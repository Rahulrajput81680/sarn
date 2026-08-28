import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, FileText, Image, Video, File,
  Type, Phone, Link, Zap, Copy, Trash2, Send, AlertTriangle,
  Clock, CheckCircle2, XCircle, ChevronDown, AlignLeft,
  MoreHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import api from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Constants ─────────────────────────────────────────── */

const CATEGORIES = [
  { key: 'marketing',      label: 'Marketing',       color: 'bg-purple-50 text-purple-700 border-purple-200',  desc: 'Promotions, offers, newsletters' },
  { key: 'utility',        label: 'Utility',         color: 'bg-blue-50 text-blue-700 border-blue-200',        desc: 'Order updates, reminders, alerts' },
  { key: 'authentication', label: 'Authentication',  color: 'bg-orange-50 text-orange-700 border-orange-200',  desc: 'OTPs, login verifications' },
]

const HEADER_TYPES = [
  { key: 'none',     label: 'None',     icon: X },
  { key: 'text',     label: 'Text',     icon: Type },
  { key: 'image',    label: 'Image',    icon: Image },
  { key: 'video',    label: 'Video',    icon: Video },
  { key: 'document', label: 'Document', icon: File },
]

const BTN_TYPES = [
  { key: 'quick_reply', label: 'Quick Reply', icon: Zap,   desc: 'Pre-set reply the user taps' },
  { key: 'call',        label: 'Call Button', icon: Phone, desc: 'Calls a phone number' },
  { key: 'url',         label: 'URL Button',  icon: Link,  desc: 'Opens a web link' },
]

const LANGUAGES = ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali']

const OTP_TYPES = [
  { key: 'COPY_CODE', label: 'Copy Code',          desc: 'User taps a button to copy the code' },
  { key: 'ONE_TAP',    label: 'One-Tap Autofill',   desc: 'Auto-fills the code in your app' },
  { key: 'ZERO_TAP',   label: 'Zero-Tap Autofill',  desc: 'Auto-submits with no user action' },
]

const STATUS_TABS = ['all', 'approved', 'pending', 'draft', 'rejected']

