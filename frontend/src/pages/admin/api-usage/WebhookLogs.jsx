import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, RefreshCw, ChevronRight, X,
  CheckCircle2, XCircle, Clock, RotateCcw, ChevronDown,
  Webhook, Code2,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Event types (Meta WhatsApp webhook events) ─────────── */

const EVENT_TYPES = [
  'messages.received',
  'messages.sent',
  'messages.delivered',
  'messages.read',
  'messages.failed',
  'messages.deleted',
  'statuses.sent',
  'statuses.delivered',
  'statuses.read',
  'statuses.failed',
  'flows.triggered',
  'template.approved',
  'template.rejected',
]

const CLIENTS = ['Flipkart Commerce', 'TechStart', 'StyleHub', 'RapidDeliver', 'FoodZone', 'QuickMart', 'MediCare Plus']

/* ─── Generate realistic webhook log ─────────────────────── */

const RAW_LOGS = Array.from({ length: 80 }, (_, i) => {
  const failed = i % 9 === 0 || i % 13 === 0
  const event  = EVENT_TYPES[i % EVENT_TYPES.length]
  const client = CLIENTS[i % CLIENTS.length]
  const code   = failed ? [500, 422, 408, 429][i % 4] : 200
  const latency= failed ? Math.floor(300 + Math.random() * 600) : Math.floor(40 + Math.random() * 160)
  const retried= failed && i % 3 === 0
  const min    = Math.floor(i / 2)
  const sec    = (i * 7) % 60
  const hour   = 12 + Math.floor(i / 30)
  return {
    id:      i + 1,
    client,
    event,
    status:  failed ? 'failed' : 'success',
    code,
    latency: `${latency}ms`,
    retries: failed ? (retried ? 1 : 0) : 0,
    time:    `Jun 15, 2026 · ${String(hour).padStart(2,'0')}:${String(min % 60).padStart(2,'0')}:${String(sec).padStart(2,'0')}`,
    payload: JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{
        id: `WABA_${i}`,
        changes: [{ value: { messaging_product: 'whatsapp', statuses: [{ id: `msg_${i}`, status: event.split('.')[1], timestamp: Date.now() }] }, field: 'messages' }],
      }],
    }, null, 2),
  }
})

/* ─── Status badge helper ────────────────────────────────── */

const codeColor = (code) => {
  if (code === 200) return 'green'
  if (code === 429) return 'yellow'
  return 'red'
}

/* ─── Payload drawer ─────────────────────────────────────── */

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
              <p className="text-xs text-gray-400">{log.client} · <code className="bg-gray-100 px-1 rounded">{log.event}</code></p>
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
              <p className="font-semibold text-gray-800">{log.latency}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-0.5">Retries</p>
              <p className="font-semibold text-gray-800">{log.retries}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 mb-0.5">Time</p>
              <p className="font-semibold text-gray-800 truncate">{log.time}</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-60">
            <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">{log.payload}</pre>
          </div>

          {log.status === 'failed' && (
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors">
              <RotateCcw size={14} /> Retry Webhook
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function WebhookLogs() {
  const [search, setSearch]       = useState('')
  const [clientF, setClientF]     = useState('all')
  const [eventF, setEventF]       = useState('all')
  const [statusF, setStatusF]     = useState('all')
  const [page, setPage]           = useState(1)
  const [selected, setSelected]   = useState(null)
  const [retried, setRetried]     = useState([])
  const perPage = 15

  const filtered = RAW_LOGS.filter((l) => {
    const q  = search.toLowerCase()
    const mQ = !q || l.client.toLowerCase().includes(q) || l.event.includes(q)
    const mC = clientF === 'all' || l.client === clientF
    const mE = eventF  === 'all' || l.event  === eventF
    const mS = statusF === 'all' || l.status === statusF
    return mQ && mC && mE && mS
  })

  const total   = filtered.length
  const pages   = Math.max(1, Math.ceil(total / perPage))
  const curPage = Math.min(page, pages)
  const paged   = filtered.slice((curPage - 1) * perPage, curPage * perPage)

  const successCount = RAW_LOGS.filter((l) => l.status === 'success').length
  const failedCount  = RAW_LOGS.filter((l) => l.status === 'failed').length
  const successRate  = Math.round((successCount / RAW_LOGS.length) * 100)

  const handleRetry = (id) => {
    setRetried((r) => [...r, id])
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Webhook Logs"
        description="Incoming Meta WhatsApp webhook events across all clients"
        breadcrumbs={['Admin', 'API Usage', 'Webhooks']}
        action={
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',   value: RAW_LOGS.length,           color: 'bg-blue-50 border-blue-200',   text: 'text-blue-700' },
          { label: 'Successful',     value: successCount,              color: 'bg-green-50 border-green-200', text: 'text-green-700' },
          { label: 'Failed',         value: failedCount,               color: 'bg-red-50 border-red-200',     text: 'text-red-700' },
          { label: 'Success Rate',   value: `${successRate}%`,         color: 'bg-gray-50 border-gray-200',   text: 'text-gray-700' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className={`rounded-xl border px-4 py-3 ${color}`}>
            <p className={`text-2xl font-bold ${text}`}>{value}</p>
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
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search client or event…"
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5">
          <Filter size={11} className="text-gray-400" />
          <select value={clientF} onChange={(e) => { setClientF(e.target.value); setPage(1) }} className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer">
            <option value="all">All clients</option>
            {CLIENTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
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

        {(search || clientF !== 'all' || eventF !== 'all' || statusF !== 'all') && (
          <button onClick={() => { setSearch(''); setClientF('all'); setEventF('all'); setStatusF('all'); setPage(1) }} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
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
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400">Retries</th>
                <th className="px-4 py-3 w-32 text-xs font-semibold text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {paged.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.02 }}
                    className={`hover:bg-gray-50/60 transition-colors ${log.status === 'failed' ? 'bg-red-50/20' : ''}`}
                  >
                    {/* Time */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-gray-300 shrink-0" />
                        <span className="text-xs text-gray-500 whitespace-nowrap">{log.time}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-800">{log.client}</span>
                    </td>

                    {/* Event */}
                    <td className="px-4 py-3">
                      <code className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-mono">{log.event}</code>
                    </td>

                    {/* Code */}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold font-mono ${log.code === 200 ? 'text-green-600' : log.code === 429 ? 'text-amber-600' : 'text-red-600'}`}>
                        {log.code}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {log.status === 'success'
                        ? <CheckCircle2 size={14} className="text-green-500 mx-auto" />
                        : <XCircle size={14} className="text-red-500 mx-auto" />
                      }
                    </td>

                    {/* Latency */}
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-medium font-mono ${parseInt(log.latency) > 300 ? 'text-red-500' : parseInt(log.latency) > 150 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {log.latency}
                      </span>
                    </td>

                    {/* Retries */}
                    <td className="px-4 py-3 text-center">
                      {log.retries > 0
                        ? <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{log.retries}×</span>
                        : <span className="text-xs text-gray-300">—</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {log.status === 'failed' && !retried.includes(log.id) && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                          >
                            <RotateCcw size={10} /> Retry
                          </button>
                        )}
                        {retried.includes(log.id) && (
                          <span className="text-[11px] text-green-600 font-medium flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Queued
                          </span>
                        )}
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

              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    <Webhook size={28} className="mx-auto mb-2 text-gray-200" />
                    No events match your filters
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

      {/* Payload drawer */}
      <AnimatePresence>
        {selected && <PayloadDrawer log={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
