"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (isInitialized) {
      if (user) {
        // Redirect authenticated users to task creation
        router.push("/tasks/create");
      } else {
        // Redirect unauthenticated users to auth page
        router.push("/auth");
      }
    }
  }, [user, isInitialized, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  );
}
