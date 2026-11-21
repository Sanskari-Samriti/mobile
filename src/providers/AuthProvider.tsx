import React, { createContext, useContext, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { signOut as authSignOut } from '../lib/auth'

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })

    // Supabase recommendation for React Native: only refresh tokens while the app is in the foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh()
      else supabase.auth.stopAutoRefresh()
    })
    supabase.auth.startAutoRefresh()

    return () => {
      sub.subscription.unsubscribe()
      appStateSub.remove()
      supabase.auth.stopAutoRefresh()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signOut: authSignOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
