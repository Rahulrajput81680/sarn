import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Search,
  Filter, Eye, ChevronRight, X, Save, History,
  LayoutTemplate, ShieldCheck, Variable, AlignLeft,
  Tag, MessageSquare, Phone, ExternalLink, Hash,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Template data ──────────────────────────────────────── */

const TEMPLATES = [
  {
    id: 1,  client: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500',
    name: 'order_shipped_update', category: 'UTILITY', language: 'en',
    header: { type: 'TEXT', text: 'Order Update' },
    body: 'Hi {{1}}, your order #{{2}} has been shipped! Estimated delivery: {{3}}. Track your package anytime.',
    footer: 'Reply STOP to unsubscribe',
    buttons: [{ type: 'URL', text: 'Track Order', url: 'https://flipkart.com/track' }],
    submittedBy: 'raj@flipkart.com', submittedOn: 'Jun 14, 2026 · 10:42 AM',
    status: 'pending',
  },
  {
    id: 2,  client: 'StyleHub', avatar: 'SH', color: 'bg-pink-500',
    name: 'summer_sale_promo', category: 'MARKETING', language: 'en',
    header: { type: 'IMAGE', text: '' },
    body: 'Hey {{1}}! 🎉 Our Summer Sale is LIVE! Get up to 50% OFF on all fashion. Shop now and save big. Limited time offer — ends {{2}}!',
    footer: 'Reply STOP to opt out',
    buttons: [{ type: 'URL', text: 'Shop Now', url: 'https://stylehub.co/sale' }, { type: 'QUICK_REPLY', text: 'Remind me later' }],
    submittedBy: 'hello@stylehub.co', submittedOn: 'Jun 13, 2026 · 03:15 PM',
    status: 'pending',
  },
  {
    id: 3,  client: 'MediCare Plus', avatar: 'MP', color: 'bg-red-500',
    name: 'otp_login_verify', category: 'AUTHENTICATION', language: 'en',
    header: { type: 'TEXT', text: 'Verification Code' },
    body: 'Your MediCare Plus login OTP is {{1}}. Valid for 10 minutes. Do not share this code with anyone.',
    footer: '',
    buttons: [{ type: 'OTP', text: 'Copy Code' }],
    submittedBy: 'admin@medicareplus.in', submittedOn: 'Jun 13, 2026 · 11:08 AM',
    status: 'pending',
  },
  {
    id: 4,  client: 'FoodZone', avatar: 'FZ', color: 'bg-orange-500',
    name: 'delivery_status_update', category: 'UTILITY', language: 'en',
    header: { type: 'TEXT', text: 'Delivery Update' },
    body: 'Hi {{1}}! Your FoodZone order is on the way. Rider {{2}} will deliver to {{3}} in approx {{4}} mins. Enjoy your meal!',
    footer: '',
    buttons: [{ type: 'CALL', text: 'Call Rider', phone: '+91XXXXXXXXXX' }],
    submittedBy: 'ops@foodzone.in', submittedOn: 'Jun 12, 2026 · 08:50 AM',
    status: 'pending',
  },
  {
    id: 5,  client: 'QuickMart', avatar: 'QM', color: 'bg-blue-500',
    name: 'payment_receipt', category: 'UTILITY', language: 'hi',
    header: { type: 'TEXT', text: 'Payment Confirmed' },
    body: 'नमस्ते {{1}}, आपका ₹{{2}} का भुगतान सफलतापूर्वक प्राप्त हो गया है। Order ID: {{3}}. धन्यवाद!',
    footer: 'QuickMart India',
    buttons: [],
    submittedBy: 'info@quickmart.in', submittedOn: 'Jun 11, 2026 · 05:30 PM',
    status: 'pending',
  },
  {
    id: 6,  client: 'TechStart', avatar: 'TS', color: 'bg-indigo-500',
    name: 'welcome_onboard', category: 'UTILITY', language: 'en',
    header: { type: 'TEXT', text: 'Welcome to TechStart' },
    body: 'Hi {{1}}! Welcome to TechStart. Your account is ready. Get started with your dashboard using the link below and explore all features available to you.',
    footer: 'TechStart Team',
    buttons: [{ type: 'URL', text: 'Go to Dashboard', url: 'https://app.techstart.io' }],
    submittedBy: 'ceo@techstart.io', submittedOn: 'Jun 11, 2026 · 09:20 AM',
    status: 'approved', decidedOn: 'Jun 11, 2026 · 11:45 AM', decidedBy: 'Admin',
  },
  {
    id: 7,  client: 'RapidDeliver', avatar: 'RD', color: 'bg-cyan-500',
    name: 'marketing_blast_v2', category: 'MARKETING', language: 'en',
    header: { type: 'TEXT', text: 'Big Offer Inside!' },
    body: 'CLICK NOW to claim your FREE delivery voucher!!! Limited slots. Don\'t miss out — offer expires in {{1}} hours. Share with friends!!',
    footer: '',
    buttons: [{ type: 'URL', text: 'Claim Now', url: 'https://rapiddeliver.com/offer' }],
    submittedBy: 'vp@rapiddeliver.com', submittedOn: 'Jun 10, 2026 · 02:00 PM',
    status: 'rejected', rejectionReason: 'CONTENT_VIOLATION', rejectionNote: 'Excessive urgency language and excessive exclamation marks violates Meta messaging policies. Use a calm, informative tone.',
    decidedOn: 'Jun 10, 2026 · 04:30 PM', decidedBy: 'Admin',
  },
  {
    id: 8,  client: 'UrbanRoots', avatar: 'UR', color: 'bg-lime-600',
    name: 'subscription_renewal', category: 'UTILITY', language: 'en',
    header: { type: 'TEXT', text: 'Subscription Renewal' },
    body: 'Dear {{1}}, your UrbanRoots subscription renews on {{2}}. Amount: ₹{{3}}. Auto-pay is enabled on your card ending {{4}}.',
    footer: 'Manage subscription at urbanroots.in',
    buttons: [{ type: 'URL', text: 'Manage Plan', url: 'https://urbanroots.in/plan' }],
    submittedBy: 'sonal@urbanroots.in', submittedOn: 'Jun 9, 2026 · 07:15 PM',
    status: 'approved', decidedOn: 'Jun 10, 2026 · 09:00 AM', decidedBy: 'Admin',
  },
  {
    id: 9,  client: 'BrandCraft', avatar: 'BC', color: 'bg-amber-500',
    name: 'support_ticket_update', category: 'UTILITY', language: 'en',
    header: { type: 'TEXT', text: 'Support Update' },
    body: 'Hi {{1}}, ticket #{{2}} status changed to "{{3}}". Our team will contact you by {{4}}. For urgent help call us directly.',
    footer: 'BrandCraft Support',
    buttons: [{ type: 'CALL', text: 'Call Support', phone: '+91XXXXXXXXXX' }, { type: 'URL', text: 'View Ticket', url: 'https://brandcraft.co/ticket' }],
    submittedBy: 'hello@brandcraft.co', submittedOn: 'Jun 8, 2026 · 01:40 PM',
    status: 'rejected', rejectionReason: 'TAG_CONTENT_MISMATCH', rejectionNote: 'Template body contains "call us" which is a service interaction. Reclassify as SERVICE category or remove the call instruction.',
    decidedOn: 'Jun 9, 2026 · 10:00 AM', decidedBy: 'Admin',
  },
]

