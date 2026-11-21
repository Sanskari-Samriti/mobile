import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '../src/providers/AuthProvider'

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FF6B35' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="deity/[slug]" options={{ title: 'Deity Feed' }} />
        <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  )
}
