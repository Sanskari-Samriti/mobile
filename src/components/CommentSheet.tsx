import React, { useEffect, useState } from 'react'
import {
  Modal, View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase, Comment } from '../lib/supabase'

type Props = { visible: boolean; postId: string; onClose: () => void }

export default function CommentSheet({ visible, postId, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (visible) fetchComments()
  }, [visible, postId])

  async function fetchComments() {
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .select('*, user_profiles(display_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
    if (data) setComments(data)
    setLoading(false)
  }

  async function postComment() {
    if (!newComment.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Please sign in to comment'); return }

    setPosting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content: newComment.trim() })
      .select('*, user_profiles(display_name, avatar_url)')
      .single()

    if (data) {
      setComments((prev) => [data, ...prev])
      setNewComment('')
    }
    setPosting(false)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          {loading ? (
            <ActivityIndicator color="#FF6B35" style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.user_profiles?.display_name || 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentUser}>{item.user_profiles?.display_name || 'Devotee'}</Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Be the first to comment 🙏</Text>
              }
            />
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={300}
            />
            <TouchableOpacity onPress={postComment} disabled={posting || !newComment.trim()} style={styles.sendBtn}>
              {posting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%' },
  handle: { width: 36, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  list: { paddingHorizontal: 16 },
  commentRow: { flexDirection: 'row', marginBottom: 14 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  commentBody: { flex: 1 },
  commentUser: { fontSize: 12, fontWeight: '700', color: '#333', marginBottom: 2 },
  commentText: { fontSize: 13, color: '#555', lineHeight: 18 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20, fontSize: 14 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 80 },
  sendBtn: { marginLeft: 8, backgroundColor: '#FF6B35', borderRadius: 20, width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
})
