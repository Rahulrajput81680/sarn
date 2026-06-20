import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, ArrowUpRight, ArrowDownRight,
  CreditCard, BarChart2, Users, Zap,
  IndianRupee, ChevronDown, ChevronUp,
} from 'lucide-react'
import LineChart from '../../../components/charts/LineChart'
import BarChart from '../../../components/charts/BarChart'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Revenue data ───────────────────────────────────────── */

const MRR_TREND = [
  { name: 'Jul',  mrr: 38400,  newMrr: 3200, expansionMrr: 800,  churnedMrr: -1200 },
  { name: 'Aug',  mrr: 41200,  newMrr: 3800, expansionMrr: 1200, churnedMrr: -2200 },
  { name: 'Sep',  mrr: 42800,  newMrr: 2400, expansionMrr: 600,  churnedMrr: -1400 },
  { name: 'Oct',  mrr: 44100,  newMrr: 2800, expansionMrr: 900,  churnedMrr: -1600 },
  { name: 'Nov',  mrr: 45600,  newMrr: 3100, expansionMrr: 1100, churnedMrr: -2600 },
  { name: 'Dec',  mrr: 47300,  newMrr: 3500, expansionMrr: 1400, churnedMrr: -3200 },
  { name: 'Jan',  mrr: 48200,  newMrr: 2100, expansionMrr: 700,  churnedMrr: -1900 },
  { name: 'Feb',  mrr: 49400,  newMrr: 2600, expansionMrr: 1200, churnedMrr: -2600 },
  { name: 'Mar',  mrr: 50100,  newMrr: 1800, expansionMrr: 900,  churnedMrr: -2000 },
  { name: 'Apr',  mrr: 49800,  newMrr: 2200, expansionMrr: 600,  churnedMrr: -2900 },
  { name: 'May',  mrr: 50900,  newMrr: 2900, expansionMrr: 1100, churnedMrr: -1900 },
  { name: 'Jun',  mrr: 51400,  newMrr: 3200, expansionMrr: 1400, churnedMrr: -4109 },
]

const PLAN_REVENUE = [
  { name: 'Jan', Enterprise: 31992, Growth: 14994, Starter: 2997 },
  { name: 'Feb', Enterprise: 31992, Growth: 17493, Starter: 3996 },
  { name: 'Mar', Enterprise: 39995, Growth: 17493, Starter: 2997 },
  { name: 'Apr', Enterprise: 39995, Growth: 19992, Starter: 3996 },
  { name: 'May', Enterprise: 39995, Growth: 22491, Starter: 3996 },
  { name: 'Jun', Enterprise: 47994, Growth: 22491, Starter: 4995 },
]

const PLAN_BREAKDOWN = [
  { plan: 'Enterprise', clients: 6,  mrr: 47994, pct: 93.4, color: 'bg-purple-500', badge: 'purple' },
  { plan: 'Growth',     clients: 9,  mrr: 22491, pct: 43.7, color: 'bg-blue-500',   badge: 'blue'   },
  { plan: 'Starter',    clients: 5,  mrr: 4995,  pct: 9.7,  color: 'bg-gray-400',   badge: 'gray'   },
]

const TOP_REVENUE = [
  { rank: 1, company: 'TechStart',        avatar: 'TS', color: 'bg-indigo-500', plan: 'Enterprise', mrr: 7999,  ltv: 95988 },
  { rank: 2, company: 'MediCare Plus',    avatar: 'MP', color: 'bg-red-500',    plan: 'Enterprise', mrr: 7999,  ltv: 71991 },
  { rank: 3, company: 'Flipkart Commerce',avatar: 'FC', color: 'bg-purple-500', plan: 'Enterprise', mrr: 7999,  ltv: 63992 },
  { rank: 4, company: 'RapidDeliver',     avatar: 'RD', color: 'bg-cyan-500',   plan: 'Growth',     mrr: 2499,  ltv: 17493 },
  { rank: 5, company: 'StyleHub',         avatar: 'SH', color: 'bg-pink-500',   plan: 'Growth',     mrr: 2499,  ltv: 14994 },
]

const planColor = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }

function fmtN(n) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)}L`
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n}`
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

/* ─── MRR waterfall (new/expansion/churned breakdown) ────── */

