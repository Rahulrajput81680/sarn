import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, RefreshCw, ChevronRight, X,
  CheckCircle2, XCircle, Clock, RotateCcw, ChevronDown,
  Webhook, Code2,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'
import api from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

const EVENT_TYPES = [
  'messages.received',
  'messages.sent',
  'messages.delivered',
  'messages.read',
  'messages.failed',
]

const codeColor = (code) => {
  if (code === 200) return 'green'
  if (code === 429) return 'yellow'
  return 'red'
}

function fmtTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString()
}

function PayloadDrawer({ log, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Code2 size={14} className="text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Webhook Payload</p>
              <p className="text-xs text-gray-400">{log.tenant?.name || 'Unknown'} · <code className="bg-gray-100 px-1 rounded">{log.event}</code></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={codeColor(log.code)}>{log.code}</Badge>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-0.5">Latency</p>
              <p className="font-semibold text-gray-800">{log.latencyMs ?? 0}ms</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-0.5">Retries</p>
              <p className="font-semibold text-gray-800">{log.retries ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-0.5">Time</p>
              <p className="font-semibold text-gray-800 truncate">{fmtTime(log.createdAt)}</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-60">
            <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
              {log.payload ? JSON.stringify(log.payload, null, 2) : log.error || '(no payload)'}
            </pre>
          </div>

          {log.status === 'failed' && log.error && (
            <div className="bg-red-50 rounded-xl p-3 border border-red-200">
              <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
              <p className="text-xs text-red-600 font-mono">{log.error}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function WebhookLogs() {
  const [logs,     setLogs]    = useState([])
  const [stats,    setStats]   = useState({ total: 0, successCount: 0, failedCount: 0, successRate: 100 })
  const [loading,  setLoading] = useState(true)
  const [spinning, setSpinning]= useState(false)
  const [search,   setSearch]  = useState('')
  const [eventF,   setEventF]  = useState('all')
  const [statusF,  setStatusF] = useState('all')
  const [page,     setPage]    = useState(1)
  const [total,    setTotal]   = useState(0)
  const [selected, setSelected]= useState(null)
  const perPage = 15

  const load = useCallback(async () => {
    setSpinning(true)
    try {
      const params = new URLSearchParams({ page, limit: perPage })
      if (eventF  !== 'all') params.set('event',  eventF)
      if (statusF !== 'all') params.set('status', statusF)

      const { data } = await api.get(`/api/v1/admin/webhook-logs?${params}`)
      const d = data.data || {}
      setLogs(d.logs || [])
      setTotal(d.total || 0)
      setStats({
        total:        d.total        || 0,
        successCount: d.successCount || 0,
        failedCount:  d.failedCount  || 0,
        successRate:  d.successRate  ?? 100,
      })
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
      setSpinning(false)
    }
  }, [page, eventF, statusF])

  useEffect(() => { load() }, [load])

  const filtered = logs.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (l.tenant?.name || '').toLowerCase().includes(q) || l.event.includes(q)
  })

  const pages   = Math.max(1, Math.ceil(total / perPage))
  const curPage = Math.min(page, pages)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Webhook Logs"
        description="Incoming Meta WhatsApp webhook events across all clients"
        breadcrumbs={['Admin', 'API Usage', 'Webhooks']}
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

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',  value: stats.total,        color: 'bg-blue-50 border-blue-200',   text: 'text-blue-700' },
          { label: 'Successful',    value: stats.successCount, color: 'bg-green-50 border-green-200', text: 'text-green-700' },
          { label: 'Failed',        value: stats.failedCount,  color: 'bg-red-50 border-red-200',     text: 'text-red-700' },
          { label: 'Success Rate',  value: `${stats.successRate}%`, color: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
            <p className={`text-2xl font-bold ${text}`}>{loading ? '—' : value}</p>
            <p className={`text-xs font-medium ${text} opacity-70`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-44 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client or event…"
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5">
          <select value={eventF} onChange={(e) => { setEventF(e.target.value); setPage(1) }} className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer max-w-[160px]">
            <option value="all">All events</option>
            {EVENT_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5">
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1) }} className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer">
            <option value="all">All status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {(search || eventF !== 'all' || statusF !== 'all') && (
          <button onClick={() => { setSearch(''); setEventF('all'); setStatusF('all'); setPage(1) }} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
        )}
        <span className="ml-auto text-xs text-gray-400">{total} event{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Event</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">Code</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">Latency</th>
                <th className="px-4 py-3 w-32 text-xs font-semibold text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.map((log, i) => (
                  <motion.tr
                    key={log._id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.02 }}
                    className={`hover:bg-gray-50/60 transition-colors ${log.status === 'failed' ? 'bg-red-50/20' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-gray-300 shrink-0" />
                        <span className="text-xs text-gray-500 whitespace-nowrap">{fmtTime(log.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-800">{log.tenant?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-mono">{log.event}</code>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold font-mono ${log.code === 200 ? 'text-green-600' : log.code === 429 ? 'text-amber-600' : 'text-red-600'}`}>
                        {log.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.status === 'success'
                        ? <CheckCircle2 size={14} className="text-green-500 mx-auto" />
                        : <XCircle size={14} className="text-red-500 mx-auto" />
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-medium font-mono ${(log.latencyMs || 0) > 300 ? 'text-red-500' : (log.latencyMs || 0) > 150 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {log.latencyMs ?? 0}ms
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setSelected(log)}
                          className="flex items-center gap-0.5 text-[11px] font-medium px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          View <ChevronRight size={10} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Webhook size={32} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-sm font-medium text-gray-400">No webhook events yet</p>
                    <p className="text-xs text-gray-300 mt-1">Events will appear here when Meta sends messages to your webhook</p>
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
              {Array.from({ length: Math.min(pages, 6) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${p === curPage ? 'bg-green-500 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={curPage === pages} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <PayloadDrawer log={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
