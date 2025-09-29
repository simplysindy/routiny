import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Session, User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { User } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/authStore";

// Mock the auth store
vi.mock("../../stores/authStore");

type AuthStoreState = ReturnType<typeof useAuthStore.getState>;

const timestamp = "2024-01-01T00:00:00.000Z";

const createMockUser = (): User => ({
  id: "1",
  email: "test@test.com",
  streak_count: 0,
  total_tasks_completed: 0,
  preferences: {
    coach_personality: "neutral",
    notification_enabled: true,
    theme: "light",
  },
  created_at: timestamp,
  last_active: timestamp,
});

const createMockSupabaseUser = (): SupabaseAuthUser => ({
  id: "supabase-user-1",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: timestamp,
});

const createMockSession = (user: SupabaseAuthUser): Session => ({
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  provider_token: null,
  provider_refresh_token: null,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
});

const createMockAuthStore = (
  overrides: Partial<AuthStoreState> = {}
): AuthStoreState => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  initialize: vi.fn(),
  setUser: vi.fn(),
  setSession: vi.fn(),
  setLoading: vi.fn(),
  ...overrides,
});

describe("useAuth", () => {
  let mockAuthStore: AuthStoreState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore = createMockAuthStore();
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);
  });

  it("should return auth state and methods", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signOut).toBe("function");
  });

  it("should call initialize on mount when not initialized", () => {
    renderHook(() => useAuth());
    expect(mockAuthStore.initialize).toHaveBeenCalledOnce();
  });

  it("should return isAuthenticated as true when user and session exist", () => {
    const domainUser = createMockUser();
    const supabaseUser = createMockSupabaseUser();
    const mockSession = createMockSession(supabaseUser);

    vi.mocked(useAuthStore).mockReturnValue(
      createMockAuthStore({
        user: domainUser,
        session: mockSession,
      })
    );

    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
  });
});