function MRRWaterfall() {
  const latest = MRR_TREND[MRR_TREND.length - 1]
  const prev   = MRR_TREND[MRR_TREND.length - 2]
  const net    = latest.newMrr + latest.expansionMrr + latest.churnedMrr

  const items = [
    { label: 'New MRR',       val: latest.newMrr,       color: 'bg-green-500',  text: 'text-green-700',  positive: true  },
    { label: 'Expansion MRR', val: latest.expansionMrr, color: 'bg-blue-500',   text: 'text-blue-700',   positive: true  },
    { label: 'Churned MRR',   val: latest.churnedMrr,   color: 'bg-red-500',    text: 'text-red-700',    positive: false },
    { label: 'Net New MRR',   val: net,                  color: net >= 0 ? 'bg-green-600' : 'bg-red-500', text: net >= 0 ? 'text-green-800' : 'text-red-700', positive: net >= 0 },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-900 mb-1">MRR Movements — Jun 2026</p>
      <p className="text-xs text-gray-400 mb-4">Starting MRR: <span className="font-semibold text-gray-700">{fmtN(prev.mrr)}</span></p>
      <div className="space-y-2.5">
        {items.map(({ label, val, color, text, positive }) => {
          const maxAbs = Math.max(latest.newMrr, latest.expansionMrr, Math.abs(latest.churnedMrr), Math.abs(net))
          const barW   = Math.round((Math.abs(val) / maxAbs) * 100)
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">{label}</span>
                <span className={`text-xs font-bold ${text}`}>{positive ? '+' : ''}{fmtN(val)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barW}%` }}
                  transition={{ duration: 0.7, ease: EASE_OUT }}
                  className={`h-full rounded-full ${color}`}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">Ending MRR</span>
        <span className="text-lg font-bold text-gray-900">{fmtN(latest.mrr)}</span>
      </div>
    </div>
  )
}

/* ─── Revenue by plan breakdown ──────────────────────────── */

function PlanBreakdown() {
  const totalMrr = PLAN_BREAKDOWN.reduce((s, p) => s + p.mrr, 0)
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-900 mb-4">Revenue by Plan</p>
      <div className="space-y-4">
        {PLAN_BREAKDOWN.map(({ plan, clients, mrr, pct, color, badge }, i) => (
          <motion.div
            key={plan}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Badge color={badge}>{plan}</Badge>
                <span className="text-xs text-gray-400">{clients} clients</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-800">{fmtN(mrr)}</span>
                <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
              </div>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.06 }}
                className={`h-full rounded-full ${color}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">Total Platform MRR</span>
        <span className="text-base font-bold text-gray-900">{fmtN(totalMrr)}</span>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function SystemHealth() {
  const currentMrr = MRR_TREND[MRR_TREND.length - 1].mrr
  const prevMrr    = MRR_TREND[MRR_TREND.length - 2].mrr
  const momGrowth  = (((currentMrr - prevMrr) / prevMrr) * 100).toFixed(1)
  const arr        = currentMrr * 12
  const totalClients = PLAN_BREAKDOWN.reduce((s, p) => s + p.clients, 0)
  const arpu       = Math.round(currentMrr / totalClients)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Revenue Analytics"
        description="MRR, ARR, plan breakdown and revenue trends"
        breadcrumbs={['Admin', 'System Analytics', 'Revenue']}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI index={0} title="MRR" value={fmtN(currentMrr)} sub="monthly recurring revenue" delta={`+${momGrowth}% vs May`} positive={+momGrowth >= 0} icon={IndianRupee} bg="bg-green-50 text-green-600" />
        <KPI index={1} title="ARR" value={fmtN(arr)} sub="annualised run rate" delta={`+${(+momGrowth * 12).toFixed(1)}% projected`} positive icon={TrendingUp} bg="bg-purple-50 text-purple-600" />
        <KPI index={2} title="ARPU" value={fmtN(arpu)} sub="avg revenue per client/mo" delta="+4.2% vs last month" positive icon={Users} bg="bg-blue-50 text-blue-600" />
        <KPI index={3} title="MoM Growth" value={`${momGrowth}%`} sub="month-over-month" delta="vs 2.3% last month" positive={+momGrowth > 0} icon={Zap} bg="bg-amber-50 text-amber-600" />
      </div>

      {/* MRR trend + waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LineChart
            data={MRR_TREND}
            lines={[{ key: 'mrr', color: '#8b5cf6', label: 'MRR (₹)' }]}
            title="MRR Trend — Last 12 Months"
          />
        </div>
        <MRRWaterfall />
      </div>

      {/* Revenue by plan stacked bar + breakdown card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BarChart
            data={PLAN_REVENUE}
            bars={[
              { key: 'Enterprise', color: '#8b5cf6', label: 'Enterprise' },
              { key: 'Growth',     color: '#3b82f6', label: 'Growth' },
              { key: 'Starter',    color: '#9ca3af', label: 'Starter' },
            ]}
            title="Revenue by Plan — Last 6 Months (₹)"
          />
        </div>
        <PlanBreakdown />
      </div>

      {/* Top revenue clients */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <CreditCard size={15} className="text-purple-600" />
          <p className="text-sm font-semibold text-gray-900">Top Revenue Clients</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 w-8">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Plan</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">MRR</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">Est. LTV</th>
                <th className="w-40 px-4 py-3 text-xs font-semibold text-gray-400">Revenue share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TOP_REVENUE.map((c, i) => {
                const totalMrr = PLAN_BREAKDOWN.reduce((s, p) => s + p.mrr, 0)
                const share    = (c.mrr / totalMrr) * 100
                return (
                  <motion.tr
                    key={c.rank}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.13, ease: EASE_OUT, delay: i * 0.04 }}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${c.rank <= 3 ? 'text-amber-500' : 'text-gray-300'}`}>{c.rank}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{c.avatar}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{c.company}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge color={planColor[c.plan]}>{c.plan}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold text-gray-900">₹{c.mrr.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm text-purple-700 font-semibold">₹{c.ltv.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${share}%` }}
                          transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.04 }}
                          className="h-full rounded-full bg-purple-500"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 text-right mt-0.5">{share.toFixed(1)}%</p>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
