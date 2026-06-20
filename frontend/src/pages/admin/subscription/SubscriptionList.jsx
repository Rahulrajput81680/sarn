import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, ArrowUpDown, CalendarPlus, X, Save,
  Check, ChevronRight, Clock, AlertTriangle, Building2,
  CheckCircle2, PauseCircle, Ban,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Demo data ──────────────────────────────────────────── */

const CLIENTS = [
  { id: 1,  company: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500', plan: 'Enterprise', status: 'active',    renewsOn: 'Jul 5, 2026',  daysLeft: 19,  mrr: 7999,  messages: { used: 124000, total: 200000 }, contacts: { used: 28400, total: 100000 } },
  { id: 2,  company: 'QuickMart',          avatar: 'QM', color: 'bg-blue-500',   plan: 'Growth',     status: 'trial',     renewsOn: 'Jul 1, 2026',  daysLeft: 15,  mrr: 0,     messages: { used: 320,    total: 500    }, contacts: { used: 42,    total: 1000   } },
  { id: 3,  company: 'StyleHub',           avatar: 'SH', color: 'bg-pink-500',   plan: 'Growth',     status: 'active',    renewsOn: 'Aug 12, 2026', daysLeft: 57,  mrr: 2499,  messages: { used: 87200,  total: 25000  }, contacts: { used: 11200, total: 10000  } },
  { id: 4,  company: 'FoodZone',           avatar: 'FZ', color: 'bg-orange-500', plan: 'Starter',    status: 'active',    renewsOn: 'Sep 3, 2026',  daysLeft: 79,  mrr: 999,   messages: { used: 18500,  total: 5000   }, contacts: { used: 2100,  total: 2000   } },
  { id: 5,  company: 'TechStart',          avatar: 'TS', color: 'bg-indigo-500', plan: 'Enterprise', status: 'active',    renewsOn: 'Dec 20, 2026', daysLeft: 187, mrr: 7999,  messages: { used: 213000, total: 200000 }, contacts: { used: 44800, total: 100000 } },
  { id: 6,  company: 'GreenLeaf',          avatar: 'GL', color: 'bg-green-500',  plan: 'Starter',    status: 'expired',   renewsOn: 'Expired',      daysLeft: -8,  mrr: 0,     messages: { used: 4900,   total: 5000   }, contacts: { used: 820,   total: 2000   } },
  { id: 7,  company: 'RapidDeliver',       avatar: 'RD', color: 'bg-cyan-500',   plan: 'Growth',     status: 'active',    renewsOn: 'Jan 14, 2027', daysLeft: 212, mrr: 2499,  messages: { used: 56000,  total: 25000  }, contacts: { used: 8700,  total: 10000  } },
  { id: 8,  company: 'EduBridge',          avatar: 'EB', color: 'bg-teal-500',   plan: 'Starter',    status: 'suspended', renewsOn: 'Jun 22, 2026', daysLeft: 6,   mrr: 999,   messages: { used: 2100,   total: 5000   }, contacts: { used: 430,   total: 2000   } },
  { id: 9,  company: 'MediCare Plus',      avatar: 'MP', color: 'bg-red-500',    plan: 'Enterprise', status: 'active',    renewsOn: 'Nov 9, 2026',  daysLeft: 146, mrr: 7999,  messages: { used: 98400,  total: 200000 }, contacts: { used: 19200, total: 100000 } },
  { id: 10, company: 'BrandCraft',         avatar: 'BC', color: 'bg-amber-500',  plan: 'Growth',     status: 'trial',     renewsOn: 'Jul 5, 2026',  daysLeft: 19,  mrr: 0,     messages: { used: 7800,   total: 500    }, contacts: { used: 1200,  total: 1000   } },
  { id: 11, company: 'UrbanRoots',         avatar: 'UR', color: 'bg-lime-600',   plan: 'Starter',    status: 'active',    renewsOn: 'Sep 18, 2026', daysLeft: 94,  mrr: 999,   messages: { used: 11200,  total: 5000   }, contacts: { used: 1900,  total: 2000   } },
  { id: 12, company: 'CloudBazaar',        avatar: 'CB', color: 'bg-sky-500',    plan: 'Growth',     status: 'active',    renewsOn: 'Jul 30, 2026', daysLeft: 44,  mrr: 2499,  messages: { used: 44300,  total: 25000  }, contacts: { used: 7100,  total: 10000  } },
]

const PLANS_ORDERED = ['Starter', 'Growth', 'Enterprise']
const planColor   = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }
const statusColor = { active: 'green', trial: 'yellow', expired: 'red', suspended: 'gray' }

const statusIcon = {
  active:    <CheckCircle2 size={12} className="text-green-500" />,
  trial:     <Clock size={12} className="text-amber-500" />,
  expired:   <Ban size={12} className="text-red-400" />,
  suspended: <PauseCircle size={12} className="text-gray-400" />,
}

