import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/clients'
import type { User } from '../types'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
}

interface AuthActions {
  signIn: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isInitialized: false,

      signIn: async (email: string) => {
        set({ isLoading: true })
        
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })

        set({ isLoading: false })
        return { error }
      },

      signOut: async () => {
        set({ isLoading: true })
        
        const { error } = await supabase.auth.signOut()
        
        if (!error) {
          set({ 
            user: null, 
            session: null, 
            isLoading: false 
          })
          
          // Clear localStorage
          localStorage.clear()
          
          // Redirect to auth page
          window.location.href = '/auth'
        } else {
          set({ isLoading: false })
        }
      },

      initialize: async () => {
        set({ isLoading: true })

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          set({ isLoading: false, isInitialized: true })
          return
        }

        if (session?.user) {
          // Fetch user profile from our users table
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!profileError && userProfile) {
            set({ 
              user: userProfile, 
              session, 
              isLoading: false, 
              isInitialized: true 
            })
          } else {
            console.error('Error fetching user profile:', profileError)
            set({ 
              user: null, 
              session: null, 
              isLoading: false, 
              isInitialized: true 
            })
          }
        } else {
          set({ 
            user: null, 
            session: null, 
            isLoading: false, 
            isInitialized: true 
          })
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            // Fetch user profile
            const { data: userProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            set({ 
              user: userProfile || null, 
              session, 
              isLoading: false 
            })
          } else if (event === 'SIGNED_OUT') {
            set({ 
              user: null, 
              session: null, 
              isLoading: false 
            })
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set({ session })
          }
        })
      },

      setUser: (user: User | null) => {
        set({ user })
      },

      setSession: (session: Session | null) => {
        set({ session })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
)