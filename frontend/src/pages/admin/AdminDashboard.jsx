import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, MessageSquare, TrendingUp, Server,
  Activity, CheckCircle2, AlertTriangle, XCircle, Plus,
  Megaphone, ChevronRight, Zap, Database, Globe, RefreshCw,
  ArrowUpRight, ArrowDownRight, Clock, UserPlus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Static data ────────────────────────────────────────── */

const msgData = Array.from({ length: 30 }, (_, i) => ({
  name: `D${i + 1}`,
  value: Math.floor(82000 + i * 1200 + Math.random() * 4000),
}))

const mrrData = [
  { name: 'Nov', value: 38400 }, { name: 'Dec', value: 41200 },
  { name: 'Jan', value: 42800 }, { name: 'Feb', value: 44100 },
  { name: 'Mar', value: 45600 }, { name: 'Apr', value: 47300 },
  { name: 'May', value: 48200 }, { name: 'Jun', value: 51400 },
]

const signupData = [
  { name: 'Nov', value: 35 }, { name: 'Dec', value: 41 },
  { name: 'Jan', value: 38 }, { name: 'Feb', value: 44 },
  { name: 'Mar', value: 52 }, { name: 'Apr', value: 49 },
  { name: 'May', value: 61 }, { name: 'Jun', value: 28 },
]

const RECENT_SIGNUPS = [
  { id: 1, name: 'Flipkart Commerce', owner: 'raj@flipkart.com',   plan: 'Enterprise', status: 'active',  joined: 'Jun 12, 2026', messages: '12,400', avatar: 'FC', color: 'bg-purple-500' },
  { id: 2, name: 'QuickMart',         owner: 'info@quickmart.in',  plan: 'Growth',     status: 'trial',   joined: 'Jun 11, 2026', messages: '3,210',  avatar: 'QM', color: 'bg-blue-500'   },
  { id: 3, name: 'StyleHub',          owner: 'hello@stylehub.co',  plan: 'Growth',     status: 'active',  joined: 'Jun 10, 2026', messages: '8,720',  avatar: 'SH', color: 'bg-pink-500'   },
  { id: 4, name: 'FoodZone',          owner: 'ops@foodzone.in',    plan: 'Starter',    status: 'active',  joined: 'Jun 9, 2026',  messages: '1,850',  avatar: 'FZ', color: 'bg-orange-500' },
  { id: 5, name: 'TechStart',         owner: 'ceo@techstart.io',   plan: 'Enterprise', status: 'active',  joined: 'Jun 8, 2026',  messages: '21,300', avatar: 'TS', color: 'bg-indigo-500' },
  { id: 6, name: 'GreenLeaf',         owner: 'admin@greenleaf.com',plan: 'Starter',    status: 'expired', joined: 'Jun 7, 2026',  messages: '490',    avatar: 'GL', color: 'bg-gray-400'   },
]

const HEALTH_SERVICES = [
  { name: 'API Gateway',        status: 'operational', latency: '42ms',  uptime: '99.98%' },
  { name: 'WhatsApp Webhook',   status: 'operational', latency: '68ms',  uptime: '99.95%' },
  { name: 'Meta Cloud API',     status: 'degraded',    latency: '310ms', uptime: '99.71%', note: 'Elevated latency in ap-south-1' },
  { name: 'Message Queue',      status: 'operational', latency: '12ms',  uptime: '99.99%' },
  { name: 'Database (Primary)', status: 'operational', latency: '8ms',   uptime: '100%'   },
  { name: 'Database (Replica)', status: 'operational', latency: '11ms',  uptime: '100%'   },
  { name: 'Storage / CDN',      status: 'operational', latency: '28ms',  uptime: '99.97%' },
]

const planColors   = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }
const statusColors = { active: 'green', trial: 'yellow', expired: 'red' }

/* ─── KPI card ───────────────────────────────────────────── */

