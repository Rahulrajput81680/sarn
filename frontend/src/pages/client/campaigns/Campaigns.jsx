import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Check, ChevronRight, ChevronLeft, ChevronDown, Eye,
  Megaphone, Bell, RefreshCw, HeadphonesIcon,
  Calendar, Clock, Repeat, Globe, FileText,
  Pause, Play, XCircle, CheckCircle2, Save,
  Send, AlertCircle, MoreHorizontal, Tag, Upload, Users,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Demo data ─────────────────────────────────────────── */

const TEMPLATES = [
  { id: 't1', name: 'Order Confirmation',   category: 'Transactional', body: 'Hi {{name}}, your order #{{order_id}} is confirmed and will arrive by {{date}}.' },
  { id: 't2', name: 'Promotional Offer',    category: 'Marketing',     body: 'Hi {{name}}, enjoy {{discount}}% off this weekend only! Use code {{code}} at checkout.' },
  { id: 't3', name: 'Appointment Reminder', category: 'Utility',       body: 'Hi {{name}}, your appointment is on {{date}} at {{time}}. Reply YES to confirm.' },
  { id: 't4', name: 'Win-back Offer',       category: 'Marketing',     body: 'We miss you, {{name}}! Come back and get {{discount}}% off your next purchase.' },
  { id: 't5', name: 'Support Follow-up',    category: 'Utility',       body: 'Hi {{name}}, we wanted to follow up on your recent support request #{{ticket_id}}.' },
  { id: 't6', name: 'Payment Reminder',     category: 'Transactional', body: 'Dear {{name}}, your payment of ₹{{amount}} is due on {{due_date}}.' },
]

const SEGMENTS = [
  { id: 's1', label: 'All Contacts',     count: 2847 },
  { id: 's2', label: 'VIP Customers',    count: 342 },
  { id: 's3', label: 'New Users',        count: 891 },
  { id: 's4', label: 'Inactive (90d)',   count: 456 },
  { id: 's5', label: 'Opted-in Only',    count: 2601 },
  { id: 's6', label: 'High Spenders',    count: 198 },
]

const TIMEZONES = [
  'Asia/Kolkata (IST +5:30)',
  'Asia/Dubai (GST +4:00)',
  'Europe/London (GMT +0:00)',
  'America/New_York (EST -5:00)',
  'America/Los_Angeles (PST -8:00)',
]

