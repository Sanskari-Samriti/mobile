import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../providers/AuthProvider'
import { signInWithEmail, signUpWithEmail, isValidEmail, isValidPhone } from '../lib/auth'

export default function LoginScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const phoneRef = useRef<React.ComponentRef<typeof TextInput>>(null)
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null)

  // Leave the screen as soon as a session exists
  useEffect(() => {
    if (user) {
      if (router.canGoBack()) router.back()
      else router.replace('/')
    }
  }, [user])

  function switchMode() {
    setIsSignUp((v) => !v)
    setError(null)
    setInfo(null)
  }

  async function onSubmit() {
    setError(null)
    setInfo(null)
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Enter your name')
        if (!isValidEmail(email)) throw new Error('Enter a valid email address')
        if (!isValidPhone(phone)) throw new Error('Enter a valid phone number')
        if (password.length < 6) throw new Error('Password must be at least 6 characters')
      } else {
        if (!isValidEmail(email)) throw new Error('Enter your username (the email you signed up with)')
        if (!password) throw new Error('Enter your password')
      }

      setBusy(true)
      if (isSignUp) {
        const res = await signUpWithEmail({ name, email, phone, password })
        if (res.needsConfirmation) {
          setInfo('Account created! Check your email and tap the confirmation link, then sign in.')
          setIsSignUp(false)
          setPassword('')
        }
        // otherwise the `user` effect closes this screen
      } else {
        await signInWithEmail(email, password)
      }
    } catch (e: any) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = isSignUp
    ? !!name.trim() && !!email.trim() && !!phone.trim() && !!password
    : !!email.trim() && !!password

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.close} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color="#666" />
        </TouchableOpacity>

        <Text style={styles.emoji}>🙏</Text>
        <Text style={styles.title}>Sanskari Samriti</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create your account' : 'Sign in to like, comment and save blessings'}
        </Text>

        <View style={styles.form}>
          {isSignUp && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </>
          )}

          <Text style={styles.label}>{isSignUp ? 'Email' : 'Username'}</Text>
          <TextInput
            ref={emailRef}
            style={styles.input}
            placeholder={isSignUp ? 'you@example.com' : 'Your email'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            onSubmitEditing={() => (isSignUp ? phoneRef : passwordRef).current?.focus()}
          />

          {isSignUp && (
            <>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.cc}><Text style={styles.ccText}>🇮🇳 +91</Text></View>
                <TextInput
                  ref={phoneRef}
                  style={[styles.input, styles.flex, styles.phoneInput]}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={15}
                  autoComplete="tel"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, styles.flex, styles.passwordInput]}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={isSignUp ? 'password-new' : 'password'}
              value={password}
              onChangeText={setPassword}
              returnKeyType="go"
              onSubmitEditing={onSubmit}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!canSubmit || busy) && styles.primaryBtnDisabled]}
            onPress={onSubmit}
            disabled={!canSubmit || busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={switchMode} style={styles.switchRow} disabled={busy}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.link}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <TouchableOpacity onPress={() => router.back()} style={styles.guest}>
          <Text style={styles.guestText}>Continue as guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function friendlyError(e: any): string {
  const msg: string = e?.message ?? 'Something went wrong. Please try again.'
  if (/invalid login credentials/i.test(msg)) return 'Incorrect username or password.'
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first — check your inbox.'
  if (/already registered|already been registered/i.test(msg)) return 'This email is already registered. Try signing in.'
  if (/rate limit|too many/i.test(msg)) return `Too many attempts (${msg}). Please wait and try again.`
  return msg
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, backgroundColor: '#FFF9F5', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  close: { position: 'absolute', top: 52, right: 20, zIndex: 2 },
  emoji: { fontSize: 44, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#CC4A0A', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 28 },

  form: { marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6d8cc', borderRadius: 12,
    paddingHorizontal: 14, height: 50, fontSize: 15, color: '#222', marginBottom: 14,
  },
  phoneRow: { flexDirection: 'row', gap: 8 },
  phoneInput: { flex: 1 },
  cc: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6d8cc', borderRadius: 12,
    paddingHorizontal: 12, height: 50, justifyContent: 'center', marginBottom: 14,
  },
  ccText: { fontSize: 15, color: '#333' },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e6d8cc', borderRadius: 12, paddingRight: 14,
  },
  passwordInput: { marginBottom: 0, borderWidth: 0 },

  primaryBtn: {
    backgroundColor: '#FF6B35', borderRadius: 12, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  switchRow: { marginTop: 18, alignItems: 'center' },
  switchText: { color: '#777', fontSize: 14 },
  link: { color: '#FF6B35', fontWeight: '700', fontSize: 14 },

  error: { color: '#C62828', textAlign: 'center', marginTop: 16, fontSize: 13 },
  info: { color: '#2E7D32', textAlign: 'center', marginTop: 16, fontSize: 13 },

  guest: { marginTop: 28, alignItems: 'center' },
  guestText: { color: '#999', fontSize: 14, textDecorationLine: 'underline' },
})
