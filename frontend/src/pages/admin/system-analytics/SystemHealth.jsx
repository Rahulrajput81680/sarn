import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Server, Database, Wifi, Cpu, MemoryStick,
  Clock, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Activity,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import api from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

function fmtUptime(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${seconds % 60}s`
}

function StatusDot({ ok }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-green-600' : 'text-red-500'}`}>
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
      {ok ? 'Operational' : 'Degraded'}
    </span>
  )
}

function ServiceCard({ icon: Icon, label, ok, detail, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT, delay: index * 0.06 }}
      className={`bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 ${ok ? 'border-gray-100' : 'border-red-200 bg-red-50/30'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
        <Icon size={18} className={ok ? 'text-green-600' : 'text-red-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {ok
            ? <CheckCircle2 size={15} className="text-green-500 shrink-0" />
            : <XCircle size={15} className="text-red-500 shrink-0" />
          }
        </div>
        <StatusDot ok={ok} />
        {detail && <p className="text-xs text-gray-400 mt-1.5">{detail}</p>}
      </div>
    </motion.div>
  )
}

function KPICard({ icon: Icon, label, value, sub, color, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function SystemHealth() {
  const [health,     setHealth]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [spinning,   setSpinning]   = useState(false)

  const load = useCallback(async () => {
    setSpinning(true)
    try {
      const { data } = await api.get('/api/v1/admin/health')
      setHealth(data.data)
      setLastUpdate(new Date())
    } catch {
      setHealth(null)
    } finally {
      setLoading(false)
      setSpinning(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const memPct = health
    ? Math.round((health.memory.usedMB / health.memory.totalMB) * 100)
    : 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Health"
        description="Live server status, database connectivity and resource usage"
        breadcrumbs={['Admin', 'System', 'Health']}
        action={
          <button
            onClick={load}
            disabled={spinning}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={spinning ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {lastUpdate && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={11} />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {loading ? <Skeleton /> : !health ? (
        <div className="bg-white rounded-xl border border-red-200 p-10 text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-red-600">Unable to reach health endpoint</p>
          <p className="text-xs text-gray-400 mt-1">The backend may be down or unreachable.</p>
          <button onClick={load} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              index={0}
              icon={Clock}
              label="Server Uptime"
              value={fmtUptime(health.uptime)}
              sub="since last restart"
              color="bg-green-50 text-green-600"
            />
            <KPICard
              index={1}
              icon={MemoryStick}
              label="Heap Used"
              value={`${health.memory.usedMB} MB`}
              sub={`of ${health.memory.totalMB} MB (${memPct}%)`}
              color="bg-blue-50 text-blue-600"
            />
            <KPICard
              index={2}
              icon={Cpu}
              label="Heap Total"
              value={`${health.memory.totalMB} MB`}
              sub="total V8 heap allocated"
              color="bg-purple-50 text-purple-600"
            />
            <KPICard
              index={3}
              icon={Activity}
              label="Memory Load"
              value={`${memPct}%`}
              sub={memPct > 80 ? 'High — consider restart' : 'Normal'}
              color={memPct > 80 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}
            />
          </div>

          {/* Memory progress bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Memory Usage</p>
              <span className="text-xs text-gray-400">{health.memory.usedMB} / {health.memory.totalMB} MB</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${memPct}%` }}
                transition={{ duration: 0.8, ease: EASE_OUT }}
                className={`h-full rounded-full ${memPct > 80 ? 'bg-red-500' : memPct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 MB</span>
              <span>{health.memory.totalMB} MB</span>
            </div>
          </div>

          {/* Service status grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ServiceCard
              index={0}
              icon={Server}
              label="API Server"
              ok={true}
              detail="Express.js — responding normally"
            />
            <ServiceCard
              index={1}
              icon={Database}
              label="MongoDB"
              ok={health.db.connected}
              detail={health.db.connected ? 'Connected and accepting queries' : 'Connection lost — check MONGO_URI'}
            />
            <ServiceCard
              index={2}
              icon={Wifi}
              label="Meta Webhook"
              ok={true}
              detail="POST /api/v1/webhooks/meta is active"
            />
          </div>

          {/* Timestamp */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-3 flex items-center gap-2">
            <Clock size={13} className="text-gray-400" />
            <span className="text-xs text-gray-500">
              Health snapshot taken at: <span className="font-mono font-semibold">{health.timestamp}</span>
            </span>
          </div>
        </>
      )}
    </div>
  )
}