const OBJECTIVES = [
  { key: 'promotion',    label: 'Promotion',     icon: Megaphone,      color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-400', desc: 'Offers, sales, product launches' },
  { key: 'reminder',     label: 'Reminder',      icon: Bell,           color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-400',  desc: 'Appointments, payments, events' },
  { key: 'reengagement', label: 'Re-engagement', icon: RefreshCw,      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-400',   desc: 'Win-back inactive contacts' },
  { key: 'support',      label: 'Support',       icon: HeadphonesIcon, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-400',  desc: 'Follow-ups, feedback, help' },
]

const STATUS_META = {
  Draft:            { color: 'text-gray-600',  bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  'Pending Approval':{ color: 'text-amber-700', bg: 'bg-amber-50',  dot: 'bg-amber-400' },
  Scheduled:        { color: 'text-blue-700',  bg: 'bg-blue-50',    dot: 'bg-blue-500' },
  Running:          { color: 'text-green-700', bg: 'bg-green-50',   dot: 'bg-green-500', pulse: true },
  Paused:           { color: 'text-amber-700', bg: 'bg-amber-50',   dot: 'bg-amber-500' },
  Completed:        { color: 'text-green-700', bg: 'bg-green-50',   dot: 'bg-green-500' },
  Cancelled:        { color: 'text-red-600',   bg: 'bg-red-50',     dot: 'bg-red-400' },
}

const CAMPAIGNS = [
  { id: 1,  name: 'Diwali Sale 2026',        objective: 'promotion',    template: 'Promotional Offer',    segment: 'All Contacts',   schedule: 'Oct 20, 2026 · 10:00 AM', timezone: 'IST', status: 'Scheduled',  sent: 0,    delivered: 0,    read: 0 },
  { id: 2,  name: 'June Win-back',           objective: 'reengagement', template: 'Win-back Offer',       segment: 'Inactive (90d)', schedule: 'Running now',             timezone: 'IST', status: 'Running',    sent: 287,  delivered: 271,  read: 198 },
  { id: 3,  name: 'Payment Due Alerts',      objective: 'reminder',     template: 'Payment Reminder',     segment: 'VIP Customers',  schedule: 'Jun 10, 2026',            timezone: 'IST', status: 'Paused',     sent: 180,  delivered: 174,  read: 120 },
  { id: 4,  name: 'New User Welcome',        objective: 'support',      template: 'Support Follow-up',    segment: 'New Users',      schedule: 'Jun 8, 2026',             timezone: 'IST', status: 'Completed',  sent: 891,  delivered: 863,  read: 641 },
  { id: 5,  name: 'Summer Flash Sale',       objective: 'promotion',    template: 'Promotional Offer',    segment: 'High Spenders',  schedule: 'Jun 5, 2026',             timezone: 'IST', status: 'Completed',  sent: 198,  delivered: 192,  read: 154 },
  { id: 6,  name: 'Abandoned Cart Nudge',    objective: 'reengagement', template: 'Win-back Offer',       segment: 'Inactive (90d)', schedule: 'Jun 1, 2026',             timezone: 'IST', status: 'Cancelled',  sent: 0,    delivered: 0,    read: 0 },
  { id: 7,  name: 'Appointment Batch',       objective: 'reminder',     template: 'Appointment Reminder', segment: 'Opted-in Only',  schedule: 'Pending review',          timezone: 'IST', status: 'Pending Approval', sent: 0, delivered: 0, read: 0 },
  { id: 8,  name: 'Product Launch Teaser',   objective: 'promotion',    template: 'Promotional Offer',    segment: 'All Contacts',   schedule: 'Not scheduled',           timezone: 'IST', status: 'Draft',      sent: 0,    delivered: 0,    read: 0 },
]

const OBJ_BADGE = {
  promotion:    'bg-purple-50 text-purple-700',
  reminder:     'bg-amber-50 text-amber-700',
  reengagement: 'bg-blue-50 text-blue-700',
  support:      'bg-green-50 text-green-700',
}
const OBJ_LABEL = { promotion: 'Promotion', reminder: 'Reminder', reengagement: 'Re-engagement', support: 'Support' }

const categoryColor = {
  Transactional: 'bg-blue-50 text-blue-600',
  Marketing:     'bg-purple-50 text-purple-600',
  Utility:       'bg-amber-50 text-amber-600',
}

/* ─── Variable helpers ───────────────────────────────────── */

const CONTACT_FIELDS = [
  ['name',    'Contact Name'],
  ['phone',   'Phone Number'],
  ['email',   'Email Address'],
  ['city',    'City'],
  ['custom1', 'Custom Field 1'],
  ['custom2', 'Custom Field 2'],
]

const SAMPLE_CONTACT = {
  name: 'Priya Sharma', phone: '+91 98765 43210',
  email: 'priya@example.com', city: 'Mumbai',
  custom1: 'Premium', custom2: 'Batch-A',
}

const extractVars = (body) =>
  [...new Set((body || '').match(/\{\{(\w+)\}\}/g)?.map((m) => m.slice(2, -2)) || [])]

const resolveBody = (body, varMap, sample = {}, csvRow = null) =>
  (body || '').replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const entry = varMap?.[key]
    if (!entry) return `{{${key}}}`
    if (entry.type === 'static') return entry.value || `{{${key}}}`
    if (entry.type === 'field')  return sample[entry.field] || `[${entry.field}]`
    if (entry.type === 'csv')    return (csvRow && csvRow[entry.column]) || `[${entry.column || key}]`
    return `{{${key}}}`
  })

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
  return { headers, rows }
}

/* ─── Shared ─────────────────────────────────────────────── */

function StepBtn({ onClick, disabled, children, variant = 'primary' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg ${
        variant === 'primary'
          ? 'bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 disabled:opacity-40 disabled:cursor-not-allowed'
          : 'text-gray-600 border border-gray-200 hover:border-gray-300 bg-white'
      }`}
      style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 120ms ease' }}
    >
      {children}
    </motion.button>
  )
}

/* ─── Step 1: Campaign Details ──────────────────────────── */

function StepDetails({ data, onChange, onNext }) {
  const valid = data.name?.trim() && data.objective

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Name your campaign and choose its objective</p>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Campaign Name</label>
        <input
          type="text"
          placeholder="e.g. June Win-back Campaign"
          value={data.name || ''}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow duration-150"
        />
      </motion.div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">Objective</label>
        <div className="grid grid-cols-2 gap-3">
          {OBJECTIVES.map((obj, i) => (
            <motion.button
              key={obj.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT, delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange({ ...data, objective: obj.key })}
              className={`p-3.5 rounded-xl border-2 text-left transition-colors duration-150 ${
                data.objective === obj.key
                  ? `${obj.border} ${obj.bg}`
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
              style={{ transition: 'border-color 150ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
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

/* ─── Step 2: Template ──────────────────────────────────── */

function StepTemplate({ data, onChange, onNext, onBack }) {
  const [preview, setPreview] = useState(null)

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select an approved WhatsApp template</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
        {TEMPLATES.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.04 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onChange({ ...data, template: t, variableMap: {} })}
            onMouseEnter={() => setPreview(t)}
            onMouseLeave={() => setPreview(null)}
            className={`text-left p-3.5 rounded-xl border-2 transition-colors duration-150 ${
              data.template?.id === t.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
            style={{ transition: 'border-color 150ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900">{t.name}</p>
              {data.template?.id === t.id && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor[t.category]}`}>{t.category}</span>
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{t.body}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {(preview || data.template) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="p-3.5 bg-gray-50 rounded-xl border border-gray-100"
          >
            <p className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Eye size={11} /> Preview</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {(preview || data.template)?.body}
            </p>
            {extractVars((preview || data.template)?.body).length > 0 && (
              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                <Tag size={10} /> {extractVars((preview || data.template)?.body).length} variable{extractVars((preview || data.template)?.body).length > 1 ? 's' : ''} — you'll set values in the next step
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

/* ─── Step 3: Personalise variables ─────────────────────── */

function StepVariables({ data, onChange, onNext, onBack }) {
  const vars   = extractVars(data.template?.body)
  const varMap = data.variableMap || {}

  function setVar(key, entry) {
    onChange({ ...data, variableMap: { ...varMap, [key]: entry } })
  }

  function handleCSVUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result)
      onChange({ ...data, csvData: { fileName: file.name, ...parsed } })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function removeCSV() {
    const cleaned = Object.fromEntries(
      Object.entries(varMap).map(([k, v]) =>
        v.type === 'csv' ? [k, { type: 'csv', column: '' }] : [k, v]
      )
    )
    onChange({ ...data, csvData: null, variableMap: cleaned })
  }

  const needsCSV   = vars.some((v) => varMap[v]?.type === 'csv')
  const csvOk      = !needsCSV || (data.csvData?.rows?.length > 0)
  const allFilled  = vars.every((v) => {
    const e = varMap[v]
    if (!e) return false
    if (e.type === 'static') return !!e.value
    if (e.type === 'field')  return !!e.field
    if (e.type === 'csv')    return !!e.column
    return false
  })
  const canContinue = allFilled && csvOk

  const csvSampleRow = data.csvData?.rows?.[0] || null
  const preview = resolveBody(data.template?.body, varMap, SAMPLE_CONTACT, csvSampleRow)

  if (vars.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <Tag size={14} className="text-gray-400" />
          <p className="text-sm text-gray-500">This template has no variable placeholders — nothing to personalise.</p>
        </div>
        <div className="flex justify-between">
          <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
          <StepBtn onClick={onNext}>Continue <ChevronRight size={15} /></StepBtn>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Set a value for each placeholder — fixed for all recipients, pulled from their contact profile, or unique per-row from a CSV file.
      </p>

      {/* Per-variable rows */}
      <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
        {vars.map((v, i) => {
          const entry = varMap[v] || { type: 'static', value: '' }
          return (
            <motion.div
              key={v}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.04 }}
              className="p-3.5 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                <code className="text-xs font-mono bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-700">
                  {`{{${v}}}`}
                </code>
                <div className="flex gap-0.5 bg-white border border-gray-200 rounded-lg p-0.5">
                  {[['static', 'Fixed'], ['field', 'Contact field'], ['csv', 'CSV column']].map(([t, label]) => (
                    <button
                      key={t}
                      onClick={() => setVar(v, { type: t, value: '', field: '', column: '' })}
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-colors duration-100 ${
                        entry.type === t
                          ? 'bg-green-100 text-green-800 shadow-sm border border-green-200'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {entry.type === 'static' && (
                <input
                  type="text"
                  placeholder={`Enter a fixed value for all recipients`}
                  value={entry.value || ''}
                  onChange={(e) => setVar(v, { ...entry, value: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}

              {entry.type === 'field' && (
                <div className="relative">
                  <select
                    value={entry.field || ''}
                    onChange={(e) => setVar(v, { ...entry, field: e.target.value })}
                    className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select contact field…</option>
                    {CONTACT_FIELDS.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}

              {entry.type === 'csv' && (
                <div className="relative">
                  <select
                    value={entry.column || ''}
                    onChange={(e) => setVar(v, { ...entry, column: e.target.value })}
                    disabled={!data.csvData}
                    className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{data.csvData ? 'Select CSV column…' : 'Upload CSV first ↓'}</option>
                    {(data.csvData?.headers || []).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* CSV uploader — appears when any variable uses CSV mode */}
      <AnimatePresence>
        {needsCSV && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className={`rounded-xl border-2 border-dashed transition-colors duration-200 ${data.csvData ? 'border-green-300 bg-green-50' : 'border-blue-200 bg-blue-50/60'}`}>
              {data.csvData ? (
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{data.csvData.fileName}</p>
                        <p className="text-xs text-gray-500">{data.csvData.rows.length.toLocaleString()} rows · Columns: <span className="font-mono">{data.csvData.headers.join(', ')}</span></p>
                      </div>
                    </div>
                    <button onClick={removeCSV} className="text-xs text-red-500 hover:text-red-700 shrink-0 mt-0.5 transition-colors">
                      Remove
                    </button>
                  </div>
                  {/* Preview table */}
                  <div className="overflow-x-auto rounded-lg border border-green-200">
                    <table className="text-xs w-full bg-white">
                      <thead>
                        <tr>
                          {data.csvData.headers.map((h) => (
                            <th key={h} className="px-2.5 py-1.5 bg-green-100 text-left text-green-800 font-semibold border-r border-green-200 last:border-r-0 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.csvData.rows.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            {data.csvData.headers.map((h) => (
                              <td key={h} className="px-2.5 py-1.5 text-gray-600 border-r border-gray-100 last:border-r-0 whitespace-nowrap">
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.csvData.rows.length > 3 && (
                      <p className="text-xs text-gray-400 px-2.5 py-1.5 border-t border-gray-100 bg-white">
                        +{(data.csvData.rows.length - 3).toLocaleString()} more rows
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <label htmlFor="csv-var-upload" className="cursor-pointer flex flex-col items-center gap-2 py-6 px-4">
                  <Upload size={20} className="text-blue-400" />
                  <p className="text-sm font-semibold text-blue-700">Upload CSV file</p>
                  <p className="text-xs text-gray-400 text-center">
                    Include a <code className="bg-white border border-gray-200 px-1 rounded">phone</code> column + one column per CSV-mapped variable.<br />
                    Each row = one recipient with their personalised values.
                  </p>
                </label>
              )}
              <input type="file" accept=".csv,.txt" id="csv-var-upload" className="hidden" onChange={handleCSVUpload} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live preview */}
      <div className="p-3.5 bg-white rounded-xl border border-gray-100">
        <p className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
          <Eye size={11} /> Preview · {csvSampleRow ? 'row 1 of CSV' : 'sample contact'}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{preview}</p>
      </div>

      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <StepBtn onClick={onNext} disabled={!canContinue}>Continue <ChevronRight size={15} /></StepBtn>
      </div>
    </div>
  )
}

/* ─── Step 4: Audience ──────────────────────────────────── */

function StepAudience({ data, onChange, onNext, onBack }) {
  const csvSeg = data.csvData
    ? { id: 'csv', label: `CSV · ${data.csvData.fileName}`, count: data.csvData.rows.length }
    : null

  const selectSeg = (seg) => onChange({ ...data, segment: seg })

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select who receives this campaign</p>

      {/* CSV audience option — shown when CSV was uploaded in Personalise step */}
      {csvSeg && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">From your uploaded CSV</p>
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => selectSeg(csvSeg)}
            className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors duration-150 ${
              data.segment?.id === 'csv'
                ? 'border-green-500 bg-green-50'
                : 'border-blue-200 bg-blue-50/60 hover:border-blue-300'
            }`}
            style={{ transition: 'border-color 150ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <div className="flex items-center gap-2.5">
              <FileText size={14} className={data.segment?.id === 'csv' ? 'text-green-600' : 'text-blue-500'} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{data.csvData.fileName}</p>
                <p className="text-xs text-gray-400">Contacts defined by your uploaded CSV file</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">{csvSeg.count.toLocaleString()} contacts</span>
              {data.segment?.id === 'csv' && <CheckCircle2 size={14} className="text-green-600" />}
            </div>
          </motion.button>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-1.5">Or choose a contact segment</p>
        </motion.div>
      )}

      {/* Regular segments */}
      <div className="space-y-2">
        {SEGMENTS.map((seg, i) => (
          <motion.button
            key={seg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT, delay: (csvSeg ? 0.06 : 0) + i * 0.04 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => selectSeg(seg)}
            className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors duration-150 ${
              data.segment?.id === seg.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
            style={{ transition: 'border-color 150ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <div className="flex items-center gap-2.5">
              <Users size={13} className={data.segment?.id === seg.id ? 'text-green-600' : 'text-gray-400'} />
              <span className="text-sm font-medium text-gray-900">{seg.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{seg.count.toLocaleString()} contacts</span>
              {data.segment?.id === seg.id && <CheckCircle2 size={14} className="text-green-600" />}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <StepBtn onClick={onNext} disabled={!data.segment}>Continue <ChevronRight size={15} /></StepBtn>
      </div>
    </div>
  )
}

/* ─── Step 4: Schedule ──────────────────────────────────── */

function StepSchedule({ data, onChange, onNext, onBack }) {
  const [type, setType]       = useState(data.scheduleType || 'immediate')
  const [datetime, setDatetime] = useState(data.datetime || '')
  const [recurring, setRecurring] = useState(data.recurring || false)
  const [freq, setFreq]       = useState(data.freq || 'weekly')
  const [tz, setTz]           = useState(data.tz || TIMEZONES[0])

  const valid = type === 'immediate' || (type === 'specific' && datetime)

  const save = () => {
    onChange({ ...data, scheduleType: type, datetime, recurring, freq, tz })
    onNext()
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Choose when to send your campaign</p>

      {/* Schedule type */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'immediate', label: 'Immediate',       icon: Send,     desc: 'Send right away after approval' },
          { key: 'specific',  label: 'Specific Date',   icon: Calendar, desc: 'Set exact date and time' },
        ].map(({ key, label, icon: Icon, desc }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setType(key)}
            className={`p-4 rounded-xl border-2 text-left transition-colors duration-150 ${
              type === key ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
            style={{ transition: 'border-color 150ms ease, background-color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Icon size={15} className={type === key ? 'text-green-600' : 'text-gray-400'} />
            <p className="text-sm font-semibold text-gray-900 mt-1">{label}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Datetime picker */}
      <AnimatePresence>
        {type === 'specific' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timezone */}
      <div>
        <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1.5">
          <Globe size={11} /> Time Zone
        </label>
        <select
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Recurring */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat size={14} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Recurring Campaign</p>
              <p className="text-xs text-gray-400">Repeat this campaign automatically</p>
            </div>
          </div>
          <button
            onClick={() => setRecurring((r) => !r)}
            className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${recurring ? 'bg-green-500' : 'bg-gray-200'}`}
            style={{ width: 40, height: 22 }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: recurring ? 'translateX(18px)' : 'translateX(0)' }}
            />
          </button>
        </div>
        <AnimatePresence>
          {recurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFreq(f)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium capitalize transition-colors duration-100 ${
                      freq === f ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <StepBtn onClick={save} disabled={!valid}>Continue <ChevronRight size={15} /></StepBtn>
      </div>
    </div>
  )
}

/* ─── Step 5: Review ────────────────────────────────────── */

function StepReview({ data, onBack, onDraft, onApproval, onLaunch }) {
  const obj = OBJECTIVES.find((o) => o.key === data.objective)
  const csvRow = data.csvData?.rows?.[0] || null
  const hasCSV = !!data.csvData

  const rows = [
    { label: 'Campaign Name', value: data.name },
    { label: 'Objective',     value: obj?.label },
    { label: 'Template',      value: data.template?.name },
    hasCSV
      ? { label: 'Variable Data', value: `${data.csvData.fileName} · ${data.csvData.rows.length.toLocaleString()} contacts` }
      : null,
    { label: 'Audience',      value: `${data.segment?.label} (${data.segment?.count?.toLocaleString()} contacts)` },
    { label: 'Schedule',      value: data.scheduleType === 'immediate' ? 'Send immediately' : data.datetime },
    { label: 'Time Zone',     value: data.tz?.split(' ')[0] },
    { label: 'Recurring',     value: data.recurring ? `Yes · ${data.freq}` : 'No' },
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Review everything before launching your campaign</p>

      <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
        {rows.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.16, ease: EASE_OUT, delay: i * 0.035 }}
            className={`flex justify-between px-4 py-3 text-sm ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <span className="text-gray-400">{label}</span>
            <span className={`font-medium text-right max-w-[55%] truncate ${label === 'Variable Data' ? 'text-blue-700' : 'text-gray-900'}`}>{value}</span>
          </motion.div>
        ))}
      </div>

      {data.template && (
        <div className="p-3.5 bg-white rounded-xl border border-gray-100">
          <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
            <Eye size={11} /> Message preview · {csvRow ? 'row 1 of CSV' : 'sample contact'}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {resolveBody(data.template.body, data.variableMap, SAMPLE_CONTACT, csvRow)}
          </p>
        </div>
      )}

      <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex gap-2">
        <AlertCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">Make sure your template is <strong>Meta approved</strong> before launching. Campaigns use pre-approved templates — no separate campaign approval is required.</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <StepBtn onClick={onBack} variant="secondary"><ChevronLeft size={15} /> Back</StepBtn>
        <div className="flex gap-2">
          <StepBtn onClick={onDraft} variant="secondary"><Save size={14} /> Save Draft</StepBtn>
          <StepBtn onClick={onApproval} variant="secondary"><FileText size={14} /> Request Team Review</StepBtn>
          <StepBtn onClick={onLaunch}>
            <Send size={14} />
            {data.scheduleType === 'specific' ? 'Schedule Campaign' : 'Launch Now'}
          </StepBtn>
        </div>
      </div>
    </div>
  )
}

/* ─── Status badge ──────────────────────────────────────── */

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.Draft
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${m.bg} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${m.pulse ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  )
}

/* ─── Campaign actions menu ─────────────────────────────── */

function CampaignActions({ campaign, onAction }) {
  const [open, setOpen] = useState(false)
  const actions = []

  if (campaign.status === 'Running')   actions.push({ key: 'pause',  label: 'Pause',   icon: Pause })
  if (campaign.status === 'Paused')    actions.push({ key: 'resume', label: 'Resume',  icon: Play })
  if (['Scheduled', 'Paused', 'Running'].includes(campaign.status))
    actions.push({ key: 'cancel', label: 'Cancel', icon: XCircle, danger: true })
  if (campaign.status === 'Draft')
    actions.push({ key: 'launch', label: 'Launch', icon: Send })

  if (!actions.length) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px]"
            >
              {actions.map(({ key, label, icon: Icon, danger }) => (
                <button
                  key={key}
                  onClick={() => { onAction(campaign.id, key); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${danger ? 'text-red-600' : 'text-gray-700'}`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────── */

const WIZARD_STEPS = ['Details', 'Template', 'Personalise', 'Audience', 'Schedule', 'Review']

export default function Campaigns() {
  const [composing, setComposing] = useState(false)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [formData, setFormData] = useState({})
  const [campaigns, setCampaigns] = useState(CAMPAIGNS)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('All')

  const goNext = () => { setDir(1); setStep((s) => s + 1) }
  const goBack = () => { setDir(-1); setStep((s) => s - 1) }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const close = () => { setComposing(false); setStep(0); setDir(1); setFormData({}) }

  const handleDraft   = () => { showToast(`"${formData.name}" saved as draft.`); close() }
  const handleApproval = () => { showToast(`"${formData.name}" submitted for approval.`, 'info'); close() }
  const handleLaunch  = () => {
    const segLabel = formData.segment?.id === 'csv'
      ? `CSV (${formData.csvData?.rows?.length?.toLocaleString()} contacts)`
      : formData.segment?.label
    const newC = {
      id: Date.now(), name: formData.name, objective: formData.objective,
      template: formData.template?.name, segment: segLabel,
      schedule: formData.scheduleType === 'immediate' ? 'Running now' : formData.datetime,
      timezone: 'IST',
      status: formData.scheduleType === 'immediate' ? 'Running' : 'Scheduled',
      sent: 0, delivered: 0, read: 0,
    }
    setCampaigns((prev) => [newC, ...prev])
    showToast(`"${formData.name}" ${formData.scheduleType === 'immediate' ? 'launched!' : 'scheduled!'}`)
    close()
  }

  const handleAction = (id, action) => {
    setCampaigns((prev) => prev.map((c) => {
      if (c.id !== id) return c
      if (action === 'pause')  return { ...c, status: 'Paused' }
      if (action === 'resume') return { ...c, status: 'Running' }
      if (action === 'cancel') return { ...c, status: 'Cancelled' }
      if (action === 'launch') return { ...c, status: 'Running' }
      return c
    }))
    const labels = { pause: 'paused', resume: 'resumed', cancel: 'cancelled', launch: 'launched' }
    showToast(`Campaign ${labels[action]}.`)
  }

  const FILTERS = ['All', 'Running', 'Scheduled', 'Draft', 'Paused', 'Completed']
  const filtered = filter === 'All' ? campaigns : campaigns.filter((c) => c.status === filter)

  const stepContent = [
    <StepDetails   data={formData} onChange={setFormData} onNext={goNext} />,
    <StepTemplate  data={formData} onChange={setFormData} onNext={goNext} onBack={goBack} />,
    <StepVariables data={formData} onChange={setFormData} onNext={goNext} onBack={goBack} />,
    <StepAudience  data={formData} onChange={setFormData} onNext={goNext} onBack={goBack} />,
    <StepSchedule  data={formData} onChange={setFormData} onNext={goNext} onBack={goBack} />,
    <StepReview    data={formData} onBack={goBack} onDraft={handleDraft} onApproval={handleApproval} onLaunch={handleLaunch} />,
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Campaigns" description="Create, schedule, and manage your WhatsApp campaigns" />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setComposing(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-medium rounded-lg shrink-0"
          style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
        >
          <Plus size={15} /> New Campaign
        </motion.button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className={`flex items-center gap-3 p-4 rounded-xl border ${
              toast.type === 'info'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <CheckCircle2 size={16} className={toast.type === 'info' ? 'text-blue-600' : 'text-green-600'} />
            <p className={`text-sm font-medium ${toast.type === 'info' ? 'text-blue-800' : 'text-green-800'}`}>{toast.msg}</p>
            <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wizard */}
      <AnimatePresence>
        {composing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Header */}
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
                      style={{
                        backgroundColor: i <= step ? '#16a34a' : '#f3f4f6',
                        color: i <= step ? '#fff' : '#9ca3af',
                      }}
                    >
                      {i < step ? <Check size={11} /> : i + 1}
                    </div>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div
                        className="h-px flex-1 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i < step ? '#16a34a' : '#e5e7eb' }}
                      />
                    )}
                  </div>
                ))}
                <span className="ml-2 text-xs text-gray-400 shrink-0">{WIZARD_STEPS[step]}</span>
              </div>
            </div>

            {/* Content */}
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

      {/* Campaign list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">Campaign History</p>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap ${
                  filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-4 py-3">Objective</th>
                <th className="text-left px-4 py-3">Template</th>
                <th className="text-left px-4 py-3">Segment</th>
                <th className="text-left px-4 py-3">Schedule</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Sent</th>
                <th className="text-right px-4 py-3">Delivered</th>
                <th className="text-right px-4 py-3">Read</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-100"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${OBJ_BADGE[c.objective]}`}>
                        {OBJ_LABEL[c.objective]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{c.template}</td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{c.segment}</td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap flex items-center gap-1">
                      <Clock size={11} /> {c.schedule}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3.5 text-right text-gray-700">{c.sent ? c.sent.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3.5 text-right text-gray-700">{c.delivered ? c.delivered.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3.5 text-right text-gray-700">{c.read ? c.read.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3.5">
                      <CampaignActions campaign={c} onAction={handleAction} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-sm text-gray-400">
                    No {filter.toLowerCase()} campaigns
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
