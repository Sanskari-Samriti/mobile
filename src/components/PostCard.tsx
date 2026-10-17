import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Alert
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { supabase, Post } from '../lib/supabase'
import { setWallpaper } from '../lib/wallpaper'
import { shareImage, shareVideo } from '../lib/share'
import CommentSheet from './CommentSheet'

const { width } = Dimensions.get('window')

type Props = { post: Post }

export default function PostCard({ post }: Props) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showComments, setShowComments] = useState(false)
  const [settingWallpaper, setSettingWallpaper] = useState(false)

  async function handleLike() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { Alert.alert('Sign in to like posts'); return }

    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
      setLikesCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
      setLikesCount((c) => c + 1)
    }
    setLiked(!liked)
  }

  async function handleWallpaper() {
    if (post.media_type !== 'image') { Alert.alert('Only images can be set as wallpaper'); return }
    setSettingWallpaper(true)
    await setWallpaper(post.media_url)
    setSettingWallpaper(false)
  }

  async function handleShare() {
    if (post.media_type === 'image') await shareImage(post.media_url, post.title || undefined)
    else await shareVideo(post.media_url, post.title || undefined)
  }

  return (
    <View style={styles.card}>
      {/* Deity tag */}
      {post.deity && (
        <View style={styles.deityTag}>
          <Text style={styles.deityTagText}>🙏 {post.deity.name}</Text>
        </View>
      )}

      {/* Media */}
      <Image
        source={{ uri: post.media_type === 'video' ? post.thumbnail_url || post.media_url : post.media_url }}
        style={styles.image}
        contentFit="cover"
        transition={300}
      />

      {/* Video indicator */}
      {post.media_type === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={52} color="rgba(255,255,255,0.9)" />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        {post.title && <Text style={styles.title}>{post.title}</Text>}
        {post.description && <Text style={styles.description} numberOfLines={2}>{post.description}</Text>}

        {/* Action bar */}
        <View style={styles.actions}>
          {/* Like */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? '#e74c3c' : '#555'} />
            <Text style={styles.actionCount}>{likesCount}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
            <Ionicons name="chatbubble-outline" size={22} color="#555" />
            <Text style={styles.actionCount}>{post.comments_count}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color="#555" />
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>

          {/* Set Wallpaper */}
          {post.media_type === 'image' && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleWallpaper} disabled={settingWallpaper}>
              <Ionicons name="phone-portrait-outline" size={22} color={settingWallpaper ? '#ccc' : '#FF6B35'} />
              <Text style={[styles.actionCount, { color: '#FF6B35' }]}>Wallpaper</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Comment Sheet */}
      <CommentSheet
        visible={showComments}
        postId={post.id}
        onClose={() => setShowComments(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 8,
    borderRadius: 16, overflow: 'hidden',
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  deityTag: {
    position: 'absolute', top: 10, left: 10, zIndex: 10,
    backgroundColor: 'rgba(255,107,53,0.9)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  deityTagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  image: { width: '100%', height: width * 0.72 },
  videoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: width * 0.72, justifyContent: 'center', alignItems: 'center',
  },
  info: { padding: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  description: { fontSize: 13, color: '#666', marginBottom: 10, lineHeight: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 4 },
  actionCount: { fontSize: 12, color: '#555' },
})
