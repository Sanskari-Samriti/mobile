import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator, Dimensions
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase, Deity } from '../lib/supabase'

const { width } = Dimensions.get('window')
const CARD_SIZE = (width - 48) / 2

export default function HomeScreen() {
  const [deities, setDeities] = useState<Deity[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDeities()
  }, [])

  async function fetchDeities() {
    const { data, error } = await supabase
      .from('deities')
      .select('*')
      .order('display_order', { ascending: true })

    if (data) setDeities(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading blessings...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🙏 Sanskari Samriti</Text>
        <Text style={styles.headerSubtitle}>Choose your deity</Text>
      </View>

      {/* All Posts shortcut */}
      <TouchableOpacity
        style={styles.allPostsBtn}
        onPress={() => router.push('/feed')}
      >
        <Text style={styles.allPostsText}>✨ View All Blessings</Text>
      </TouchableOpacity>

      <FlatList
        data={deities}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/deity/[slug]', params: { slug: item.slug } })}
            activeOpacity={0.85}
          >
            {item.thumbnail_url ? (
              <Image source={{ uri: item.thumbnail_url }} style={styles.cardImage} />
            ) : (
              <View style={styles.cardPlaceholder}>
                <Text style={styles.cardEmoji}>🙏</Text>
              </View>
            )}
            <View style={styles.cardOverlay}>
              <Text style={styles.cardName}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F5' },
  loadingText: { marginTop: 12, color: '#FF6B35', fontSize: 14 },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#CC4A0A' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  allPostsBtn: {
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: '#FF6B35', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  allPostsText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  grid: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    width: CARD_SIZE, height: CARD_SIZE,
    margin: 8, borderRadius: 16,
    overflow: 'hidden', backgroundColor: '#f0e0d0',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4,
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFE8D6' },
  cardEmoji: { fontSize: 40 },
  cardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8, paddingHorizontal: 10,
  },
  cardName: { color: '#fff', fontWeight: '700', fontSize: 13 },
})
