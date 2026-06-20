import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Download, Plus, CheckCircle2, XCircle, Clock,
  AlertCircle, RefreshCw, ReceiptText, ChevronDown, X,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Clients ─────────────────────────────────────────────── */
const CLIENTS = [
  { name: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500', plan: 'Enterprise', mrr: 7999 },
  { name: 'TechStart',         avatar: 'TS', color: 'bg-indigo-500', plan: 'Enterprise', mrr: 7999 },
  { name: 'StyleHub',          avatar: 'SH', color: 'bg-pink-500',   plan: 'Growth',     mrr: 2499 },
  { name: 'FoodZone',          avatar: 'FZ', color: 'bg-orange-500', plan: 'Starter',    mrr: 999  },
  { name: 'QuickMart',         avatar: 'QM', color: 'bg-blue-500',   plan: 'Growth',     mrr: 2499 },
  { name: 'MediCare Plus',     avatar: 'MP', color: 'bg-red-500',    plan: 'Growth',     mrr: 2499 },
  { name: 'RapidDeliver',      avatar: 'RD', color: 'bg-cyan-500',   plan: 'Enterprise', mrr: 7999 },
  { name: 'CloudBazaar',       avatar: 'CB', color: 'bg-sky-500',    plan: 'Starter',    mrr: 999  },
]

const PLAN_COLOR = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }
const GST_RATE = 0.18

function gst(base) { return Math.round(base * GST_RATE) }
function total(base) { return base + gst(base) }
function fmtR(n) { return `₹${n.toLocaleString('en-IN')}` }

/* ─── Invoice data ────────────────────────────────────────── */
const RAW = [
  { id: 'INV-2601', cIdx: 0, period: 'Jun 2026', status: 'paid',    paidOn: 'Jun 1',  method: 'Card ••4242' },
  { id: 'INV-2600', cIdx: 1, period: 'Jun 2026', status: 'paid',    paidOn: 'Jun 1',  method: 'Bank Transfer' },
  { id: 'INV-2599', cIdx: 2, period: 'Jun 2026', status: 'failed',  paidOn: null,     method: 'Card ••7841' },
  { id: 'INV-2598', cIdx: 3, period: 'Jun 2026', status: 'pending', paidOn: null,     method: 'UPI' },
  { id: 'INV-2597', cIdx: 4, period: 'Jun 2026', status: 'paid',    paidOn: 'Jun 2',  method: 'UPI' },
  { id: 'INV-2596', cIdx: 5, period: 'Jun 2026', status: 'paid',    paidOn: 'Jun 1',  method: 'Card ••3311' },
  { id: 'INV-2595', cIdx: 6, period: 'Jun 2026', status: 'paid',    paidOn: 'Jun 1',  method: 'Card ••9920' },
  { id: 'INV-2594', cIdx: 7, period: 'Jun 2026', status: 'failed',  paidOn: null,     method: 'UPI' },
  { id: 'INV-2593', cIdx: 0, period: 'May 2026', status: 'paid',    paidOn: 'May 1',  method: 'Card ••4242' },
  { id: 'INV-2592', cIdx: 1, period: 'May 2026', status: 'paid',    paidOn: 'May 1',  method: 'Bank Transfer' },
  { id: 'INV-2591', cIdx: 2, period: 'May 2026', status: 'paid',    paidOn: 'May 3',  method: 'Card ••7841' },
  { id: 'INV-2590', cIdx: 3, period: 'May 2026', status: 'overdue', paidOn: null,     method: 'UPI' },
  { id: 'INV-2589', cIdx: 4, period: 'May 2026', status: 'paid',    paidOn: 'May 2',  method: 'UPI' },
  { id: 'INV-2588', cIdx: 5, period: 'May 2026', status: 'refunded',paidOn: 'May 1',  method: 'Card ••3311' },
  { id: 'INV-2587', cIdx: 6, period: 'May 2026', status: 'paid',    paidOn: 'May 1',  method: 'Card ••9920' },
  { id: 'INV-2586', cIdx: 7, period: 'May 2026', status: 'paid',    paidOn: 'May 2',  method: 'UPI' },
  { id: 'INV-2585', cIdx: 0, period: 'Apr 2026', status: 'paid',    paidOn: 'Apr 1',  method: 'Card ••4242' },
  { id: 'INV-2584', cIdx: 2, period: 'Apr 2026', status: 'paid',    paidOn: 'Apr 2',  method: 'Card ••7841' },
  { id: 'INV-2583', cIdx: 4, period: 'Apr 2026', status: 'paid',    paidOn: 'Apr 1',  method: 'UPI' },
  { id: 'INV-2582', cIdx: 6, period: 'Apr 2026', status: 'paid',    paidOn: 'Apr 1',  method: 'Card ••9920' },
]

