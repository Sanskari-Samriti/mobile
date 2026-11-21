import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from './supabase'

// Lets the in-app browser close itself after the OAuth redirect
WebBrowser.maybeCompleteAuthSession()

// Must be added to Supabase → Authentication → URL Configuration → Redirect URLs
export const AUTH_REDIRECT_URL = Linking.createURL('auth-callback')

const DEFAULT_COUNTRY_CODE = '+91'

// ── Helpers ────────────────────────────────────────────
/** "98765 43210" → "+919876543210" (E.164, which Supabase requires) */
export function normalizePhone(raw: string, countryCode = DEFAULT_COUNTRY_CODE): string {
  const cleaned = raw.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  return countryCode + cleaned.replace(/^0+/, '')
}

export function isValidPhone(raw: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(normalizePhone(raw))
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function parseUrlParams(url: string): Record<string, string> {
  const out: Record<string, string> = {}
  const [beforeHash, hash] = url.split('#')
  const query = beforeHash.split('?')[1]
  for (const part of [query, hash]) {
    if (!part) continue
    for (const pair of part.split('&')) {
      const [k, v = ''] = pair.split('=')
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '))
    }
  }
  return out
}

// ── Google ─────────────────────────────────────────────
/** Returns false if the user closed the browser without finishing. */
export async function signInWithGoogle(): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: AUTH_REDIRECT_URL, skipBrowserRedirect: true },
  })
  if (error) throw error
  if (!data?.url) throw new Error('Could not start Google sign-in')

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT_URL)
  if (result.type !== 'success') return false

  const params = parseUrlParams(result.url)
  if (params.error_description || params.error) {
    throw new Error(params.error_description || params.error)
  }

  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code)
    if (exchangeError) throw exchangeError
  } else if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    })
    if (sessionError) throw sessionError
  } else {
    throw new Error('Google sign-in did not return a session')
  }
  return true
}

// ── Phone + OTP ────────────────────────────────────────
export async function sendPhoneOtp(rawPhone: string) {
  const phone = normalizePhone(rawPhone)
  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) throw error
  return phone
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) throw error
  return data
}

// ── Email + password ───────────────────────────────────
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
  return data
}

/** `needsConfirmation` is true when "Confirm email" is enabled in Supabase. */
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: AUTH_REDIRECT_URL,
      data: displayName ? { display_name: displayName.trim() } : undefined,
    },
  })
  if (error) throw error
  return { ...data, needsConfirmation: !data.session }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
