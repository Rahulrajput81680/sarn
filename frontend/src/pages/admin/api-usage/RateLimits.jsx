import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gauge, Save, Check, AlertTriangle, X,
  ChevronDown, ChevronUp, Settings, Bell, Zap,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Data ───────────────────────────────────────────────── */

const INITIAL_CLIENTS = [
  { id: 1, company: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500', plan: 'Enterprise',
    limits: { msgPerMin: 500, apiPerHour: 50000, webhookPerMin: 200 },
    current: { msgPerMin: 312, apiPerHour: 28400, webhookPerMin: 94 } },
  { id: 2, company: 'TechStart',         avatar: 'TS', color: 'bg-indigo-500', plan: 'Enterprise',
    limits: { msgPerMin: 500, apiPerHour: 50000, webhookPerMin: 200 },
    current: { msgPerMin: 448, apiPerHour: 43200, webhookPerMin: 178 } },
  { id: 3, company: 'MediCare Plus',     avatar: 'MP', color: 'bg-red-500',    plan: 'Enterprise',
    limits: { msgPerMin: 500, apiPerHour: 50000, webhookPerMin: 200 },
    current: { msgPerMin: 190, apiPerHour: 21000, webhookPerMin: 82 } },
  { id: 4, company: 'StyleHub',          avatar: 'SH', color: 'bg-pink-500',   plan: 'Growth',
    limits: { msgPerMin: 200, apiPerHour: 20000, webhookPerMin: 80 },
    current: { msgPerMin: 88,  apiPerHour: 8800,  webhookPerMin: 31 } },
  { id: 5, company: 'RapidDeliver',      avatar: 'RD', color: 'bg-cyan-500',   plan: 'Growth',
    limits: { msgPerMin: 200, apiPerHour: 20000, webhookPerMin: 80 },
    current: { msgPerMin: 199, apiPerHour: 19800, webhookPerMin: 79 } },
  { id: 6, company: 'CloudBazaar',       avatar: 'CB', color: 'bg-sky-500',    plan: 'Growth',
    limits: { msgPerMin: 200, apiPerHour: 20000, webhookPerMin: 80 },
    current: { msgPerMin: 71,  apiPerHour: 9200,  webhookPerMin: 28 } },
  { id: 7, company: 'FoodZone',          avatar: 'FZ', color: 'bg-orange-500', plan: 'Starter',
    limits: { msgPerMin: 60,  apiPerHour: 5000,  webhookPerMin: 30 },
    current: { msgPerMin: 58,  apiPerHour: 4920,  webhookPerMin: 29 } },
  { id: 8, company: 'QuickMart',         avatar: 'QM', color: 'bg-blue-500',   plan: 'Growth',
    limits: { msgPerMin: 200, apiPerHour: 20000, webhookPerMin: 80 },
    current: { msgPerMin: 42,  apiPerHour: 3800,  webhookPerMin: 12 } },
]

const THROTTLE_EVENTS = [
  { id: 1, company: 'RapidDeliver', type: '429 Too Many Requests', limit: 'msgPerMin',   hit: '199/200',  time: '12 min ago',   resolved: false },
  { id: 2, company: 'FoodZone',     type: '429 Too Many Requests', limit: 'apiPerHour',  hit: '4920/5000',time: '28 min ago',   resolved: false },
  { id: 3, company: 'TechStart',    type: '429 Too Many Requests', limit: 'msgPerMin',   hit: '500/500',  time: '1h 4 min ago', resolved: true  },
  { id: 4, company: 'FoodZone',     type: '429 Too Many Requests', limit: 'webhookPerMin', hit: '30/30',  time: '2h 18 min ago', resolved: true },
]

const LIMIT_DEFAULTS = {
  Enterprise: { msgPerMin: 500, apiPerHour: 50000, webhookPerMin: 200 },
  Growth:     { msgPerMin: 200, apiPerHour: 20000, webhookPerMin: 80  },
  Starter:    { msgPerMin: 60,  apiPerHour: 5000,  webhookPerMin: 30  },
}

function pct(current, limit) { return Math.min(100, Math.round((current / limit) * 100)) }

