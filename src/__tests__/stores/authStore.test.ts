import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  Session,
  User as SupabaseAuthUser,
  AuthError,
} from "@supabase/supabase-js";
import { useAuthStore } from "../../stores/authStore";
import type { User } from "../../types";

// Mock userRepository
vi.mock("../../services/userService", () => ({
  userRepository: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    findById: vi.fn(),
  },
}));

const timestamp = "2024-01-01T00:00:00.000Z";

const createDomainUser = (): User => ({
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

const createSupabaseUser = (): SupabaseAuthUser => ({
  id: "supabase-user-1",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: timestamp,
});

const createSession = (user: SupabaseAuthUser): Session => ({
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  provider_token: null,
  provider_refresh_token: null,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
});

// Get the mocked userRepository
import { userRepository } from "../../services/userService";
const mockUserRepository = vi.mocked(userRepository);

describe("authStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setSession(null);
  });

  it("should have initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBe(null);
    expect(state.session).toBe(null);
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(false);
  });

  it("should handle sign in", async () => {
    const email = "test@example.com";
    mockUserRepository.signIn.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    const { signIn } = useAuthStore.getState();
    const result = await signIn(email);

    expect(mockUserRepository.signIn).toHaveBeenCalledWith(email);
    expect(result.error).toBe(null);
  });

  it("should handle sign in error", async () => {
    const email = "test@example.com";
    const error = new Error("Sign in failed") as AuthError;
    mockUserRepository.signIn.mockResolvedValue({
      data: { user: null, session: null },
      error,
    });

    const { signIn } = useAuthStore.getState();
    const result = await signIn(email);

    expect(result.error).toBe(error);
  });

  it("should handle sign out", async () => {
    // Mock successful sign out
    mockUserRepository.signOut.mockResolvedValue({ error: null });

    const { signOut } = useAuthStore.getState();
    await signOut();

    expect(mockUserRepository.signOut).toHaveBeenCalled();
    expect(window.location.href).toBe("/auth");
  });

  it("should set user", () => {
    const mockUser = createDomainUser();
    const { setUser } = useAuthStore.getState();

    setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toBe(mockUser);
  });

  it("should set session", () => {
    const mockSession = createSession(createSupabaseUser());
    const { setSession } = useAuthStore.getState();

    setSession(mockSession);

    const state = useAuthStore.getState();
    expect(state.session).toBe(mockSession);
  });

  it("should set loading state", () => {
    const { setLoading } = useAuthStore.getState();

    setLoading(true);

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(true);
  });
});
