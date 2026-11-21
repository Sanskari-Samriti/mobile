import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useAuth } from '../providers/AuthProvider'
import { supabase } from '../lib/supabase'

type Profile = { display_name: string | null; avatar_url: string | null; phone: string | null }

export default function ProfileScreen() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!user) { setProfile(null); return }
    supabase
      .from('user_profiles')
      .select('display_name, avatar_url, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data))
  }, [user?.id])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#FF6B35" /></View>
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🙏</Text>
        <Text style={styles.title}>Welcome, devotee</Text>
        <Text style={styles.sub}>Sign in to like and comment on blessings</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/login')}>
          <Text style={styles.btnText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const name = profile?.display_name || user.email?.split('@')[0] || 'Devotee'
  const contact = [user.email, profile?.phone].filter(Boolean).join('\n')

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <View style={styles.center}>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.title}>{name}</Text>
      {!!contact && <Text style={styles.sub}>{contact}</Text>}
      <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={confirmSignOut}>
        <Text style={[styles.btnText, { color: '#FF6B35' }]}>Sign out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F5', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback: { backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: '#CC4A0A' },
  sub: { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center' },
  btn: { marginTop: 24, backgroundColor: '#FF6B35', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#FF6B35' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
