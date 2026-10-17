import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// Custom storage using Expo SecureStore for auth tokens
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// ── Types ──────────────────────────────────────────────
export type Deity = {
  id: string
  name: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  display_order: number
  created_at: string
}

export type Post = {
  id: string
  deity_id: string | null
  title: string | null
  description: string | null
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url: string | null
  tags: string[] | null
  is_published: boolean
  likes_count: number
  comments_count: number
  created_at: string
  deity?: Deity
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user_profiles?: { display_name: string; avatar_url: string }
}

export type Like = {
  id: string
  post_id: string
  user_id: string
}
