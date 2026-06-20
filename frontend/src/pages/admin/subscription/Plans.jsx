import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Check, X, Save, ChevronRight,
  MessageSquare, Phone, Users, BookUser, Bot,
  Clock, ShieldOff, EyeOff, LogOut, AlertTriangle,
  ArrowUpDown, Zap, Settings,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Initial plan data ──────────────────────────────────── */

const INITIAL_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    color: 'gray',
    gradient: 'from-gray-50 to-gray-100',
    border: 'border-gray-200',
    popular: false,
    limits: {
      connectedNumbers: 1,
      monthlyMessages: 5000,
      teamMembers: 3,
      contacts: 2000,
      chatbotFlows: 2,
    },
    features: {
      analytics: false,
      apiAccess: false,
      bulkMessaging: true,
      templateCreation: true,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    color: 'blue',
    gradient: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    popular: true,
    limits: {
      connectedNumbers: 3,
      monthlyMessages: 25000,
      teamMembers: 10,
      contacts: 10000,
      chatbotFlows: 10,
    },
    features: {
      analytics: true,
      apiAccess: true,
      bulkMessaging: true,
      templateCreation: true,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 7999,
    yearlyPrice: 79990,
    color: 'purple',
    gradient: 'from-purple-50 to-purple-100',
    border: 'border-purple-200',
    popular: false,
    limits: {
      connectedNumbers: 10,
      monthlyMessages: 200000,
      teamMembers: 50,
      contacts: 100000,
      chatbotFlows: 50,
    },
    features: {
      analytics: true,
      apiAccess: true,
      bulkMessaging: true,
      templateCreation: true,
      prioritySupport: true,
      whiteLabel: true,
    },
  },
]

const INITIAL_TRIAL = {
  duration: 14,
  messageQuota: 500,
  features: {
    bulkMessaging: false,
    apiAccess: false,
    analytics: false,
    chatbotFlows: true,
    templateCreation: true,
  },
}

const INITIAL_GRACE = {
  duration: 5,
  allowSending: true,
  allowBulk: false,
  allowBotFlows: true,
  notifyDaysBefore: 3,
}

const INITIAL_LOCK = {
  readOnlyMode: true,
  sendingDisabled: true,
  teamLoginRestricted: false,
  botFlowsDisabled: true,
  bulkDisabled: true,
}

const LIMIT_META = [
  { key: 'connectedNumbers', label: 'Connected WA Numbers', icon: Phone,         unit: 'numbers' },
  { key: 'monthlyMessages',  label: 'Monthly Messages',     icon: MessageSquare, unit: 'msgs/mo', large: true },
  { key: 'teamMembers',      label: 'Team Members',         icon: Users,         unit: 'members' },
  { key: 'contacts',         label: 'Contacts',             icon: BookUser,      unit: 'contacts', large: true },
  { key: 'chatbotFlows',     label: 'Chatbot Flows',        icon: Bot,           unit: 'flows' },
]

const FEATURE_META = [
  { key: 'analytics',         label: 'Analytics' },
  { key: 'apiAccess',         label: 'API Access' },
  { key: 'bulkMessaging',     label: 'Bulk Messaging' },
  { key: 'templateCreation',  label: 'Template Creation' },
  { key: 'prioritySupport',   label: 'Priority Support' },
  { key: 'whiteLabel',        label: 'White Label' },
]

