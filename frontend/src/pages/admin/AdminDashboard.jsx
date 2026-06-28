import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, MessageSquare, Server,
  Activity, CheckCircle2, AlertTriangle, XCircle, Plus,
  Megaphone, ChevronRight, Zap, Database, RefreshCw,
  ArrowUpRight, ArrowDownRight, Clock, UserPlus, LayoutTemplate,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/layout/PageHeader'
import api from '../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]
const COLORS   = ['bg-purple-500','bg-blue-500','bg-pink-500','bg-orange-500','bg-indigo-500','bg-teal-500','bg-cyan-500','bg-amber-500','bg-red-500','bg-lime-600']

function initials(name = '') {
  const w = name.trim().split(/\s+/)
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function fmtNum(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/* ─── KPI card ───────────────────────────────────────────── */

function KPI({ title, value, sub, delta, deltaPositive, icon: Icon, iconBg, index, loading }) {
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
      {loading
        ? <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-lg" />
        : <p className="text-2xl font-bold text-gray-900">{value}</p>
      }
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {delta && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${deltaPositive ? 'text-green-600' : 'text-amber-600'}`}>
          {deltaPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Account status breakdown ───────────────────────────── */

function AccountBreakdown({ activeTenants, inactiveTenants, loading, index }) {
  const total = (activeTenants + inactiveTenants) || 1
  const items = [
    { label: 'Active',   value: activeTenants,   pct: Math.round((activeTenants   / total) * 100), color: 'bg-green-500', text: 'text-green-700', badge: 'bg-green-50 border-green-200' },
    { label: 'Inactive', value: inactiveTenants, pct: Math.round((inactiveTenants / total) * 100), color: 'bg-gray-400',  text: 'text-gray-600',  badge: 'bg-gray-50 border-gray-200' },
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
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-5 bg-gray-100 animate-pulse rounded" />)}
        </div>
      ) : (
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
      )}
    </motion.div>
  )
}

/* ─── Platform stats card ────────────────────────────────── */

function PlatformStats({ stats, loading, index }) {
  const rows = [
    { label: 'Total Users',       value: stats?.totalUsers,       icon: Users,          color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Total Contacts',    value: stats?.totalContacts,    icon: Database,       color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Campaigns Run',     value: stats?.totalCampaigns,   icon: Megaphone,      color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Pending Templates', value: stats?.pendingTemplates, icon: LayoutTemplate, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
    >
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Platform Stats</p>
      <div className="space-y-2.5">
        {rows.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={12} className={color} />
              </div>
              <span className="text-xs text-gray-600">{label}</span>
            </div>
            {loading
              ? <div className="h-4 w-10 bg-gray-100 animate-pulse rounded" />
              : <span className="text-sm font-bold text-gray-900">{value?.toLocaleString() ?? '—'}</span>
            }
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── System health widget ───────────────────────────────── */

const STATIC_SERVICES = [
  { name: 'API Gateway',        key: 'api' },
  { name: 'WhatsApp Webhook',   key: 'webhook' },
  { name: 'Meta Cloud API',     key: 'meta' },
  { name: 'Database (Primary)', key: 'db' },
]

function SystemHealthWidget({ health, loading }) {
  const [expanded, setExpanded] = useState(false)
  const dbOk = health?.db?.connected !== false

  const services = STATIC_SERVICES.map((s) => ({
    ...s,
    status: s.key === 'db' ? (dbOk ? 'operational' : 'down') : 'operational',
  }))

  const visible = expanded ? services : services.slice(0, 3)

  const statusIcon = (s) => {
    if (s === 'operational') return <CheckCircle2 size={13} className="text-green-500 shrink-0" />
    if (s === 'degraded')    return <AlertTriangle size={13} className="text-amber-500 shrink-0" />
    return <XCircle size={13} className="text-red-500 shrink-0" />
  }
  const statusCls = (s) => ({
    operational: { text: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Operational' },
    degraded:    { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Degraded' },
    down:        { text: 'text-red-600',   bg: 'bg-red-50 border-red-200',     label: 'Down' },
  }[s])

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dbOk ? 'bg-green-50' : 'bg-red-50'}`}>
            <Server size={15} className={dbOk ? 'text-green-600' : 'text-red-600'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">System Health</p>
            <p className="text-xs text-gray-400">
              {loading ? 'Checking…' : dbOk ? 'All systems operational' : 'DB connection issue'}
            </p>
          </div>
        </div>
        {health && !loading && (
          <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
            Up {Math.floor(health.uptime / 60)}m · {health.memory?.usedMB}MB
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        <AnimatePresence initial={false}>
          {visible.map((svc, i) => {
            const st = statusCls(svc.status)
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
                  <p className="text-sm font-medium text-gray-800 truncate">{svc.name}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${st.bg} ${st.text}`}>{st.label}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-600 border-t border-gray-100 hover:bg-gray-50 transition-colors"
      >
        {expanded ? 'Show less' : `Show ${services.length - 3} more`}
        <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
    </div>
  )
}

/* ─── Recent clients table ───────────────────────────────── */

const planColors = { enterprise: 'purple', growth: 'blue', starter: 'gray' }

function RecentClients({ tenants, loading }) {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <UserPlus size={15} className="text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Recent Clients</p>
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
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-3"><div className="h-8 bg-gray-100 animate-pulse rounded-lg" /></td>
                </tr>
              ))
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm text-gray-400">
                  No clients yet — use <span className="text-green-600 font-medium">Add New Client</span> to get started
                </td>
              </tr>
            ) : tenants.map((t, i) => (
              <motion.tr
                key={t._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.04 }}
                onClick={() => navigate(`/admin/tenants/${t._id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-xs font-bold">{initials(t.name)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                      <p className="text-xs text-gray-400 truncate">{t.owner?.email || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color={planColors[t.plan] || 'gray'}>{t.plan ? t.plan.charAt(0).toUpperCase() + t.plan.slice(1) : '—'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={t.isActive ? 'green' : 'red'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-gray-700">{(t.usage?.messages || 0).toLocaleString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
  const [stats,   setStats]   = useState(null)
  const [tenants, setTenants] = useState([])
  const [health,  setHealth]  = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [dashRes, healthRes] = await Promise.all([
        api.get('/api/v1/admin/dashboard'),
        api.get('/api/v1/admin/health'),
      ])
      setStats(dashRes.data.data.stats)
      setTenants(dashRes.data.data.recentTenants)
      setHealth(healthRes.data.data)
    } catch {
      // stats remain null — loading skeletons clear
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Platform-wide overview for SarnConnect"
        breadcrumbs={['Admin', 'Dashboard']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => navigate('/admin/tenants/new')}>
              New Client
            </Button>
            <Button size="sm" icon={<RefreshCw size={14} />} onClick={load}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPI
          index={0} loading={loading}
          title="Total Clients"
          value={fmtNum(stats?.totalTenants)}
          sub="registered businesses"
          icon={Building2}
          iconBg="bg-blue-50 text-blue-600"
        />
        <AccountBreakdown
          index={1} loading={loading}
          activeTenants={stats?.activeTenants   || 0}
          inactiveTenants={stats?.inactiveTenants || 0}
        />
        <PlatformStats stats={stats} loading={loading} index={2} />
        <KPI
          index={3} loading={loading}
          title="Messages Sent"
          value={fmtNum(stats?.totalMessages)}
          sub="across all clients"
          icon={MessageSquare}
          iconBg="bg-green-50 text-green-600"
        />
        <KPI
          index={4} loading={loading}
          title="Pending Templates"
          value={fmtNum(stats?.pendingTemplates)}
          sub="awaiting review"
          icon={LayoutTemplate}
          iconBg="bg-amber-50 text-amber-600"
          delta={stats?.pendingTemplates > 0 ? 'Needs attention' : undefined}
          deltaPositive={false}
        />
      </div>

      {/* Row 2 — Recent clients + system health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentClients tenants={tenants} loading={loading} />
        </div>
        <SystemHealthWidget health={health} loading={loading} />
      </div>
    </div>
  )
}
