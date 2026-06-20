import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, Bot, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Eye, TrendingUp,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import LineChart from '../../../components/charts/LineChart'
import BarChart from '../../../components/charts/BarChart'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Chart data ─────────────────────────────────────────── */

const deliveryTrendData = Array.from({ length: 30 }, (_, i) => ({
  name: `D${i + 1}`,
  sent:      Math.floor(88000 + i * 600 + Math.random() * 4000),
  delivered: Math.floor(84000 + i * 550 + Math.random() * 3500),
  read:      Math.floor(62000 + i * 400 + Math.random() * 3000),
  failed:    Math.floor(800  + Math.random() * 600),
}))

const msgVolumeData = Array.from({ length: 12 }, (_, i) => ({
  name: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
  messages: Math.floor(1_200_000 + i * 180_000 + Math.random() * 200_000),
}))

/* ─── Top active clients ─────────────────────────────────── */

const TOP_CLIENTS = [
  { rank: 1,  company: 'TechStart',       avatar: 'TS', color: 'bg-indigo-500', plan: 'Enterprise', messages: 4_210_000, deliveryRate: 98.2, readRate: 74.1, bots: 18 },
  { rank: 2,  company: 'Flipkart Commerce',avatar: 'FC', color: 'bg-purple-500', plan: 'Enterprise', messages: 3_840_000, deliveryRate: 97.9, readRate: 71.3, bots: 22 },
  { rank: 3,  company: 'MediCare Plus',    avatar: 'MP', color: 'bg-red-500',    plan: 'Enterprise', messages: 2_120_000, deliveryRate: 99.1, readRate: 82.4, bots: 14 },
  { rank: 4,  company: 'StyleHub',         avatar: 'SH', color: 'bg-pink-500',   plan: 'Growth',     messages: 1_480_000, deliveryRate: 96.4, readRate: 68.9, bots: 8 },
  { rank: 5,  company: 'RapidDeliver',     avatar: 'RD', color: 'bg-cyan-500',   plan: 'Growth',     messages: 1_190_000, deliveryRate: 94.2, readRate: 61.5, bots: 6 },
  { rank: 6,  company: 'CloudBazaar',      avatar: 'CB', color: 'bg-sky-500',    plan: 'Growth',     messages: 982_000,   deliveryRate: 97.1, readRate: 65.8, bots: 5 },
  { rank: 7,  company: 'FoodZone',         avatar: 'FZ', color: 'bg-orange-500', plan: 'Starter',    messages: 421_000,   deliveryRate: 91.4, readRate: 57.2, bots: 3 },
  { rank: 8,  company: 'QuickMart',        avatar: 'QM', color: 'bg-blue-500',   plan: 'Growth',     messages: 384_000,   deliveryRate: 96.8, readRate: 69.1, bots: 4 },
]

const MAX_MSGS = TOP_CLIENTS[0].messages
const planColor = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }

