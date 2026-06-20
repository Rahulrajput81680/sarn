import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, Users, AlertTriangle, RefreshCw,
  CheckCircle2, XCircle, Clock, ReceiptText, Settings2,
  ArrowUpRight, CreditCard, BadgeIndianRupee, ChevronRight,
} from 'lucide-react'
import LineChart from '../../../components/charts/LineChart'
import BarChart from '../../../components/charts/BarChart'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Chart data ─────────────────────────────────────────── */
const MRR_DATA = [
  { name: 'Jul', mrr: 38400 }, { name: 'Aug', mrr: 40100 }, { name: 'Sep', mrr: 41200 },
  { name: 'Oct', mrr: 42800 }, { name: 'Nov', mrr: 43500 }, { name: 'Dec', mrr: 44900 },
  { name: 'Jan', mrr: 46200 }, { name: 'Feb', mrr: 47000 }, { name: 'Mar', mrr: 48400 },
  { name: 'Apr', mrr: 49600 }, { name: 'May', mrr: 50800 }, { name: 'Jun', mrr: 51400 },
]

const PLAN_REVENUE = [
  { name: 'Jan', Starter: 8900, Growth: 22400, Enterprise: 14900 },
  { name: 'Feb', Starter: 9100, Growth: 23200, Enterprise: 15700 },
  { name: 'Mar', Starter: 9400, Growth: 24100, Enterprise: 14900 },
  { name: 'Apr', Starter: 9600, Growth: 25200, Enterprise: 14800 },
  { name: 'May', Starter: 9900, Growth: 25700, Enterprise: 15200 },
  { name: 'Jun', Starter: 9990, Growth: 25420, Enterprise: 15990 },
]

/* ─── Failed payments ─────────────────────────────────────── */
const INIT_FAILED = [
  { id: 1, client: 'StyleHub',     avatar: 'SH', color: 'bg-pink-500',   plan: 'Growth',     amount: 2499, attempts: 2, reason: 'Card declined',       nextRetry: 'Jun 17, 10:00 AM', email: 'accounts@stylehub.com'  },
  { id: 2, client: 'FoodZone',     avatar: 'FZ', color: 'bg-orange-500', plan: 'Starter',    amount: 999,  attempts: 1, reason: 'Insufficient funds',   nextRetry: 'Jun 17, 02:00 PM', email: 'billing@foodzone.com'   },
  { id: 3, client: 'EduBridge',    avatar: 'EB', color: 'bg-teal-500',   plan: 'Starter',    amount: 999,  attempts: 3, reason: 'Card expired',         nextRetry: 'Jun 18, 09:00 AM', email: 'admin@edubridge.in'     },
  { id: 4, client: 'LocalMart',    avatar: 'LM', color: 'bg-gray-400',   plan: 'Growth',     amount: 2499, attempts: 1, reason: 'Bank declined — UPI',  nextRetry: 'Jun 17, 06:00 PM', email: 'pay@localmart.com'      },
]

