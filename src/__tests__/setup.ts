import { beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";

type QueryResult = { data: unknown; error: unknown };

const mockQueryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const resetQueryBuilder = () => {
  mockQueryBuilder.select.mockReset();
  mockQueryBuilder.select.mockImplementation(() => mockQueryBuilder);

  mockQueryBuilder.eq.mockReset();
  mockQueryBuilder.eq.mockImplementation(() => mockQueryBuilder);

  mockQueryBuilder.single.mockReset();
  mockQueryBuilder.single.mockImplementation(
    async (): Promise<QueryResult> => ({
      data: null,
      error: null,
    })
  );

  mockQueryBuilder.insert.mockReset();
  mockQueryBuilder.insert.mockImplementation(() => mockQueryBuilder);

  mockQueryBuilder.update.mockReset();
  mockQueryBuilder.update.mockImplementation(() => mockQueryBuilder);

  mockQueryBuilder.delete.mockReset();
  mockQueryBuilder.delete.mockImplementation(() => mockQueryBuilder);
};

resetQueryBuilder();

// Mock Supabase
export const mockSupabaseClient = {
  auth: {
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    exchangeCodeForSession: vi.fn(),
  },
  from: vi.fn(() => mockQueryBuilder),
  rpc: vi.fn(),
};

const resetSupabaseClient = () => {
  resetQueryBuilder();

  mockSupabaseClient.from.mockReset();
  mockSupabaseClient.from.mockImplementation(() => mockQueryBuilder);

  mockSupabaseClient.rpc.mockReset();
  mockSupabaseClient.rpc.mockImplementation(
    async (): Promise<QueryResult> => ({
      data: null,
      error: null,
    })
  );

  Object.values(mockSupabaseClient.auth).forEach((fn) => fn.mockReset?.());
};

resetSupabaseClient();

// Mock the Supabase client
vi.mock("../lib/clients", () => ({
  supabase: mockSupabaseClient,
  createServerSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

beforeEach(() => {
  resetSupabaseClient();
});

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