/* ─── Validation logic ───────────────────────────────────── */

function validateTemplate(t) {
  const vars = t.body.match(/\{\{(\d+)\}\}/g) || []
  const nums = vars.map((v) => parseInt(v.replace(/\D/g, ''))).sort((a, b) => a - b)
  const sequential = nums.length === 0 || nums.every((n, i) => n === i + 1)
  const malformed  = /\{[^{]|[^}]\}|\{\{[^0-9]/.test(t.body)

  const VALID_CATS  = ['UTILITY', 'MARKETING', 'AUTHENTICATION', 'SERVICE']
  const promoWords  = /\b(free|win|winner|click now|limited|guaranteed|make money|earn \$)\b/i
  const excessivePunct = /[!?]{2,}|[A-Z]{5,}/.test(t.body)

  return {
    categoryValid:     VALID_CATS.includes(t.category),
    variablesCorrect:  sequential && !malformed,
    bodyLength:        t.body.length <= 1024,
    noProhibited:      !excessivePunct && !(t.category === 'AUTHENTICATION' && promoWords.test(t.body)),
  }
}

/* ─── Rejection reasons (Meta standard) ─────────────────── */

const REJECTION_REASONS = [
  { key: 'TAG_CONTENT_MISMATCH',    label: 'Category mismatch',         desc: 'Template content does not match the selected category' },
  { key: 'INVALID_FORMAT',          label: 'Invalid variable format',    desc: 'Variables must use {{1}}, {{2}}... sequential format' },
  { key: 'CONTENT_VIOLATION',       label: 'Content policy violation',   desc: 'Excessive urgency, all-caps, or prohibited language' },
  { key: 'PROMOTIONAL_IN_UTILITY',  label: 'Promo content in Utility',   desc: 'Utility templates cannot contain promotional messaging' },
  { key: 'INCOMPLETE_VARIABLES',    label: 'Non-sequential variables',   desc: 'Variable numbers must start at 1 and be sequential' },
  { key: 'MISSING_OPT_OUT',         label: 'Missing opt-out for Marketing', desc: 'Marketing templates must include an unsubscribe option' },
  { key: 'CUSTOM',                  label: 'Custom reason',              desc: 'Provide a specific reason below' },
]

/* ─── Colors ─────────────────────────────────────────────── */

const catColor = { UTILITY: 'blue', MARKETING: 'purple', AUTHENTICATION: 'green', SERVICE: 'gray' }
const statusColor = { pending: 'yellow', approved: 'green', rejected: 'red' }

const statusIcon = {
  pending:  <Clock size={13} className="text-amber-500" />,
  approved: <CheckCircle2 size={13} className="text-green-500" />,
  rejected: <XCircle size={13} className="text-red-500" />,
}

function highlightVars(text) {
  const parts = text.split(/(\{\{\d+\}\})/g)
  return parts.map((p, i) =>
    /^\{\{\d+\}\}$/.test(p)
      ? <span key={i} className="bg-blue-100 text-blue-700 font-mono text-xs px-1 rounded">{p}</span>
      : p
  )
}

/* ─── Validation checklist component ────────────────────── */

function ValidationChecklist({ v }) {
  const items = [
    { label: 'Category is valid Meta type',          pass: v.categoryValid },
    { label: 'Variable formatting {{n}} sequential', pass: v.variablesCorrect },
    { label: 'Body within 1024 characters',          pass: v.bodyLength },
    { label: 'No prohibited content patterns',       pass: v.noProhibited },
  ]
  const allPass = items.every((i) => i.pass)
  return (
    <div className={`rounded-xl border p-3.5 ${allPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <p className="text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">Automated Validation</p>
      <div className="space-y-1.5">
        {items.map(({ label, pass }) => (
          <div key={label} className="flex items-center gap-2">
            {pass
              ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
              : <XCircle     size={13} className="text-red-500 shrink-0" />
            }
            <span className={`text-xs ${pass ? 'text-gray-700' : 'text-red-700 font-medium'}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Reject modal ───────────────────────────────────────── */

function RejectModal({ template, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [note, setNote]     = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Reject Template</p>
            <p className="text-xs text-gray-400 font-mono">{template.name} · {template.client}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rejection Reason</p>
        <div className="space-y-1.5 mb-4">
          {REJECTION_REASONS.map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => setReason(key)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl border-2 transition-all ${reason === key ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-xs font-semibold ${reason === key ? 'text-red-800' : 'text-gray-700'}`}>{label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Additional note to client <span className="text-gray-400 font-normal">(sent with rejection)</span></label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Explain what needs to be fixed before resubmitting…"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            disabled={!reason}
            onClick={() => reason && onConfirm(reason, note)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${!reason ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          >
            <XCircle size={14} /> Send Rejection
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Template review drawer ─────────────────────────────── */

function ReviewDrawer({ template, onClose, onApprove, onReject }) {
  const v = validateTemplate(template)
  const allPass = Object.values(v).every(Boolean)
  const buttonIcon = { URL: <ExternalLink size={11} />, CALL: <Phone size={11} />, QUICK_REPLY: <MessageSquare size={11} />, OTP: <Hash size={11} /> }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
        className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${template.color} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{template.avatar}</span>
            </div>
            <div>
              <code className="text-sm font-semibold text-gray-900">{template.name}</code>
              <p className="text-xs text-gray-400">{template.client}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Meta info */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-0.5">Category</p>
              <Badge color={catColor[template.category]}>{template.category}</Badge>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-0.5">Language</p>
              <p className="font-semibold text-gray-800">{template.language.toUpperCase()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-0.5">Submitted</p>
              <p className="font-medium text-gray-700 leading-tight">{template.submittedBy.split('@')[0]}</p>
            </div>
          </div>

          {/* Template preview */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Template Preview</p>
            <div className="bg-[#e5ddd5] rounded-2xl p-4">
              <div className="bg-white rounded-2xl rounded-tl-none shadow-sm px-4 py-3 max-w-xs text-sm space-y-2">
                {template.header?.type === 'TEXT' && template.header.text && (
                  <p className="font-bold text-gray-900">{template.header.text}</p>
                )}
                {template.header?.type === 'IMAGE' && (
                  <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-xs">📷 Image header</div>
                )}
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {highlightVars(template.body)}
                </p>
                {template.footer && (
                  <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-1.5">{template.footer}</p>
                )}
              </div>
              {template.buttons?.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {template.buttons.map((btn, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm px-4 py-2 flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 max-w-xs">
                      {buttonIcon[btn.type]}
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Variable check */}
          {(template.body.match(/\{\{\d+\}\}/g) || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Variable Check</p>
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {(template.body.match(/\{\{\d+\}\}/g) || [])
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .sort()
                    .map((v) => (
                      <div key={v} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1">
                        <Variable size={11} className="text-blue-500" />
                        <code className="text-xs font-mono font-semibold text-blue-700">{v}</code>
                        <CheckCircle2 size={11} className="text-green-500" />
                      </div>
                    ))
                  }
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  {(template.body.match(/\{\{\d+\}\}/g) || []).filter((v, i, a) => a.indexOf(v) === i).length} unique variable{(template.body.match(/\{\{\d+\}\}/g) || []).filter((v, i, a) => a.indexOf(v) === i).length !== 1 ? 's' : ''} · body length {template.body.length}/1024 chars
                </p>
              </div>
            </div>
          )}

          {/* Validation */}
          <ValidationChecklist v={v} />

          {/* Rejection info if already rejected */}
          {template.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">Previously Rejected</p>
              <p className="text-xs text-red-600">{REJECTION_REASONS.find((r) => r.key === template.rejectionReason)?.label || template.rejectionReason}</p>
              {template.rejectionNote && <p className="text-xs text-red-500 mt-1.5 italic">"{template.rejectionNote}"</p>}
              <p className="text-[10px] text-red-400 mt-2">{template.decidedOn} · by {template.decidedBy}</p>
            </div>
          )}

          {template.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 mb-1">Approved</p>
              <p className="text-[10px] text-green-500">{template.decidedOn} · by {template.decidedBy}</p>
            </div>
          )}
        </div>

        {/* Action footer — only for pending */}
        {template.status === 'pending' && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-2">
            {!allPass && (
              <div className="w-full flex gap-2 items-start text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-2">
                <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                Validation failed — you can still approve manually if you've reviewed the content.
              </div>
            )}
            <div className="flex gap-2 w-full">
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={onApprove}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-semibold transition-all"
              >
                <CheckCircle2 size={14} /> Approve
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* ─── Template row card ──────────────────────────────────── */

function TemplateRow({ template, onSelect, onQuickApprove, onQuickReject, index }) {
  const v = validateTemplate(template)
  const failCount = Object.values(v).filter((x) => !x).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: EASE_OUT, delay: index * 0.04 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-xl ${template.color} flex items-center justify-center shrink-0 mt-0.5`}>
          <span className="text-white text-xs font-bold">{template.avatar}</span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm font-semibold text-gray-900">{template.name}</code>
                <Badge color={catColor[template.category]}>{template.category}</Badge>
                <span className="text-xs text-gray-400 uppercase">{template.language}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{template.client} · {template.submittedBy}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {statusIcon[template.status]}
              <Badge color={statusColor[template.status]}>{template.status}</Badge>
            </div>
          </div>

          {/* Body preview */}
          <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
            {template.body}
          </p>

          {/* Validation issues */}
          {template.status === 'pending' && failCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle size={11} className="text-red-500 shrink-0" />
              <span className="text-xs text-red-600 font-medium">{failCount} validation issue{failCount > 1 ? 's' : ''} detected</span>
            </div>
          )}

          {/* Rejection note */}
          {template.status === 'rejected' && template.rejectionNote && (
            <div className="mt-2 text-xs text-red-500 italic line-clamp-1">
              "{template.rejectionNote}"
            </div>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">{template.submittedOn}</span>
            <div className="flex items-center gap-1.5">
              {template.status === 'pending' && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickReject(template) }}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuickApprove(template.id) }}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    Approve
                  </button>
                </>
              )}
              <button
                onClick={() => onSelect(template)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Review <ChevronRight size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

const TABS = [
  { key: 'pending',  label: 'Pending Review', icon: Clock },
  { key: 'approved', label: 'Approved',        icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected',        icon: XCircle },
  { key: 'all',      label: 'All Templates',   icon: LayoutTemplate },
]

export default function TemplateApproval() {
  const [templates, setTemplates] = useState(TEMPLATES)
  const [tab, setTab]             = useState('pending')
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [selected, setSelected]   = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  const filtered = useMemo(() => templates.filter((t) => {
    const matchTab = tab === 'all' || t.status === tab
    const q = search.toLowerCase()
    const matchQ = !q || t.name.includes(q) || t.client.toLowerCase().includes(q)
    const matchC = catFilter === 'all' || t.category === catFilter
    return matchTab && matchQ && matchC
  }), [templates, tab, search, catFilter])

  const counts = {
    pending:  templates.filter((t) => t.status === 'pending').length,
    approved: templates.filter((t) => t.status === 'approved').length,
    rejected: templates.filter((t) => t.status === 'rejected').length,
  }

  const handleApprove = (id) => {
    setTemplates((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: 'approved', decidedOn: 'Jun 15, 2026 · Now', decidedBy: 'Admin' } : t
    ))
    if (selected?.id === id) setSelected((s) => ({ ...s, status: 'approved', decidedOn: 'Jun 15, 2026 · Now', decidedBy: 'Admin' }))
  }

  const handleReject = (reason, note) => {
    const id = rejectTarget.id
    setTemplates((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: 'rejected', rejectionReason: reason, rejectionNote: note, decidedOn: 'Jun 15, 2026 · Now', decidedBy: 'Admin' } : t
    ))
    if (selected?.id === id) setSelected((s) => ({ ...s, status: 'rejected', rejectionReason: reason, rejectionNote: note }))
    setRejectTarget(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Template Approval"
        description="Review, validate and approve Meta WhatsApp message templates"
        breadcrumbs={['Admin', 'Meta Integration', 'Template Approval']}
      />

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Review', count: counts.pending,  color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
          { label: 'Approved',       count: counts.approved, color: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle2 },
          { label: 'Rejected',       count: counts.rejected, color: 'bg-red-50 border-red-200',     text: 'text-red-700',   icon: XCircle },
        ].map(({ label, count, color, text, icon: Icon }) => (
          <div key={label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${color}`}>
            <Icon size={18} className={text} />
            <div>
              <p className={`text-2xl font-bold ${text}`}>{count}</p>
              <p className={`text-xs font-medium ${text} opacity-70`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === key ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === key && <motion.div layoutId="tpl-tab" className="absolute inset-0 bg-white rounded-lg shadow-sm" />}
              <span className="relative flex items-center gap-1.5">
                <Icon size={12} />
                {label}
                {key !== 'all' && counts[key] > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${key === 'pending' ? 'bg-amber-200 text-amber-800' : key === 'approved' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {counts[key]}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or client…"
            className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400 w-48"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5">
          <Filter size={11} className="text-gray-400" />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer">
            <option value="all">All categories</option>
            {['UTILITY', 'MARKETING', 'AUTHENTICATION', 'SERVICE'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Template list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center py-14 text-gray-300">
          <LayoutTemplate size={36} className="mb-3" />
          <p className="text-sm text-gray-400">No templates in this view</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((t, i) => (
              <TemplateRow
                key={t.id}
                index={i}
                template={t}
                onSelect={setSelected}
                onQuickApprove={handleApprove}
                onQuickReject={setRejectTarget}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Review drawer */}
      <AnimatePresence>
        {selected && (
          <ReviewDrawer
            template={selected}
            onClose={() => setSelected(null)}
            onApprove={() => { handleApprove(selected.id); setSelected(null) }}
            onReject={() => setRejectTarget(selected)}
          />
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            template={rejectTarget}
            onClose={() => setRejectTarget(null)}
            onConfirm={handleReject}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
