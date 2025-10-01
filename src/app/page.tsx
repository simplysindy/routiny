"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
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
