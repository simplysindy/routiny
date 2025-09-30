"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { initialize } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Validate URL parameters for potential malformed tokens
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        // Check for auth errors in URL
        if (error) {
          console.error("Auth URL error:", { error, errorDescription });
          router.push(
            `/auth?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "Authentication failed")}`
          );
          return;
        }

        // Validate token format if present
        const accessToken = urlParams.get("access_token");

        if (accessToken && !accessToken.match(/^[a-zA-Z0-9._-]+$/)) {
          console.error("Malformed access token detected");
          router.push(
            "/auth?error=invalid_token&description=Invalid token format"
          );
          return;
        }

        await initialize();
        router.push("/dashboard");
      } catch (error) {
        console.error("Auth callback error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        router.push(
          `/auth?error=callback_failed&description=${encodeURIComponent(errorMessage)}`
        );
      }
    };

    handleAuthCallback();
  }, [initialize, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          Completing sign in...
        </h2>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    </div>
  );
}
