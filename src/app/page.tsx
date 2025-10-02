"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Check if there are auth tokens in the hash (from magic link redirect)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        // Redirect to auth callback to handle the tokens
        window.location.href = `/api/auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
        return;
      }
    }

    // Only redirect once auth is fully initialized
    if (isInitialized && !hasRedirected) {
      setHasRedirected(true);
      if (user) {
        // Redirect authenticated users to task creation
        router.push("/tasks/create");
      } else {
        // Redirect unauthenticated users to auth page
        router.push("/auth");
      }
    }
  }, [user, isInitialized, router, hasRedirected]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  );
}
