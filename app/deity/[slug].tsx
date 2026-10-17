import { useLocalSearchParams, Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase, Deity } from '../../src/lib/supabase'
import FeedScreen from '../../src/screens/FeedScreen'
import { View, Text } from 'react-native'

export default function DeityFeedPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [deity, setDeity] = useState<Deity | null>(null)

  useEffect(() => {
    supabase.from('deities').select('*').eq('slug', slug).single()
      .then(({ data }) => setDeity(data))
  }, [slug])

  return (
    <>
      <Stack.Screen options={{ title: deity?.name || 'Loading...' }} />
      {deity && <FeedScreen deityId={deity.id} />}
    </>
  )
}