function pct(used, total) { return Math.min(100, Math.round((used / total) * 100)) }
function fmtN(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

/* ─── Usage bar ──────────────────────────────────────────── */

function UsageBar({ used, total }) {
  const p = pct(used, total)
  const color = p >= 90 ? 'bg-red-500' : p >= 70 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>{fmtN(used)}</span>
        <span className={p >= 90 ? 'text-red-500 font-semibold' : ''}>{p}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

/* ─── Manual extension modal ─────────────────────────────── */

function ExtendModal({ client, onClose, onConfirm }) {
  const [days, setDays] = useState(7)
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CalendarPlus size={18} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Manual Extension</p>
            <p className="text-xs text-gray-400">{client.company}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-gray-400">Current plan</span><span className="font-medium text-gray-700">{client.plan}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Current renewal</span><span className="font-medium text-gray-700">{client.renewsOn}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Status</span><Badge color={statusColor[client.status]}>{client.status}</Badge></div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-2">Extend by (days)</label>
          <div className="flex items-center gap-2 mb-3">
            {[3, 7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${days === d ? 'border-green-400 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                +{d}d
              </button>
            ))}
          </div>
          <input
            type="number"
            value={days}
            min={1}
            max={365}
            onChange={(e) => setDays(+e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
            placeholder="Custom days"
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Internal note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Extended for support issue on Jun 12"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm(days, note)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-semibold transition-all"
          >
            <Check size={14} /> Extend +{days} days
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Upgrade / Downgrade modal ──────────────────────────── */

function PlanChangeModal({ client, onClose, onConfirm }) {
  const [selected, setSelected] = useState(client.plan)
  const isUpgrade = PLANS_ORDERED.indexOf(selected) > PLANS_ORDERED.indexOf(client.plan)
  const isChange  = selected !== client.plan

  const PLAN_PRICES = { Starter: 999, Growth: 2499, Enterprise: 7999 }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ArrowUpDown size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Change Plan</p>
              <p className="text-xs text-gray-400">{client.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <p className="text-xs text-gray-400 mb-3">Select new plan (current: <span className="font-semibold text-gray-700">{client.plan}</span>)</p>

        <div className="space-y-2 mb-5">
          {PLANS_ORDERED.map((plan) => {
            const isCurrent  = plan === client.plan
            const isSelected = plan === selected
            const dir = PLANS_ORDERED.indexOf(plan) > PLANS_ORDERED.indexOf(client.plan) ? 'upgrade' : PLANS_ORDERED.indexOf(plan) < PLANS_ORDERED.indexOf(client.plan) ? 'downgrade' : null
            return (
              <button
                key={plan}
                onClick={() => !isCurrent && setSelected(plan)}
                disabled={isCurrent}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                  isSelected && !isCurrent
                    ? (dir === 'upgrade' ? 'border-blue-400 bg-blue-50' : 'border-amber-400 bg-amber-50')
                    : isCurrent
                    ? 'border-green-400 bg-green-50 cursor-default'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{plan}</p>
                  <p className="text-xs text-gray-400">₹{PLAN_PRICES[plan].toLocaleString()}/mo</p>
                </div>
                <div className="flex items-center gap-2">
                  {isCurrent && <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Current</span>}
                  {!isCurrent && dir && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dir === 'upgrade' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {dir}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {!isUpgrade && isChange && (
          <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
            <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
            Downgrade will reduce limits. Client's usage exceeding new limits will be restricted but data is retained.
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => isChange && onConfirm(selected)}
            disabled={!isChange}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!isChange ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : isUpgrade ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
          >
            {!isChange ? 'No change' : isUpgrade ? 'Confirm Upgrade' : 'Confirm Downgrade'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function SubscriptionList() {
  const navigate   = useNavigate()
  const [clients, setClients]     = useState(CLIENTS)
  const [search, setSearch]       = useState('')
  const [statusF, setStatusF]     = useState('all')
  const [planF, setPlanF]         = useState('all')
  const [extendTarget, setExtendTarget] = useState(null)
  const [changeTarget, setChangeTarget] = useState(null)
  const [page, setPage]           = useState(1)
  const perPage = 10

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    const mQ = !q || c.company.toLowerCase().includes(q)
    const mS = statusF === 'all' || c.status === statusF
    const mP = planF   === 'all' || c.plan   === planF
    return mQ && mS && mP
  })

  const total   = filtered.length
  const pages   = Math.max(1, Math.ceil(total / perPage))
  const curPage = Math.min(page, pages)
  const paged   = filtered.slice((curPage - 1) * perPage, curPage * perPage)

  const handleExtend = (days, _note) => {
    setClients((prev) =>
      prev.map((c) => c.id === extendTarget.id
        ? { ...c, daysLeft: Math.max(0, c.daysLeft) + days, status: c.status === 'expired' ? 'active' : c.status }
        : c
      )
    )
    setExtendTarget(null)
  }

  const handlePlanChange = (newPlan) => {
    setClients((prev) =>
      prev.map((c) => c.id === changeTarget.id ? { ...c, plan: newPlan } : c)
    )
    setChangeTarget(null)
  }

  const daysLeftColor = (d) => d < 0 ? 'text-red-500' : d <= 7 ? 'text-amber-600' : d <= 14 ? 'text-amber-500' : 'text-gray-700'

  return (
    <div className="space-y-5">
      <PageHeader
        title="Client Subscriptions"
        description="Manage renewals, plan changes and extensions"
        breadcrumbs={['Admin', 'Subscription', 'Clients']}
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active',    count: clients.filter((c) => c.status === 'active').length,    color: 'bg-green-50 border-green-200',  text: 'text-green-700' },
          { label: 'Trial',     count: clients.filter((c) => c.status === 'trial').length,     color: 'bg-amber-50 border-amber-200',  text: 'text-amber-700' },
          { label: 'Expiring soon', count: clients.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 7 && c.status === 'active').length, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
          { label: 'Expired',   count: clients.filter((c) => c.status === 'expired').length,   color: 'bg-red-50 border-red-200',      text: 'text-red-700' },
        ].map(({ label, count, color, text }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
            <p className={`text-2xl font-bold ${text}`}>{count}</p>
            <p className={`text-xs font-medium ${text} opacity-80`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search client…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5">
          <Filter size={12} className="text-gray-400" />
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1) }} className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer">
            {['all', 'active', 'trial', 'expired', 'suspended'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All status' : s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5">
          <select value={planF} onChange={(e) => { setPlanF(e.target.value); setPage(1) }} className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer">
            {['all', 'Starter', 'Growth', 'Enterprise'].map((p) => <option key={p} value={p}>{p === 'all' ? 'All plans' : p}</option>)}
          </select>
        </div>
        {(search || statusF !== 'all' || planF !== 'all') && (
          <button onClick={() => { setSearch(''); setStatusF('all'); setPlanF('all'); setPage(1) }} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
        )}
        <span className="ml-auto text-xs text-gray-400">{total} client{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Renewal</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400">Messages</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400">Contacts</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">MRR</th>
                <th className="px-4 py-3 w-44"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {paged.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.13, ease: EASE_OUT, delay: i * 0.03 }}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Client */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/users/${c.id}`)}>
                        <div className={`w-8 h-8 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{c.avatar}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-gray-900 hover:text-green-700 transition-colors">{c.company}</p>
                          <ChevronRight size={12} className="text-gray-300" />
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5">
                      <Badge color={planColor[c.plan]}>{c.plan}</Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {statusIcon[c.status]}
                        <Badge color={statusColor[c.status]}>{c.status}</Badge>
                      </div>
                    </td>

                    {/* Renewal */}
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-medium text-gray-700">{c.renewsOn}</p>
                      {c.daysLeft !== undefined && (
                        <p className={`text-[10px] font-semibold mt-0.5 ${daysLeftColor(c.daysLeft)}`}>
                          {c.daysLeft < 0
                            ? `${Math.abs(c.daysLeft)}d overdue`
                            : c.daysLeft === 0
                            ? 'Expires today'
                            : `${c.daysLeft}d left`}
                        </p>
                      )}
                    </td>

                    {/* Messages usage */}
                    <td className="px-4 py-3.5 w-28">
                      <UsageBar used={c.messages.used} total={c.messages.total} />
                    </td>

                    {/* Contacts usage */}
                    <td className="px-4 py-3.5 w-28">
                      <UsageBar used={c.contacts.used} total={c.contacts.total} />
                    </td>

                    {/* MRR */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-800">
                        {c.mrr ? `₹${c.mrr.toLocaleString()}` : <span className="text-gray-400 font-normal">Trial</span>}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setExtendTarget(c)}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                        >
                          <CalendarPlus size={11} /> Extend
                        </button>
                        <button
                          onClick={() => setChangeTarget(c)}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <ArrowUpDown size={11} /> Plan
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    <Building2 size={32} className="mx-auto mb-2 text-gray-200" />
                    No subscriptions match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Showing {(curPage - 1) * perPage + 1}–{Math.min(curPage * perPage, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={curPage === 1} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${p === curPage ? 'bg-green-500 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={curPage === pages} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {extendTarget && <ExtendModal client={extendTarget} onClose={() => setExtendTarget(null)} onConfirm={handleExtend} />}
        {changeTarget && <PlanChangeModal client={changeTarget} onClose={() => setChangeTarget(null)} onConfirm={handlePlanChange} />}
      </AnimatePresence>
    </div>
  )
}
