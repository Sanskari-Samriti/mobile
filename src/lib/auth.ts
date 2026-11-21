import * as Linking from 'expo-linking'
import { supabase } from './supabase'

// Only used if "Confirm email" is ever turned back on in Supabase
// (add it under Authentication → URL Configuration → Redirect URLs)
export const AUTH_REDIRECT_URL = Linking.createURL('auth-callback')

const DEFAULT_COUNTRY_CODE = '+91'

// ── Helpers ────────────────────────────────────────────
/** "98765 43210" → "+919876543210" */
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

// ── Sign in ────────────────────────────────────────────
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
  return data
}

// ── Sign up (name, email, phone, password — phone is NOT verified) ──
/**
 * Creates the user and signs them in straight away when "Confirm email"
 * is OFF in Supabase. `needsConfirmation` is only true if it is still ON.
 * The phone number is stored as a plain profile detail; no SMS is sent.
 */
export async function signUpWithEmail(params: {
  name: string
  email: string
  phone: string
  password: string
}) {
  const email = params.email.trim()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: params.password,
    options: {
      emailRedirectTo: AUTH_REDIRECT_URL,
      data: {
        display_name: params.name.trim(),
        phone_number: normalizePhone(params.phone),
      },
    },
  })
  if (error) throw error
  if (data.session) return { needsConfirmation: false }

  // No session: either the email already exists or confirmation is still on.
  const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: params.password,
  })
  if (signedIn?.session) return { needsConfirmation: false }
  if (signInError && /invalid login credentials/i.test(signInError.message)) {
    throw new Error('This email is already registered. Try signing in.')
  }
  return { needsConfirmation: true }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