/* ─── Recent transactions ─────────────────────────────────── */
const RECENT_TXN = [
  { id: 'TXN-7041', client: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500', plan: 'Enterprise', amount: 9438, method: 'Card ••4242', status: 'paid',    date: 'Jun 15' },
  { id: 'TXN-7040', client: 'QuickMart',         avatar: 'QM', color: 'bg-blue-500',   plan: 'Growth',     amount: 2948, method: 'UPI',          status: 'paid',    date: 'Jun 15' },
  { id: 'TXN-7039', client: 'TechStart',         avatar: 'TS', color: 'bg-indigo-500', plan: 'Enterprise', amount: 9438, method: 'Bank Transfer', status: 'paid',    date: 'Jun 14' },
  { id: 'TXN-7038', client: 'StyleHub',          avatar: 'SH', color: 'bg-pink-500',   plan: 'Growth',     amount: 2948, method: 'Card ••7841',  status: 'failed',  date: 'Jun 13' },
  { id: 'TXN-7037', client: 'MediCare Plus',     avatar: 'MP', color: 'bg-red-500',    plan: 'Growth',     amount: 2948, method: 'Card ••3311',  status: 'paid',    date: 'Jun 13' },
  { id: 'TXN-7036', client: 'CloudBazaar',       avatar: 'CB', color: 'bg-sky-500',    plan: 'Starter',    amount: 1178, method: 'UPI',          status: 'paid',    date: 'Jun 12' },
  { id: 'TXN-7035', client: 'FoodZone',          avatar: 'FZ', color: 'bg-orange-500', plan: 'Starter',    amount: 1178, method: 'UPI',          status: 'failed',  date: 'Jun 12' },
  { id: 'TXN-7034', client: 'RapidDeliver',      avatar: 'RD', color: 'bg-cyan-500',   plan: 'Enterprise', amount: 9438, method: 'Card ••9920',  status: 'refunded',date: 'Jun 10' },
]

const STATUS_COLOR = { paid: 'green', failed: 'red', pending: 'yellow', refunded: 'gray' }

function fmtR(n) { return `₹${n.toLocaleString('en-IN')}` }

/* ─── MarkPaidModal ───────────────────────────────────────── */
function MarkPaidModal({ item, onClose, onSave }) {
  const [method, setMethod]   = useState('bank_transfer')
  const [txnId,  setTxnId]   = useState('')
  const [note,   setNote]     = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <p className="text-base font-bold text-gray-900 mb-1">Mark as Paid</p>
        <p className="text-xs text-gray-400 mb-5">{item.client} — {fmtR(item.amount)}/mo</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Transaction / Reference ID</label>
            <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. TXN12345 or UTR number"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Internal Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Manual offline payment received"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(item.id, { method, txnId, note })}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
            Mark Paid
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function BillingOverview() {
  const navigate = useNavigate()
  const [failed,  setFailed]   = useState(INIT_FAILED)
  const [retrying, setRetrying] = useState(null)
  const [markItem, setMarkItem] = useState(null)

  function handleRetry(id) {
    setRetrying(id)
    setTimeout(() => {
      setFailed((prev) => prev.map((f) => f.id === id ? { ...f, attempts: f.attempts + 1 } : f))
      setRetrying(null)
    }, 1200)
  }

  function handleMarkPaid(id) {
    setFailed((prev) => prev.filter((f) => f.id !== id))
    setMarkItem(null)
  }

  const taxCollected = Math.round(MRR_DATA[MRR_DATA.length - 1].mrr * 0.18)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing & Payments"
        description="Revenue overview, payment monitoring, failed alerts and manual controls"
        breadcrumbs={['Admin', 'Billing', 'Overview']}
        action={
          <div className="flex gap-2">
            <button onClick={() => navigate('/admin/billing/invoices')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
              <ReceiptText size={14} /> Invoices
            </button>
            <button onClick={() => navigate('/admin/billing/config')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
              <Settings2 size={14} /> Coupons & Tax
            </button>
          </div>
        }
      />

      {/* Failed payment alert banner */}
      {failed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl"
        >
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            {failed.length} failed payment{failed.length > 1 ? 's' : ''} require attention —
            <span className="font-normal text-red-600"> {fmtR(failed.reduce((s, f) => s + f.amount, 0))} at risk</span>
          </p>
        </motion.div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { title: 'MRR',              value: '₹51,400',           sub: '+1.2% vs May',   icon: BadgeIndianRupee, bg: 'bg-green-50 text-green-600', positive: true  },
          { title: 'ARR',              value: '₹6,16,800',         sub: 'annualised',     icon: TrendingUp,       bg: 'bg-blue-50 text-blue-500',   positive: true  },
          { title: 'Paid Clients',     value: '187',               sub: '+4 this month',  icon: Users,            bg: 'bg-indigo-50 text-indigo-500', positive: true },
          { title: 'Failed Payments',  value: String(failed.length), sub: 'needs action', icon: AlertTriangle,    bg: 'bg-red-50 text-red-500',     positive: false },
          { title: 'GST Collected',    value: `₹${taxCollected.toLocaleString('en-IN')}`, sub: '18% GST on MRR', icon: DollarSign, bg: 'bg-amber-50 text-amber-600', positive: true },
        ].map(({ title, value, sub, icon: Icon, bg, positive }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}><Icon size={14} /></div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <div className={`flex items-center gap-0.5 mt-1 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
              <ArrowUpRight size={11} />{sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChart data={MRR_DATA} lines={[{ key: 'mrr', color: '#16a34a', label: 'MRR (₹)' }]} title="MRR Trend — Last 12 Months" />
        <BarChart
          data={PLAN_REVENUE}
          bars={[
            { key: 'Starter',    color: '#94a3b8', label: 'Starter'    },
            { key: 'Growth',     color: '#3b82f6', label: 'Growth'     },
            { key: 'Enterprise', color: '#7c3aed', label: 'Enterprise' },
          ]}
          title="Revenue by Plan — Last 6 Months"
        />
      </div>

      {/* Failed payment alerts */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-900">Failed Payment Alerts</p>
            {failed.length > 0 && <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5">{failed.length}</span>}
          </div>
          <span className="text-xs text-gray-400">Auto-retry scheduled for each</span>
        </div>
        {failed.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-400">
            <CheckCircle2 size={28} className="text-green-400 mb-2" />
            <p className="text-sm">No failed payments — all clear!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {failed.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.14, ease: EASE_OUT, delay: i * 0.04 }}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-xs font-bold">{f.avatar}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{f.client}</p>
                      <span className="text-xs font-semibold text-red-600">{fmtR(f.amount)}/mo</span>
                    </div>
                    <p className="text-xs text-gray-400">{f.reason} · {f.attempts} attempt{f.attempts > 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-400">Next retry: {f.nextRetry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRetry(f.id)}
                    disabled={retrying === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={retrying === f.id ? 'animate-spin' : ''} />
                    Retry
                  </button>
                  <button
                    onClick={() => setMarkItem(f)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all"
                  >
                    <CheckCircle2 size={12} /> Mark Paid
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-900">Recent Transactions</p>
          </div>
          <button onClick={() => navigate('/admin/billing/invoices')} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
            View all invoices <ChevronRight size={13} />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {RECENT_TXN.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.03 }}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${t.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-[10px] font-bold">{t.avatar}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{t.client}</p>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{t.plan}</span>
                  </div>
                  <p className="text-xs text-gray-400">{t.id} · {t.method}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{fmtR(t.amount)}</p>
                  <p className="text-xs text-gray-400">{t.date}</p>
                </div>
                <div className="flex items-center gap-1">
                  {t.status === 'paid' && <CheckCircle2 size={13} className="text-green-500" />}
                  {t.status === 'failed' && <XCircle size={13} className="text-red-500" />}
                  {t.status === 'pending' && <Clock size={13} className="text-yellow-500" />}
                  <Badge color={STATUS_COLOR[t.status]} className="capitalize">{t.status}</Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {markItem && (
          <MarkPaidModal item={markItem} onClose={() => setMarkItem(null)} onSave={handleMarkPaid} />
        )}
      </AnimatePresence>
    </div>
  )
}