function KPI({ title, value, sub, delta, deltaPositive, icon: Icon, iconBg, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {delta && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${deltaPositive ? 'text-green-600' : 'text-red-500'}`}>
          {deltaPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Account status breakdown card ─────────────────────── */

function AccountBreakdown({ index }) {
  const items = [
    { label: 'Active',  value: 187, pct: 82, color: 'bg-green-500',  text: 'text-green-700',  badge: 'bg-green-50 border-green-200' },
    { label: 'Trial',   value: 29,  pct: 13, color: 'bg-amber-400',  text: 'text-amber-700',  badge: 'bg-amber-50 border-amber-200' },
    { label: 'Expired', value: 12,  pct: 5,  color: 'bg-red-400',    text: 'text-red-600',    badge: 'bg-red-50 border-red-200' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Status</p>
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Activity size={16} className="text-blue-600" />
        </div>
      </div>
      <div className="space-y-2.5">
        {items.map(({ label, value, pct, color, text, badge }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge} ${text}`}>{label}</span>
              <span className="text-xs font-bold text-gray-800">{value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: index * 0.05 + 0.2 }}
                className={`h-full rounded-full ${color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── MRR / ARR card ─────────────────────────────────────── */

function RevenueCard({ index }) {
  const MRR = 51400
  const ARR = MRR * 12
  const mrrGrowth = '+6.7%'
  const churnRate = '1.8%'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</p>
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
          <TrendingUp size={16} className="text-green-600" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-2.5 bg-green-50 rounded-xl border border-green-100">
          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-0.5">MRR</p>
          <p className="text-lg font-bold text-gray-900">₹{(MRR / 1000).toFixed(1)}K</p>
          <p className="text-xs text-green-600 font-medium flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight size={10} />{mrrGrowth} vs last mo
          </p>
        </div>
        <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-0.5">ARR</p>
          <p className="text-lg font-bold text-gray-900">₹{(ARR / 100000).toFixed(2)}L</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Annualised</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
        <span className="text-gray-400">Churn rate</span>
        <span className="font-semibold text-red-500">{churnRate} / mo</span>
      </div>
    </motion.div>
  )
}

/* ─── System health widget ───────────────────────────────── */

function SystemHealth() {
  const [expanded, setExpanded] = useState(false)
  const overallOk = HEALTH_SERVICES.every((s) => s.status === 'operational')
  const degraded  = HEALTH_SERVICES.filter((s) => s.status === 'degraded').length
  const visible   = expanded ? HEALTH_SERVICES : HEALTH_SERVICES.slice(0, 4)

  const statusIcon = (s) => {
    if (s === 'operational') return <CheckCircle2 size={13} className="text-green-500 shrink-0" />
    if (s === 'degraded')    return <AlertTriangle size={13} className="text-amber-500 shrink-0" />
    return <XCircle size={13} className="text-red-500 shrink-0" />
  }
  const statusLabel = (s) => ({
    operational: { text: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Operational' },
    degraded:    { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Degraded' },
    down:        { text: 'text-red-600',   bg: 'bg-red-50 border-red-200',     label: 'Down' },
  }[s])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${overallOk ? 'bg-green-50' : 'bg-amber-50'}`}>
            <Server size={15} className={overallOk ? 'text-green-600' : 'text-amber-600'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">System Health</p>
            <p className="text-xs text-gray-400">
              {overallOk ? 'All systems operational' : `${degraded} service${degraded > 1 ? 's' : ''} degraded`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${overallOk ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {overallOk ? '● All Good' : '⚠ Issues Detected'}
          </span>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        <AnimatePresence initial={false}>
          {visible.map((svc, i) => {
            const st = statusLabel(svc.status)
            return (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.04 }}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {statusIcon(svc.status)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{svc.name}</p>
                    {svc.note && <p className="text-xs text-amber-600 truncate">{svc.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-gray-700">{svc.latency}</p>
                    <p className="text-[10px] text-gray-400">latency</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-semibold text-gray-700">{svc.uptime}</p>
                    <p className="text-[10px] text-gray-400">uptime</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 border-t border-gray-100 hover:bg-gray-50 transition-colors"
      >
        {expanded ? 'Show less' : `Show ${HEALTH_SERVICES.length - 4} more services`}
        <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
    </div>
  )
}

/* ─── Recent signups table ───────────────────────────────── */

function RecentSignups() {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <UserPlus size={15} className="text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Recent Signups</p>
        </div>
        <button
          onClick={() => navigate('/admin/tenants')}
          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          View all <ChevronRight size={12} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400">Client</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Plan</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-400">Msgs</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {RECENT_SIGNUPS.map((t, i) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.04 }}
                onClick={() => navigate(`/admin/tenants/${t.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-xs font-bold">{t.avatar}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                      <p className="text-xs text-gray-400 truncate">{t.owner}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color={planColors[t.plan]}>{t.plan}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={statusColors[t.status]}>{t.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-gray-700">{t.messages}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> {t.joined}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Platform-wide overview for Wixabotic"
        breadcrumbs={['Admin', 'Dashboard']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/admin/tenants/new')}>
              New Client
            </Button>
            <Button size="sm" icon={<Megaphone size={14} />} onClick={() => navigate('/admin/announcements')}>
              Announce
            </Button>
          </div>
        }
      />

      {/* Row 1 — 5 KPI widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPI
          index={0}
          title="Total Clients"
          value="228"
          sub="across all plans"
          delta="+8 this month"
          deltaPositive
          icon={Building2}
          iconBg="bg-blue-50 text-blue-600"
        />
        <AccountBreakdown index={1} />
        <RevenueCard index={2} />
        <KPI
          index={3}
          title="API Requests"
          value="4.2M"
          sub="this month"
          delta="+18% vs last month"
          deltaPositive
          icon={Zap}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPI
          index={4}
          title="Messages Processed"
          value="2.84M"
          sub="this month"
          delta="+11.4% vs last month"
          deltaPositive
          icon={MessageSquare}
          iconBg="bg-green-50 text-green-600"
        />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LineChart
            data={msgData}
            lines={[{ key: 'value', color: '#16a34a', label: 'Messages Processed' }]}
            title="Messages Processed — Last 30 Days"
          />
        </div>
        <LineChart
          data={mrrData}
          lines={[{ key: 'value', color: '#8b5cf6', label: 'MRR (₹)' }]}
          title="MRR Trend (Last 8 Months)"
        />
      </div>

      {/* Row 3 — System health + Signups bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SystemHealth />
        </div>
        <BarChart
          data={signupData}
          bars={[{ key: 'value', color: '#3b82f6', label: 'New Clients' }]}
          title="New Signups (Last 8 Months)"
        />
      </div>

      {/* Row 4 — Recent signups table */}
      <RecentSignups />
    </div>
  )
}