function gaugeColor(p) {
  if (p >= 90) return { bar: 'bg-red-500',   text: 'text-red-600',   bg: 'bg-red-50',   badge: 'red' }
  if (p >= 70) return { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', badge: 'yellow' }
  return              { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', badge: 'green' }
}

const planColor = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }

const LIMIT_LABELS = {
  msgPerMin:     'Msgs / min',
  apiPerHour:    'API calls / hr',
  webhookPerMin: 'Webhooks / min',
}

/* ─── Gauge bar ──────────────────────────────────────────── */

function GaugeBar({ label, current, limit }) {
  const p = pct(current, limit)
  const { bar, text } = gaugeColor(p)
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-xs font-bold ${text}`}>{current.toLocaleString()} / {limit.toLocaleString()} ({p}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.65, ease: EASE_OUT }}
          className={`h-full rounded-full ${bar}`}
        />
      </div>
    </div>
  )
}

/* ─── Edit limit modal ───────────────────────────────────── */

function EditModal({ client, onSave, onClose }) {
  const [form, setForm] = useState({ ...client.limits })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const defaults = LIMIT_DEFAULTS[client.plan]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${client.color} flex items-center justify-center`}>
              <span className="text-white text-xs font-bold">{client.avatar}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{client.company}</p>
              <Badge color={planColor[client.plan]}>{client.plan}</Badge>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Rate Limits</p>

        <div className="space-y-4 mb-5">
          {Object.keys(form).map((k) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{LIMIT_LABELS[k]}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form[k]}
                  onChange={(e) => set(k, +e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
                />
                <button
                  onClick={() => set(k, defaults[k])}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  Reset ({defaults[k]})
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-semibold transition-all"
          >
            <Save size={14} /> Save Limits
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function RateLimits() {
  const [clients, setClients] = useState(INITIAL_CLIENTS)
  const [editing, setEditing] = useState(null)
  const [sortBy, setSortBy]   = useState('utilization')
  const [saved, setSaved]     = useState(null)

  const handleSave = (newLimits) => {
    setClients((prev) => prev.map((c) => c.id === editing.id ? { ...c, limits: newLimits } : c))
    setSaved(editing.id)
    setTimeout(() => setSaved(null), 2000)
    setEditing(null)
  }

  const sorted = [...clients].sort((a, b) => {
    if (sortBy === 'utilization') {
      const au = pct(a.current.msgPerMin, a.limits.msgPerMin)
      const bu = pct(b.current.msgPerMin, b.limits.msgPerMin)
      return bu - au
    }
    return a.company.localeCompare(b.company)
  })

  const nearLimit  = clients.filter((c) => pct(c.current.msgPerMin, c.limits.msgPerMin) >= 85).length
  const atLimit    = clients.filter((c) => pct(c.current.msgPerMin, c.limits.msgPerMin) >= 99).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rate Limit Monitoring"
        description="Live API throughput vs. configured limits per client"
        breadcrumbs={['Admin', 'API Usage', 'Rate Limits']}
      />

      {/* Alert banners */}
      {nearLimit > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Bell size={14} className="text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            <span className="font-bold">{nearLimit} client{nearLimit > 1 ? 's' : ''}</span> approaching rate limits (≥ 85% usage).
            {atLimit > 0 && <span className="text-red-600 font-bold"> {atLimit} at 100% — actively throttled.</span>}
          </p>
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sort by:</span>
        {[
          { key: 'utilization', label: 'Highest utilization' },
          { key: 'name',        label: 'Client name' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all ${sortBy === key ? 'border-green-400 bg-green-50 text-green-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Client cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map((client, i) => {
          const maxPct  = Math.max(
            pct(client.current.msgPerMin,     client.limits.msgPerMin),
            pct(client.current.apiPerHour,    client.limits.apiPerHour),
            pct(client.current.webhookPerMin, client.limits.webhookPerMin),
          )
          const { badge, bg } = gaugeColor(maxPct)

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: EASE_OUT, delay: i * 0.04 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${client.color} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{client.avatar}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{client.company}</p>
                      {saved === client.id && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-green-600 font-medium flex items-center gap-0.5"
                        >
                          <Check size={11} /> Saved
                        </motion.span>
                      )}
                    </div>
                    <Badge color={planColor[client.plan]}>{client.plan}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={badge}>{maxPct}% peak</Badge>
                  <button
                    onClick={() => setEditing(client)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Settings size={13} />
                  </button>
                </div>
              </div>

              <div className={`rounded-xl p-3 ${bg} mb-0`}>
                <GaugeBar label={LIMIT_LABELS.msgPerMin}     current={client.current.msgPerMin}     limit={client.limits.msgPerMin} />
                <GaugeBar label={LIMIT_LABELS.apiPerHour}    current={client.current.apiPerHour}    limit={client.limits.apiPerHour} />
                <GaugeBar label={LIMIT_LABELS.webhookPerMin} current={client.current.webhookPerMin} limit={client.limits.webhookPerMin} />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Throttle event log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Zap size={15} className="text-amber-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Recent Throttle Events</p>
        </div>
        <div className="divide-y divide-gray-50">
          {THROTTLE_EVENTS.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.14, ease: EASE_OUT, delay: i * 0.04 }}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${ev.resolved ? 'bg-gray-300' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{ev.company}</p>
                  <p className="text-xs text-gray-400">{ev.type} · {LIMIT_LABELS[ev.limit]} · {ev.hit}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{ev.time}</span>
                <Badge color={ev.resolved ? 'gray' : 'red'}>{ev.resolved ? 'Resolved' : 'Active'}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && <EditModal client={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      </AnimatePresence>
    </div>
  )
}
