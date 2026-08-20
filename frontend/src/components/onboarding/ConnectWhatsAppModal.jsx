import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Check, ChevronRight, Loader2, CheckCircle2,
  ChevronDown, Eye, EyeOff, AlertCircle, Phone,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import axiosInstance from '../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

const fieldVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.22, ease: EASE_OUT, delay: i * 0.05 },
  }),
}

function Btn({ onClick, disabled, loading, children }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg bg-green-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 120ms ease' }}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </motion.button>
  )
}

// Loads the Facebook JS SDK once and resolves when FB is ready
function useFBSDK() {
  const [ready, setReady] = useState(!!window.FB)
  const appId = import.meta.env.VITE_META_APP_ID

  useEffect(() => {
    if (!appId || window.FB) { setReady(!!window.FB); return }

    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v20.0' })
      setReady(true)
    }

    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [appId])

  return { ready, appId }
}

/* ─── Connect WhatsApp popup (shown right after signup) ────── */

export default function ConnectWhatsAppModal({ onDismiss }) {
  const { ready: fbReady, appId } = useFBSDK()
  const configId = import.meta.env.VITE_META_CONFIG_ID

  // 'choose'   → show Embedded Signup button + manual fallback toggle
  // 'select'   → OAuth succeeded, pick a phone number from the list
  // 'manual'   → developer manually enters credentials
  const [view,        setView]        = useState('choose')
  const [oauthOpts,   setOauthOpts]   = useState([])
  const [selected,    setSelected]    = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [done,        setDone]        = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [completing,  setCompleting]  = useState(false)

  const [form,      setForm]      = useState({ phoneNumberId: '', wabaId: '', accessToken: '' })
  const [showToken, setShowToken] = useState(false)

  // Meta's popup posts the exact waba_id/phone_number_id here as soon as signup finishes
  // (enabled by sessionInfoVersion: 2 below) — captured so we can hand it straight to the
  // backend instead of relying solely on /me/businesses, which can lag behind a business/WABA
  // that was just created inside this same signup session.
  const wabaHintRef = useRef({ wabaId: null, phoneNumberId: null })

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.origin.endsWith('facebook.com')) return
      let data
      try { data = JSON.parse(event.data) } catch { return }
      if (data.type !== 'WA_EMBEDDED_SIGNUP') return
      if (data.event === 'FINISH' || data.event === 'FINISH_ONLY_WABA') {
        wabaHintRef.current = {
          wabaId:        data.data?.waba_id || null,
          phoneNumberId: data.data?.phone_number_id || null,
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const finish = async (name) => {
    setCompleting(true)
    try {
      await axiosInstance.post('/api/v1/profile/complete-onboarding')
    } catch {}
    setDisplayName(name)
    setDone(true)
    setCompleting(false)
  }

  // ── Embedded Signup ───────────────────────────────────────────────────────

  const handleAuthCode = async (code) => {
    setLoading(true)
    try {
      const { data } = await axiosInstance.post('/api/v1/profile/wa-connect-oauth', {
        code,
        wabaId:        wabaHintRef.current.wabaId,
        phoneNumberId: wabaHintRef.current.phoneNumberId,
      })
      const opts = data.data?.options || []
      if (opts.length === 1) {
        await finalizeNumber(opts[0])
      } else {
        setOauthOpts(opts)
        setView('select')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect with Meta. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const launchEmbeddedSignup = useCallback(() => {
    if (!fbReady || !window.FB) return
    setError('')
    // The FB SDK rejects an `async` function passed directly as this callback
    // ("Expression is of type asyncfunction, not function") — must stay a plain
    // sync function; the async work happens in handleAuthCode instead.
    window.FB.login(
      (response) => {
        if (!response.authResponse?.code) {
          if (response.status !== 'connected') setError('Meta login was cancelled or failed. Please try again.')
          return
        }
        handleAuthCode(response.authResponse.code)
      },
      {
        config_id:                      configId,
        response_type:                  'code',
        override_default_response_type: true,
        extras:                         { sessionInfoVersion: 2 },
      }
    )
  }, [fbReady, configId])

  const finalizeNumber = async (opt) => {
    setLoading(true)
    setError('')
    try {
      await axiosInstance.put('/api/v1/profile/wa-select-number', {
        phoneNumberId: opt.phoneNumberId,
        wabaId:        opt.wabaId,
        displayName:   opt.verifiedName || opt.displayPhone,
        displayPhone:  opt.displayPhone,
      })
      await finish(opt.verifiedName || opt.displayPhone)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save number. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Manual fallback ───────────────────────────────────────────────────────

  const handleManualConnect = async () => {
    if (!form.phoneNumberId.trim() || !form.wabaId.trim() || !form.accessToken.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await axiosInstance.put('/api/v1/profile/wa-connect', {
        phoneNumberId: form.phoneNumberId.trim(),
        wabaId:        form.wabaId.trim(),
        accessToken:   form.accessToken.trim(),
      })
      // Backend verifies against Meta and returns the real phone/business name — never trust local form state
      await finish(data.data?.tenant?.whatsapp?.displayName || 'your WhatsApp number')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnterDashboard = () => {
    useAuthStore.getState().setOnboarded()
    onDismiss?.()
  }

  const embeddedSignupAvailable = appId && configId && fbReady

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT }}
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {done ? (
          /* ── Completion ── */
          <div className="px-6 py-10 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 size={32} className="text-green-600" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.25, ease: EASE_OUT }}>
              <h2 className="text-xl font-semibold text-gray-900">WhatsApp connected!</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                <span className="font-semibold text-gray-800">{displayName}</span> is ready to send and receive messages.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleEnterDashboard}
                disabled={completing}
                className="px-7 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
              >
                Enter Dashboard →
              </motion.button>
            </motion.div>
          </div>
        ) : view === 'select' ? (
          /* ── Pick a number after OAuth ── */
          <div className="px-6 py-5">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Select Your Number</h2>
              <p className="text-sm text-gray-500 mt-1">Choose which WhatsApp number to connect</p>
            </div>

            <div className="space-y-2">
              {oauthOpts.map((opt) => (
                <button
                  key={opt.phoneNumberId}
                  onClick={() => setSelected(opt)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors ${
                    selected?.phoneNumberId === opt.phoneNumberId
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Phone size={15} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{opt.verifiedName}</p>
                    <p className="text-xs text-gray-400">{opt.displayPhone} · WABA {opt.wabaId}</p>
                  </div>
                  {selected?.phoneNumberId === opt.phoneNumberId && (
                    <Check size={15} className="ml-auto text-green-600" />
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => { setView('choose'); setSelected(null); setError('') }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
              <Btn onClick={() => selected && finalizeNumber(selected)} disabled={!selected} loading={loading}>
                Connect Number <Check size={14} />
              </Btn>
            </div>
          </div>
        ) : view === 'manual' ? (
          /* ── Manual credential entry ── */
          <div className="px-6 py-5">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Enter Credentials</h2>
              <p className="text-sm text-gray-500 mt-1">Paste your Meta API credentials — we'll verify them and fetch your number and business name automatically</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-3">
              <p className="text-xs text-gray-500">
                From{' '}
                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Meta Developer Console</a>
                {' '}→ WhatsApp → API Setup
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number ID</label>
                <input type="text" placeholder="123456789012345" value={form.phoneNumberId}
                  onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">WABA ID</label>
                <input type="text" placeholder="987654321098765" value={form.wabaId}
                  onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Permanent Access Token</label>
                <div className="relative">
                  <input type={showToken ? 'text' : 'password'} placeholder="EAA..."
                    value={form.accessToken}
                    onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                    className="w-full px-3 py-2 pr-9 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono" />
                  <button type="button" onClick={() => setShowToken((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Use a System User permanent token — never a temporary one</p>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button onClick={() => { setView('choose'); setError('') }} className="text-xs text-gray-400 hover:text-gray-600">
                ← Back
              </button>
              <Btn onClick={handleManualConnect} disabled={!form.phoneNumberId.trim() || !form.wabaId.trim() || !form.accessToken.trim()} loading={loading}>
                {loading ? 'Saving…' : 'Connect & Finish'} {!loading && <Check size={14} />}
              </Btn>
            </div>
          </div>
        ) : (
          /* ── Default: Connect WhatsApp ── */
          <div className="px-6 py-5">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-gray-900">Connect WhatsApp</h2>
              <p className="text-sm text-gray-500 mt-1">Link your WhatsApp Business number to start messaging your customers</p>
            </div>

            {/* Primary: Meta Embedded Signup */}
            <motion.div custom={0} initial="hidden" animate="visible" variants={fieldVariants}>
              <div className={`rounded-xl border-2 p-4 mb-3 ${embeddedSignupAvailable ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">Connect with Meta</p>
                    <p className="text-xs text-gray-500 mt-0.5">Sign in with Facebook and select your WhatsApp Business number. Tokens are stored encrypted and never exposed.</p>
                    {!embeddedSignupAvailable && (
                      <p className="text-xs text-amber-600 mt-1.5 font-medium">
                        Requires <code className="bg-amber-100 px-1 rounded">VITE_META_APP_ID</code> and <code className="bg-amber-100 px-1 rounded">VITE_META_CONFIG_ID</code> in your frontend .env
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={launchEmbeddedSignup}
                  disabled={!embeddedSignupAvailable || loading}
                  className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    embeddedSignupAvailable
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Connecting…</> : 'Continue with Meta'}
                </button>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Secondary: manual entry */}
            <motion.div custom={1} initial="hidden" animate="visible" variants={fieldVariants}>
              <button
                onClick={() => setView('manual')}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <ChevronDown size={15} className="text-gray-500 -rotate-90" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Enter credentials manually</p>
                  <p className="text-xs text-gray-400">Paste your Phone Number ID, WABA ID, and access token</p>
                </div>
                <ChevronRight size={14} className="ml-auto text-gray-400 shrink-0" />
              </button>
            </motion.div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={13} /> {error}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
