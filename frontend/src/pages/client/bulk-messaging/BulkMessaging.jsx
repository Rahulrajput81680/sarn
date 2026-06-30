import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, FileText, Users, Clock, CheckCircle2, ChevronRight,
  ChevronLeft, Upload, X, Plus, AlertTriangle, Check,
  Zap, Calendar, Layers, Gauge, RotateCcw, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import TOSModal from '../../../components/bulk-messaging/TOSModal'
import api from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── API helpers ────────────────────────────────────────── */

const CAT_LABEL = { MARKETING: 'Marketing', UTILITY: 'Utility', AUTHENTICATION: 'Authentication' }

function extractVars(body = '') {
  const matches = body.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
}

function normalizeBulkTemplate(t) {
  const bodyComp = (t.components || []).find((c) => c.type === 'BODY')
  const body = bodyComp?.text || ''
  return {
    id: t._id,
    name: t.name,
    category: CAT_LABEL[t.category] || t.category,
    body,
    vars: extractVars(body),
  }
}

function normalizeCampaign(c) {
  const statusMap = { completed: 'Completed', running: 'Sending', scheduled: 'Scheduled', draft: 'Draft' }
  return {
    id: c._id,
    name: c.name,
    template: c.template?.name || '—',
    recipients: c.recipients?.count || c.stats?.total || 0,
    sent: c.stats?.sent || 0,
    delivered: c.stats?.delivered || 0,
    read: c.stats?.read || 0,
    failed: c.stats?.failed || 0,
    lastError: c.stats?.lastError || null,
    date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    status: statusMap[c.status] || c.status,
  }
}

/* ─── Shared components ─────────────────────────────────── */

