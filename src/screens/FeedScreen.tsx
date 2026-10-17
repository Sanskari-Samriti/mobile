import React, { useEffect, useState, useCallback } from 'react'
import {
  View, FlatList, StyleSheet, Text,
  ActivityIndicator, RefreshControl, Dimensions
} from 'react-native'
import { supabase, Post } from '../lib/supabase'
import PostCard from '../components/PostCard'

const PAGE_SIZE = 10

type Props = { deityId?: string }

export default function FeedScreen({ deityId }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadPosts(true)

    // Realtime: listen for new posts
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        const newPost = payload.new as Post
        if (newPost.is_published) {
          setPosts((prev) => [newPost, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [deityId])

  async function loadPosts(reset = false) {
    const from = reset ? 0 : page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('posts')
      .select('*, deity:deities(id,name,slug)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (deityId) query = query.eq('deity_id', deityId)

    const { data, error } = await query

    if (data) {
      if (reset) {
        setPosts(data)
        setPage(1)
      } else {
        setPosts((prev) => [...prev, ...data])
        setPage((p) => p + 1)
      }
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
    setRefreshing(false)
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadPosts(true)
  }, [deityId])

  const onEndReached = () => {
    if (hasMore && !loading) loadPosts(false)
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
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        hasMore ? <ActivityIndicator style={{ marginVertical: 16 }} color="#FF6B35" /> : undefined
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>🙏 No posts yet. Check back soon!</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F5' },
  loadingText: { marginTop: 12, color: '#FF6B35', fontSize: 14 },
  list: { paddingVertical: 8, backgroundColor: '#FFF9F5' },
  empty: { flex: 1, alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 15, color: '#999' },
})
