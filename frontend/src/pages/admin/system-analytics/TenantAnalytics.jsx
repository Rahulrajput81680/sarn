import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, UserMinus, UserCheck,
  TrendingDown, AlertTriangle, ChevronRight, Calendar,
} from 'lucide-react'
import LineChart from '../../../components/charts/LineChart'
import BarChart from '../../../components/charts/BarChart'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Chart data ─────────────────────────────────────────── */

const churnTrendData = [
  { name: 'Jul', retained: 182, churned: 4  },
  { name: 'Aug', retained: 188, churned: 3  },
  { name: 'Sep', retained: 191, churned: 5  },
  { name: 'Oct', retained: 194, churned: 2  },
  { name: 'Nov', retained: 199, churned: 6  },
  { name: 'Dec', retained: 204, churned: 4  },
  { name: 'Jan', retained: 210, churned: 3  },
  { name: 'Feb', retained: 214, churned: 4  },
  { name: 'Mar', retained: 218, churned: 2  },
  { name: 'Apr', retained: 220, churned: 5  },
  { name: 'May', retained: 224, churned: 3  },
  { name: 'Jun', retained: 228, churned: 5  },
]

const churnRateLine = churnTrendData.map((d) => ({
  name: d.name,
  churnRate: parseFloat(((d.churned / (d.retained + d.churned)) * 100).toFixed(2)),
}))

const churnByPlan = [
  { name: 'Starter',    churned: 28, retained: 42 },
  { name: 'Growth',     churned: 12, retained: 112 },
  { name: 'Enterprise', churned: 2,  retained: 32 },
]

/* ─── Churned clients log ────────────────────────────────── */

const CHURNED = [
  { id: 1, company: 'EduBridge',   avatar: 'EB', color: 'bg-teal-500',   plan: 'Starter',    reason: 'Price — switched to competitor',  mrr: 999,  daysWith: 24,  churnedOn: 'Jun 7, 2026' },
  { id: 2, company: 'LocalMart',   avatar: 'LM', color: 'bg-gray-400',   plan: 'Growth',     reason: 'Low usage — under-utilizing plan', mrr: 2499, daysWith: 62,  churnedOn: 'Jun 2, 2026' },
  { id: 3, company: 'PrintBuddy',  avatar: 'PB', color: 'bg-rose-500',   plan: 'Starter',    reason: 'Business closed',                 mrr: 999,  daysWith: 38,  churnedOn: 'May 28, 2026' },
  { id: 4, company: 'CityRides',   avatar: 'CR', color: 'bg-violet-500', plan: 'Growth',     reason: 'Product fit — needed enterprise features', mrr: 2499, daysWith: 91, churnedOn: 'May 21, 2026' },
  { id: 5, company: 'GreenLeaf',   avatar: 'GL', color: 'bg-green-500',  plan: 'Starter',    reason: 'Payment failure — multiple retries', mrr: 999, daysWith: 70,  churnedOn: 'May 14, 2026' },
]

const planColor = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }

const CHURN_REASONS_AGG = [
  { reason: 'Price / competitor',         count: 18, pct: 36, color: 'bg-red-500'    },
  { reason: 'Low usage / bad fit',        count: 14, pct: 28, color: 'bg-amber-500'  },
  { reason: 'Payment failure',            count: 10, pct: 20, color: 'bg-orange-500' },
  { reason: 'Business closed / paused',   count: 5,  pct: 10, color: 'bg-gray-400'   },
  { reason: 'Needed different features',  count: 3,  pct: 6,  color: 'bg-blue-400'   },
]

function fmtN(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
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

/* ─── Main ───────────────────────────────────────────────── */

export default function TenantAnalytics() {
  const [period, setPeriod] = useState('12mo')

  const totalChurned   = CHURNED.length
  const mrrLost        = CHURNED.reduce((s, c) => s + c.mrr, 0)
  const latestChurnRate= churnRateLine[churnRateLine.length - 1].churnRate
  const avgDaysWith    = Math.round(CHURNED.reduce((s, c) => s + c.daysWith, 0) / CHURNED.length)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Churn Analytics"
        description="Client retention, churn rates, reasons and MRR impact"
        breadcrumbs={['Admin', 'System Analytics', 'Churn']}
        action={
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {['3mo', '6mo', '12mo'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${period === p ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI index={0} title="Churned This Month" value={totalChurned} sub="clients lost in Jun 2026" delta="vs 3 last month" positive={false} icon={UserMinus} bg="bg-red-50 text-red-500" />
        <KPI index={1} title="Churn Rate" value={`${latestChurnRate}%`} sub="monthly rate" delta="-0.3% vs May" positive icon={TrendingDown} bg="bg-amber-50 text-amber-600" />
        <KPI index={2} title="Retention Rate" value={`${(100 - latestChurnRate).toFixed(1)}%`} sub="active clients retained" delta="+0.3% vs May" positive icon={UserCheck} bg="bg-green-50 text-green-600" />
        <KPI index={3} title="MRR Lost" value={`₹${fmtN(mrrLost)}`} sub="from churn this month" delta="avg ₹0 recovery" positive={false} icon={AlertTriangle} bg="bg-orange-50 text-orange-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart
          data={churnTrendData}
          bars={[
            { key: 'retained', color: '#16a34a', label: 'Retained' },
            { key: 'churned',  color: '#ef4444', label: 'Churned' },
          ]}
          title="Retained vs Churned — Last 12 Months"
        />
        <LineChart
          data={churnRateLine}
          lines={[{ key: 'churnRate', color: '#ef4444', label: 'Churn Rate (%)' }]}
          title="Monthly Churn Rate Trend"
        />
      </div>

      {/* Churn reasons + by plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Churn reasons breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Churn Reasons Breakdown</p>
          <div className="space-y-3">
            {CHURN_REASONS_AGG.map(({ reason, count, pct, color }, i) => (
              <motion.div
                key={reason}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800">{count}</span>
                    <span className="text-xs text-gray-400">({pct}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
        </div>

        {/* Churn by plan */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Churn by Plan</p>
          <div className="space-y-4">
            {churnByPlan.map(({ name, churned, retained }, i) => {
              const total   = churned + retained
              const churnPct= ((churned / total) * 100).toFixed(1)
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge color={planColor[name]}>{name}</Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      <span className="font-bold text-red-600">{churned}</span> / {total} clients · <span className="font-semibold text-red-500">{churnPct}% rate</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(retained / total) * 100}%` }}
                      transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.07 }}
                      className="h-full bg-green-500"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(churned / total) * 100}%` }}
                      transition={{ duration: 0.7, ease: EASE_OUT, delay: i * 0.07 + 0.1 }}
                      className="h-full bg-red-400"
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs text-gray-500">Retained</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-xs text-gray-500">Churned</span></div>
          </div>
        </div>
      </div>

      {/* Churned clients log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserMinus size={15} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-900">Recently Churned Clients</p>
          </div>
          <span className="text-xs text-gray-400">Last 30 days</span>
        </div>
        <div className="divide-y divide-gray-50">
          {CHURNED.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.14, ease: EASE_OUT, delay: i * 0.04 }}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{c.avatar}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{c.company}</p>
                    <Badge color={planColor[c.plan]}>{c.plan}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{c.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0 ml-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-red-600">-₹{c.mrr.toLocaleString()}/mo</p>
                  <p className="text-[10px] text-gray-400">MRR lost</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="text-xs font-semibold text-gray-700">{c.daysWith}d</p>
                  <p className="text-[10px] text-gray-400">lifespan</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={11} />
                  {c.churnedOn}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