function StepBtn({ onClick, disabled, children, variant = 'primary' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg ${
        variant === 'primary'
          ? 'bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 disabled:opacity-40 disabled:cursor-not-allowed'
          : 'text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 bg-white'
      }`}
      style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 120ms ease' }}
    >
      {children}
    </motion.button>
  )
}

const categoryColor = {
  Transactional: 'bg-blue-50 text-blue-600',
  Marketing:     'bg-purple-50 text-purple-600',
  Utility:       'bg-amber-50 text-amber-600',
}

/* ─── Step 1: Template ──────────────────────────────────── */

function StepTemplate({ selected, onSelect, onNext, varMapping, onVarMapping, templates }) {
  const [preview, setPreview] = useState(null)

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Choose an approved WhatsApp template</p>
      {templates?.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400">No approved templates yet. Create and submit a template for approval first.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(templates || []).map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT, delay: i * 0.045 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onSelect(t)}
            onMouseEnter={() => setPreview(t)}
            onMouseLeave={() => setPreview(null)}
            className={`text-left p-4 rounded-xl border-2 transition-colors duration-150 ${
              selected?.id === t.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
            style={{ transition: 'border-color 150ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor[t.category]}`}>
                  {t.category}
                </span>
              </div>
              {selected?.id === t.id && (
                <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{t.body}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {(preview || selected) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <Eye size={12} /> Preview
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{(preview || selected)?.body}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(preview || selected)?.vars.map((v) => (
                <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500 font-mono">
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variable mapping — appears only when template has vars */}
      <AnimatePresence>
        {selected && selected.vars?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl overflow-hidden"
          >
            <p className="text-xs font-semibold text-blue-800 mb-0.5">Map Template Variables</p>
            <p className="text-xs text-blue-600 mb-3">Enter a CSV column name or a fixed value for each variable in this template.</p>
            <div className="space-y-2">
              {selected.vars.map((v) => (
                <div key={v} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-blue-700 w-24 shrink-0">{`{{${v}}}`}</span>
                  <input
                    value={varMapping?.[v] || ''}
                    onChange={(e) => onVarMapping({ ...varMapping, [v]: e.target.value })}
                    placeholder={`CSV column or fixed value`}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-blue-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-xs text-blue-400 shrink-0">→ message</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-500 mt-2.5">Column names must match your CSV headers exactly (case-sensitive).</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex justify-end ">
        <StepBtn onClick={onNext} disabled={!selected}>
          Continue <ChevronRight size={15} />
        </StepBtn>
      </div>
    </div>
  )
}

/* ─── Step 2: Recipients ────────────────────────────────── */

function StepRecipients({ data, onChange, onNext, onBack, segments }) {
  const [tab, setTab] = useState(data.tab || 'upload')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(data.file || null)
  const [manual, setManual] = useState(data.manual || '')
  const [segment, setSegment] = useState(data.segment || '')
  const [validated, setValidated] = useState(data.validated || false)
  const [validResult, setValidResult] = useState(data.validResult || null)
  const fileRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setValidated(false); setValidResult(null) }
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) { setFile(f); setValidated(false); setValidResult(null) }
  }

  // ── Real validation — no fake numbers ────────────────────
  const validate = () => {
    let result = { valid: 0, duplicates: 0, invalid: 0, total: 0, phones: [] }

    if (tab === 'manual') {
      const lines = manual.split('\n').map(l => l.trim()).filter(Boolean)
      const seen = new Set()
      lines.forEach(raw => {
        const cleaned = raw.replace(/[\s\-().]/g, '')
        const phone = cleaned.startsWith('+') ? cleaned : `+${cleaned}`
        const isValid = /^\+\d{7,15}$/.test(phone)
        if (!isValid) {
          result.invalid++
        } else if (seen.has(phone)) {
          result.duplicates++
        } else {
          seen.add(phone)
          result.valid++
          result.phones.push(phone)
        }
      })
      result.total = lines.length

    } else if (tab === 'segment') {
      const match = segment.match(/\((\d[\d,]*)\)/)
      const count = match ? parseInt(match[1].replace(/,/g, '')) : 0
      result.valid = count
      result.total = count

    } else if (tab === 'upload') {
      result.valid = 0
      result.total = 0
    }

    setValidResult(result)
    setValidated(true)
    onChange({ ...data, file, manual, segment, tab, validated: true, count: result.valid, phones: result.phones, validResult: result })
  }

  const hasInput = (tab === 'manual' && manual.trim()) ||
                   (tab === 'segment' && segment) ||
                   (tab === 'upload' && file)

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Add recipients via CSV upload, manual entry, or contact segment</p>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4 w-fit">
        {[['upload', 'CSV / Excel'], ['manual', 'Manual'], ['segment', 'Segment']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setValidated(false); setValidResult(null) }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-150 ${
                dragging ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
              <Upload size={24} className={`mx-auto mb-2 ${dragging ? 'text-green-500' : 'text-gray-300'}`} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={14} className="text-green-600" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); setValidated(false); setValidResult(null) }}>
                    <X size={13} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Drop CSV or Excel file here</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Required columns: phone. Optional: name, order_id, custom fields</p>
          </motion.div>
        )}

        {tab === 'manual' && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            <textarea
              value={manual}
              onChange={(e) => { setManual(e.target.value); setValidated(false); setValidResult(null) }}
              placeholder={`+91 98765 43210\n+91 87654 32109\n+91 76543 21098`}
              rows={6}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">One phone number per line, with country code (e.g. +91...)</p>
          </motion.div>
        )}

        {tab === 'segment' && (
          <motion.div
            key="segment"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="space-y-2"
          >
            {(segments || []).map((seg) => (
              <button
                key={seg}
                onClick={() => { setSegment(seg); setValidated(false); setValidResult(null) }}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors duration-150 ${
                  segment === seg
                    ? 'border-green-500 bg-green-50 text-green-800 font-medium'
                    : 'border-gray-100 bg-white hover:border-gray-200 text-gray-700'
                }`}
              >
                {seg}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real Validation Result */}
      <AnimatePresence>
        {validated && validResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="mt-4 p-4 bg-white rounded-xl border border-gray-100 overflow-hidden"
          >
            <p className="text-xs font-semibold text-gray-700 mb-3">Audience Validation</p>
            {tab === 'upload' ? (
              <p className="text-xs text-gray-500">CSV will be validated on the server when you send.</p>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Valid recipients',  value: validResult.valid,      icon: Check,         color: 'text-green-600', bg: 'bg-green-50' },
                  ...(validResult.duplicates > 0 ? [{ label: 'Duplicates removed', value: validResult.duplicates, icon: X, color: 'text-amber-600', bg: 'bg-amber-50' }] : []),
                  ...(validResult.invalid > 0    ? [{ label: 'Invalid numbers',    value: validResult.invalid,    icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' }] : []),
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-md ${bg}`}>
                        <Icon size={11} className={color} />
                      </span>
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                    <span className={`text-xs font-semibold ${color}`}>{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
              <span className="text-xs text-gray-500">Final recipient count</span>
              <span className="text-sm font-bold text-gray-900">{validResult.valid.toLocaleString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <div className="flex gap-2">
          {!validated && hasInput && (
            <StepBtn onClick={validate} variant="secondary">
              Validate Audience
            </StepBtn>
          )}
          <StepBtn onClick={onNext} disabled={!validated || (validResult && validResult.valid === 0)}>
            Continue <ChevronRight size={15} />
          </StepBtn>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 3: Send Controls ─────────────────────────────── */

function StepSchedule({ data, onChange, onNext, onBack }) {
  const [sendType, setSendType]   = useState(data.sendType || 'instant')
  const [schedule, setSchedule]   = useState(data.schedule || '')
  const [batch, setBatch]         = useState(data.batch || '500')
  const [throttle, setThrottle]   = useState(data.throttle || '1000')

  const save = () => {
    onChange({ ...data, sendType, schedule, batch, throttle })
    onNext()
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Configure how and when to send your bulk messages</p>

      {/* Send type */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">Send Type</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'instant',   label: 'Instant Send',    icon: Zap,      desc: 'Send immediately' },
            { key: 'scheduled', label: 'Scheduled Send',  icon: Calendar, desc: 'Pick a date & time' },
          ].map(({ key, label, icon: Icon, desc }) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSendType(key)}
              className={`p-4 rounded-xl border-2 text-left transition-colors duration-150 ${
                sendType === key ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
              style={{ transition: 'border-color 150ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
            >
              <Icon size={16} className={sendType === key ? 'text-green-600' : 'text-gray-400'} />
              <p className="text-sm font-medium text-gray-900 mt-1">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Date/time picker for scheduled */}
      <AnimatePresence>
        {sendType === 'scheduled' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Date & Time</label>
            <input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch + throttle */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Layers size={12} /> Batch Size
          </label>
          <div className="space-y-1.5">
            {['100', '500', '1000', 'All'].map((v) => (
              <button
                key={v}
                onClick={() => setBatch(v)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs border transition-colors duration-100 ${
                  batch === v ? 'border-green-500 bg-green-50 text-green-800 font-medium' : 'border-gray-100 hover:border-gray-200 text-gray-600'
                }`}
              >
                {v === 'All' ? 'All at once' : `${v} per batch`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Gauge size={12} /> Throttle (msgs/hr)
          </label>
          <div className="space-y-1.5">
            {['100', '500', '1000', 'Unlimited'].map((v) => (
              <button
                key={v}
                onClick={() => setThrottle(v)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs border transition-colors duration-100 ${
                  throttle === v ? 'border-green-500 bg-green-50 text-green-800 font-medium' : 'border-gray-100 hover:border-gray-200 text-gray-600'
                }`}
              >
                {v === 'Unlimited' ? 'No limit' : `${v} / hr`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <StepBtn onClick={save} disabled={sendType === 'scheduled' && !schedule}>
          Continue <ChevronRight size={15} />
        </StepBtn>
      </div>
    </div>
  )
}

/* ─── Step 4: Review & Send ─────────────────────────────── */

function StepReview({ template, recipients, schedule, onBack, onSend }) {
  const rows = [
    { label: 'Template',    value: template?.name || '—' },
    { label: 'Recipients',  value: `${recipients?.count?.toLocaleString() || 0} contacts` },
    { label: 'Audience',    value: recipients?.segment || (recipients?.file?.name) || 'Manual entry' },
    { label: 'Send type',   value: schedule?.sendType === 'scheduled' ? `Scheduled · ${schedule.schedule}` : 'Instant' },
    { label: 'Batch size',  value: schedule?.batch ? (schedule.batch === 'All' ? 'All at once' : `${schedule.batch} per batch`) : '—' },
    { label: 'Throttle',    value: schedule?.throttle ? (schedule.throttle === 'Unlimited' ? 'No limit' : `${schedule.throttle}/hr`) : '—' },
  ]

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Review your campaign before sending</p>

      <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
        {rows.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.04 }}
            className={`flex justify-between px-4 py-3 text-sm ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{value}</span>
          </motion.div>
        ))}
      </div>

      {template && (
        <div className="p-4 bg-white rounded-xl border border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Message Preview</p>
          <p className="text-sm text-gray-700 leading-relaxed">{template.body}</p>
        </div>
      )}

      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSend}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-semibold rounded-lg"
          style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
        >
          <Send size={15} />
          {schedule?.sendType === 'scheduled' ? 'Schedule Campaign' : 'Send Now'}
        </motion.button>
      </div>
    </div>
  )
}

/* ─── Delivery tracking row ─────────────────────────────── */

function DeliveryBar({ value, total, color }) {
  const pct = Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-700 w-12 text-right">{value.toLocaleString()}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 600ms cubic-bezier(0.23,1,0.32,1)' }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8">{pct}%</span>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────── */

const STEPS = ['Template', 'Recipients', 'Schedule', 'Review']

export default function BulkMessaging() {
  const [composing,  setComposing]  = useState(false)
  const [step,       setStep]       = useState(0)
  const [dir,        setDir]        = useState(1)
  const [template,   setTemplate]   = useState(null)
  const [varMapping, setVarMapping] = useState({})
  const [recipients, setRecipients] = useState({})
  const [schedule,   setSchedule]   = useState({})
  const [sent,       setSent]       = useState(false)
  const [sentCount,  setSentCount]  = useState(0)

  const [templates,      setTemplates]      = useState([])
  const [campaigns,      setCampaigns]      = useState([])
  const [segments,       setSegments]       = useState(['All Contacts'])
  const [loadingData,    setLoadingData]    = useState(true)
  const [refreshing,     setRefreshing]     = useState(false)
  const [syncing,        setSyncing]        = useState(false)
  const [tosAccepted,    setTosAccepted]    = useState(true)  // optimistic; corrected on load
  const [tosChecked,     setTosChecked]     = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/templates?status=APPROVED&limit=100'),
      api.get('/api/v1/campaigns?limit=50'),
      api.get('/api/v1/contacts?limit=1'),
      api.get('/api/v1/profile'),
    ]).then(([tRes, cRes, ctRes, pRes]) => {
      setTemplates((tRes.data.data?.templates || []).map(normalizeBulkTemplate))
      setCampaigns((cRes.data.data?.campaigns || []).map(normalizeCampaign))
      const total = ctRes.data.data?.total || 0
      setSegments([
        `All Contacts${total ? ` (${total.toLocaleString()})` : ''}`,
        'Lead',
        'Customer',
        'Interested',
        'Follow-up',
      ])
      const tos = pRes.data.data?.user?.tenant?.tosAccepted ?? false
      setTosAccepted(tos)
      setTosChecked(true)
    }).catch(() => { setTosChecked(true) }).finally(() => setLoadingData(false))
  }, [])

  const refreshCampaignList = async () => {
    setRefreshing(true)
    try {
      const r = await api.get('/api/v1/campaigns?limit=50')
      setCampaigns((r.data.data?.campaigns || []).map(normalizeCampaign))
    } catch {
      toast.error('Failed to refresh campaigns.')
    } finally {
      setRefreshing(false)
    }
  }

  const syncFromMeta = async () => {
    setSyncing(true)
    try {
      const r = await api.post('/api/v1/templates/sync')
      toast.success(`${r.data.data?.synced || 0} template(s) synced from Meta`)
      const tRes = await api.get('/api/v1/templates?status=APPROVED&limit=100')
      setTemplates((tRes.data.data?.templates || []).map(normalizeBulkTemplate))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Template sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const goNext = () => { setDir(1); setStep((s) => s + 1) }
  const goBack = () => { setDir(-1); setStep((s) => s - 1) }

  const reset = () => { setStep(0); setTemplate(null); setVarMapping({}); setRecipients({}); setSchedule({}) }

  const handleSend = async () => {
    const campaignName = template?.name
      ? `${template.name}_${new Date().toISOString().split('T')[0]}`
      : `campaign_${Date.now()}`

    const recipientsPayload = recipients.segment && !recipients.segment.startsWith('All')
      ? { type: 'segment', tags: [recipients.segment] }
      : { type: 'all' }

    try {
      const { data: cData } = await api.post('/api/v1/campaigns', {
        name: campaignName,
        templateId: template?.id,
        objective: 'promotion',
        recipients: recipientsPayload,
        variables: varMapping,
        schedule: schedule.sendType === 'scheduled' && schedule.schedule ? { scheduledAt: schedule.schedule } : undefined,
      })
      const campaignId = cData.data.campaign._id
      const { data: sData } = await api.post(`/api/v1/campaigns/${campaignId}/send`)
      setSentCount(sData.data.campaign?.total || 0)

      // Immediate refresh to show "Sending" in table
      refreshCampaignList()
      // Poll again at 2s and 5s — catches "completed" after background send finishes
      setTimeout(refreshCampaignList, 2000)
      setTimeout(refreshCampaignList, 5000)
    } catch (err) {
      if (err.response?.data?.code === 'TOS_REQUIRED') {
        setTosAccepted(false)  // re-show TOS modal
        return
      }
      if (err.response?.data?.code === 'CAMPAIGN_ALREADY_RUNNING') {
        toast.error('A campaign is already running. Wait for it to complete first.')
        return
      }
      toast.error(err.response?.data?.message || 'Failed to send campaign.')
      return
    }

    setSent(true)
    setComposing(false)
    reset()
  }

  const stepContent = [
    <StepTemplate selected={template} onSelect={(t) => { setTemplate(t); setVarMapping({}) }} onNext={goNext} varMapping={varMapping} onVarMapping={setVarMapping} templates={templates} />,
    <StepRecipients data={recipients} onChange={setRecipients} onNext={goNext} onBack={goBack} segments={segments} />,
    <StepSchedule data={schedule} onChange={setSchedule} onNext={goNext} onBack={goBack} />,
    <StepReview template={template} recipients={recipients} schedule={schedule} onBack={goBack} onSend={handleSend} />,
  ]

  return (
    <div className="space-y-6">
      {/* TOS modal — shown once until user accepts */}
      <AnimatePresence>
        {tosChecked && !tosAccepted && (
          <TOSModal onAccepted={() => setTosAccepted(true)} />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <PageHeader title="Bulk Messaging" description="Send template-based messages to large contact lists" />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setComposing(true); setSent(false) }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-grey-200 shadow-sm shadow-green-500 border-2 border-green-400 text-sm font-medium rounded-lg shrink-0 hover:bg-white/45 w-full sm:w-auto"
          style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
        >
          <Plus size={15} /> New Campaign
        </motion.button>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"
          >
            <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800">Campaign queued successfully!{sentCount > 0 ? ` Sending to ${sentCount.toLocaleString()} contacts.` : ''}</p>
            <button onClick={() => setSent(false)} className="ml-auto text-green-500 hover:text-green-700">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <AnimatePresence>
        {composing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Step header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">New Bulk Campaign</p>
                <button onClick={() => setComposing(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex items-center gap-1 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors duration-200"
                      style={{
                        backgroundColor: i <= step ? '#16a34a' : '#f3f4f6',
                        color: i <= step ? '#fff' : '#9ca3af',
                      }}
                    >
                      {i < step ? <Check size={11} /> : i + 1}
                    </div>
                    {!composing || i < STEPS.length - 1 ? (
                      <div
                        className="h-px flex-1 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i < step ? '#16a34a' : '#e5e7eb' }}
                      />
                    ) : null}
                  </div>
                ))}
                <span className="text-xs text-gray-400 ml-1 shrink-0">{STEPS[step]}</span>
              </div>
            </div>

            {/* Step content */}
            <div className="p-6 overflow-hidden">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  initial={(d) => ({ opacity: 0, x: d * 28 })}
                  animate={{ opacity: 1, x: 0 }}
                  exit={(d) => ({ opacity: 0, x: d * -28 })}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                >
                  {stepContent[step]}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past campaigns */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Recent Campaigns</p>
          <div className="flex items-center gap-2">
            <button
              onClick={syncFromMeta}
              disabled={syncing}
              title="Import all approved templates from Meta into this account"
              className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 transition-colors"
            >{syncing ? 'Syncing…' : 'Sync Templates'}</button>
            <button
              onClick={refreshCampaignList}
              disabled={refreshing}
              title="Refresh campaign list"
              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-40 transition-colors"
            >
              <RotateCcw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <span className="text-xs text-gray-400">{campaigns.length} campaigns</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                <th className="text-left px-5 py-3">Campaign</th>
                <th className="text-left px-4 py-3">Template</th>
                <th className="text-right px-4 py-3">Recipients</th>
                <th className="px-4 py-3 min-w-[120px]">Delivered</th>
                <th className="px-4 py-3 min-w-[120px]">Read</th>
                <th className="px-4 py-3 min-w-[120px]">Failed</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && !loadingData && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400">No campaigns yet. Create your first bulk campaign above.</td>
                </tr>
              )}
              {campaigns.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.04 }}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-100"
                >
                  <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">{c.name}</td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{c.template}</td>
                  <td className="px-4 py-3.5 text-right text-gray-700">{c.recipients.toLocaleString()}</td>
                  <td className="px-4 py-3.5"><DeliveryBar value={c.delivered} total={c.recipients} color="#16a34a" /></td>
                  <td className="px-4 py-3.5"><DeliveryBar value={c.read}      total={c.recipients} color="#2563eb" /></td>
                  <td className="px-4 py-3.5"><DeliveryBar value={c.failed}    total={c.recipients} color="#dc2626" /></td>
                  <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap text-xs">{c.date}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.status === 'Sending' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'
                    }`}>
                      {c.status === 'Sending' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.failed > 0 && (
                      <button
                        title={c.lastError || 'Messages failed — click for details'}
                        onClick={() => toast.error(c.lastError || 'Messages failed. Check that the template is approved by Meta and your token has messaging permissions.', { duration: 8000 })}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <AlertTriangle size={13} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
