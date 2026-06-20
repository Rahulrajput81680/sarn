import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ChevronRight, Loader2, CheckCircle2,
  Building2, CreditCard, Smartphone, Users,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const EASE_OUT = [0.23, 1, 0.32, 1]

const STEP_META = [
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'plan', label: 'Plan', icon: CreditCard },
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { id: 'team', label: 'Team', icon: Users },
]

const INDUSTRIES = [
  'E-commerce', 'Healthcare', 'Education', 'Finance',
  'Real Estate', 'Retail', 'Hospitality', 'Other',
]

const PLANS = [
  {
    id: 'trial',
    name: 'Free Trial',
    price: '$0',
    duration: '14 days',
    features: ['500 messages/day', '1 WhatsApp number', 'Basic automation'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    duration: '/month',
    features: ['5,000 messages/day', '1 WhatsApp number', 'Full automation', 'Analytics'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    duration: '/month',
    features: ['Unlimited messages', '3 WhatsApp numbers', 'Priority support', 'Advanced analytics'],
  },
]

const META_STEPS = [
  { label: 'Connect Facebook Business Manager', desc: 'OAuth flow to link FB Business account', action: 'Connect via Facebook' },
  { label: 'Verify Business Details', desc: 'Business name, website, industry confirmation', action: 'Confirm Details' },
  { label: 'Connect WhatsApp Business Account', desc: 'WABA linking via Meta Graph API', action: 'Link WABA' },
  { label: 'Add Phone Number', desc: 'Enter number to register with WhatsApp Business', action: 'Register Number' },
  { label: 'OTP Verification', desc: 'Receive and enter OTP to verify ownership', action: 'Verify OTP' },
  { label: 'Webhook Connection', desc: 'System configures webhooks for message events', action: 'Auto-configure' },
  { label: 'Status Dashboard', desc: 'View quality rating, messaging limits, connection health', action: 'View Status' },
]

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE_OUT, delay: i * 0.045 },
  }),
}