const INIT_INVOICES = RAW.map((r) => {
  const c = CLIENTS[r.cIdx]
  const base = c.mrr
  return { ...r, client: c, base, gstAmt: gst(base), totalAmt: total(base) }
})

const STATUS_COLOR = { paid: 'green', failed: 'red', pending: 'yellow', overdue: 'orange', refunded: 'gray' }
const STATUS_ICON  = {
  paid:     <CheckCircle2 size={13} className="text-green-500" />,
  failed:   <XCircle size={13} className="text-red-500" />,
  pending:  <Clock size={13} className="text-yellow-500" />,
  overdue:  <AlertCircle size={13} className="text-orange-500" />,
  refunded: <RefreshCw size={13} className="text-gray-400" />,
}

/* ─── Generate Invoice Modal ──────────────────────────────── */
function GenerateModal({ onClose, onGenerate }) {
  const [cIdx,    setCIdx]   = useState(0)
  const [period,  setPeriod] = useState('Jul 2026')
  const [custom,  setCustom] = useState('')
  const [method,  setMethod] = useState('upi')

  const baseAmt  = custom ? Number(custom) : CLIENTS[cIdx].mrr
  const gstAmt   = gst(baseAmt)
  const totalAmt = total(baseAmt)

  function submit() {
    const inv = {
      id:       `INV-${2602 + Math.floor(Math.random() * 100)}`,
      client:   CLIENTS[cIdx],
      period,
      status:   'pending',
      paidOn:   null,
      method,
      base:     baseAmt,
      gstAmt,
      totalAmt,
    }
    onGenerate(inv)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-bold text-gray-900">Generate Invoice</p>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Client</label>
            <div className="relative">
              <select value={cIdx} onChange={(e) => setCIdx(Number(e.target.value))}
                className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
                {CLIENTS.map((c, i) => <option key={i} value={i}>{c.name} — {c.plan}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Billing Period</label>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. Jul 2026"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Base Amount (₹) <span className="text-gray-400 font-normal">— leave blank to use plan default</span>
            </label>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} type="number" placeholder={`${CLIENTS[cIdx].mrr} (plan default)`}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Payment Method</label>
            <div className="relative">
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="auto">Auto (Razorpay)</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Tax breakdown preview */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Base Amount</span><span className="font-medium">{fmtR(baseAmt)}</span></div>
            <div className="flex justify-between text-gray-500 text-xs"><span>GST @ 18% (CGST 9% + SGST 9%)</span><span>{fmtR(gstAmt)}</span></div>
            <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-2 mt-2"><span>Total</span><span>{fmtR(totalAmt)}</span></div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={submit}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
            Generate
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

/* ─── Mark Paid Modal ─────────────────────────────────────── */
function MarkPaidModal({ inv, onClose, onSave }) {
  const [method, setMethod] = useState('upi')
  const [txnId,  setTxnId] = useState('')
  const [note,   setNote]  = useState('')
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-base font-bold text-gray-900">Mark as Paid</p>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700" /></button>
        </div>
        <p className="text-xs text-gray-400 mb-5">{inv.id} · {inv.client.name} · {fmtR(inv.totalAmt)}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Payment Method</label>
            <div className="relative">
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Transaction / UTR ID</label>
            <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="TXN or UTR reference"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Internal Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Client paid offline via NEFT"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(inv.id, { method, txnId, note })}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
            Confirm Paid
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function InvoiceList() {
  const [invoices,    setInvoices]    = useState(INIT_INVOICES)
  const [search,      setSearch]      = useState('')
  const [statusF,     setStatusF]     = useState('')
  const [periodF,     setPeriodF]     = useState('')
  const [page,        setPage]        = useState(1)
  const [showGen,     setShowGen]     = useState(false)
  const [markInv,     setMarkInv]     = useState(null)
  const perPage = 8

  const periods  = [...new Set(invoices.map((i) => i.period))]

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase()
    const matchQ  = !q || inv.id.toLowerCase().includes(q) || inv.client.name.toLowerCase().includes(q)
    const matchSt = !statusF || inv.status === statusF
    const matchPd = !periodF || inv.period === periodF
    return matchQ && matchSt && matchPd
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  function handleGenerate(inv) {
    setInvoices((prev) => [inv, ...prev])
    setShowGen(false)
  }

  function handleMarkPaid(id, data) {
    setInvoices((prev) => prev.map((inv) =>
      inv.id === id ? { ...inv, status: 'paid', paidOn: 'Today', method: data.method } : inv
    ))
    setMarkInv(null)
  }

  const counts = { paid: 0, pending: 0, failed: 0, overdue: 0, refunded: 0 }
  invoices.forEach((i) => { if (counts[i.status] !== undefined) counts[i.status]++ })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        description="Invoice generation, payment status tracking and manual payment marking"
        breadcrumbs={['Admin', 'Billing', 'Invoices']}
        action={
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => setShowGen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all"
            >
              <Plus size={14} /> Generate Invoice
            </button>
          </div>
        }
      />

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([st, n]) => (
          <button
            key={st}
            onClick={() => { setStatusF((prev) => prev === st ? '' : st); setPage(1) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusF === st ? 'border-gray-400 bg-gray-100 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {STATUS_ICON[st]}
            <span className="capitalize">{st}</span>
            <span className="ml-1 font-bold">{n}</span>
          </button>
        ))}
        {statusF && (
          <button onClick={() => setStatusF('')} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-gray-700 border border-dashed border-gray-300">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search invoice # or client…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div className="relative">
          <select value={periodF} onChange={(e) => { setPeriodF(e.target.value); setPage(1) }}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-700">
            <option value="">All Periods</option>
            {periods.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <span className="self-center text-xs text-gray-400">{filtered.length} invoices</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Invoice #', 'Client', 'Period', 'Base', 'GST (18%)', 'Total', 'Method', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.03 }}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <ReceiptText size={13} className="text-gray-300" />
                      <span className="font-mono text-xs font-medium text-gray-700">{inv.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${inv.client.color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-[10px] font-bold">{inv.client.avatar}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800 whitespace-nowrap">{inv.client.name}</p>
                        <Badge color={PLAN_COLOR[inv.client.plan]} className="text-[10px]">{inv.client.plan}</Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{inv.period}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-700">{fmtR(inv.base)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtR(inv.gstAmt)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmtR(inv.totalAmt)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 capitalize whitespace-nowrap">{inv.method?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICON[inv.status]}
                      <Badge color={STATUS_COLOR[inv.status]} className="capitalize">{inv.status}</Badge>
                    </div>
                    {inv.paidOn && <p className="text-[10px] text-gray-400 mt-0.5">Paid {inv.paidOn}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {(inv.status === 'pending' || inv.status === 'failed' || inv.status === 'overdue') && (
                        <button
                          onClick={() => setMarkInv(inv)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 hover:bg-white/45 transition-all whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button className="px-2 py-1 text-[11px] rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all whitespace-nowrap flex items-center gap-1">
                        <Download size={10} /> PDF
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-400">No invoices match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showGen  && <GenerateModal onClose={() => setShowGen(false)} onGenerate={handleGenerate} />}
        {markInv  && <MarkPaidModal inv={markInv} onClose={() => setMarkInv(null)} onSave={handleMarkPaid} />}
      </AnimatePresence>
    </div>
  )
}