const STATUS_STYLE = {
  approved: { icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50 text-green-700 border-green-200',  label: 'Approved' },
  pending:  { icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Pending'  },
  draft:    { icon: AlignLeft,    color: 'text-gray-400',   bg: 'bg-gray-50 text-gray-600 border-gray-200',     label: 'Draft'    },
  rejected: { icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 text-red-600 border-red-200',        label: 'Rejected' },
}

/* ─── API helpers ────────────────────────────────────────── */

const LANG_TO_CODE = { English: 'en', Hindi: 'hi', Gujarati: 'gu', Marathi: 'mr', Tamil: 'ta', Telugu: 'te', Kannada: 'kn', Bengali: 'bn' }
const CODE_TO_LANG = Object.fromEntries(Object.entries(LANG_TO_CODE).map(([k, v]) => [v, k]))
const MEDIA_TYPES  = ['IMAGE', 'VIDEO', 'DOCUMENT']

const BLANK_AUTH = {
  codeExpirationMinutes: 10,
  addSecurityRecommendation: true,
  otpType: 'COPY_CODE',
  buttonText: '',
  autofillText: '',
  supportedApps: [{ packageName: '', signatureHash: '' }],
  zeroTapTermsAccepted: false,
}

function flatToComponents(form) {
  if (form.category === 'authentication') return buildAuthComponents(form.authConfig)

  const comps = []
  if (form.header?.type && form.header.type !== 'none') {
    if (form.header.type === 'text') {
      const headerComp = { type: 'HEADER', format: 'TEXT', text: form.header.text || '' }
      if (countVars(form.header.text || '') > 0) {
        headerComp.example = { header_text: [form.sampleValues?.header || ''] }
      }
      comps.push(headerComp)
    } else {
      // IMAGE | VIDEO | DOCUMENT — Meta requires format field + a header_handle example
      // from the Resumable Upload API (see the header-media upload flow), not arbitrary URLs.
      const headerComp = { type: 'HEADER', format: form.header.type.toUpperCase() }
      if (form.header.headerHandle) headerComp.example = { header_handle: [form.header.headerHandle] }
      comps.push(headerComp)
    }
  }
  if (form.body) {
    const bodyComp = { type: 'BODY', text: form.body }
    const varCount = countVars(form.body)
    if (varCount > 0 && form.sampleValues) {
      const examples = Array.from({ length: varCount }, (_, i) => form.sampleValues[i + 1] || `sample_${i + 1}`)
      bodyComp.example = { body_text: [examples] }
    }
    comps.push(bodyComp)
  }
  if (form.footer) comps.push({ type: 'FOOTER', text: form.footer })
  if (form.buttons?.length) {
    comps.push({
      type: 'BUTTONS',
      buttons: form.buttons.map((b) => ({
        type:         b.type === 'url' ? 'URL' : b.type === 'call' ? 'PHONE_NUMBER' : 'QUICK_REPLY',
        text:         b.label,
        url:          b.type === 'url'  ? b.value : undefined,
        phone_number: b.type === 'call' ? b.value : undefined,  // Meta uses snake_case
      })),
    })
  }
  return comps
}

// AUTHENTICATION templates have a fixed shape — Meta auto-generates the BODY/FOOTER copy from
// these flags, and the only allowed BUTTONS entry is a single OTP button. No HEADER, no free text.
function buildAuthComponents(auth = {}) {
  const comps = [
    { type: 'BODY', add_security_recommendation: !!auth.addSecurityRecommendation },
    { type: 'FOOTER', code_expiration_minutes: Number(auth.codeExpirationMinutes) || 10 },
  ]
  const btn = { type: 'OTP', otp_type: auth.otpType || 'COPY_CODE' }
  if (auth.buttonText) btn.text = auth.buttonText
  if (['ONE_TAP', 'ZERO_TAP'].includes(btn.otp_type)) {
    if (auth.autofillText) btn.autofill_text = auth.autofillText
    const apps = (auth.supportedApps || [])
      .filter((a) => a.packageName?.trim() && a.signatureHash?.trim())
      .map((a) => ({ package_name: a.packageName.trim(), signature_hash: a.signatureHash.trim() }))
    if (apps.length) btn.supported_apps = apps
  }
  if (btn.otp_type === 'ZERO_TAP') btn.zero_tap_terms_accepted = !!auth.zeroTapTermsAccepted
  comps.push({ type: 'BUTTONS', buttons: [btn] })
  return comps
}

function componentsToFlat(components = [], category) {
  if (category === 'AUTHENTICATION') {
    const b   = components.find((c) => c.type === 'BODY')
    const f   = components.find((c) => c.type === 'FOOTER')
    const bt  = components.find((c) => c.type === 'BUTTONS')
    const btn = bt?.buttons?.[0] || {}
    const supportedApps = (btn.supported_apps || []).map((a) => ({
      packageName: a.package_name || '', signatureHash: a.signature_hash || '',
    }))
    return {
      header: { type: 'none', text: '', url: '', headerHandle: '', previewUrl: '' },
      body: '', footer: '', buttons: [], sampleValues: {},
      authConfig: {
        codeExpirationMinutes: f?.code_expiration_minutes ?? 10,
        addSecurityRecommendation: b?.add_security_recommendation ?? true,
        otpType: btn.otp_type || 'COPY_CODE',
        buttonText: btn.text || '',
        autofillText: btn.autofill_text || '',
        supportedApps: supportedApps.length ? supportedApps : [{ packageName: '', signatureHash: '' }],
        zeroTapTermsAccepted: !!btn.zero_tap_terms_accepted,
      },
    }
  }

  const h  = components.find((c) => c.type === 'HEADER')
  const b  = components.find((c) => c.type === 'BODY')
  const f  = components.find((c) => c.type === 'FOOTER')
  const bt = components.find((c) => c.type === 'BUTTONS')
  let header = { type: 'none', text: '', url: '', headerHandle: '', previewUrl: '' }
  if (h) {
    // prefer h.format (Meta's field); fall back to reading h.text for old records
    const fmt = (h.format || h.text || '').toUpperCase()
    const isMedia = MEDIA_TYPES.includes(fmt)
    header = {
      type: isMedia ? fmt.toLowerCase() : 'text',
      text: isMedia ? '' : (h.text || ''),
      url: '',
      headerHandle: isMedia ? (h.example?.header_handle?.[0] || '') : '',
      previewUrl: '',
    }
  }
  const sampleValues = {}
  if (b?.example?.body_text?.[0]) {
    b.example.body_text[0].forEach((val, i) => { sampleValues[i + 1] = val })
  }
  if (h?.example?.header_text?.[0]) sampleValues.header = h.example.header_text[0]
  return {
    header,
    body: b?.text || '',
    footer: f?.text || '',
    buttons: bt?.buttons?.map((btn) => ({
      type:  btn.type === 'URL' ? 'url' : btn.type === 'PHONE_NUMBER' ? 'call' : 'quick_reply',
      label: btn.text || '',
      value: btn.url || btn.phone_number || btn.phoneNumber || '',  // handle both cases
    })) || [],
    sampleValues,
    authConfig: { ...BLANK_AUTH, supportedApps: [{ packageName: '', signatureHash: '' }] },
  }
}

function normalizeTemplate(t) {
  const category = (t.category || 'MARKETING').toUpperCase()
  const { header, body, footer, buttons, sampleValues, authConfig } = componentsToFlat(t.components || [], category)
  return {
    id: t._id || t.id,
    name: t.name,
    category: category.toLowerCase(),
    language: CODE_TO_LANG[t.language] || t.language || 'English',
    status: (t.status || 'DRAFT').toLowerCase(),
    header, body, footer, buttons, sampleValues, authConfig,
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : '',
    usedIn: t.usageCount || 0,
    rejectionReason: t.rejectionReason || null,
    // Distinguishes "not yet submitted for review" from "submitted, Meta just hasn't decided yet" —
    // both show as status=pending, only metaTemplateId tells them apart.
    submittedToMeta: !!t.metaTemplateId,
  }
}

/* ─── Variable inserter ──────────────────────────────────── */

function insertVariable(text, setText, varNum) {
  const toInsert = `{{${varNum}}}`
  setText(text + toInsert)
}

/* ─── WhatsApp preview ───────────────────────────────────── */

function AuthPreviewShell({ children }) {
  return (
    <div className="sticky top-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Preview</p>
      <div className="mx-auto w-56 bg-gray-800 rounded-3xl p-2 shadow-xl">
        <div className="bg-[#e5ddd5] rounded-2xl overflow-hidden">
          <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SC</span>
            </div>
            <p className="text-white text-xs font-medium flex-1">SarnConnect</p>
          </div>
          <div className="p-2 min-h-[200px]">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm max-w-[200px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WaPreview({ form }) {
  if (form.category === 'authentication') {
    const a = form.authConfig || {}
    return (
      <AuthPreviewShell>
        <div className="px-3 py-2">
          <p className="text-xs text-gray-800 leading-relaxed">
            <strong>123456</strong> is your verification code.
            {a.addSecurityRecommendation ? ' For your security, do not share this code.' : ''}
            {a.codeExpirationMinutes ? ` This code expires in ${a.codeExpirationMinutes} minutes.` : ''}
          </p>
        </div>
        <div className="px-3 pb-2 flex justify-end">
          <span className="text-xs text-gray-300">10:24 AM ✓✓</span>
        </div>
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#128c7e]">
            <Copy size={10} />
            {a.otpType === 'COPY_CODE' ? (a.buttonText || 'Copy Code') : (a.buttonText || 'Autofill')}
          </div>
        </div>
      </AuthPreviewShell>
    )
  }

  const resolvedBody = (form.body || '')
    .replace(/\{\{1\}\}/g, 'John')
    .replace(/\{\{2\}\}/g, '#ORD-4821')
    .replace(/\{\{3\}\}/g, 'Tonight by 9 PM')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')

  const hasButtons = form.buttons?.filter((b) => b.label).length > 0

  return (
    <div className="sticky top-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Preview</p>
      {/* Phone shell */}
      <div className="mx-auto w-56 bg-gray-800 rounded-3xl p-2 shadow-xl">
        <div className="bg-[#e5ddd5] rounded-2xl overflow-hidden">
          {/* WA header bar */}
          <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SC</span>
            </div>
            <p className="text-white text-xs font-medium flex-1">SarnConnect</p>
          </div>

          {/* Chat area */}
          <div className="p-2 min-h-[280px]">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm max-w-[200px]">
              {/* Header */}
              {form.header?.type === 'text' && form.header.text && (
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-xs font-bold text-gray-900 leading-snug">{form.header.text}</p>
                </div>
              )}
              {form.header?.type === 'image' && (
                form.header.previewUrl ? (
                  <img src={form.header.previewUrl} alt="" className="w-full h-20 object-cover" />
                ) : (
                  <div className="w-full h-20 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <Image size={24} className="text-green-400" />
                  </div>
                )
              )}
              {form.header?.type === 'video' && (
                <div className="w-full h-20 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <Video size={24} className="text-purple-400" />
                </div>
              )}
              {form.header?.type === 'document' && (
                <div className="w-full h-14 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center gap-2 px-3">
                  <File size={18} className="text-blue-500" />
                  <p className="text-xs text-blue-700 font-medium">document.pdf</p>
                </div>
              )}

              {/* Body */}
              <div className="px-3 py-2">
                <p
                  className="text-xs text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: resolvedBody || '<span class="text-gray-300">Message body appears here…</span>' }}
                />
              </div>

              {/* Footer */}
              {form.footer && (
                <div className="px-3 pb-2">
                  <p className="text-xs text-gray-400">{form.footer}</p>
                </div>
              )}

              {/* Timestamp */}
              <div className="px-3 pb-2 flex justify-end">
                <span className="text-xs text-gray-300">10:24 AM ✓✓</span>
              </div>

              {/* Buttons */}
              {hasButtons && (
                <div className="border-t border-gray-100">
                  {form.buttons.filter((b) => b.label).map((btn, i) => (
                    <div key={i} className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#128c7e] ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                      {btn.type === 'url'        && <Link size={10} />}
                      {btn.type === 'call'       && <Phone size={10} />}
                      {btn.type === 'quick_reply'&& <Zap size={10} />}
                      {btn.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Template form drawer ───────────────────────────────── */

const BLANK = {
  name: '', category: 'marketing', language: 'English',
  header: { type: 'none', text: '', url: '', headerHandle: '', previewUrl: '' },
  body: '', footer: '',
  buttons: [],
  sampleValues: {},
  authConfig: { ...BLANK_AUTH, supportedApps: [{ packageName: '', signatureHash: '' }] },
}

function countVars(text) {
  const matches = text.match(/\{\{\d+\}\}/g) || []
  const nums = [...new Set(matches.map((m) => parseInt(m.replace(/[{}]/g, ''))))]
  return Math.max(0, ...nums, 0)
}

// Meta requires {{1}}, {{2}}, {{3}}... with no gaps — {{1}} + {{3}} without {{2}} gets rejected.
function findVarGap(text) {
  const nums = [...new Set((text.match(/\{\{\d+\}\}/g) || []).map((m) => parseInt(m.replace(/[{}]/g, ''), 10)))].sort((a, b) => a - b)
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) return true
  }
  return false
}

function getValidationErrors(form) {
  const errors = []
  if (!form.name.trim()) errors.push('Template name is required.')

  if (form.category === 'authentication') {
    const a = form.authConfig || {}
    if (!a.codeExpirationMinutes || a.codeExpirationMinutes < 1 || a.codeExpirationMinutes > 90) {
      errors.push('Code expiration must be between 1 and 90 minutes.')
    }
    if (['ONE_TAP', 'ZERO_TAP'].includes(a.otpType)) {
      const hasApp = (a.supportedApps || []).some((app) => app.packageName?.trim() && app.signatureHash?.trim())
      if (!hasApp) errors.push('At least one supported app (package name + signature hash) is required for this OTP type.')
    }
    if (a.otpType === 'ZERO_TAP' && !a.zeroTapTermsAccepted) {
      errors.push('You must accept the zero-tap terms to use Zero-Tap autofill.')
    }
    return errors
  }

  if (!form.body.trim()) errors.push('Body text is required.')
  if (form.body.length > 1024) errors.push('Body text must be 1024 characters or fewer.')
  if (findVarGap(form.body)) errors.push('Body variables must be sequential starting at {{1}} with no gaps.')

  if (form.header?.type === 'text') {
    if (form.header.text.length > 60) errors.push('Header text must be 60 characters or fewer.')
    if (findVarGap(form.header.text)) errors.push('Header can only use a single {{1}} variable.')
    if (countVars(form.header.text) > 0 && !form.sampleValues?.header?.trim()) {
      errors.push('Header variable requires a sample value.')
    }
  }
  if (['image', 'video', 'document'].includes(form.header?.type)) {
    if (form.header.uploading) errors.push('Header media is still uploading.')
    if (!form.header.headerHandle) errors.push('Upload header media before saving.')
  }
  if (form.footer && form.footer.length > 60) errors.push('Footer text must be 60 characters or fewer.')

  return errors
}

function TemplateDrawer({ template, onSave, onClose }) {
  const [form, setForm] = useState(
    template
      ? {
          name: template.name, category: template.category, language: template.language,
          header: { headerHandle: '', previewUrl: '', ...template.header },
          body: template.body, footer: template.footer,
          buttons: template.buttons.map((b) => ({ ...b })),
          sampleValues: template.sampleValues || {},
          authConfig: template.authConfig
            ? { ...BLANK_AUTH, ...template.authConfig, supportedApps: template.authConfig.supportedApps?.length ? template.authConfig.supportedApps.map((a) => ({ ...a })) : [{ packageName: '', signatureHash: '' }] }
            : { ...BLANK_AUTH, supportedApps: [{ packageName: '', signatureHash: '' }] },
        }
      : { ...BLANK, header: { ...BLANK.header }, buttons: [], sampleValues: {}, authConfig: { ...BLANK_AUTH, supportedApps: [{ packageName: '', signatureHash: '' }] } }
  )
  const [showBtnPicker, setShowBtnPicker] = useState(false)
  const headerFileRef = useRef(null)

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const setHeader = (key, val) => setForm((f) => ({ ...f, header: { ...f.header, [key]: val } }))
  const setAuthField = (key, val) => setForm((f) => ({ ...f, authConfig: { ...f.authConfig, [key]: val } }))
  const setBtn = (i, key, val) => {
    const btns = [...form.buttons]
    btns[i] = { ...btns[i], [key]: val }
    setField('buttons', btns)
  }
  const addBtn = (type) => {
    if (form.buttons.length >= 3) return
    setField('buttons', [...form.buttons, { type, label: '', value: '' }])
    setShowBtnPicker(false)
  }
  const removeBtn = (i) => {
    const btns = [...form.buttons]
    btns.splice(i, 1)
    setField('buttons', btns)
  }
  const setSupportedApp = (i, key, val) => {
    const apps = [...form.authConfig.supportedApps]
    apps[i] = { ...apps[i], [key]: val }
    setAuthField('supportedApps', apps)
  }
  const addSupportedApp = () => setAuthField('supportedApps', [...form.authConfig.supportedApps, { packageName: '', signatureHash: '' }])
  const removeSupportedApp = (i) => {
    const apps = [...form.authConfig.supportedApps]
    apps.splice(i, 1)
    setAuthField('supportedApps', apps.length ? apps : [{ packageName: '', signatureHash: '' }])
  }

  const handleHeaderMediaSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setHeader('previewUrl', file.type.startsWith('image/') ? URL.createObjectURL(file) : '')
    setHeader('headerHandle', '')
    setHeader('uploading', true)
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await api.post('/api/v1/templates/header-media', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setHeader('headerHandle', data.data.headerHandle)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload header media')
    } finally {
      setHeader('uploading', false)
    }
  }

  const varCount = countVars(form.body)
  const validationErrors = getValidationErrors(form)
  const valid = validationErrors.length === 0
  // Drafts are a work-in-progress scratchpad — only require what's always required (name, and
  // body for non-auth categories, matching the original pre-validation behavior). The full
  // Meta-compliance checks above (char limits, sequential vars, uploaded media, auth completeness)
  // only gate actually submitting to Meta, not saving progress.
  const canSaveDraft = form.name.trim() && (form.category === 'authentication' || form.body.trim())

  return createPortal(
    <motion.div className="fixed inset-0 z-50 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
        className="w-full max-w-3xl bg-white h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-sm font-semibold text-gray-900">{template ? 'Edit Template' : 'Create Template'}</p>
            <p className="text-xs text-gray-400 mt-0.5">WhatsApp Business Message Template</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
        </div>

        {/* Body — two columns */}
        <div className="flex-1 overflow-hidden flex">
          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Name + Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Template Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. summer_sale"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase, underscores only</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setField('language', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Category *</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setField('category', cat.key)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${form.category === cat.key ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${form.category === cat.key ? 'text-green-800' : 'text-gray-700'}`}>{cat.label}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {form.category === 'authentication' ? (
              <div className="space-y-5">
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <p className="text-xs font-semibold text-orange-800 mb-1">Meta-controlled message</p>
                  <p className="text-xs text-orange-600 leading-relaxed">
                    Authentication templates have no custom header, body, or footer text — Meta
                    generates the OTP message copy automatically from the options below.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Code Expiration (minutes)</label>
                    <input
                      type="number" min={1} max={90}
                      value={form.authConfig.codeExpirationMinutes}
                      onChange={(e) => setAuthField('codeExpirationMinutes', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.authConfig.addSecurityRecommendation}
                        onChange={(e) => setAuthField('addSecurityRecommendation', e.target.checked)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Add security recommendation
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">OTP Delivery Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OTP_TYPES.map((o) => (
                      <button
                        key={o.key}
                        onClick={() => setAuthField('otpType', o.key)}
                        className={`p-3 rounded-xl border-2 text-left transition-colors ${form.authConfig.otpType === o.key ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <p className={`text-xs font-semibold mb-0.5 ${form.authConfig.otpType === o.key ? 'text-green-800' : 'text-gray-700'}`}>{o.label}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{o.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {['ONE_TAP', 'ZERO_TAP'].includes(form.authConfig.otpType) && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-gray-700">Supported Apps</label>
                      <button onClick={addSupportedApp} className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700 transition-colors">
                        <Plus size={12} /> Add app
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.authConfig.supportedApps.map((app, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={app.packageName}
                            onChange={(e) => setSupportedApp(i, 'packageName', e.target.value)}
                            placeholder="Package name (e.g. com.yourapp)"
                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-white font-mono"
                          />
                          <input
                            value={app.signatureHash}
                            onChange={(e) => setSupportedApp(i, 'signatureHash', e.target.value)}
                            placeholder="Signature hash"
                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-white font-mono"
                          />
                          <button onClick={() => removeSupportedApp(i)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {form.authConfig.otpType === 'ZERO_TAP' && (
                  <label className="flex items-start gap-2 text-xs text-gray-700 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      checked={form.authConfig.zeroTapTermsAccepted}
                      onChange={(e) => setAuthField('zeroTapTermsAccepted', e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span>I understand zero-tap autofill is subject to WhatsApp Business Terms of Service and confirm this app is authorized to use it.</span>
                  </label>
                )}
              </div>
            ) : (
              <>
            {/* Header */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Header <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="flex gap-2 mb-3">
                {HEADER_TYPES.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setHeader('type', key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-colors ${form.header.type === key ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                  >
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {form.header.type === 'text' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
                    <input
                      value={form.header.text}
                      onChange={(e) => setHeader('text', e.target.value)}
                      placeholder="Header text (max 60 chars)"
                      maxLength={60}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">{form.header.text.length}/60</p>
                    {countVars(form.header.text) > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-blue-700 shrink-0">{'{{1}}'}</span>
                        <input
                          value={form.sampleValues?.header || ''}
                          onChange={(e) => setField('sampleValues', { ...form.sampleValues, header: e.target.value })}
                          placeholder="Sample value for header variable (required for Meta approval)"
                          className="flex-1 px-2.5 py-1.5 text-xs border border-blue-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
                {['image', 'video', 'document'].includes(form.header.type) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
                    <input
                      ref={headerFileRef}
                      type="file"
                      accept={form.header.type === 'image' ? 'image/*' : form.header.type === 'video' ? 'video/*' : 'application/pdf'}
                      className="hidden"
                      onChange={handleHeaderMediaSelect}
                    />
                    <button
                      type="button"
                      onClick={() => headerFileRef.current?.click()}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 transition-colors text-left"
                    >
                      {form.header.type === 'image'    && <Image size={20} className="text-gray-300 shrink-0" />}
                      {form.header.type === 'video'    && <Video size={20} className="text-gray-300 shrink-0" />}
                      {form.header.type === 'document' && <File  size={20} className="text-gray-300 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">
                          {form.header.uploading ? 'Uploading…' : form.header.headerHandle ? 'Replace file' : `Upload ${form.header.type}`}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {form.header.headerHandle ? 'Ready — used as the header sample for Meta review' : 'Required for Meta approval'}
                        </p>
                      </div>
                      {form.header.previewUrl && form.header.type === 'image' && (
                        <img src={form.header.previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">Body *</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Insert variable:</span>
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setField('body', form.body + `{{${n}}}`)}
                      className="text-xs font-mono px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
                    >
                      {`{{${n}}}`}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={6}
                value={form.body}
                onChange={(e) => setField('body', e.target.value)}
                placeholder="Hello {{1}}, your order {{2}} is ready!&#10;&#10;Use *bold* for formatting."
                maxLength={1024}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">Use *text* for bold · {'{{1}}'} {'{{2}}'} for variables · \n for newline</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {varCount > 0 && <span className="text-green-600 font-medium">{varCount} variable{varCount > 1 ? 's' : ''}</span>}
                  <span>{form.body.length}/1024</span>
                </div>
              </div>
            </div>

            {/* Sample Values — required by Meta for approval */}
            {varCount > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs font-semibold text-blue-800 mb-0.5">Sample Variable Values <span className="text-blue-500 font-normal">(required for Meta approval)</span></p>
                <p className="text-xs text-blue-600 mb-3">Meta requires example content for each variable so reviewers can see how the message will look.</p>
                <div className="space-y-2">
                  {Array.from({ length: varCount }, (_, i) => i + 1).map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-700 w-10 shrink-0">{`{{${n}}}`}</span>
                      <input
                        value={form.sampleValues?.[n] || ''}
                        onChange={(e) => setField('sampleValues', { ...form.sampleValues, [n]: e.target.value })}
                        placeholder={n === 1 ? 'e.g. John' : n === 2 ? 'e.g. #ORD-4821' : 'e.g. sample value'}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-blue-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Footer <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                value={form.footer}
                onChange={(e) => setField('footer', e.target.value)}
                placeholder="e.g. Valid till June 30 · Unsubscribe anytime"
                maxLength={60}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Buttons</label>
                  <p className="text-xs text-gray-400 mt-0.5 mb-1">Max 3 Quick Reply buttons OR max 2 Call-to-Action (1 phone + 1 URL)</p>
                </div>
                {form.buttons.length < 3 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowBtnPicker((s) => !s)}
                      className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700 transition-colors"
                    >
                      <Plus size={12} /> Add Button
                    </button>
                    <AnimatePresence>
                      {showBtnPicker && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowBtnPicker(false)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.14, ease: EASE_OUT }}
                            className="absolute right-0 top-6 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[200px]"
                          >
                            {BTN_TYPES.map(({ key, label, icon: Icon, desc }) => (
                              <button
                                key={key}
                                onClick={() => addBtn(key)}
                                className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <Icon size={13} className="text-gray-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-gray-800">{label}</p>
                                  <p className="text-xs text-gray-400">{desc}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {form.buttons.map((btn, i) => {
                    const def = BTN_TYPES.find((b) => b.key === btn.type)
                    const BIcon = def?.icon || Zap
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.16, ease: EASE_OUT }}
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <span className="p-1.5 bg-white rounded-lg border border-gray-200 shrink-0 mt-0.5">
                          <BIcon size={12} className="text-gray-500" />
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            value={btn.label}
                            onChange={(e) => setBtn(i, 'label', e.target.value)}
                            placeholder="Button label"
                            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                          />
                          {btn.type !== 'quick_reply' && (
                            <input
                              value={btn.value}
                              onChange={(e) => setBtn(i, 'value', e.target.value)}
                              placeholder={btn.type === 'call' ? '+91 98765 43210' : 'https://…'}
                              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 bg-white font-mono"
                            />
                          )}
                        </div>
                        <button onClick={() => removeBtn(i)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <X size={12} />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                {form.buttons.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-xl">
                    No buttons added yet
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </div>

          {/* Preview panel */}
          <div className="w-64 border-l border-gray-100 px-4 py-5 bg-gray-50/50 shrink-0 overflow-y-auto">
            <WaPreview form={form} />
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="px-6 py-2 border-t border-gray-100 bg-red-50/50 shrink-0">
            <p className="text-xs text-red-600">{validationErrors[0]}</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { onSave({ ...form, status: 'draft' }); onClose() }}
              disabled={!canSaveDraft}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
            >
              <AlignLeft size={13} /> Save Draft
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { onSave({ ...form, status: 'pending' }); onClose() }}
              disabled={!valid}
              className="flex items-center gap-1.5 px-5 py-2 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
            >
              <Send size={13} /> Submit for Approval
            </motion.button>
          </div>
        </div>
      </motion.aside>
    </motion.div>,
    document.body
  )
}

/* ─── Row action menu ────────────────────────────────────── */

function RowMenu({ t, onEdit, onDuplicate, onDelete, onSubmit }) {
  const [open, setOpen] = useState(false)
  const items = [
    { key: 'edit',      label: 'Edit',                icon: AlignLeft  },
    { key: 'duplicate', label: 'Duplicate',            icon: Copy       },
    ...(t.status === 'draft' || t.status === 'rejected'
      ? [{ key: 'submit', label: 'Submit for Approval', icon: Send, green: true }]
      : []),
    { key: 'delete',    label: 'Delete',               icon: Trash2, danger: true },
  ]
  const handlers = { edit: onEdit, duplicate: onDuplicate, delete: onDelete, submit: onSubmit }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[168px]"
            >
              {items.map(({ key, label, icon: Icon, danger, green }) => (
                <button
                  key={key}
                  onClick={() => { handlers[key]?.(); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${danger ? 'text-red-600' : green ? 'text-green-600' : 'text-gray-700'}`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Template card ──────────────────────────────────────── */

function TemplateCard({ t, index, onEdit, onDuplicate, onDelete, onSubmit }) {
  const [showRejection, setShowRejection] = useState(false)
  const cat      = CATEGORIES.find((c) => c.key === t.category)
  const stStatus = STATUS_STYLE[t.status]
  const SIcon    = stStatus.icon

  const varCount = countVars(t.body)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: EASE_OUT, delay: index * 0.04 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow transition-shadow"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-gray-900 font-mono">{t.name}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cat?.color}`}>{cat?.label}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${stStatus.bg}`}>
              <SIcon size={10} /> {stStatus.label}
            </span>
            <span className="text-xs text-gray-400">{t.language}</span>
          </div>
          {t.status === 'pending' && (
            <p className="text-[11px] mt-1 text-blue-500">
              Submitted to Meta — awaiting their review (auto-updates once decided)
            </p>
          )}
        </div>
        <RowMenu t={t} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} onSubmit={onSubmit} />
      </div>

      {/* Body preview */}
      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
        {t.body}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
        {t.header.type !== 'none' && (
          <span className="flex items-center gap-1">
            {t.header.type === 'image'    && <><Image size={11} /> Image header</>}
            {t.header.type === 'video'    && <><Video size={11} /> Video header</>}
            {t.header.type === 'document' && <><File  size={11} /> Doc header</>}
            {t.header.type === 'text'     && <><Type  size={11} /> {t.header.text.slice(0, 20)}{t.header.text.length > 20 ? '…' : ''}</>}
          </span>
        )}
        {t.buttons.length > 0 && <span>{t.buttons.length} button{t.buttons.length > 1 ? 's' : ''}</span>}
        {varCount > 0 && <span className="text-green-600">{varCount} variable{varCount > 1 ? 's' : ''}</span>}
        {t.usedIn > 0 && <span className="text-blue-500">Used in {t.usedIn} campaign{t.usedIn > 1 ? 's' : ''}</span>}
        <span className="ml-auto">{t.updatedAt}</span>
      </div>

      {/* Rejection reason */}
      {t.status === 'rejected' && t.rejectionReason && (
        <div>
          <button
            onClick={() => setShowRejection((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-red-600 font-medium hover:text-red-700 transition-colors"
          >
            <AlertTriangle size={11} /> View rejection reason
            <ChevronDown size={11} className={`transition-transform ${showRejection ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showRejection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 leading-relaxed"
              >
                {t.rejectionReason}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function Templates() {
  const [templates,   setTemplates]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [statusTab,   setStatusTab]   = useState('all')
  const [search,      setSearch]      = useState('')
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)   // null = new, obj = editing

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/templates?limit=100')
      setTemplates((data.data?.templates || []).map(normalizeTemplate))
    } catch {
      toast.error('Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  /* Filtered list */
  const filtered = templates.filter((t) => {
    if (statusTab !== 'all' && t.status !== statusTab) return false
    if (search && !t.name.includes(search.toLowerCase()) && !t.body.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  /* Counts for tabs */
  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'all' ? templates.length : templates.filter((t) => t.status === s).length
    return acc
  }, {})

  /* CRUD */
  const handleSave = async (form) => {
    const payload = {
      name: form.name,
      category: form.category.toUpperCase(),
      language: LANG_TO_CODE[form.language] || 'en',
      components: flatToComponents(form),
    }
    try {
      let saved
      if (editTarget) {
        const { data } = await api.put(`/api/v1/templates/${editTarget.id}`, payload)
        saved = normalizeTemplate(data.data.template)
        setTemplates((ts) => ts.map((t) => t.id === editTarget.id ? saved : t))
      } else {
        const { data } = await api.post('/api/v1/templates', payload)
        saved = normalizeTemplate(data.data.template)
        setTemplates((ts) => [saved, ...ts])
      }
      if (form.status === 'pending') {
        const { data: subData } = await api.post(`/api/v1/templates/${saved.id}/submit`)
        setTemplates((ts) => ts.map((t) => t.id === saved.id ? { ...t, status: 'pending' } : t))
        toast.success(subData.message || 'Submitted to Meta for review.')
      } else {
        toast.success('Template saved as draft.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template.')
    }
    setEditTarget(null)
    setDrawerOpen(false)
  }

  const handleDuplicate = async (t) => {
    const payload = {
      name: `${t.name}_copy`,
      category: t.category.toUpperCase(),
      language: LANG_TO_CODE[t.language] || 'en',
      components: flatToComponents(t),
    }
    try {
      const { data } = await api.post('/api/v1/templates', payload)
      setTemplates((ts) => [normalizeTemplate(data.data.template), ...ts])
      toast.success('Template duplicated as draft.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate template.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/templates/${id}`)
      setTemplates((ts) => ts.filter((t) => t.id !== id))
      toast.success('Template deleted.')
    } catch {
      toast.error('Failed to delete template.')
    }
  }

  const handleSubmit = async (id) => {
    try {
      const { data } = await api.post(`/api/v1/templates/${id}/submit`)
      setTemplates((ts) => ts.map((t) => t.id === id ? { ...t, status: 'pending' } : t))
      toast.success(data.message || 'Submitted to Meta for review.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit template.')
    }
  }

  const openCreate = () => { setEditTarget(null); setDrawerOpen(true) }
  const openEdit   = (t)  => { setEditTarget(t);   setDrawerOpen(true) }

  const STATUS_TAB_LABELS = { all: 'All', approved: 'Approved', pending: 'Pending', draft: 'Draft', rejected: 'Rejected' }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Templates" description="Create and manage WhatsApp Business message templates" />
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-medium rounded-lg"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Plus size={14} /> New Template
          </motion.button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusTab(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${statusTab === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {STATUS_TAB_LABELS[s]}
              {counts[s] > 0 && (
                <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${statusTab === s ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {counts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>
        <p className="text-xs text-gray-400 ml-auto">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((t, i) => (
              <TemplateCard
                key={t.id}
                t={t}
                index={i}
                onEdit={() => openEdit(t)}
                onDuplicate={() => handleDuplicate(t)}
                onDelete={() => handleDelete(t.id)}
                onSubmit={() => handleSubmit(t.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
          <p className="text-sm">Loading templates…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
          <FileText size={32} />
          <p className="text-sm">No templates found</p>
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <TemplateDrawer
            template={editTarget}
            onSave={handleSave}
            onClose={() => { setDrawerOpen(false); setEditTarget(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
