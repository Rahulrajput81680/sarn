import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, Bell, Flame, FileWarning, TrendingUp,
  CheckCircle2, XCircle, AlertTriangle, AlertCircle,
  ChevronUp, ChevronDown, Send, RefreshCw, ExternalLink,
  ArrowUpRight, Clock, X,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'
import BarChart from '../../../components/charts/BarChart'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Shared client data ──────────────────────────────────── */
const CLIENTS = [
  { name: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500', wabaId: 'WABA-FC-7841' },
  { name: 'TechStart',         avatar: 'TS', color: 'bg-indigo-500', wabaId: 'WABA-TS-2291' },
  { name: 'StyleHub',          avatar: 'SH', color: 'bg-pink-500',   wabaId: 'WABA-SH-9023' },
  { name: 'FoodZone',          avatar: 'FZ', color: 'bg-orange-500', wabaId: 'WABA-FZ-4401' },
  { name: 'QuickMart',         avatar: 'QM', color: 'bg-blue-500',   wabaId: 'WABA-QM-3312' },
  { name: 'MediCare Plus',     avatar: 'MP', color: 'bg-red-500',    wabaId: 'WABA-MP-5520' },
  { name: 'RapidDeliver',      avatar: 'RD', color: 'bg-cyan-500',   wabaId: 'WABA-RD-8834' },
  { name: 'CloudBazaar',       avatar: 'CB', color: 'bg-sky-500',    wabaId: 'WABA-CB-1190' },
]

function ClientChip({ c }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-lg ${c.color} flex items-center justify-center shrink-0`}>
        <span className="text-white text-[10px] font-bold">{c.avatar}</span>
      </div>
      <span className="text-xs font-medium text-gray-800 whitespace-nowrap">{c.name}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — OPT-IN COMPLIANCE REMINDERS
══════════════════════════════════════════════════════════════ */
const OPT_IN_DATA = [
  { cIdx: 0, method: 'Double Opt-in',    optInRate: 94, lastChecked: 'Jun 14', status: 'compliant',     reminderSent: null          },
  { cIdx: 1, method: 'Checkbox + Link',  optInRate: 87, lastChecked: 'Jun 14', status: 'compliant',     reminderSent: null          },
  { cIdx: 2, method: 'None configured',  optInRate: 12, lastChecked: 'Jun 13', status: 'non_compliant', reminderSent: 'Jun 10'      },
  { cIdx: 3, method: 'Single Opt-in',    optInRate: 61, lastChecked: 'Jun 13', status: 'partial',       reminderSent: 'Jun 12'      },
  { cIdx: 4, method: 'Double Opt-in',    optInRate: 91, lastChecked: 'Jun 14', status: 'compliant',     reminderSent: null          },
  { cIdx: 5, method: 'None configured',  optInRate: 9,  lastChecked: 'Jun 12', status: 'non_compliant', reminderSent: null          },
  { cIdx: 6, method: 'Single Opt-in',    optInRate: 74, lastChecked: 'Jun 14', status: 'partial',       reminderSent: 'Jun 8'       },
  { cIdx: 7, method: 'Double Opt-in',    optInRate: 96, lastChecked: 'Jun 15', status: 'compliant',     reminderSent: null          },
]

const OPT_STATUS_COLOR  = { compliant: 'green', non_compliant: 'red', partial: 'yellow', pending: 'gray' }
const OPT_STATUS_LABEL  = { compliant: 'Compliant', non_compliant: 'Non-Compliant', partial: 'Partial', pending: 'Pending' }

function OptInTab() {
  const [rows, setRows]   = useState(OPT_IN_DATA.map((r) => ({ ...r, client: CLIENTS[r.cIdx], sending: false })))
  const [sent, setSent]   = useState({})

  function sendReminder(idx) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, sending: true } : r))
    setTimeout(() => {
      setRows((prev) => prev.map((r, i) => i === idx ? { ...r, sending: false, reminderSent: 'Today' } : r))
      setSent((prev) => ({ ...prev, [idx]: true }))
      setTimeout(() => setSent((prev) => { const n = { ...prev }; delete n[idx]; return n }), 2000)
    }, 1100)
  }

  const compliant    = rows.filter((r) => r.status === 'compliant').length
  const nonCompliant = rows.filter((r) => r.status === 'non_compliant').length
  const partial      = rows.filter((r) => r.status === 'partial').length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Compliant',     value: compliant,    color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
          { label: 'Partial',       value: partial,      color: 'text-yellow-600',bg: 'bg-yellow-50',icon: AlertTriangle },
          { label: 'Non-Compliant', value: nonCompliant, color: 'text-red-600',   bg: 'bg-red-50',   icon: XCircle      },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <Icon size={18} className={color} />
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {nonCompliant > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <span className="text-red-700 font-medium">{nonCompliant} client{nonCompliant > 1 ? 's' : ''} have no opt-in mechanism configured — WhatsApp Business Policy requires explicit user consent.</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {['Client', 'Opt-in Method', 'Opt-in Rate', 'Last Checked', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <motion.tr key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.03 }}
                className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3"><ClientChip c={r.client} /></td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.method}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${r.optInRate >= 80 ? 'bg-green-400' : r.optInRate >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${r.optInRate}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{r.optInRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{r.lastChecked}</td>
                <td className="px-4 py-3"><Badge color={OPT_STATUS_COLOR[r.status]}>{OPT_STATUS_LABEL[r.status]}</Badge></td>
                <td className="px-4 py-3">
                  {(r.status === 'non_compliant' || r.status === 'partial') && (
                    <button onClick={() => sendReminder(i)} disabled={r.sending}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all disabled:opacity-50">
                      {r.sending ? <RefreshCw size={11} className="animate-spin" /> : sent[i] ? <CheckCircle2 size={11} className="text-green-600" /> : <Send size={11} />}
                      {sent[i] ? 'Sent!' : r.reminderSent ? 'Re-remind' : 'Send Reminder'}
                    </button>
                  )}
                  {r.reminderSent && <p className="text-[10px] text-gray-400 mt-1">Last sent: {r.reminderSent}</p>}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — MESSAGING VIOLATION ALERTS
══════════════════════════════════════════════════════════════ */
const VIOLATION_TYPES = {
  HIGH_BLOCK_RATE:          { label: 'High Block Rate',            severity: 'critical', desc: 'User block rate exceeds Meta threshold (>2%)' },
  QUALITY_RATING_DEGRADED:  { label: 'Quality Rating Degraded',   severity: 'high',    desc: 'WABA quality rating dropped to Yellow or Red' },
  TEMPLATE_POLICY_BREACH:   { label: 'Template Policy Breach',    severity: 'high',    desc: 'Template approved then flagged for policy violation' },
  MESSAGING_LIMIT_REDUCED:  { label: 'Messaging Limit Reduced',   severity: 'medium',  desc: 'Daily messaging limit reduced by Meta' },
  ACCOUNT_FLAGGED:          { label: 'Account Flagged',           severity: 'critical', desc: 'WABA account flagged by Meta for investigation' },
  HIGH_OPT_OUT_RATE:        { label: 'High Opt-out Rate',         severity: 'medium',  desc: 'Opt-out rate above acceptable threshold (>3%)' },
}

const INIT_VIOLATIONS = [
  { id: 1, cIdx: 6, type: 'HIGH_BLOCK_RATE',         detected: 'Jun 14', status: 'active',    metaRef: 'META-VIO-88271', resolveBy: 'Jun 21' },
  { id: 2, cIdx: 2, type: 'QUALITY_RATING_DEGRADED', detected: 'Jun 12', status: 'active',    metaRef: 'META-QR-44201',  resolveBy: 'Jun 19' },
  { id: 3, cIdx: 3, type: 'HIGH_OPT_OUT_RATE',       detected: 'Jun 11', status: 'escalated', metaRef: 'META-OO-31190',  resolveBy: 'Jun 18' },
  { id: 4, cIdx: 5, type: 'TEMPLATE_POLICY_BREACH',  detected: 'Jun 10', status: 'active',    metaRef: 'META-TP-29084',  resolveBy: 'Jun 17' },
  { id: 5, cIdx: 7, type: 'MESSAGING_LIMIT_REDUCED', detected: 'Jun 8',  status: 'resolved',  metaRef: 'META-ML-17823',  resolveBy: null },
  { id: 6, cIdx: 0, type: 'HIGH_BLOCK_RATE',         detected: 'Jun 5',  status: 'resolved',  metaRef: 'META-VIO-79003', resolveBy: null },
]

const SEV_COLOR = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' }
const VIO_STATUS_COLOR = { active: 'red', escalated: 'purple', resolved: 'green', acknowledged: 'blue' }

function ViolationsTab() {
  const [vios, setVios] = useState(INIT_VIOLATIONS.map((v) => ({ ...v, client: CLIENTS[v.cIdx] })))

  function act(id, newStatus) {
    setVios((prev) => prev.map((v) => v.id === id ? { ...v, status: newStatus } : v))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active',     value: vios.filter((v) => v.status === 'active').length,     bg: 'bg-red-50',    color: 'text-red-600',    icon: AlertTriangle },
          { label: 'Escalated',  value: vios.filter((v) => v.status === 'escalated').length,  bg: 'bg-purple-50', color: 'text-purple-600', icon: ArrowUpRight  },
          { label: 'Resolved',   value: vios.filter((v) => v.status === 'resolved').length,   bg: 'bg-green-50',  color: 'text-green-600',  icon: CheckCircle2  },
        ].map(({ label, value, bg, color, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <Icon size={18} className={color} />
            <div><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {vios.map((v, i) => {
          const vt = VIOLATION_TYPES[v.type]
          return (
            <motion.div key={v.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.04 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">
                    <AlertTriangle size={16} className={SEV_COLOR[vt.severity] === 'red' ? 'text-red-500' : SEV_COLOR[vt.severity] === 'orange' ? 'text-orange-500' : 'text-yellow-500'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <ClientChip c={v.client} />
                      <Badge color={SEV_COLOR[vt.severity]} className="uppercase text-[10px]">{vt.severity}</Badge>
                      <Badge color={VIO_STATUS_COLOR[v.status]} className="capitalize">{v.status}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{vt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{vt.desc}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-gray-400">
                      <span>Detected: {v.detected}</span>
                      <span className="font-mono">{v.metaRef}</span>
                      {v.resolveBy && <span className="text-orange-500">Resolve by: {v.resolveBy}</span>}
                    </div>
                  </div>
                </div>
                {v.status !== 'resolved' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {v.status === 'active' && (
                      <button onClick={() => act(v.id, 'acknowledged')}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                        Acknowledge
                      </button>
                    )}
                    {v.status !== 'escalated' && (
                      <button onClick={() => act(v.id, 'escalated')}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-all">
                        Escalate
                      </button>
                    )}
                    <button onClick={() => act(v.id, 'resolved')}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — SPAM RISK MONITORING
══════════════════════════════════════════════════════════════ */
const SPAM_DATA = [
  { cIdx: 0, score: 8,  blockRate: 0.3, reportRate: 0.2, optOutRate: 1.1, failRate: 0.8  },
  { cIdx: 1, score: 14, blockRate: 0.5, reportRate: 0.4, optOutRate: 1.8, failRate: 1.2  },
  { cIdx: 2, score: 71, blockRate: 2.8, reportRate: 1.9, optOutRate: 5.4, failRate: 3.1  },
  { cIdx: 3, score: 58, blockRate: 2.1, reportRate: 1.4, optOutRate: 4.1, failRate: 2.2  },
  { cIdx: 4, score: 22, blockRate: 0.8, reportRate: 0.5, optOutRate: 2.1, failRate: 1.4  },
  { cIdx: 5, score: 11, blockRate: 0.4, reportRate: 0.3, optOutRate: 1.3, failRate: 0.9  },
  { cIdx: 6, score: 84, blockRate: 3.4, reportRate: 2.8, optOutRate: 6.2, failRate: 4.1  },
  { cIdx: 7, score: 6,  blockRate: 0.2, reportRate: 0.1, optOutRate: 0.9, failRate: 0.5  },
]

const SPAM_TREND = [
  { name: 'Jun 9',  high: 1, medium: 2, low: 5 },
  { name: 'Jun 10', high: 1, medium: 3, low: 4 },
  { name: 'Jun 11', high: 2, medium: 2, low: 4 },
  { name: 'Jun 12', high: 2, medium: 3, low: 3 },
  { name: 'Jun 13', high: 2, medium: 2, low: 4 },
  { name: 'Jun 14', high: 2, medium: 1, low: 5 },
  { name: 'Jun 15', high: 2, medium: 1, low: 5 },
]

function spamLevel(score) {
  if (score >= 80) return { label: 'Critical', color: 'red',    bg: 'bg-red-500'    }
  if (score >= 50) return { label: 'High',     color: 'orange', bg: 'bg-orange-400' }
  if (score >= 20) return { label: 'Medium',   color: 'yellow', bg: 'bg-yellow-400' }
  return                  { label: 'Low',      color: 'green',  bg: 'bg-green-400'  }
}

function SpamTab() {
  const [rows, setRows] = useState(SPAM_DATA.map((r) => ({ ...r, client: CLIENTS[r.cIdx], throttled: false })))

  function throttle(idx) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, throttled: !r.throttled } : r))
  }

  const sorted = [...rows].sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-4">
      <BarChart
        data={SPAM_TREND}
        bars={[
          { key: 'high',   color: '#ef4444', label: 'High/Critical' },
          { key: 'medium', color: '#f59e0b', label: 'Medium'        },
          { key: 'low',    color: '#22c55e', label: 'Low'           },
        ]}
        title="Spam Risk Distribution — Last 7 Days"
      />

      <div className="space-y-2">
        {sorted.map((r, i) => {
          const lv = spamLevel(r.score)
          return (
            <motion.div key={r.cIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.04 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ClientChip c={r.client} />
                  <Badge color={lv.color}>{lv.label}</Badge>
                  {r.throttled && <Badge color="blue">Throttled</Badge>}
                </div>

                {/* Score gauge */}
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Spam Score</span>
                    <span className="text-sm font-bold text-gray-900">{r.score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${r.score}%` }}
                      transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.05 }}
                      className={`h-full rounded-full ${lv.bg}`} />
                  </div>
                  <div className="grid grid-cols-4 gap-1 mt-2 text-[10px] text-gray-400">
                    <span>Block: <span className="font-semibold text-gray-600">{r.blockRate}%</span></span>
                    <span>Report: <span className="font-semibold text-gray-600">{r.reportRate}%</span></span>
                    <span>Opt-out: <span className="font-semibold text-gray-600">{r.optOutRate}%</span></span>
                    <span>Fail: <span className="font-semibold text-gray-600">{r.failRate}%</span></span>
                  </div>
                </div>

                {r.score >= 50 && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => throttle(i)}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all ${r.throttled ? 'border-gray-300 bg-gray-100 text-gray-600' : 'border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>
                      {r.throttled ? 'Unthrottle' : 'Throttle'}
                    </button>
                    <button className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                      Warn
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — META POLICY ISSUE TRACKING
══════════════════════════════════════════════════════════════ */
const META_ISSUE_TYPES = {
  BIZ_VERIFICATION_PENDING:  'Business Verification Pending',
  QUALITY_WARNING:           'Quality Rating Warning',
  TEMPLATE_REJECTION_PATTERN:'Template Rejection Pattern',
  MESSAGING_LIMIT_DOWNGRADE: 'Messaging Limit Downgrade',
  ACCOUNT_RESTRICTION:       'Account Restriction',
  POLICY_ENFORCEMENT:        'Policy Enforcement Action',
}

const INIT_META_ISSUES = [
  { id: 1, cIdx: 6, type: 'ACCOUNT_RESTRICTION',       severity: 'critical', detected: 'Jun 14', deadline: 'Jun 21', status: 'open',     metaRef: 'META-AR-88271', notes: 'WABA restricted due to high block rates. Meta reviewing account.' },
  { id: 2, cIdx: 2, type: 'QUALITY_WARNING',           severity: 'high',     detected: 'Jun 12', deadline: 'Jun 19', status: 'open',     metaRef: 'META-QW-44201', notes: 'Quality rating dropped to Yellow. Improve message relevance.' },
  { id: 3, cIdx: 3, type: 'TEMPLATE_REJECTION_PATTERN',severity: 'high',     detected: 'Jun 11', deadline: 'Jun 18', status: 'tracking', metaRef: 'META-TR-31190', notes: '4 templates rejected in 7 days. Meta may suspend template access.' },
  { id: 4, cIdx: 1, type: 'BIZ_VERIFICATION_PENDING',  severity: 'medium',   detected: 'Jun 8',  deadline: 'Jun 22', status: 'tracking', metaRef: 'META-BV-29084', notes: 'Business portfolio verification document pending since Jun 1.' },
  { id: 5, cIdx: 4, type: 'MESSAGING_LIMIT_DOWNGRADE', severity: 'medium',   detected: 'Jun 5',  deadline: null,     status: 'resolved', metaRef: 'META-ML-17823', notes: 'Limit restored after reducing opt-out rate below 2%.' },
  { id: 6, cIdx: 5, type: 'POLICY_ENFORCEMENT',        severity: 'critical', detected: 'Jun 3',  deadline: 'Jun 17', status: 'open',     metaRef: 'META-PE-09912', notes: 'Client was sending messages outside 24h window using templates incorrectly.' },
]

function MetaPolicyTab() {
  const [issues, setIssues] = useState(INIT_META_ISSUES.map((v) => ({ ...v, client: CLIENTS[v.cIdx] })))

  function act(id, newStatus) {
    setIssues((prev) => prev.map((v) => v.id === id ? { ...v, status: newStatus } : v))
  }

  const STATUS_COLOR = { open: 'red', tracking: 'yellow', resolved: 'green', escalated: 'purple' }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open',     value: issues.filter((i) => i.status === 'open').length,     bg: 'bg-red-50',    color: 'text-red-600',    icon: AlertCircle  },
          { label: 'Tracking', value: issues.filter((i) => i.status === 'tracking').length, bg: 'bg-yellow-50', color: 'text-yellow-600', icon: Clock        },
          { label: 'Resolved', value: issues.filter((i) => i.status === 'resolved').length, bg: 'bg-green-50',  color: 'text-green-600',  icon: CheckCircle2 },
        ].map(({ label, value, bg, color, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <Icon size={18} className={color} />
            <div><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {issues.map((iss, i) => (
          <motion.div key={iss.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.04 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <FileWarning size={16} className={iss.severity === 'critical' ? 'text-red-500 mt-0.5 shrink-0' : iss.severity === 'high' ? 'text-orange-500 mt-0.5 shrink-0' : 'text-yellow-500 mt-0.5 shrink-0'} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <ClientChip c={iss.client} />
                    <Badge color={SEV_COLOR[iss.severity]} className="capitalize">{iss.severity}</Badge>
                    <Badge color={STATUS_COLOR[iss.status]} className="capitalize">{iss.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{META_ISSUE_TYPES[iss.type]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{iss.notes}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-gray-400">
                    <span>Detected: {iss.detected}</span>
                    <span className="font-mono">{iss.metaRef}</span>
                    {iss.wabaId && <span>{iss.wabaId}</span>}
                    {iss.deadline && <span className="text-orange-500 font-medium">Deadline: {iss.deadline}</span>}
                  </div>
                </div>
              </div>
              {iss.status !== 'resolved' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {iss.status !== 'tracking' && (
                    <button onClick={() => act(iss.id, 'tracking')}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                      Track
                    </button>
                  )}
                  <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                    <ExternalLink size={10} /> Meta BM
                  </button>
                  <button onClick={() => act(iss.id, 'resolved')}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
                    Resolve
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — ACCOUNT QUALITY ISSUE ESCALATION
══════════════════════════════════════════════════════════════ */
const QUALITY_RATING = {
  green:  { label: 'Green',  color: 'text-green-600',  bg: 'bg-green-100',  dot: 'bg-green-500'  },
  yellow: { label: 'Yellow', color: 'text-yellow-600', bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
  red:    { label: 'Red',    color: 'text-red-600',    bg: 'bg-red-100',    dot: 'bg-red-500'    },
}

const ESC_LEVELS = {
  0: { label: 'No Escalation', bg: 'bg-gray-100',    text: 'text-gray-600'   },
  1: { label: 'L1 — Warning',  bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  2: { label: 'L2 — Throttle', bg: 'bg-orange-100',  text: 'text-orange-700' },
  3: { label: 'L3 — Suspend',  bg: 'bg-red-100',     text: 'text-red-700'    },
}

const ESC_DESC = {
  0: 'Account in good standing.',
  1: 'Warning email sent to client. Client has 72h to respond.',
  2: 'Message sending rate throttled to 20% of plan limit.',
  3: 'Account sending suspended pending admin review.',
}

const INIT_ESC = [
  { cIdx: 6, rating: 'red',    escLevel: 2, daysAtLevel: 2,  blockRate: 3.4, optOutRate: 6.2, failRate: 4.1 },
  { cIdx: 2, rating: 'yellow', escLevel: 1, daysAtLevel: 5,  blockRate: 2.8, optOutRate: 5.4, failRate: 3.1 },
  { cIdx: 3, rating: 'yellow', escLevel: 1, daysAtLevel: 8,  blockRate: 2.1, optOutRate: 4.1, failRate: 2.2 },
  { cIdx: 5, rating: 'red',    escLevel: 3, daysAtLevel: 1,  blockRate: 1.8, optOutRate: 3.9, failRate: 2.8 },
  { cIdx: 0, rating: 'green',  escLevel: 0, daysAtLevel: 30, blockRate: 0.3, optOutRate: 1.1, failRate: 0.8 },
  { cIdx: 1, rating: 'green',  escLevel: 0, daysAtLevel: 45, blockRate: 0.5, optOutRate: 1.8, failRate: 1.2 },
  { cIdx: 4, rating: 'green',  escLevel: 0, daysAtLevel: 22, blockRate: 0.8, optOutRate: 2.1, failRate: 1.4 },
  { cIdx: 7, rating: 'green',  escLevel: 0, daysAtLevel: 60, blockRate: 0.2, optOutRate: 0.9, failRate: 0.5 },
]

function EscalationTab() {
  const [rows, setRows] = useState(INIT_ESC.map((r) => ({ ...r, client: CLIENTS[r.cIdx] })))

  function escalate(idx) {
    setRows((prev) => prev.map((r, i) => i === idx && r.escLevel < 3 ? { ...r, escLevel: r.escLevel + 1, daysAtLevel: 0 } : r))
  }

  function deescalate(idx) {
    setRows((prev) => prev.map((r, i) => i === idx && r.escLevel > 0 ? { ...r, escLevel: r.escLevel - 1, daysAtLevel: 0 } : r))
  }

  const sorted = [...rows].sort((a, b) => b.escLevel - a.escLevel || (b.rating === 'red') - (a.rating === 'red'))

  return (
    <div className="space-y-4">
      {/* Escalation level legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(ESC_LEVELS).map(([lvl, { label, bg, text }]) => (
          <div key={lvl} className={`${bg} rounded-xl px-3 py-2.5`}>
            <p className={`text-xs font-bold ${text}`}>{label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{ESC_DESC[Number(lvl)]}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.map((r, i) => {
          const qr  = QUALITY_RATING[r.rating]
          const el  = ESC_LEVELS[r.escLevel]
          return (
            <motion.div key={r.cIdx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.04 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ClientChip c={r.client} />

                  {/* Quality rating */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${qr.bg}`}>
                    <div className={`w-2 h-2 rounded-full ${qr.dot}`} />
                    <span className={`text-xs font-semibold ${qr.color}`}>{qr.label}</span>
                  </div>

                  {/* Escalation level */}
                  <div className={`px-2.5 py-1 rounded-full ${el.bg}`}>
                    <span className={`text-xs font-semibold ${el.text}`}>{el.label}</span>
                  </div>

                  {r.escLevel > 0 && (
                    <span className="text-xs text-gray-400">{r.daysAtLevel}d at this level</span>
                  )}
                </div>

                {/* Metrics */}
                <div className="hidden md:flex gap-4 text-[10px] text-gray-400">
                  <span>Block: <span className={`font-semibold ${r.blockRate > 2 ? 'text-red-600' : 'text-gray-600'}`}>{r.blockRate}%</span></span>
                  <span>Opt-out: <span className={`font-semibold ${r.optOutRate > 3 ? 'text-red-600' : 'text-gray-600'}`}>{r.optOutRate}%</span></span>
                  <span>Fail: <span className={`font-semibold ${r.failRate > 3 ? 'text-red-600' : 'text-gray-600'}`}>{r.failRate}%</span></span>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                  {r.escLevel > 0 && (
                    <button onClick={() => deescalate(i)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                      <ChevronDown size={11} /> De-escalate
                    </button>
                  )}
                  {r.escLevel < 3 && (r.rating !== 'green' || r.escLevel > 0) && (
                    <button onClick={() => escalate(i)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border-2 border-orange-400 bg-orange-50 text-orange-800 hover:bg-orange-100 transition-all">
                      <ChevronUp size={11} /> Escalate to L{r.escLevel + 1}
                    </button>
                  )}
                  {r.escLevel === 3 && (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-100 rounded-lg">
                      <ShieldAlert size={12} /> Max escalation
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'optin',       label: 'Opt-in Compliance',   icon: Bell      },
  { key: 'violations',  label: 'Violation Alerts',    icon: AlertTriangle },
  { key: 'spam',        label: 'Spam Risk',           icon: Flame     },
  { key: 'meta',        label: 'Meta Policy Issues',  icon: FileWarning },
  { key: 'escalation',  label: 'Quality Escalation',  icon: TrendingUp },
]

export default function ComplianceMonitor() {
  const [tab, setTab] = useState('optin')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compliance Monitoring"
        description="Opt-in compliance, violation alerts, spam risk, Meta policy issues and account quality escalation"
        breadcrumbs={['Admin', 'Compliance', 'Monitor']}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: EASE_OUT }}
        >
          {tab === 'optin'      && <OptInTab />}
          {tab === 'violations' && <ViolationsTab />}
          {tab === 'spam'       && <SpamTab />}
          {tab === 'meta'       && <MetaPolicyTab />}
          {tab === 'escalation' && <EscalationTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