function fmtLimit(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

const planBadgeColor = { starter: 'gray', growth: 'blue', enterprise: 'purple' }

/* ─── Toggle switch ──────────────────────────────────────── */

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${checked ? 'bg-green-500' : 'bg-gray-200'}`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  )
}

/* ─── Number input row ───────────────────────────────────── */

function NumInput({ label, icon: Icon, value, onChange, unit, large }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-gray-500" />
      </div>
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="w-24 px-2.5 py-1 text-sm font-semibold text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
        />
        <span className="text-xs text-gray-400 w-16">{unit}</span>
      </div>
    </div>
  )
}

/* ─── Plan edit modal ────────────────────────────────────── */

function PlanModal({ plan, onSave, onClose, isNew }) {
  const [form, setForm] = useState(plan)
  const setLimit   = (k, v) => setForm((f) => ({ ...f, limits:   { ...f.limits,   [k]: v } }))
  const setFeature = (k, v) => setForm((f) => ({ ...f, features: { ...f.features, [k]: v } }))
  const setField   = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">{isNew ? 'Create Pricing Plan' : `Edit ${plan.name} Plan`}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Plan Name',      key: 'name',         type: 'text' },
              { label: 'Monthly Price (₹)', key: 'monthlyPrice', type: 'number' },
              { label: 'Yearly Price (₹)',  key: 'yearlyPrice',  type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key} className={key === 'name' ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setField(key, type === 'number' ? +e.target.value : e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
                />
              </div>
            ))}
          </div>

          {/* Limits */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Plan Limits</p>
            <div className="bg-gray-50 rounded-xl px-4 py-1 border border-gray-100">
              {LIMIT_META.map(({ key, label, icon, unit, large }) => (
                <NumInput
                  key={key}
                  label={label}
                  icon={icon}
                  unit={unit}
                  value={form.limits[key]}
                  onChange={(v) => setLimit(key, v)}
                  large={large}
                />
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Features Included</p>
            <div className="bg-gray-50 rounded-xl px-4 py-1 border border-gray-100">
              {FEATURE_META.map(({ key, label }) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={form.features[key]}
                  onChange={(v) => setFeature(key, v)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-semibold transition-all"
          >
            <Save size={14} /> {isNew ? 'Create Plan' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

/* ─── Plans tab ──────────────────────────────────────────── */

function PlansTab() {
  const [plans, setPlans] = useState(INITIAL_PLANS)
  const [editing, setEditing]   = useState(null)
  const [creating, setCreating] = useState(false)
  const [billing, setBilling]   = useState('monthly')

  const BLANK = {
    id: `plan_${Date.now()}`, name: '', monthlyPrice: 0, yearlyPrice: 0,
    color: 'gray', gradient: 'from-gray-50 to-gray-100', border: 'border-gray-200', popular: false,
    limits: { connectedNumbers: 1, monthlyMessages: 1000, teamMembers: 2, contacts: 500, chatbotFlows: 1 },
    features: { analytics: false, apiAccess: false, bulkMessaging: true, templateCreation: true, prioritySupport: false, whiteLabel: false },
  }

  const handleSave = (updated) => {
    setPlans((prev) => {
      const exists = prev.find((p) => p.id === updated.id)
      return exists ? prev.map((p) => p.id === updated.id ? updated : p) : [...prev, updated]
    })
    setEditing(null)
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-0.5 gap-0.5">
          {['monthly', 'yearly'].map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${billing === b ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {b}{billing === 'yearly' && b === 'yearly' ? ' (save 17%)' : ''}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-semibold transition-all"
        >
          <Plus size={14} /> Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT, delay: i * 0.05 }}
            className={`bg-gradient-to-br ${plan.gradient} rounded-2xl border ${plan.border} p-5 relative`}
          >
            {plan.popular && (
              <span className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            <div className="flex items-center gap-2 mb-1">
              <Badge color={planBadgeColor[plan.id] || 'gray'}>{plan.name}</Badge>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">
              ₹{(billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice).toLocaleString()}
              <span className="text-sm font-normal text-gray-500">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
            </p>

            <div className="mt-4 space-y-1.5">
              {LIMIT_META.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-2 text-xs text-gray-700">
                  <Icon size={11} className="text-gray-400 shrink-0" />
                  <span className="font-semibold">{fmtLimit(plan.limits[key])}</span>
                  <span className="text-gray-500">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-black/5 space-y-1">
              {FEATURE_META.map(({ key, label }) => (
                <div key={key} className={`flex items-center gap-1.5 text-xs ${plan.features[key] ? 'text-gray-700' : 'text-gray-300'}`}>
                  <Check size={11} className={plan.features[key] ? 'text-green-600' : 'text-gray-300'} />
                  {label}
                </div>
              ))}
            </div>

            <button
              onClick={() => setEditing({ ...plan })}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-300 bg-white/60 hover:bg-white text-xs font-semibold text-gray-700 transition-colors"
            >
              <Pencil size={11} /> Edit Plan
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {(editing || creating) && (
          <PlanModal
            plan={creating ? BLANK : editing}
            isNew={creating}
            onSave={handleSave}
            onClose={() => { setEditing(null); setCreating(false) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Trial & Grace tab ──────────────────────────────────── */

function TrialGraceTab() {
  const [trial, setTrial] = useState(INITIAL_TRIAL)
  const [grace, setGrace] = useState(INITIAL_GRACE)
  const [saved, setSaved] = useState(false)

  const setTrialField   = (k, v) => setTrial((t) => ({ ...t, [k]: v }))
  const setTrialFeature = (k, v) => setTrial((t) => ({ ...t, features: { ...t.features, [k]: v } }))
  const setGraceField   = (k, v) => setGrace((g) => ({ ...g, [k]: v }))

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Trial config */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock size={15} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Trial Configuration</p>
            <p className="text-xs text-gray-400">Applied to all new accounts</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Trial Duration</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={trial.duration}
                  onChange={(e) => setTrialField('duration', +e.target.value)}
                  className="w-20 px-3 py-2 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Message Quota</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={trial.messageQuota}
                  onChange={(e) => setTrialField('messageQuota', +e.target.value)}
                  className="w-24 px-3 py-2 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
                />
                <span className="text-sm text-gray-500">msgs</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Features available during trial</p>
            <div className="bg-gray-50 rounded-xl px-4 py-1 border border-gray-100">
              {Object.entries(trial.features).map(([k, v]) => (
                <Toggle
                  key={k}
                  label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  checked={v}
                  onChange={(val) => setTrialFeature(k, val)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grace period */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
            <AlertTriangle size={15} className="text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Grace Period Handling</p>
            <p className="text-xs text-gray-400">Buffer after subscription expires</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Grace Duration</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={grace.duration}
                  onChange={(e) => setGraceField('duration', +e.target.value)}
                  className="w-20 px-3 py-2 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notify Before</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={grace.notifyDaysBefore}
                  onChange={(e) => setGraceField('notifyDaysBefore', +e.target.value)}
                  className="w-20 px-3 py-2 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
                />
                <span className="text-sm text-gray-500">days prior</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">During grace period, allow:</p>
            <div className="bg-gray-50 rounded-xl px-4 py-1 border border-gray-100">
              <Toggle label="Sending messages" desc="Allow replies within 24h window" checked={grace.allowSending} onChange={(v) => setGraceField('allowSending', v)} />
              <Toggle label="Bulk / Campaign sending" desc="Proactive outbound stays blocked" checked={grace.allowBulk} onChange={(v) => setGraceField('allowBulk', v)} />
              <Toggle label="Chatbot flows" desc="Bot continues responding" checked={grace.allowBotFlows} onChange={(v) => setGraceField('allowBotFlows', v)} />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45'}`}
        >
          {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Trial & Grace Settings</>}
        </button>
      </div>
    </div>
  )
}

