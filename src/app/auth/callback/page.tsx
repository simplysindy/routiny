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
        await initialize();
        router.push("/dashboard");
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push("/auth?error=callback_failed");
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
