import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Webhook, AlertTriangle, TrendingDown,
  ChevronDown, ChevronUp, ShieldAlert, MessageSquare,
  BarChart2, ArrowUpRight, ArrowDownRight, Eye,
  CheckCircle2, XCircle, Clock, Filter, Search,
} from 'lucide-react'
import LineChart from '../../../components/charts/LineChart'
import BarChart from '../../../components/charts/BarChart'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Chart data ─────────────────────────────────────────── */

const msgVolumeData = Array.from({ length: 30 }, (_, i) => ({
  name: `D${i + 1}`,
  messages: Math.floor(82000 + i * 400 + Math.random() * 6000),
  errors:   Math.floor(80 + Math.random() * 220),
}))

const webhookData = Array.from({ length: 14 }, (_, i) => ({
  name: `D${i + 1}`,
  received: Math.floor(4000 + Math.random() * 3000),
  failed:   Math.floor(Math.random() * 120),
}))

/* ─── Per-client consumption ─────────────────────────────── */

const CLIENT_USAGE = [
  { id: 1, company: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500', plan: 'Enterprise', apiCalls: 412300, msgSent: 213000, webhooks: 18400, failed: 12,  errorRate: 0.003, abuse: false },
  { id: 2, company: 'TechStart',         avatar: 'TS', color: 'bg-indigo-500', plan: 'Enterprise', apiCalls: 389100, msgSent: 198400, webhooks: 14200, failed: 8,   errorRate: 0.002, abuse: false },
  { id: 3, company: 'MediCare Plus',     avatar: 'MP', color: 'bg-red-500',    plan: 'Enterprise', apiCalls: 212800, msgSent: 98400,  webhooks: 8900,  failed: 34,  errorRate: 0.016, abuse: false },
  { id: 4, company: 'StyleHub',          avatar: 'SH', color: 'bg-pink-500',   plan: 'Growth',     apiCalls: 148200, msgSent: 87200,  webhooks: 4100,  failed: 56,  errorRate: 0.038, abuse: false },
  { id: 5, company: 'RapidDeliver',      avatar: 'RD', color: 'bg-cyan-500',   plan: 'Growth',     apiCalls: 119400, msgSent: 56000,  webhooks: 3200,  failed: 89,  errorRate: 0.075, abuse: true  },
  { id: 6, company: 'CloudBazaar',       avatar: 'CB', color: 'bg-sky-500',    plan: 'Growth',     apiCalls: 98200,  msgSent: 44300,  webhooks: 2800,  failed: 41,  errorRate: 0.042, abuse: false },
  { id: 7, company: 'FoodZone',          avatar: 'FZ', color: 'bg-orange-500', plan: 'Starter',    apiCalls: 42100,  msgSent: 18500,  webhooks: 1100,  failed: 182, errorRate: 0.432, abuse: true  },
  { id: 8, company: 'QuickMart',         avatar: 'QM', color: 'bg-blue-500',   plan: 'Growth',     apiCalls: 38400,  msgSent: 32100,  webhooks: 890,   failed: 12,  errorRate: 0.031, abuse: false },
]

const MAX_API = Math.max(...CLIENT_USAGE.map((c) => c.apiCalls))

/* ─── Abuse signals ──────────────────────────────────────── */

const ABUSE_FLAGS = [
  { id: 1, company: 'RapidDeliver', avatar: 'RD', color: 'bg-cyan-500',   reason: 'Spike: 3.2× normal API rate in last 2h',                  severity: 'medium', time: '14 min ago' },
  { id: 2, company: 'FoodZone',     avatar: 'FZ', color: 'bg-orange-500', reason: 'High error rate 43.2% — possible invalid number flooding', severity: 'high',   time: '1h 22 min ago' },
  { id: 3, company: 'EduBridge',    avatar: 'EB', color: 'bg-teal-500',   reason: 'Repeated 429 responses — rate limit hit 14 times today',   severity: 'low',    time: '3h ago' },
]

const severityColor = { high: 'red', medium: 'yellow', low: 'gray' }
const severityBg    = {
  high:   'bg-red-50 border-red-200',
  medium: 'bg-amber-50 border-amber-200',
  low:    'bg-gray-50 border-gray-200',
}

function fmtN(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

/* ─── KPI card ───────────────────────────────────────────── */

function KPI({ title, value, sub, delta, positive, icon: Icon, bg, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {delta && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Per-client consumption table ──────────────────────── */

function ClientConsumption({ filter }) {
  const [sortKey, setSortKey]   = useState('apiCalls')
  const [sortDir, setSortDir]   = useState('desc')
  const [search, setSearch]     = useState('')
  const [expanded, setExpanded] = useState(null)

  const toggle = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const clients = CLIENT_USAGE
    .filter((c) => {
      if (filter === 'abuse') return c.abuse
      const q = search.toLowerCase()
      return !q || c.company.toLowerCase().includes(q)
    })
    .sort((a, b) => sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey])

  const SortBtn = ({ k, label }) => (
    <button onClick={() => toggle(k)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
      {label}
      {sortKey === k ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-30" />}
    </button>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">Per-client API Consumption</p>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client…"
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400 w-44"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Client</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-right"><SortBtn k="apiCalls" label="API Calls" /></th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-right"><SortBtn k="msgSent"  label="Msgs Sent" /></th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-right"><SortBtn k="webhooks" label="Webhooks" /></th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-right"><SortBtn k="failed"   label="Failed" /></th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-right"><SortBtn k="errorRate" label="Error %" /></th>
              <th className="px-4 py-3 w-48 text-xs font-semibold text-gray-400">Share</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clients.map((c, i) => {
              const errPct   = (c.errorRate * 100).toFixed(2)
              const errColor = c.errorRate > 0.2 ? 'text-red-600 font-bold' : c.errorRate > 0.05 ? 'text-amber-600 font-semibold' : 'text-gray-600'
              const barW     = Math.round((c.apiCalls / MAX_API) * 100)
              const barColor = c.abuse ? 'bg-red-400' : barW > 70 ? 'bg-blue-500' : 'bg-green-500'
              return (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.13, ease: EASE_OUT, delay: i * 0.03 }}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-xs font-bold">{c.avatar}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900">{c.company}</p>
                          {c.abuse && <ShieldAlert size={13} className="text-red-500" />}
                        </div>
                        <p className="text-xs text-gray-400">{c.plan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">{fmtN(c.apiCalls)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{fmtN(c.msgSent)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{fmtN(c.webhooks)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">{c.failed}</td>
                  <td className={`px-4 py-3 text-right text-sm ${errColor}`}>{errPct}%</td>
                  <td className="px-4 py-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barW}%` }}
                        transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.04 }}
                        className={`h-full rounded-full ${barColor}`}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 text-right">{barW}% of peak</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Eye size={13} />
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Abuse detection panel ──────────────────────────────── */

function AbuseDetection() {
  const [dismissed, setDismissed] = useState([])
  const active = ABUSE_FLAGS.filter((f) => !dismissed.includes(f.id))

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
            <ShieldAlert size={15} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Abuse Detection</p>
            <p className="text-xs text-gray-400">Unusual patterns flagged automatically</p>
          </div>
        </div>
        {active.length > 0 && (
          <span className="text-xs font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
            {active.length} alert{active.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        <AnimatePresence>
          {active.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-300">
              <CheckCircle2 size={28} className="mb-2 text-green-300" />
              <p className="text-sm text-gray-400">No abuse signals detected</p>
            </div>
          ) : (
            active.map((flag, i) => (
              <motion.div
                key={flag.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.04 }}
                className={`flex items-start gap-3 px-5 py-4 border-l-4 ${flag.severity === 'high' ? 'border-l-red-500' : flag.severity === 'medium' ? 'border-l-amber-400' : 'border-l-gray-300'}`}
              >
                <div className={`w-8 h-8 rounded-xl ${flag.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className="text-white text-xs font-bold">{flag.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{flag.company}</p>
                    <Badge color={severityColor[flag.severity]}>{flag.severity}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">{flag.reason}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock size={10} className="text-gray-400" />
                    <span className="text-xs text-gray-400">{flag.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button className="text-xs font-medium text-red-500 hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors">
                    Throttle
                  </button>
                  <button
                    onClick={() => setDismissed((d) => [...d, flag.id])}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function APIMonitor() {
  const [view, setView] = useState('all')

  const totalApiCalls  = CLIENT_USAGE.reduce((s, c) => s + c.apiCalls, 0)
  const totalMsgs      = CLIENT_USAGE.reduce((s, c) => s + c.msgSent, 0)
  const totalWebhooks  = CLIENT_USAGE.reduce((s, c) => s + c.webhooks, 0)
  const totalFailed    = CLIENT_USAGE.reduce((s, c) => s + c.failed, 0)
  const avgErrRate     = ((totalFailed / totalApiCalls) * 100).toFixed(3)

  return (
    <div className="space-y-5">
      <PageHeader
        title="API Usage Monitoring"
        description="Per-client consumption, send volume, webhook events, failures and abuse signals"
        breadcrumbs={['Admin', 'API Usage', 'Monitor']}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI index={0} title="Total API Calls" value={fmtN(totalApiCalls)} sub="this month" delta="+8.4% vs last month" positive icon={Activity} bg="bg-blue-50 text-blue-600" />
        <KPI index={1} title="Message Send Volume" value={fmtN(totalMsgs)} sub="messages sent" delta="+11.2% vs last month" positive icon={MessageSquare} bg="bg-green-50 text-green-600" />
        <KPI index={2} title="Webhook Event Count" value={fmtN(totalWebhooks)} sub="events received" delta="+6.1% vs last month" positive icon={Webhook} bg="bg-purple-50 text-purple-600" />
        <KPI index={3} title="Failed API Calls" value={totalFailed.toLocaleString()} sub={`avg error rate ${avgErrRate}%`} delta="-3.2% vs last month" positive icon={AlertTriangle} bg="bg-red-50 text-red-500" />
      </div>

      {/* Usage trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChart
          data={msgVolumeData}
          lines={[
            { key: 'messages', color: '#16a34a', label: 'Messages Sent' },
            { key: 'errors',   color: '#ef4444', label: 'Failed Calls' },
          ]}
          title="Message Send Volume & Failed Calls — Last 30 Days"
        />
        <BarChart
          data={webhookData}
          bars={[
            { key: 'received', color: '#8b5cf6', label: 'Received' },
            { key: 'failed',   color: '#f87171', label: 'Failed' },
          ]}
          title="Webhook Event Count — Last 14 Days"
        />
      </div>

      {/* Abuse detection */}
      <AbuseDetection />

      {/* Per-client table */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {[
            { key: 'all',   label: 'All Clients' },
            { key: 'abuse', label: '⚠ Flagged only' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border-2 transition-all ${view === key ? 'border-green-400 bg-green-50 text-green-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <ClientConsumption filter={view} />
      </div>
    </div>
  )
}