function fmtN(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
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

/* ─── Delivery rate summary bar ──────────────────────────── */

function DeliveryBreakdown() {
  const latest = deliveryTrendData[deliveryTrendData.length - 1]
  const total  = latest.sent
  const items = [
    { label: 'Delivered', val: latest.delivered, color: 'bg-green-500',  text: 'text-green-700'  },
    { label: 'Read',      val: latest.read,      color: 'bg-blue-500',   text: 'text-blue-700'   },
    { label: 'Failed',    val: latest.failed,    color: 'bg-red-500',    text: 'text-red-700'    },
  ]
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-900 mb-4">Today's Delivery Breakdown</p>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
        {items.map(({ label, val, color }) => (
          <motion.div
            key={label}
            initial={{ width: 0 }}
            animate={{ width: `${(val / total) * 100}%` }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
            className={`h-full ${color}`}
            title={`${label}: ${fmtN(val)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ label, val, color, text }) => (
          <div key={label} className="text-center">
            <div className={`inline-block w-2.5 h-2.5 rounded-full ${color} mb-1`} />
            <p className={`text-lg font-bold ${text}`}>{fmtN(val)}</p>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-[10px] text-gray-400">{((val / total) * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Top clients table ──────────────────────────────────── */

function TopClientsTable() {
  const [sortKey, setSortKey] = useState('messages')
  const [sortDir, setSortDir] = useState('desc')

  const toggle = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...TOP_CLIENTS].sort((a, b) =>
    sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
  )

  const SortBtn = ({ k, label }) => (
    <button onClick={() => toggle(k)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
      {label}
      {sortKey === k
        ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />)
        : <ChevronDown size={11} className="opacity-30" />
      }
    </button>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-green-600" />
          <p className="text-sm font-semibold text-gray-900">Top Active Clients</p>
        </div>
        <span className="text-xs text-gray-400">All time · sorted by {sortKey}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 w-8">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Client</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400"><SortBtn k="messages" label="Messages" /></th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400"><SortBtn k="deliveryRate" label="Delivery %" /></th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400"><SortBtn k="readRate" label="Read %" /></th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400"><SortBtn k="bots" label="Bots" /></th>
              <th className="w-36 px-4 py-3 text-xs font-semibold text-gray-400">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((c, i) => {
              const share = (c.messages / MAX_MSGS) * 100
              const rankColor = c.rank === 1 ? 'text-amber-500' : c.rank === 2 ? 'text-gray-400' : c.rank === 3 ? 'text-orange-600' : 'text-gray-300'
              return (
                <motion.tr
                  key={c.rank}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.13, ease: EASE_OUT, delay: i * 0.03 }}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-bold ${rankColor}`}>{c.rank}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-xs font-bold">{c.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.company}</p>
                        <Badge color={planColor[c.plan]}>{c.plan}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-bold text-gray-900">{fmtN(c.messages)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`text-sm font-semibold ${c.deliveryRate >= 97 ? 'text-green-600' : c.deliveryRate >= 94 ? 'text-amber-600' : 'text-red-500'}`}>
                      {c.deliveryRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm text-gray-600">{c.readRate}%</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Bot size={12} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{c.bots}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={{ duration: 0.6, ease: EASE_OUT, delay: i * 0.04 }}
                        className="h-full rounded-full bg-green-500"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 text-right mt-0.5">{share.toFixed(0)}%</p>
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

/* ─── Main ───────────────────────────────────────────────── */

export default function PlatformOverview() {
  const totalMessages   = msgVolumeData.reduce((s, d) => s + d.messages, 0)
  const activeBots      = TOP_CLIENTS.reduce((s, c) => s + c.bots, 0)
  const avgDelivery     = (TOP_CLIENTS.reduce((s, c) => s + c.deliveryRate, 0) / TOP_CLIENTS.length).toFixed(1)
  const avgRead         = (TOP_CLIENTS.reduce((s, c) => s + c.readRate, 0) / TOP_CLIENTS.length).toFixed(1)

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Analytics"
        description="Platform-wide messaging, delivery trends and top client activity"
        breadcrumbs={['Admin', 'System Analytics', 'Overview']}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI index={0} title="Total Messages Sent" value={fmtN(totalMessages)} sub="platform-wide, last 12 months" delta="+22.4% YoY" positive icon={MessageSquare} bg="bg-green-50 text-green-600" />
        <KPI index={1} title="Active Bots" value={activeBots} sub="chatbot flows running" delta="+12 this month" positive icon={Bot} bg="bg-purple-50 text-purple-600" />
        <KPI index={2} title="Avg Delivery Rate" value={`${avgDelivery}%`} sub="across all clients" delta="+0.8% vs last month" positive icon={CheckCircle2} bg="bg-blue-50 text-blue-600" />
        <KPI index={3} title="Avg Read Rate" value={`${avgRead}%`} sub="across all clients" delta="+1.2% vs last month" positive icon={Eye} bg="bg-indigo-50 text-indigo-600" />
      </div>

      {/* Delivery/read/failure trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LineChart
            data={deliveryTrendData}
            lines={[
              { key: 'delivered', color: '#16a34a', label: 'Delivered' },
              { key: 'read',      color: '#3b82f6', label: 'Read' },
              { key: 'failed',    color: '#ef4444', label: 'Failed' },
            ]}
            title="Delivery / Read / Failure Trends — Last 30 Days"
          />
        </div>
        <DeliveryBreakdown />
      </div>

      {/* Total messages platform-wide — monthly volume */}
      <BarChart
        data={msgVolumeData}
        bars={[{ key: 'messages', color: '#16a34a', label: 'Messages Sent' }]}
        title="Total Messages Sent Platform-wide — Last 12 Months"
      />

      {/* Top active clients */}
      <TopClientsTable />
    </div>
  )
}
