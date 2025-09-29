import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../../stores/authStore'
import { mockSupabaseClient } from '../setup'

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setLoading(false)
    useAuthStore.getState().setUser(null)
    useAuthStore.getState().setSession(null)
  })

  it('should have initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBe(null)
    expect(state.session).toBe(null)
    expect(state.isLoading).toBe(false)
    expect(state.isInitialized).toBe(false)
  })

  it('should handle sign in', async () => {
    const email = 'test@example.com'
    mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error: null })

    const { signIn } = useAuthStore.getState()
    const result = await signIn(email)

    expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    expect(result.error).toBe(null)
  })

  it('should handle sign in error', async () => {
    const email = 'test@example.com'
    const error = new Error('Sign in failed')
    mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({ error })

    const { signIn } = useAuthStore.getState()
    const result = await signIn(email)

    expect(result.error).toBe(error)
  })

  it('should handle sign out', async () => {
    // Mock successful sign out
    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

    // Mock window.location
    delete (window as any).location
    window.location = { href: '' } as any

    const { signOut } = useAuthStore.getState()
    await signOut()

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    expect(window.location.href).toBe('/auth')
  })

  it('should set user', () => {
    const mockUser = { id: '1', email: 'test@test.com' } as any
    const { setUser } = useAuthStore.getState()
    
    setUser(mockUser)
    
    const state = useAuthStore.getState()
    expect(state.user).toBe(mockUser)
  })

  it('should set session', () => {
    const mockSession = { user: { id: '1' } } as any
    const { setSession } = useAuthStore.getState()
    
    setSession(mockSession)
    
    const state = useAuthStore.getState()
    expect(state.session).toBe(mockSession)
  })

  it('should set loading state', () => {
    const { setLoading } = useAuthStore.getState()
    
    setLoading(true)
    
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(true)
  })
})