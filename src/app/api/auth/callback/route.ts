import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { config } from "../../../../lib/config";
import type { Database } from "../../../../types/database";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("Auth callback API route:", {
    hasCode: !!code,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    next,
  });

  const response = new NextResponse();

  const supabase = createServerClient<Database>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let session = null;
  let error = null;

  // Handle token-based auth (from magic link hash)
  if (accessToken && refreshToken) {
    console.log("Setting session from tokens...");
    const result = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    session = result.data.session;
    error = result.error;
  }
  // Handle code-based auth (PKCE flow)
  else if (code) {
    console.log("Exchanging code for session...");
    const result = await supabase.auth.exchangeCodeForSession(code);
    session = result.data.session;
    error = result.error;
  }

  console.log("Auth result:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    error: error?.message,
  });

  if (!error && session) {
    // Ensure user profile exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (!existingUser) {
      console.log("Creating user profile...");
      const { id: userId, email } = session.user;

      if (!email) {
        console.error(
          "Session user is missing an email address; skipping profile creation.",
          {
            userId,
          }
        );
      } else {
        const newUser: Database["public"]["Tables"]["users"]["Insert"] = {
          id: userId,
          email,
          preferences: {
            coach_personality: "encouraging",
            notification_enabled: true,
            theme: "auto",
          },
        };

        const { error: insertError } = await supabase
          .from("users")
          .insert(newUser);

        if (insertError) {
          console.error("Failed to create user profile:", insertError);
        }
      }
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    let redirectUrl: string;
    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`;
    } else {
      redirectUrl = `${origin}${next}`;
    }

    console.log("Redirecting to:", redirectUrl);

    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: response.headers,
    });
  }

  console.error("Auth failed:", error);

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`);
}
