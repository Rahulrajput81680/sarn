import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ChevronRight, Loader2, CheckCircle2,
  ExternalLink, ChevronDown, Eye, EyeOff, AlertCircle,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import axiosInstance from '../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

const STEP_META = [
  { id: 'business',  label: 'Business' },
  { id: 'whatsapp', label: 'WhatsApp' },
]

const INDUSTRIES = [
  'E-commerce', 'Healthcare', 'Education', 'Finance',
  'Real Estate', 'Retail', 'Hospitality', 'Technology', 'Other',
]

const fieldVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.22, ease: EASE_OUT, delay: i * 0.05 },
  }),
}

/* ─── Shared button ────────────────────────────────────────── */

function Btn({ onClick, disabled, loading, children, variant = 'primary', type = 'button' }) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg transition-opacity ${
        variant === 'primary'
          ? 'bg-green-600 text-white disabled:opacity-40 disabled:cursor-not-allowed'
          : 'text-gray-500 hover:text-gray-700'
      }`}
      style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 120ms ease' }}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </motion.button>
  )
}

/* ─── Step 1 — Business Info ───────────────────────────────── */

function BusinessDetails({ onNext }) {
  const { user, updateUser } = useAuthStore()
  const [form, setForm]     = useState({
    businessName: user?.businessName || '',
    industry:     '',
    website:      '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const valid = form.businessName.trim() && form.industry

  const handleNext = async () => {
    if (!valid) return
    setSaving(true)
    setError('')
    try {
      await axiosInstance.put('/api/v1/profile', {
        businessName: form.businessName.trim(),
        category:     form.industry,
        website:      form.website.trim(),
      })
      updateUser({ businessName: form.businessName.trim() })
      onNext(form)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Business Details</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about your business so we can set up your profile</p>
      </div>

      <div className="space-y-4">
        <motion.div custom={0} initial="hidden" animate="visible" variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Acme Corp"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
          />
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="visible" variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Select industry…</option>
            {INDUSTRIES.map((ind) => <option key={ind}>{ind}</option>)}
          </select>
        </motion.div>

        <motion.div custom={2} initial="hidden" animate="visible" variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website <span className="text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://yourcompany.com"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
          />
        </motion.div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Btn onClick={handleNext} disabled={!valid} loading={saving}>
          Continue <ChevronRight size={15} />
        </Btn>
      </div>
    </div>
  )
}

/* ─── Step 2 — Connect WhatsApp ────────────────────────────── */

function ConnectWhatsApp({ bizData, onFinish }) {
  const [form, setForm]       = useState({
    phoneNumber:   '',
    displayName:   bizData?.businessName || '',
    phoneNumberId: '',
    wabaId:        '',
    accessToken:   '',
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showToken,    setShowToken]    = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  const valid = form.phoneNumber.trim() && form.displayName.trim()

  const handleConnect = async () => {
    if (!valid) return
    setSaving(true)
    setError('')
    try {
      await axiosInstance.put('/api/v1/profile/wa-connect', {
        phoneNumber:   form.phoneNumber.trim(),
        displayName:   form.displayName.trim(),
        phoneNumberId: form.phoneNumberId.trim() || undefined,
        wabaId:        form.wabaId.trim()        || undefined,
        accessToken:   form.accessToken.trim()   || undefined,
      })
      onFinish(form.displayName)
    } catch {
      setError('Failed to connect WhatsApp. Check your details and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Connect WhatsApp</h2>
        <p className="text-sm text-gray-500 mt-1">Link your WhatsApp Business number to start messaging</p>
      </div>

      {/* Meta policy notice */}
      <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-blue-800 mb-1.5">Meta Business Requirements</p>
        <ul className="space-y-1 text-xs text-blue-700">
          <li className="flex items-start gap-1.5"><Check size={11} className="mt-0.5 shrink-0 text-blue-500" /> WhatsApp Business Account (WABA) approved by Meta</li>
          <li className="flex items-start gap-1.5"><Check size={11} className="mt-0.5 shrink-0 text-blue-500" /> Phone number verified and registered with Meta</li>
          <li className="flex items-start gap-1.5"><Check size={11} className="mt-0.5 shrink-0 text-blue-500" /> Business verified in Meta Business Manager</li>
        </ul>
        <a
          href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-700 hover:text-blue-900"
        >
          Meta setup guide <ExternalLink size={10} />
        </a>
      </div>

      <div className="space-y-4">
        <motion.div custom={0} initial="hidden" animate="visible" variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +91 for India</p>
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="visible" variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Acme Support"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">This name appears to your customers in WhatsApp</p>
        </motion.div>

        {/* Advanced: Meta API credentials */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={fieldVariants}>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronDown size={13} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            {showAdvanced ? 'Hide' : 'Add'} Meta API Credentials
            <span className="text-gray-400 font-normal">(optional — required for sending messages)</span>
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500">
                    Find these in your{' '}
                    <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Meta Developer Console</a>
                    {' '}→ WhatsApp → API Setup
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      placeholder="123456789012345"
                      value={form.phoneNumberId}
                      onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
                    <input
                      type="text"
                      placeholder="987654321098765"
                      value={form.wabaId}
                      onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Permanent Access Token</label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        placeholder="EAA..."
                        value={form.accessToken}
                        onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                        className="w-full px-3 py-2 pr-9 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Use a System User permanent token — never a temporary one</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Btn onClick={handleConnect} disabled={!valid} loading={saving}>
          {saving ? 'Connecting…' : 'Connect & Finish'}
          {!saving && <Check size={14} />}
        </Btn>
      </div>
    </div>
  )
}

/* ─── Main wizard ──────────────────────────────────────────── */

export default function OnboardingWizard() {
  const { setOnboarded, updateUser } = useAuthStore()
  const [step,        setStep]     = useState(0)
  const [dir,         setDir]      = useState(1)
  const [done,        setDone]     = useState(false)
  const [bizData,     setBizData]  = useState(null)
  const [bizName,     setBizName]  = useState('')
  const [completing,  setCompleting] = useState(false)

  const handleBizNext = (data) => {
    setBizData(data)
    setDir(1)
    setStep(1)
  }

  const handleFinish = async (displayName) => {
    setCompleting(true)
    try {
      await axiosInstance.post('/api/v1/profile/complete-onboarding')
    } catch {}
    setBizName(displayName || bizData?.businessName || 'Your business')
    setDone(true)
    setCompleting(false)
  }

  const handleEnterDashboard = () => {
    setOnboarded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT }}
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {!done ? (
          <>
            {/* Step header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-1">
                {STEP_META.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{
                        backgroundColor: i <= step ? '#16a34a' : '#f3f4f6',
                        color: i <= step ? '#fff' : '#9ca3af',
                        transition: 'background-color 220ms ease, color 220ms ease',
                      }}
                    >
                      {i < step ? <Check size={11} /> : i + 1}
                    </div>
                    {i < STEP_META.length - 1 && (
                      <div
                        className="h-px flex-1 mx-1 rounded-full"
                        style={{
                          backgroundColor: i < step ? '#16a34a' : '#e5e7eb',
                          transition: 'background-color 300ms ease',
                        }}
                      />
                    )}
                  </div>
                ))}
                <span className="ml-2 text-xs text-gray-400 shrink-0">{step + 1}/{STEP_META.length}</span>
              </div>

              {/* Labels */}
              <div className="flex mt-2">
                {STEP_META.map((s, i) => (
                  <div key={s.id} className="flex-1">
                    <p className={`text-xs font-medium ${i === step ? 'text-green-700' : i < step ? 'text-green-500' : 'text-gray-400'}`}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="px-6 py-5 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  initial={(d) => ({ opacity: 0, x: d * 28 })}
                  animate={{ opacity: 1, x: 0 }}
                  exit={(d) => ({ opacity: 0, x: d * -28 })}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                >
                  {step === 0 && <BusinessDetails onNext={handleBizNext} />}
                  {step === 1 && <ConnectWhatsApp bizData={bizData} onFinish={handleFinish} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Completion */
          <div className="px-6 py-10 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 size={32} className="text-green-600" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.25, ease: EASE_OUT }}
            >
              <h2 className="text-xl font-semibold text-gray-900">You're all set!</h2>
              <p className="text-sm text-gray-500 mt-1 mb-2">
                <span className="font-semibold text-gray-800">{bizName}</span> is ready on WhatsApp
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Start by sending a test message or importing your contacts.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  ['Policy', 'Compliant'],
                  ['Status', 'Connected'],
                  ['Inbox', 'Ready'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-semibold text-green-700 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

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
        )}
      </motion.div>
    </div>
  )
}
