import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "./src/lib/config";
import type { Database } from "./src/types/database";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Skip middleware for auth callback to avoid interfering with auth flow
  if (pathname === "/auth/callback") {
    return response;
  }

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient<Database>(
    appConfig.supabase.url,
    appConfig.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // Get the user (more secure than getSession for server-side)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(`[Middleware] ${pathname}:`, {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
  });

  // Protected routes that require authentication
  // TODO: /dashboard route doesn't exist - remove if not planning to create it
  const protectedRoutes = ["/dashboard", "/tasks", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Public routes that authenticated users shouldn't access
  const authRoutes = ["/auth"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !user) {
    console.log(
      `[Middleware] Redirecting to /auth (no user for protected route)`
    );
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user && pathname !== "/auth/callback") {
    console.log(
      `[Middleware] Redirecting authenticated user from ${pathname} to task creation`
    );
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const redirectUrl = new URL(redirectTo || "/tasks/create", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
