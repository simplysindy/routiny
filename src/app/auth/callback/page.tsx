"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/clients";
import type { Database } from "../../../types/database";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Log the full URL to debug
        const fullUrl = window.location.href;
        const hash = window.location.hash;
        const search = window.location.search;

        console.log("Auth callback - URL details:", {
          fullUrl,
          hash,
          search,
          hasHash: hash.length > 0,
          hasSearch: search.length > 0,
        });

        // Check if there's an error in the URL
        const hashParams = new URLSearchParams(hash.substring(1));
        const searchParams = new URLSearchParams(search);

        const errorFromUrl =
          searchParams.get("error_description") ||
          searchParams.get("error") ||
          hashParams.get("error_description") ||
          hashParams.get("error");

        if (errorFromUrl) {
          console.error("Error from URL:", errorFromUrl);
          setError(errorFromUrl);
          setTimeout(() => {
            router.push(`/auth?error=${encodeURIComponent(errorFromUrl)}`);
          }, 2000);
          return;
        }

        // Check if there's a hash with tokens (implicit flow or magic link redirect)
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        console.log("Token check:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });

        let session = null;
        let authError = null;

        if (accessToken && refreshToken) {
          console.log(
            "Found tokens in hash, redirecting to API route to set server-side session..."
          );

          // Instead of setting session client-side, redirect to API route
          // which will set it server-side with proper cookies
          window.location.href = `/api/auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
          return;
        } else {
          // Fallback to getSession
          const { data, error } = await supabase.auth.getSession();
          session = data.session;
          authError = error;
        }

        console.log("Session check:", {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: authError?.message,
        });

        if (authError) {
          console.error("Auth callback error:", authError);
          setError(authError.message);
          setTimeout(() => {
            router.push(`/auth?error=${encodeURIComponent(authError.message)}`);
          }, 2000);
          return;
        }

        if (session) {
          console.log("Session established");

          // Ensure user profile exists in the database
          try {
            console.log(
              "Checking if user profile exists for:",
              session.user.id
            );
            const { data: existingUser, error: fetchError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            console.log("User profile check result:", {
              exists: !!existingUser,
              fetchError: fetchError?.message,
              userId: session.user.id,
            });

            if (!existingUser) {
              console.log("User profile doesn't exist, creating...");
              const { id: userId, email } = session.user;

              if (!email) {
                console.error(
                  "Session user is missing an email address; cannot create profile.",
                  { userId }
                );
              } else {
                const newUserPayload: Database["public"]["Tables"]["users"]["Insert"] =
                  {
                    id: userId,
                    email,
                    preferences: {
                      coach_personality: "encouraging",
                      notification_enabled: true,
                      theme: "auto",
                    },
                  };

                const { data: newUser, error: createError } = await supabase
                  .from("users")
                  .insert(newUserPayload)
                  .select()
                  .single();

                console.log("User creation result:", {
                  success: !!newUser,
                  error: createError?.message,
                });

                if (createError) {
                  console.error("Failed to create user profile:", createError);
                } else {
                  console.log("User profile created successfully:", newUser);
                }
              }
            } else {
              console.log("User profile already exists");
            }
          } catch (err) {
            console.error("Error checking/creating user profile:", err);
          }

          console.log("Redirecting to dashboard");
          window.location.href = "/dashboard";
        } else {
          console.error("No session after callback");
          console.error("This usually means:");
          console.error(
            "1. The redirect URL is not whitelisted in Supabase dashboard"
          );
          console.error("2. The magic link has expired or been used already");
          console.error("3. The token/hash is missing from the redirect");
          setError(
            "Authentication failed. The link may have expired or been used already."
          );
          setTimeout(() => {
            router.push("/auth");
          }, 3000);
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setTimeout(() => {
          router.push(`/auth?error=${encodeURIComponent(errorMessage)}`);
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">
          {error ? "Sign in failed" : "Completing sign in..."}
        </h2>
        {error ? (
          <div className="mt-4 max-w-md">
            <p className="mb-2 text-sm text-red-600">{error}</p>
            <p className="text-xs text-gray-500">
              Redirecting back to sign in...
            </p>
          </div>
        ) : (
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        )}
      </div>
    </div>
  );
}
