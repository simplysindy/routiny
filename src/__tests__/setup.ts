import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock Supabase
export const mockSupabaseClient = {
  auth: {
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    exchangeCodeForSession: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// Mock the Supabase client
vi.mock("../lib/clients", () => ({
  supabase: mockSupabaseClient,
  createServerSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    origin: "http://localhost:3000",
    href: "http://localhost:3000",
  },
  writable: true,
});