function StepBtn({ onClick, disabled, children, variant = 'primary' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg transition-opacity ${
        variant === 'primary'
          ? 'bg-green-600 text-white disabled:opacity-40 disabled:cursor-not-allowed'
          : 'text-gray-500 hover:text-gray-700'
      }`}
      style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 120ms ease' }}
    >
      {children}
    </motion.button>
  )
}

function BusinessDetails({ data, onChange, onNext }) {
  const valid = data.companyName?.trim() && data.industry

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Business Details</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about your company</p>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Company Name', key: 'companyName', type: 'text', placeholder: 'Acme Corp', i: 0 },
          { label: 'Website URL', key: 'website', type: 'url', placeholder: 'https://yourcompany.com', i: 1 },
        ].map(({ label, key, type, placeholder, i }) => (
          <motion.div key={key} custom={i} initial="hidden" animate="visible" variants={fieldVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={data[key] || ''}
              onChange={(e) => onChange({ ...data, [key]: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow duration-150"
            />
          </motion.div>
        ))}
        <motion.div custom={2} initial="hidden" animate="visible" variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <select
            value={data.industry || ''}
            onChange={(e) => onChange({ ...data, industry: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Select industry…</option>
            {INDUSTRIES.map((ind) => <option key={ind}>{ind}</option>)}
          </select>
        </motion.div>
      </div>
      <div className="mt-6 flex justify-end">
        <StepBtn onClick={onNext} disabled={!valid}>
          Continue <ChevronRight size={15} />
        </StepBtn>
      </div>
    </div>
  )
}

function ChoosePlan({ data, onChange, onNext, onBack }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Choose Your Plan</h2>
        <p className="text-sm text-gray-500 mt-1">You can upgrade anytime</p>
      </div>
      <div className="space-y-3">
        {PLANS.map((plan, i) => (
          <motion.button
            key={plan.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fieldVariants}
            whileTap={{ scale: 0.985 }}
            onClick={() => onChange({ ...data, plan: plan.id })}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-150 ${
              data.plan === plan.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
            style={{ transition: 'border-color 150ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{plan.features.join(' · ')}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-base font-bold text-gray-900">{plan.price}</p>
                <p className="text-xs text-gray-400">{plan.duration}</p>
              </div>
            </div>
            <AnimatePresence>
              {data.plan === plan.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="mt-2 flex items-center gap-1 text-green-600 overflow-hidden"
                >
                  <Check size={12} />
                  <span className="text-xs font-medium">Selected</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <StepBtn onClick={onBack} variant="ghost">Back</StepBtn>
        <StepBtn onClick={onNext} disabled={!data.plan}>
          Continue <ChevronRight size={15} />
        </StepBtn>
      </div>
    </div>
  )
}

function ConnectWhatsApp({ data, onChange, onNext, onBack }) {
  const [metaStep, setMetaStep] = useState(data.metaStep ?? 0)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState(data.phone || '')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [metaDir, setMetaDir] = useState(1)
  const isComplete = metaStep >= META_STEPS.length

  const advance = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setMetaDir(1)
      const next = metaStep + 1
      setMetaStep(next)
      onChange({ ...data, metaStep: next, phone })
    }, 1600)
  }

  const handleOtp = (i, val) => {
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 3) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const canAdvance =
    metaStep === 3 ? phone.trim().length >= 7
    : metaStep === 4 ? otp.every(Boolean)
    : true

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Connect WhatsApp</h2>
        <p className="text-sm text-gray-500 mt-1">Link your number via Meta API</p>
      </div>

      {/* Sub-step progress dots */}
      <div className="flex items-center gap-1.5 mb-4">
        {META_STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: i < metaStep ? '#16a34a' : i === metaStep ? '#86efac' : '#f3f4f6',
              transition: 'background-color 300ms ease',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={metaDir}>
        {isComplete ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="text-center py-4"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">WhatsApp Connected!</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">{phone} is active and verified</p>
            <div className="grid grid-cols-3 gap-2">
              {[['Quality', 'High'], ['Limit', '1K/day'], ['Status', 'Live']].map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={metaStep}
            custom={metaDir}
            initial={(d) => ({ opacity: 0, x: d * 24 })}
            animate={{ opacity: 1, x: 0 }}
            exit={(d) => ({ opacity: 0, x: d * -24 })}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="bg-gray-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                {metaStep + 1}/{META_STEPS.length}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mt-1">{META_STEPS[metaStep].label}</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">{META_STEPS[metaStep].desc}</p>

            {metaStep === 1 && (
              <div className="space-y-1.5 mb-4 text-xs text-gray-600">
                {[['Company', data.companyName || '—'], ['Website', data.website || '—'], ['Industry', data.industry || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {metaStep === 3 && (
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                maxLength={10}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white mb-4"
              />
            )}

            {metaStep === 4 && (
              <div className="flex gap-2 justify-center mb-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtp(i, e.target.value)}
                    className="w-11 h-11 text-center text-lg font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                ))}
              </div>
            )}

            {metaStep === 5 && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <Loader2 size={13} className="animate-spin text-green-500" />
                Configuring webhooks automatically…
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={advance}
              disabled={loading || !canAdvance}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 120ms ease' }}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? 'Connecting…' : META_STEPS[metaStep].action}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex justify-between">
        <StepBtn onClick={onBack} variant="ghost">Back</StepBtn>
        <StepBtn onClick={onNext} disabled={!isComplete}>
          Continue <ChevronRight size={15} />
        </StepBtn>
      </div>
    </div>
  )
}

function InviteTeam({ onNext, onBack }) {
  const [emails, setEmails] = useState([{ email: '', role: 'agent' }])

  const update = (i, field, val) => {
    const next = emails.map((e, idx) => idx === i ? { ...e, [field]: val } : e)
    setEmails(next)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Invite Team</h2>
        <p className="text-sm text-gray-500 mt-1">Optional — you can do this later in Settings</p>
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {emails.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder="teammate@company.com"
                value={item.email}
                onChange={(e) => update(i, 'email', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                value={item.role}
                onChange={(e) => update(i, 'role', e.target.value)}
                className="px-2 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setEmails([...emails, { email: '', role: 'agent' }])}
          className="text-xs text-green-600 hover:text-green-700 font-medium mt-1"
        >
          + Add another
        </motion.button>
      </div>
      <div className="mt-6 flex justify-between">
        <StepBtn onClick={onBack} variant="ghost">Back</StepBtn>
        <div className="flex gap-2">
          <StepBtn onClick={onNext} variant="ghost">Skip</StepBtn>
          <StepBtn onClick={onNext}>
            Send Invites <ChevronRight size={15} />
          </StepBtn>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingWizard() {
  const { setOnboarded } = useAuthStore()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [formData, setFormData] = useState({})

  const goNext = () => { setDir(1); setStep((s) => s + 1) }
  const goBack = () => { setDir(-1); setStep((s) => s - 1) }

  const steps = [
    <BusinessDetails data={formData} onChange={setFormData} onNext={goNext} />,
    <ChoosePlan data={formData} onChange={setFormData} onNext={goNext} onBack={goBack} />,
    <ConnectWhatsApp data={formData} onChange={setFormData} onNext={goNext} onBack={goBack} />,
    <InviteTeam onNext={goNext} onBack={goBack} />,
  ]

  const isDone = step >= steps.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {!isDone ? (
          <>
            {/* Step indicator header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-1">
                {STEP_META.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors duration-200"
                      style={{
                        backgroundColor: i < step ? '#16a34a' : i === step ? '#16a34a' : '#f3f4f6',
                        color: i <= step ? '#fff' : '#9ca3af',
                        transition: 'background-color 200ms ease, color 200ms ease',
                      }}
                    >
                      {i < step ? <Check size={11} /> : i + 1}
                    </div>
                    {i < STEP_META.length - 1 && (
                      <div
                        className="h-px flex-1 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i < step ? '#16a34a' : '#e5e7eb' }}
                      />
                    )}
                  </div>
                ))}
                <span className="ml-2 text-xs text-gray-400 shrink-0">{step + 1}/{steps.length}</span>
              </div>
            </div>

            {/* Step content */}
            <div className="px-6 py-5 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  initial={(d) => ({ opacity: 0, x: d * 32 })}
                  animate={{ opacity: 1, x: 0 }}
                  exit={(d) => ({ opacity: 0, x: d * -32 })}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                >
                  {steps[step]}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Completion screen */
          <div className="px-6 py-10 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.55, bounce: 0.28 }}
              className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 size={32} className="text-green-600" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.25, ease: EASE_OUT }}
            >
              <h2 className="text-xl font-semibold text-gray-900">You're all set!</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                {formData.companyName || 'Your business'} is ready to automate WhatsApp
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={setOnboarded}
                className="px-7 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg"
                style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
              >
                Enter Dashboard
              </motion.button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
