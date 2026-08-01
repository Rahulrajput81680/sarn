import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Send, Megaphone, Bell, RefreshCw, HeadphonesIcon,
  ChevronRight, ChevronLeft, CheckCircle2, Check, Users, FileText,
  AlertCircle, Trash2, Tag, Eye, Loader2, Play, BarChart2,
} from 'lucide-react'
import axiosInstance from '../../../api/axios'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

const OBJECTIVES = [
  { key: 'promotion',    label: 'Promotion',     icon: Megaphone,      color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400', desc: 'Offers, sales, product launches' },
  { key: 'reminder',     label: 'Reminder',      icon: Bell,           color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-400',  desc: 'Appointments, payments, events' },
  { key: 'reengagement', label: 'Re-engagement', icon: RefreshCw,      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-400',   desc: 'Win-back inactive contacts' },
  { key: 'support',      label: 'Support',       icon: HeadphonesIcon, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-400',  desc: 'Follow-ups, feedback, help' },
]

const STATUS_META = {
  draft:     { label: 'Draft',     color: 'text-gray-600',  bg: 'bg-gray-100', dot: 'bg-gray-400',  pulse: false },
  scheduled: { label: 'Scheduled', color: 'text-blue-700',  bg: 'bg-blue-50',  dot: 'bg-blue-500',  pulse: false },
  running:   { label: 'Running',   color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500', pulse: true  },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500', pulse: false },
  failed:    { label: 'Failed',    color: 'text-red-600',   bg: 'bg-red-50',   dot: 'bg-red-400',   pulse: false },
  paused:    { label: 'Paused',    color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', pulse: false },
}

const OBJ_BADGE = {
  promotion:    'bg-purple-50 text-purple-700',
  reminder:     'bg-amber-50 text-amber-700',
  reengagement: 'bg-blue-50 text-blue-700',
  support:      'bg-green-50 text-green-700',
}
const OBJ_LABEL = {
  promotion: 'Promotion', reminder: 'Reminder',
  reengagement: 'Re-engagement', support: 'Support',
}

// Extract {{1}}, {{2}} etc from Meta template body
const extractVars = (body) =>
  [...new Set((body || '').match(/\{\{(\d+)\}\}/g)?.map(m => m.slice(2, -2)) || [])]

// Get BODY component text from template object
const getTemplateBody = (template) =>
  template?.components?.find(c => c.type === 'BODY')?.text || ''

// Replace {{N}} placeholders with actual values for preview
const resolvePreview = (body, varMap) =>
  (body || '').replace(/\{\{(\d+)\}\}/g, (_, key) => varMap?.[key] || `{{${key}}}`)

/* ── Shared button ─────────────────────────────────────────────────────────── */

function StepBtn({ onClick, disabled, loading: isLoading, children, variant = 'primary' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
        variant === 'primary'
          ? 'bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 disabled:opacity-40 disabled:cursor-not-allowed'
          : 'text-gray-600 border border-gray-200 hover:border-gray-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed'
      }`}
      style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 120ms ease' }}
    >
      {isLoading && <Loader2 size={13} className="animate-spin" />}
      {children}
    </motion.button>
  )
}

/* ── Status badge ──────────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${m.bg} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${m.pulse ? 'animate-pulse' : ''}`} />
      {m.label}
    </span>
  )
}

/* ── Step 1: Campaign details ──────────────────────────────────────────────── */

function StepDetails({ data, onChange, onNext }) {
  const valid = data.name?.trim() && data.objective
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Name your campaign and choose its objective</p>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Campaign Name</label>
        <input
          type="text"
          placeholder="e.g. June Win-back Campaign"
          value={data.name || ''}
          onChange={e => onChange({ ...data, name: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">Objective</label>
        <div className="grid grid-cols-2 gap-3">
          {OBJECTIVES.map((obj, i) => (
            <motion.button
              key={obj.key}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT, delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange({ ...data, objective: obj.key })}
              className={`p-3.5 rounded-xl border-2 text-left transition-colors duration-150 ${
                data.objective === obj.key ? `${obj.border} ${obj.bg}` : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <obj.icon size={14} className={data.objective === obj.key ? obj.color : 'text-gray-400'} />
                <p className="text-sm font-semibold text-gray-900">{obj.label}</p>
              </div>
              <p className="text-xs text-gray-400">{obj.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <StepBtn onClick={onNext} disabled={!valid}>Continue <ChevronRight size={15} /></StepBtn>
      </div>
    </div>
  )
}

/* ── Step 2: Template selection ────────────────────────────────────────────── */

function StepTemplate({ data, onChange, onNext, onBack, templates, loading }) {
  const [preview, setPreview] = useState(null)

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-2">
      <Loader2 size={20} className="animate-spin text-green-500" />
      <span className="text-sm text-gray-400">Loading templates…</span>
    </div>
  )

  if (templates.length === 0) return (
    <div className="space-y-4">
      <div className="text-center py-12">
        <FileText size={32} className="mx-auto text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-600">No approved templates</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Go to <strong>Templates</strong>, create a template, submit it for review, and wait for Meta to approve it.
        </p>
      </div>
      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select an approved WhatsApp template</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
        {templates.map((t, i) => {
          const body = getTemplateBody(t)
          return (
            <motion.button
              key={t._id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.04 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onChange({ ...data, template: t, variableMap: {} })}
              onMouseEnter={() => setPreview(t)}
              onMouseLeave={() => setPreview(null)}
              className={`text-left p-3.5 rounded-xl border-2 transition-colors duration-150 ${
                data.template?._id === t._id ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                {data.template?._id === t._id && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{t.category}</span>
              <p className="text-xs text-gray-400 mt-2 line-clamp-2">{body || '(No body text)'}</p>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {(preview || data.template) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.16, ease: EASE_OUT }}
            className="p-3.5 bg-gray-50 rounded-xl border border-gray-100"
          >
            <p className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
              <Eye size={11} /> Preview
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {getTemplateBody(preview || data.template) || '(No body text)'}
            </p>
            {extractVars(getTemplateBody(preview || data.template)).length > 0 && (
              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                <Tag size={10} />
                {extractVars(getTemplateBody(preview || data.template)).length} variable(s) — you'll set values in the next step
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <StepBtn onClick={onNext} disabled={!data.template}>Continue <ChevronRight size={15} /></StepBtn>
      </div>
    </div>
  )
}

/* ── Step 3: Variable values ───────────────────────────────────────────────── */

function StepVariables({ data, onChange, onNext, onBack }) {
  const body   = getTemplateBody(data.template)
  const vars   = extractVars(body)
  const varMap = data.variableMap || {}

  const setVar = (key, val) => onChange({ ...data, variableMap: { ...varMap, [key]: val } })
  const preview = resolvePreview(body, varMap)

  if (vars.length === 0) return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <Tag size={14} className="text-gray-400 shrink-0" />
        <p className="text-sm text-gray-500">This template has no variable placeholders — nothing to personalise.</p>
      </div>
      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <StepBtn onClick={onNext}>Continue <ChevronRight size={15} /></StepBtn>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Set a fixed value for each placeholder. Leave <code className="bg-gray-100 px-1 rounded text-xs">{'{{1}}'}</code> blank to auto-use the contact's name.
      </p>

      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
        {vars.map((v, i) => (
          <motion.div
            key={v}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.04 }}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
          >
            <code className="text-xs font-mono bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-700 shrink-0">
              {`{{${v}}}`}
            </code>
            <input
              type="text"
              placeholder={v === '1' ? 'Contact name (auto-filled if blank)' : `Value for {{${v}}}`}
              value={varMap[v] || ''}
              onChange={e => setVar(v, e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </motion.div>
        ))}
      </div>

      <div className="p-3.5 bg-white rounded-xl border border-gray-100">
        <p className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
          <Eye size={11} /> Live preview
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{preview}</p>
      </div>

      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <StepBtn onClick={onNext}>Continue <ChevronRight size={15} /></StepBtn>
      </div>
    </div>
  )
}

/* ── Step 4: Audience ──────────────────────────────────────────────────────── */

function StepAudience({ data, onChange, onNext, onBack, contactCount }) {
  const [tagInput, setTagInput] = useState(data.tags?.join(', ') || '')

  const canContinue = data.recipientType === 'all' ||
    (data.recipientType === 'segment' && tagInput.trim())

  const updateTags = (val) => {
    setTagInput(val)
    const tags = val.split(',').map(t => t.trim()).filter(Boolean)
    onChange({ ...data, recipientType: 'segment', tags })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Choose who receives this campaign</p>

      {/* All contacts */}
      <motion.button
        whileTap={{ scale: 0.985 }}
        onClick={() => onChange({ ...data, recipientType: 'all', tags: [] })}
        className={`w-full text-left flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-colors duration-150 ${
          data.recipientType === 'all' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <Users size={15} className={data.recipientType === 'all' ? 'text-green-600' : 'text-gray-400'} />
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">All opted-in contacts</p>
            <p className="text-xs text-gray-400">Everyone who hasn't unsubscribed</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{contactCount.toLocaleString()} contacts</span>
          {data.recipientType === 'all' && <CheckCircle2 size={14} className="text-green-600" />}
        </div>
      </motion.button>

      {/* By tag */}
      <div className={`rounded-xl border-2 transition-colors duration-150 overflow-hidden ${
        data.recipientType === 'segment' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'
      }`}>
        <button
          onClick={() => onChange({ ...data, recipientType: 'segment' })}
          className="w-full text-left flex items-center justify-between px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <Tag size={15} className={data.recipientType === 'segment' ? 'text-green-600' : 'text-gray-400'} />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">By tag / segment</p>
              <p className="text-xs text-gray-400">Send to contacts with specific tags</p>
            </div>
          </div>
          {data.recipientType === 'segment' && <CheckCircle2 size={14} className="text-green-600" />}
        </button>

        <AnimatePresence>
          {data.recipientType === 'segment' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}
              className="px-4 pb-3.5"
            >
              <input
                type="text"
                placeholder="vip, premium, new-users  (comma separated)"
                value={tagInput}
                onChange={e => updateTags(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Only active opted-in contacts matching these tags will receive the campaign.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <StepBtn onClick={onNext} disabled={!canContinue}>Continue <ChevronRight size={15} /></StepBtn>
      </div>
    </div>
  )
}

/* ── Step 5: Review & launch ───────────────────────────────────────────────── */

function StepReview({ data, onBack, onDraft, onLaunch, creating }) {
  const obj     = OBJECTIVES.find(o => o.key === data.objective)
  const body    = getTemplateBody(data.template)
  const preview = resolvePreview(body, data.variableMap)

  const rows = [
    { label: 'Campaign Name', value: data.name },
    { label: 'Objective',     value: obj?.label },
    { label: 'Template',      value: data.template?.name },
    {
      label: 'Audience',
      value: data.recipientType === 'all'
        ? 'All opted-in contacts'
        : `By tag: ${data.tags?.join(', ')}`,
    },
  ]

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Review everything before launching your campaign</p>

      <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
        {rows.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.16, ease: EASE_OUT, delay: i * 0.035 }}
            className={`flex justify-between px-4 py-3 text-sm ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <span className="text-gray-400">{label}</span>
            <span className="font-medium text-gray-900 text-right max-w-[55%] truncate">{value}</span>
          </motion.div>
        ))}
      </div>

      {preview && (
        <div className="p-3.5 bg-white rounded-xl border border-gray-100">
          <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
            <Eye size={11} /> Message preview
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{preview}</p>
        </div>
      )}

      <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex gap-2.5">
        <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Only opted-in contacts will receive messages. Campaigns run in the background with a 300ms delay between sends to protect your WhatsApp quality score.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <StepBtn onClick={onBack} variant="secondary" disabled={!!creating}>
          <ChevronLeft size={15} /> Back
        </StepBtn>
        <div className="flex gap-2">
          <StepBtn onClick={onDraft} variant="secondary" loading={creating === 'draft'} disabled={!!creating}>
            <FileText size={14} /> Save Draft
          </StepBtn>
          <StepBtn onClick={onLaunch} loading={creating === 'launch'} disabled={!!creating}>
            <Send size={14} /> Send Now
          </StepBtn>
        </div>
      </div>
    </div>
  )
}

/* ── TOS acceptance modal ──────────────────────────────────────────────────── */

function TosModal({ onAccept, onClose, loading }) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Bulk Messaging Terms of Service</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed max-h-52 overflow-y-auto space-y-2.5">
            <p className="font-semibold text-gray-800">By sending bulk campaigns you agree to:</p>
            <p>1. Only send messages to contacts who have explicitly opted in to receive WhatsApp communications from you.</p>
            <p>2. Only use Meta-approved message templates for business-initiated conversations.</p>
            <p>3. Honour all opt-out requests immediately — contacts who reply <strong>STOP</strong> are automatically excluded from future campaigns.</p>
            <p>4. Not send spam, misleading content, or any material that violates WhatsApp Business Policy.</p>
            <p>5. Comply with all applicable laws including TCPA, GDPR, TRAI Regulations, and any local legislation regarding commercial messaging.</p>
            <p>6. Understand that violating these terms may result in your WhatsApp Business Account being permanently suspended by Meta.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-green-600 cursor-pointer"
            />
            <span className="text-xs text-gray-700 leading-relaxed">
              I have read and agree to the Bulk Messaging Terms of Service
            </span>
          </label>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onAccept}
            disabled={!checked || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Accept & Send Campaign
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────────── */

const WIZARD_STEPS = ['Details', 'Template', 'Variables', 'Audience', 'Review']
const FILTERS      = ['All', 'running', 'draft', 'completed', 'paused', 'failed']

export default function Campaigns() {
  const [campaigns, setCampaigns]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [composing, setComposing]         = useState(false)
  const [step, setStep]                   = useState(0)
  const [dir, setDir]                     = useState(1)
  const [formData, setFormData]           = useState({})

  const [templates, setTemplates]             = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [contactCount, setContactCount]       = useState(0)

  const [tosAccepted, setTosAccepted]   = useState(false)
  const [showTos, setShowTos]           = useState(false)
  const [tosLoading, setTosLoading]     = useState(false)
  const [pendingSendId, setPendingSendId] = useState(null)
  const [pendingSendName, setPendingSendName] = useState('')

  const [creating, setCreating]   = useState(null)  // 'draft' | 'launch' | null
  const [sending, setSending]     = useState(new Set())
  const [deleting, setDeleting]   = useState(new Set())
  const [filter, setFilter]       = useState('All')

  const pollRef = useRef(null)

  /* ── Load initial data ────────────────────────────────────────────────────── */
  const loadCampaigns = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/v1/campaigns?limit=50')
      setCampaigns(data.data?.campaigns || [])
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      axiosInstance.get('/api/v1/campaigns?limit=50'),
      axiosInstance.get('/api/v1/profile'),
      axiosInstance.get('/api/v1/contacts?limit=1&status=active'),
    ])
      .then(([campRes, profileRes, contactRes]) => {
        setCampaigns(campRes.data.data?.campaigns || [])
        setTosAccepted(profileRes.data.data?.user?.tenant?.tosAccepted || false)
        setContactCount(contactRes.data.data?.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* ── Auto-poll while a campaign is running ───────────────────────────────── */
  useEffect(() => {
    const hasRunning = campaigns.some(c => c.status === 'running')
    clearInterval(pollRef.current)
    if (hasRunning) {
      pollRef.current = setInterval(loadCampaigns, 4000)
    }
    return () => clearInterval(pollRef.current)
  }, [campaigns, loadCampaigns])

  /* ── Load approved templates when wizard opens ───────────────────────────── */
  useEffect(() => {
    if (!composing) return
    setTemplatesLoading(true)
    axiosInstance.get('/api/v1/templates?limit=100')
      .then(({ data }) => {
        const approved = (data.data?.templates || []).filter(t => t.status === 'APPROVED')
        setTemplates(approved)
      })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))
  }, [composing])

  /* ── Wizard navigation ───────────────────────────────────────────────────── */
  const goNext = () => { setDir(1);  setStep(s => s + 1) }
  const goBack = () => { setDir(-1); setStep(s => s - 1) }
  const close  = () => { setComposing(false); setStep(0); setDir(1); setFormData({}) }

  /* ── Create + optionally send ────────────────────────────────────────────── */
  const createCampaign = async (mode) => {
    setCreating(mode)
    try {
      const variables = {}
      Object.entries(formData.variableMap || {}).forEach(([k, v]) => {
        if (v?.trim()) variables[k] = v.trim()
      })

      const { data } = await axiosInstance.post('/api/v1/campaigns', {
        name:       formData.name,
        templateId: formData.template._id,
        objective:  formData.objective,
        recipients: {
          type: formData.recipientType || 'all',
          tags: formData.tags || [],
        },
        variables,
      })

      const campaign = data.data?.campaign
      close()

      if (mode === 'draft') {
        toast.success(`"${formData.name}" saved as draft`)
        loadCampaigns()
        return
      }

      // Send immediately after creating
      await doSend(campaign._id, formData.name)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign')
    } finally {
      setCreating(null)
    }
  }

  /* ── Send a campaign (handles TOS gate) ─────────────────────────────────── */
  const doSend = async (campaignId, campaignName) => {
    setSending(prev => new Set([...prev, campaignId]))
    try {
      await axiosInstance.post(`/api/v1/campaigns/${campaignId}/send`)
      toast.success(`"${campaignName || 'Campaign'}" is running!`)
      loadCampaigns()
    } catch (err) {
      if (err.response?.data?.code === 'TOS_REQUIRED') {
        setPendingSendId(campaignId)
        setPendingSendName(campaignName || '')
        setShowTos(true)
      } else {
        toast.error(err.response?.data?.message || 'Failed to send campaign')
        loadCampaigns()
      }
    } finally {
      setSending(prev => { const s = new Set(prev); s.delete(campaignId); return s })
    }
  }

  /* ── Accept TOS then retry pending send ─────────────────────────────────── */
  const acceptTos = async () => {
    setTosLoading(true)
    try {
      await axiosInstance.post('/api/v1/profile/accept-tos')
      setTosAccepted(true)
      setShowTos(false)
      const id   = pendingSendId
      const name = pendingSendName
      setPendingSendId(null)
      setPendingSendName('')
      if (id) await doSend(id, name)
    } catch {
      toast.error('Failed to accept terms. Please try again.')
    } finally {
      setTosLoading(false)
    }
  }

  /* ── Delete draft ────────────────────────────────────────────────────────── */
  const deleteDraft = async (id, name) => {
    setDeleting(prev => new Set([...prev, id]))
    try {
      await axiosInstance.delete(`/api/v1/campaigns/${id}`)
      toast.success(`"${name}" deleted`)
      setCampaigns(prev => prev.filter(c => c._id !== id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete campaign')
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  /* ── Stats ───────────────────────────────────────────────────────────────── */
  const stats = {
    total:     campaigns.length,
    running:   campaigns.filter(c => c.status === 'running').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    sent:      campaigns.reduce((a, c) => a + (c.stats?.sent || 0), 0),
  }

  const filtered = filter === 'All' ? campaigns : campaigns.filter(c => c.status === filter)

  const stepContent = [
    <StepDetails   data={formData} onChange={setFormData} onNext={goNext} />,
    <StepTemplate  data={formData} onChange={setFormData} onNext={goNext} onBack={goBack}
                   templates={templates} loading={templatesLoading} />,
    <StepVariables data={formData} onChange={setFormData} onNext={goNext} onBack={goBack} />,
    <StepAudience  data={formData} onChange={setFormData} onNext={goNext} onBack={goBack}
                   contactCount={contactCount} />,
    <StepReview    data={formData} onBack={goBack}
                   onDraft={() => createCampaign('draft')}
                   onLaunch={() => createCampaign('launch')}
                   creating={creating} />,
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <PageHeader title="Campaigns" description="Create and send WhatsApp broadcast campaigns" />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setComposing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-medium rounded-lg shrink-0"
          style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
        >
          <Plus size={15} /> New Campaign
        </motion.button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: stats.total,                    icon: BarChart2,    color: 'text-blue-500'   },
          { label: 'Running Now',     value: stats.running,                  icon: Play,         color: 'text-green-500'  },
          { label: 'Completed',       value: stats.completed,                icon: CheckCircle2, color: 'text-green-600'  },
          { label: 'Messages Sent',   value: stats.sent.toLocaleString(),    icon: Send,         color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={color} />
              <p className="text-xs text-gray-400">{label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* ── Create wizard ── */}
      <AnimatePresence>
        {composing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25, ease: EASE_OUT }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Wizard header + step indicator */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">New Campaign</p>
                <button onClick={close} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                {WIZARD_STEPS.map((label, i) => (
                  <div key={label} className="flex items-center gap-1 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors duration-200"
                      style={{ backgroundColor: i <= step ? '#16a34a' : '#f3f4f6', color: i <= step ? '#fff' : '#9ca3af' }}
                    >
                      {i < step ? <Check size={11} /> : i + 1}
                    </div>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div className="h-px flex-1 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i < step ? '#16a34a' : '#e5e7eb' }} />
                    )}
                  </div>
                ))}
                <span className="ml-2 text-xs text-gray-400 shrink-0">{WIZARD_STEPS[step]}</span>
              </div>
            </div>

            {/* Step content */}
            <div className="p-6 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step} custom={dir}
                  initial={d => ({ opacity: 0, x: d * 28 })}
                  animate={{ opacity: 1, x: 0 }}
                  exit={d => ({ opacity: 0, x: d * -28 })}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                >
                  {stepContent[step]}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Campaign list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">Campaign History</p>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f === 'All' ? 'All' : (STATUS_META[f]?.label || f)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <Loader2 size={20} className="animate-spin text-green-500" />
            <span className="text-sm text-gray-400">Loading campaigns…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-4 py-3">Template</th>
                  <th className="text-left px-4 py-3">Audience</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-right px-4 py-3">Sent</th>
                  <th className="text-right px-4 py-3">Read</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c._id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-100"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 whitespace-nowrap">{c.name}</p>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${OBJ_BADGE[c.objective] || 'bg-gray-100 text-gray-600'}`}>
                          {OBJ_LABEL[c.objective] || c.objective}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                        {c.template?.name || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users size={11} />
                          <span className="text-xs">{(c.recipients?.count || 0).toLocaleString()} contacts</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3.5 text-right text-gray-700">
                        {c.stats?.total ? c.stats.total.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-700">
                        {c.stats?.sent ? c.stats.sent.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-700">
                        {c.stats?.read ? c.stats.read.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          {c.status === 'draft' && (
                            <>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => doSend(c._id, c.name)}
                                disabled={sending.has(c._id)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                              >
                                {sending.has(c._id)
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : <Send size={11} />}
                                Send
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => deleteDraft(c._id, c.name)}
                                disabled={deleting.has(c._id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Delete draft"
                              >
                                {deleting.has(c._id)
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <Trash2 size={13} />}
                              </motion.button>
                            </>
                          )}
                          {c.status === 'running' && (
                            <span className="text-xs text-green-600 flex items-center gap-1 whitespace-nowrap">
                              <Loader2 size={11} className="animate-spin" /> Sending…
                            </span>
                          )}
                          {c.status === 'failed' && c.stats?.lastError && (
                            <span className="text-xs text-red-500 max-w-[120px] truncate" title={c.stats.lastError}>
                              {c.stats.lastError}
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center">
                      <Megaphone size={28} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">
                        {filter === 'All'
                          ? 'No campaigns yet — click "New Campaign" to create your first one'
                          : `No ${STATUS_META[filter]?.label || filter} campaigns`}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── TOS Modal ── */}
      <AnimatePresence>
        {showTos && (
          <TosModal
            onAccept={acceptTos}
            onClose={() => { setShowTos(false); setPendingSendId(null); setPendingSendName('') }}
            loading={tosLoading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
