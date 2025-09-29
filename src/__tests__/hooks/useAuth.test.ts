import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../stores/authStore'
import { mockSupabaseClient } from '../setup'

// Mock the auth store
vi.mock('../../stores/authStore')

describe('useAuth', () => {
  const mockAuthStore = {
    user: null,
    session: null,
    isLoading: false,
    isInitialized: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    initialize: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)
  })

  it('should return auth state and methods', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBe(null)
    expect(result.current.session).toBe(null)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isInitialized).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(typeof result.current.signIn).toBe('function')
    expect(typeof result.current.signOut).toBe('function')
  })

  it('should call initialize on mount when not initialized', () => {
    renderHook(() => useAuth())
    expect(mockAuthStore.initialize).toHaveBeenCalledOnce()
  })

  it('should return isAuthenticated as true when user and session exist', () => {
    const mockUser = { id: '1', email: 'test@test.com' } as any
    const mockSession = { user: mockUser } as any

    vi.mocked(useAuthStore).mockReturnValue({
      ...mockAuthStore,
      user: mockUser,
      session: mockSession,
    })

    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)
  })
})