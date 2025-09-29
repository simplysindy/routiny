import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const {
    user,
    session,
    isLoading,
    isInitialized,
    signIn,
    signOut,
    initialize,
  } = useAuthStore();

  const isAuthenticated = !!user && !!session;

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return {
    user,
    session,
    isLoading,
    isInitialized,
    isAuthenticated,
    signIn,
    signOut,
    initialize,
  };
}