/* ─── Lock Rules tab ─────────────────────────────────────── */

function LockRulesTab() {
  const [lock, setLock] = useState(INITIAL_LOCK)
  const [upDownRule, setUpDownRule] = useState({
    allowSelfUpgrade: true,
    requireAdminApprovalDowngrade: true,
    prorationMode: 'immediate',
  })
  const [saved, setSaved] = useState(false)

  const setLockField = (k, v) => setLock((l) => ({ ...l, [k]: v }))
  const handleSave   = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Expiry lock rules */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <ShieldOff size={15} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Expiry Lock Rules</p>
              <p className="text-xs text-gray-400">Applied immediately after grace period ends</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-1 border border-gray-100">
            <Toggle
              label="Read-only mode"
              desc="Client can view data but cannot modify"
              checked={lock.readOnlyMode}
              onChange={(v) => setLockField('readOnlyMode', v)}
            />
            <Toggle
              label="Sending disabled"
              desc="All outbound messages blocked (including bots)"
              checked={lock.sendingDisabled}
              onChange={(v) => setLockField('sendingDisabled', v)}
            />
            <Toggle
              label="Bulk & campaigns disabled"
              desc="Proactive messaging blocked"
              checked={lock.bulkDisabled}
              onChange={(v) => setLockField('bulkDisabled', v)}
            />
            <Toggle
              label="Chatbot flows disabled"
              desc="Bot automation stops responding"
              checked={lock.botFlowsDisabled}
              onChange={(v) => setLockField('botFlowsDisabled', v)}
            />
            <Toggle
              label="Team login restricted"
              desc="Only account owner can login"
              checked={lock.teamLoginRestricted}
              onChange={(v) => setLockField('teamLoginRestricted', v)}
            />
          </div>

          <div className="mt-4 flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
            Enabling "Sending disabled" will also stop all bot flows automatically, regardless of the chatbot toggle.
          </div>
        </div>

        {/* Upgrade / downgrade controls */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <ArrowUpDown size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Upgrade / Downgrade Controls</p>
              <p className="text-xs text-gray-400">Control how plan changes are handled</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-1 border border-gray-100">
            <Toggle
              label="Allow self-upgrade"
              desc="Clients can upgrade their plan directly from billing"
              checked={upDownRule.allowSelfUpgrade}
              onChange={(v) => setUpDownRule((r) => ({ ...r, allowSelfUpgrade: v }))}
            />
            <Toggle
              label="Admin approval for downgrade"
              desc="Downgrades require admin confirmation"
              checked={upDownRule.requireAdminApprovalDowngrade}
              onChange={(v) => setUpDownRule((r) => ({ ...r, requireAdminApprovalDowngrade: v }))}
            />
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Proration mode on plan change</p>
            <div className="space-y-2">
              {[
                { val: 'immediate', label: 'Immediate',    desc: 'Charge/credit calculated now, applied today' },
                { val: 'next',      label: 'Next cycle',   desc: 'New price applies on next renewal date' },
                { val: 'none',      label: 'No proration', desc: 'No adjustments — simple plan swap' },
              ].map(({ val, label, desc }) => (
                <button
                  key={val}
                  onClick={() => setUpDownRule((r) => ({ ...r, prorationMode: val }))}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${upDownRule.prorationMode === val ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${upDownRule.prorationMode === val ? 'border-green-500' : 'border-gray-300'}`}>
                    {upDownRule.prorationMode === val && <div className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${upDownRule.prorationMode === val ? 'text-green-800' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45'}`}
        >
          {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Lock & Upgrade Rules</>}
        </button>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

const TABS = [
  { key: 'plans',    label: 'Pricing Plans',     icon: Zap },
  { key: 'trial',   label: 'Trial & Grace',      icon: Clock },
  { key: 'lock',    label: 'Lock & Upgrade Rules', icon: Settings },
]

export default function Plans() {
  const [tab, setTab] = useState('plans')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subscription Control"
        description="Manage pricing plans, limits, trial config, grace periods and lock rules"
        breadcrumbs={['Admin', 'Subscription', 'Control']}
      />

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === key && (
              <motion.div layoutId="sub-tab" className="absolute inset-0 bg-white rounded-lg shadow-sm" />
            )}
            <span className="relative flex items-center gap-2">
              <Icon size={13} />
              {label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
        >
          {tab === 'plans' && <PlansTab />}
          {tab === 'trial' && <TrialGraceTab />}
          {tab === 'lock'  && <LockRulesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
