import { Redirect } from 'expo-router'

// Landing route for the sanskarisamriti://auth-callback deep link (Google OAuth / email confirmation).
// The session itself is handled in src/lib/auth.ts; this just stops Expo Router showing "unmatched route".
export default function AuthCallback() {
  return <Redirect href="/" />
}
