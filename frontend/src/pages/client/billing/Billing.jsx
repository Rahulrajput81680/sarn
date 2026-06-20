import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Download, Zap, RefreshCw, CheckCircle, AlertCircle,
  ArrowUpRight, ArrowDownRight, X, ChevronRight, MessageSquare,
  Users, BarChart2, Shield, Clock, FileText,
} from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 999,
    color: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-600 border border-gray-200',
    features: ['5,000 messages/mo', '500 contacts', '1 WhatsApp number', 'Basic templates', 'Email support'],
    credits: 5000,
    conversations: 500,
    contacts: 500,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 2499,
    color: 'text-green-700',
    badge: 'bg-green-100 text-green-700 border border-green-300',
    features: ['25,000 messages/mo', '5,000 contacts', '3 WhatsApp numbers', 'Advanced templates', 'Priority support', 'Analytics dashboard'],
    credits: 25000,
    conversations: 2500,
    contacts: 5000,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 7999,
    color: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700 border border-purple-200',
    features: ['Unlimited messages', 'Unlimited contacts', 'Unlimited numbers', 'Custom templates', 'Dedicated manager', 'Custom integrations', 'SLA guarantee'],
    credits: Infinity,
    conversations: Infinity,
    contacts: Infinity,
  },
]

const INVOICES = [
  { id: 'INV-2026-06', period: 'June 2026',    amount: 2499, status: 'paid',    date: 'Jun 1, 2026' },
  { id: 'INV-2026-05', period: 'May 2026',     amount: 2499, status: 'paid',    date: 'May 1, 2026' },
  { id: 'INV-2026-04', period: 'April 2026',   amount: 2499, status: 'paid',    date: 'Apr 1, 2026' },
  { id: 'INV-2026-03', period: 'March 2026',   amount: 999,  status: 'paid',    date: 'Mar 1, 2026' },
  { id: 'INV-2026-02', period: 'February 2026',amount: 999,  status: 'paid',    date: 'Feb 1, 2026' },
]

const PAYMENT_METHODS = [
  { id: 1, type: 'visa',       last4: '4242', expiry: '12/27', default: true  },
  { id: 2, type: 'mastercard', last4: '8810', expiry: '08/26', default: false },
]

const CURRENT_PLAN_ID = 'growth'

function UsageBar({ label, used, total, icon: Icon, color }) {
  const pct = total === Infinity ? 42 : Math.min(100, Math.round((used / total) * 100))
  const isHigh = pct >= 80
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-xs text-gray-500">
          {total === Infinity ? `${used.toLocaleString()} used` : `${used.toLocaleString()} / ${total.toLocaleString()}`}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
          className={clsx(
            'h-full rounded-full',
            isHigh ? 'bg-orange-400' : 'bg-green-500'
          )}
        />
      </div>
      {isHigh && (
        <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
          <AlertCircle size={9} /> {pct}% used — consider upgrading
        </p>
      )}
    </div>
  )
}

function CardIcon({ type }) {
  return (
    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
      <span className="text-[9px] font-bold text-white uppercase tracking-wider">{type}</span>
    </div>
  )
}

