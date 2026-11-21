import React, { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../providers/AuthProvider'
import {
  signInWithGoogle, sendPhoneOtp, verifyPhoneOtp,
  signInWithEmail, signUpWithEmail, isValidPhone, isValidEmail,
} from '../lib/auth'

type Method = 'phone' | 'email'
const RESEND_SECONDS = 30
const OTP_LENGTH = 6

export default function LoginScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [method, setMethod] = useState<Method>('phone')
  const [busy, setBusy] = useState<null | 'google' | 'phone' | 'email'>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // phone
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneE164, setPhoneE164] = useState<string | null>(null) // set once OTP is sent
  const [otp, setOtp] = useState('')
  const [resendIn, setResendIn] = useState(0)

  // email
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null)

  // Leave the screen as soon as a session exists (works for all three methods)
  useEffect(() => {
    if (user) {
      if (router.canGoBack()) router.back()
      else router.replace('/')
    }
  }, [user])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  function reset(next?: Method) {
    setError(null)
    setInfo(null)
    if (next) setMethod(next)
  }

  async function run<T>(kind: 'google' | 'phone' | 'email', fn: () => Promise<T>) {
    setBusy(kind)
    setError(null)
    setInfo(null)
    try {
      return await fn()
    } catch (e: any) {
      setError(friendlyError(e))
    } finally {
      setBusy(null)
    }
  }

  // ── Handlers ─────────────────────────────────────────
  const onGoogle = () => run('google', () => signInWithGoogle())

  const onSendOtp = () =>
    run('phone', async () => {
      if (!isValidPhone(phoneInput)) throw new Error('Enter a valid phone number')
      const phone = await sendPhoneOtp(phoneInput)
      setPhoneE164(phone)
      setOtp('')
      setResendIn(RESEND_SECONDS)
      setInfo(`We sent a ${OTP_LENGTH}-digit code to ${phone}`)
    })

  const onVerifyOtp = () =>
    run('phone', async () => {
      if (!phoneE164) return
      if (otp.length !== OTP_LENGTH) throw new Error(`Enter the ${OTP_LENGTH}-digit code`)
      await verifyPhoneOtp(phoneE164, otp)
      // navigation happens in the `user` effect
    })

  const onEmailSubmit = () =>
    run('email', async () => {
      if (!isValidEmail(email)) throw new Error('Enter a valid email address')
      if (password.length < 6) throw new Error('Password must be at least 6 characters')

      if (isSignUp) {
        const res = await signUpWithEmail(email, password, name)
        if (res.needsConfirmation) {
          setInfo('Account created! Check your email and tap the confirmation link, then sign in.')
          setIsSignUp(false)
          setPassword('')
        }
      } else {
        await signInWithEmail(email, password)
      }
    })

  const loading = busy !== null

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        <Text style={styles.subtitle}>Sign in to like, comment and save blessings</Text>

        {/* Google */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={onGoogle}
          disabled={loading}
          activeOpacity={0.85}
        >
          {busy === 'google' ? (
            <ActivityIndicator color="#333" />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#DB4437" />
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Method switch */}
        <View style={styles.segment}>
          {(['phone', 'email'] as Method[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.segmentItem, method === m && styles.segmentItemActive]}
              onPress={() => reset(m)}
              disabled={loading}
            >
              <Text style={[styles.segmentText, method === m && styles.segmentTextActive]}>
                {m === 'phone' ? 'Phone' : 'Email'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phone */}
        {method === 'phone' && (
          <View style={styles.form}>
            {!phoneE164 ? (
              <>
                <Text style={styles.label}>Phone number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.cc}><Text style={styles.ccText}>🇮🇳 +91</Text></View>
                  <TextInput
                    style={[styles.input, styles.flex]}
                    placeholder="98765 43210"
                    keyboardType="phone-pad"
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    maxLength={15}
                    autoComplete="tel"
                  />
                </View>
                <PrimaryButton
                  label="Send OTP"
                  loading={busy === 'phone'}
                  disabled={loading || !phoneInput.trim()}
                  onPress={onSendOtp}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter OTP</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="••••••"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                  maxLength={OTP_LENGTH}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  autoFocus
                />
                <PrimaryButton
                  label="Verify & Continue"
                  loading={busy === 'phone'}
                  disabled={loading || otp.length !== OTP_LENGTH}
                  onPress={onVerifyOtp}
                />
                <View style={styles.otpActions}>
                  <TouchableOpacity onPress={() => { setPhoneE164(null); setOtp(''); reset() }}>
                    <Text style={styles.link}>Change number</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onSendOtp} disabled={resendIn > 0 || loading}>
                    <Text style={[styles.link, resendIn > 0 && styles.linkDisabled]}>
                      {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* Email */}
        {method === 'email' && (
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
                />
              </>
            )}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.flex, { marginBottom: 0, borderWidth: 0 }]}
                placeholder="At least 6 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={isSignUp ? 'password-new' : 'password'}
                value={password}
                onChangeText={setPassword}
                returnKeyType="go"
                onSubmitEditing={onEmailSubmit}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#999" />
              </TouchableOpacity>
            </View>
            <PrimaryButton
              label={isSignUp ? 'Create account' : 'Sign in'}
              loading={busy === 'email'}
              disabled={loading || !email.trim() || !password}
              onPress={onEmailSubmit}
              style={{ marginTop: 16 }}
            />
            <TouchableOpacity onPress={() => { setIsSignUp((v) => !v); reset() }} style={styles.switchRow}>
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.link}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <TouchableOpacity onPress={() => router.back()} style={styles.guest}>
          <Text style={styles.guestText}>Continue as guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function PrimaryButton({
  label, onPress, loading, disabled, style,
}: {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  style?: object
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
    </TouchableOpacity>
  )
}

function friendlyError(e: any): string {
  const msg: string = e?.message ?? 'Something went wrong. Please try again.'
  if (/invalid login credentials/i.test(msg)) return 'Incorrect email or password.'
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first — check your inbox.'
  if (/already registered|already been registered/i.test(msg)) return 'This email is already registered. Try signing in.'
  if (/token has expired|invalid.*(token|otp)/i.test(msg)) return 'That code is incorrect or has expired.'
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Please wait a bit and try again.'
  if (/sms|provider/i.test(msg)) return 'Could not send the SMS. Please try again later.'
  return msg
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, backgroundColor: '#FFF9F5', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  close: { position: 'absolute', top: 52, right: 20, zIndex: 2 },
  emoji: { fontSize: 44, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#CC4A0A', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 28 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6d8cc', borderRadius: 12, height: 50,
  },
  googleText: { fontSize: 15, fontWeight: '600', color: '#333' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eadfd5' },
  dividerText: { marginHorizontal: 12, color: '#aaa', fontSize: 13 },

  segment: { flexDirection: 'row', backgroundColor: '#FFE8D6', borderRadius: 12, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segmentItemActive: { backgroundColor: '#fff', elevation: 1 },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#a5643f' },
  segmentTextActive: { color: '#FF6B35' },

  form: { marginTop: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6d8cc', borderRadius: 12,
    paddingHorizontal: 14, height: 50, fontSize: 15, color: '#222', marginBottom: 14,
  },
  phoneRow: { flexDirection: 'row', gap: 8 },
  cc: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6d8cc', borderRadius: 12,
    paddingHorizontal: 12, height: 50, justifyContent: 'center',
  },
  ccText: { fontSize: 15, color: '#333' },
  otpInput: { textAlign: 'center', fontSize: 22, letterSpacing: 8 },
  otpActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e6d8cc', borderRadius: 12, paddingRight: 14,
  },

  primaryBtn: { backgroundColor: '#FF6B35', borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  switchRow: { marginTop: 18, alignItems: 'center' },
  switchText: { color: '#777', fontSize: 14 },
  link: { color: '#FF6B35', fontWeight: '700', fontSize: 14 },
  linkDisabled: { color: '#bbb' },

  error: { color: '#C62828', textAlign: 'center', marginTop: 16, fontSize: 13 },
  info: { color: '#2E7D32', textAlign: 'center', marginTop: 16, fontSize: 13 },

  guest: { marginTop: 28, alignItems: 'center' },
  guestText: { color: '#999', fontSize: 14, textDecorationLine: 'underline' },
})