export default function Billing() {
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [planModalType, setPlanModalType] = useState('upgrade')
  const [addCardOpen, setAddCardOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [confirmPlan, setConfirmPlan] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState(PAYMENT_METHODS)
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' })

  const currentPlan = PLANS.find((p) => p.id === CURRENT_PLAN_ID)

  const usageData = {
    conversations: { used: 1842, total: currentPlan.conversations },
    contacts:      { used: 3291, total: currentPlan.contacts },
  }

  const openPlanModal = (type) => {
    setPlanModalType(type)
    setSelectedPlan(null)
    setPlanModalOpen(true)
  }

  const handlePlanSelect = (plan) => {
    if (plan.id === CURRENT_PLAN_ID) return
    setSelectedPlan(plan)
    setConfirmPlan(plan)
  }

  const handleSetDefault = (id) =>
    setPaymentMethods((p) => p.map((m) => ({ ...m, default: m.id === id })))

  const handleRemoveCard = (id) =>
    setPaymentMethods((p) => p.filter((m) => m.id !== id))

  const handleAddCard = () => {
    if (!cardForm.number || !cardForm.name) return
    const last4 = cardForm.number.replace(/\s/g, '').slice(-4)
    setPaymentMethods((p) => [...p, {
      id: Date.now(), type: 'visa', last4, expiry: cardForm.expiry || '01/30', default: false,
    }])
    setCardForm({ number: '', name: '', expiry: '', cvv: '' })
    setAddCardOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Subscription" description="Manage your plan, usage, and payment details" />

      {/* ── Plan + Renewal row ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Current Plan card */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{currentPlan.name}</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${currentPlan.badge}`}>Active</span>
                {currentPlan.popular && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">Most Popular</span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                <span className="text-2xl font-bold text-gray-900">₹{currentPlan.price.toLocaleString()}</span>
                <span className="text-gray-400"> / month</span>
              </p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => openPlanModal('downgrade')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
              >
                <ArrowDownRight size={13} /> Downgrade
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => openPlanModal('upgrade')}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-gray-800 shadow-sm shadow-green-500 border-2 border-green-400 text-xs font-semibold rounded-lg hover:bg-white/45"
                style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
              >
                <ArrowUpRight size={13} /> Upgrade Plan
              </motion.button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {currentPlan.features.map((f) => (
                <span key={f} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  <CheckCircle size={10} className="text-green-500" /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Renewal card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Renewal Date</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <RefreshCw size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">July 1, 2026</p>
                <p className="text-xs text-gray-400">15 days remaining</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Auto-renew</span>
              <span className="font-semibold text-green-600 flex items-center gap-1"><CheckCircle size={11} /> Enabled</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Next charge</span>
              <span className="font-semibold text-gray-800">₹2,499</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Billing cycle</span>
              <span className="font-semibold text-gray-800">Monthly</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Usage consumption ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Usage This Month</h3>
            <p className="text-xs text-gray-400 mt-0.5">Resets on July 1, 2026 · Meta charges per conversation, not per message</p>
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={11} /> As of Jun 16, 2026
          </span>
        </div>
        <div className="grid grid-cols-3 gap-8 mb-5">
          <UsageBar
            label="Total Conversations"
            used={usageData.conversations.used}
            total={usageData.conversations.total}
            icon={MessageSquare}
            color="text-blue-500"
          />
          <UsageBar
            label="Contacts"
            used={usageData.contacts.used}
            total={usageData.contacts.total}
            icon={Users}
            color="text-orange-500"
          />
          <UsageBar
            label="Chatbot Sessions"
            used={842}
            total={usageData.conversations.total}
            icon={BarChart2}
            color="text-purple-500"
          />
        </div>
        {/* Conversation type breakdown */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3">Conversations by Type <span className="font-normal text-gray-400">(Meta billing categories)</span></p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Marketing',      count: 1124, color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500', note: 'Paid' },
              { label: 'Utility',        count: 498,  color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500',   note: 'Paid (lower rate)' },
              { label: 'Authentication', count: 87,   color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', note: 'Paid' },
              { label: 'Service',        count: 133,  color: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-500',  note: 'Free (≤1,000/mo)' },
            ].map(({ label, count, color, dot, note }) => (
              <div key={label} className={`p-3 rounded-xl border ${color.split(' ').slice(0, 3).join(' ')}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{count.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Invoices + Payment methods ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Invoice download */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Invoices</h3>
            <span className="text-xs text-gray-400">{INVOICES.length} records</span>
          </div>
          <div className="divide-y divide-gray-50">
            {INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <FileText size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{inv.period}</p>
                    <p className="text-[10px] text-gray-400">{inv.id} · {inv.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">₹{inv.amount.toLocaleString()}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                    Paid
                  </span>
                  <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-all">
                    <Download size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment method management */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Payment Methods</h3>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setAddCardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-gray-800 shadow-sm shadow-green-500 border-2 border-green-400 text-xs font-semibold rounded-lg hover:bg-white/45"
              style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
            >
              + Add Card
            </motion.button>
          </div>

          <div className="p-5 space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={clsx(
                  'flex items-center justify-between p-3.5 rounded-xl border transition-colors',
                  method.default ? 'border-green-300 bg-green-50/40' : 'border-gray-100 bg-gray-50/60'
                )}
              >
                <div className="flex items-center gap-3">
                  <CardIcon type={method.type} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      •••• •••• •••• {method.last4}
                    </p>
                    <p className="text-[10px] text-gray-400">Expires {method.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.default ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-[10px] font-medium text-gray-500 hover:text-green-600 px-2 py-0.5 rounded-full border border-gray-200 hover:border-green-300 transition-colors"
                    >
                      Set default
                    </button>
                  )}
                  {!method.default && (
                    <button
                      onClick={() => handleRemoveCard(method.id)}
                      className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {paymentMethods.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CreditCard size={28} className="mb-2 text-gray-300" />
                <p className="text-xs">No payment methods added</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 text-[10px] text-gray-400">
              <Shield size={11} className="text-green-500" />
              Secured by 256-bit SSL encryption
            </div>
          </div>
        </div>
      </div>

      {/* ── Upgrade / Downgrade modal ── */}
      <AnimatePresence>
        {planModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setPlanModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-2xl p-6 z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {planModalType === 'upgrade' ? 'Upgrade Your Plan' : 'Change Plan'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Currently on <strong>{currentPlan.name}</strong> · Select a plan to switch</p>
                </div>
                <button onClick={() => setPlanModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                  const isCurrent = plan.id === CURRENT_PLAN_ID
                  const isSelected = selectedPlan?.id === plan.id
                  return (
                    <motion.button
                      key={plan.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !isCurrent && handlePlanSelect(plan)}
                      className={clsx(
                        'text-left p-4 rounded-xl border-2 transition-all relative',
                        isCurrent ? 'border-green-400 bg-green-50/60 cursor-default' : 'border-gray-100 hover:border-green-300 bg-white cursor-pointer',
                        isSelected && 'border-green-400 bg-green-50/60'
                      )}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white whitespace-nowrap">
                          Most Popular
                        </span>
                      )}
                      <div className={`text-xs font-bold mb-1 ${plan.color}`}>{plan.name}</div>
                      <div className="text-xl font-bold text-gray-900 mb-0.5">₹{plan.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/mo</span></div>
                      {isCurrent && <span className="text-[9px] font-bold text-green-600 uppercase">Current Plan</span>}
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.slice(0, 4).map((f) => (
                          <li key={f} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                            <CheckCircle size={9} className="text-green-500 mt-0.5 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setPlanModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedPlan}
                  onClick={() => { setPlanModalOpen(false); setSelectedPlan(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-green-100 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedPlan ? `Switch to ${selectedPlan.name}` : 'Select a plan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Card modal ── */}
      <AnimatePresence>
        {addCardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setAddCardOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6 z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Add Payment Method</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Your card details are encrypted</p>
                </div>
                <button onClick={() => setAddCardOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              {/* Card preview */}
              <div
                className="h-36 rounded-2xl p-5 mb-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)' }}
              >
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-4">Card Number</p>
                <p className="text-white text-lg font-mono tracking-widest">
                  {cardForm.number
                    ? cardForm.number.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
                    : '•••• •••• •••• ••••'}
                </p>
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-white/50 text-[9px] uppercase tracking-wider">Cardholder</p>
                    <p className="text-white text-xs font-semibold">{cardForm.name || 'YOUR NAME'}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-[9px] uppercase tracking-wider">Expires</p>
                    <p className="text-white text-xs font-semibold">{cardForm.expiry || 'MM/YY'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Card Number</label>
                  <input
                    value={cardForm.number}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                      setCardForm((f) => ({ ...f, number: v.replace(/(.{4})/g, '$1 ').trim() }))
                    }}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all font-mono tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cardholder Name</label>
                  <input
                    value={cardForm.name}
                    onChange={(e) => setCardForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Name on card"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                    <input
                      value={cardForm.expiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
                        setCardForm((f) => ({ ...f, expiry: v }))
                      }}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">CVV</label>
                    <input
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm((f) => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                      placeholder="•••"
                      type="password"
                      maxLength={3}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-4 mb-5 text-[10px] text-gray-400">
                <Shield size={11} className="text-green-500" /> Secured with 256-bit SSL encryption
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAddCardOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCard}
                  disabled={!cardForm.number || !cardForm.name}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-green-100 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
