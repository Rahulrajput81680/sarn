import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings2, Tag, Receipt, Plus, X, ChevronDown,
  CheckCircle2, Pencil, Trash2, ToggleLeft, ToggleRight, Copy,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Coupons ─────────────────────────────────────────────── */
const INIT_COUPONS = [
  { id: 1, code: 'LAUNCH50',  type: 'percent', value: 50, plans: ['Starter', 'Growth'],    maxUses: 100, used: 47, expiry: 'Jul 31, 2026', firstTime: true,  active: true  },
  { id: 2, code: 'ENTER500',  type: 'flat',    value: 500, plans: ['Enterprise'],           maxUses: 20,  used: 8,  expiry: 'Aug 31, 2026', firstTime: false, active: true  },
  { id: 3, code: 'ANNUAL20',  type: 'percent', value: 20, plans: ['Starter', 'Growth', 'Enterprise'], maxUses: null, used: 182, expiry: 'Dec 31, 2026', firstTime: false, active: true  },
  { id: 4, code: 'DIWALI25',  type: 'percent', value: 25, plans: ['Growth', 'Enterprise'], maxUses: 50,  used: 50, expiry: 'Nov 5, 2025',  firstTime: false, active: false },
  { id: 5, code: 'WELCOME999',type: 'flat',    value: 999, plans: ['Starter'],              maxUses: 200, used: 134,expiry: 'Sep 30, 2026', firstTime: true,  active: true  },
]

const ALL_PLANS = ['Starter', 'Growth', 'Enterprise']

function genCode() {
  return 'PROMO' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

/* ─── Tax settings ────────────────────────────────────────── */
const INIT_TAX = {
  gstEnabled:      true,
  gstin:           '29AADCS0472M1ZK',
  state:           'Karnataka',
  hsnCode:         '998314',
  includeInPrice:  false,
  taxRates:        { Starter: 18, Growth: 18, Enterprise: 18 },
  invoiceNote:     'GST applicable as per Indian tax laws. CGST 9% + SGST 9% for intra-state supply.',
  effectiveFrom:   '2026-04-01',
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi',
]

/* ─── Coupon Modal ─────────────────────────────────────────── */
function CouponModal({ coupon, onClose, onSave }) {
  const editing = !!coupon
  const [code,      setCode]     = useState(coupon?.code     || genCode())
  const [type,      setType]     = useState(coupon?.type     || 'percent')
  const [value,     setValue]    = useState(coupon?.value    || '')
  const [plans,     setPlans]    = useState(coupon?.plans    || [])
  const [maxUses,   setMaxUses]  = useState(coupon?.maxUses  || '')
  const [expiry,    setExpiry]   = useState(coupon?.expiry   || '')
  const [firstTime, setFirst]    = useState(coupon?.firstTime|| false)

  function togglePlan(p) {
    setPlans((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  function submit() {
    if (!value || plans.length === 0) return
    onSave({
      id:       coupon?.id || Date.now(),
      code:     code.toUpperCase(),
      type, value: Number(value), plans,
      maxUses:  maxUses ? Number(maxUses) : null,
      used:     coupon?.used || 0,
      expiry:   expiry || 'No expiry',
      firstTime,
      active:   coupon?.active ?? true,
    })
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
          <p className="text-base font-bold text-gray-900">{editing ? 'Edit Coupon' : 'Create Coupon'}</p>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Coupon Code</label>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 uppercase" />
              <button onClick={() => setCode(genCode())}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">Auto</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Discount Type</label>
              <div className="relative">
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Value {type === 'percent' ? '(%)' : '(₹)'}
              </label>
              <input value={value} onChange={(e) => setValue(e.target.value)} type="number" placeholder={type === 'percent' ? '20' : '500'}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Applicable Plans</label>
            <div className="flex gap-2">
              {ALL_PLANS.map((p) => (
                <button key={p} onClick={() => togglePlan(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all ${plans.includes(p) ? 'border-green-400 bg-green-100 text-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Max Uses (blank = unlimited)</label>
              <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" placeholder="Unlimited"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Expiry Date</label>
              <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="Dec 31, 2026"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button onClick={() => setFirst((v) => !v)}
              className={`w-9 h-5 rounded-full transition-colors relative ${firstTime ? 'bg-green-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${firstTime ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
            <span className="text-xs font-medium text-gray-700">First-time subscribers only</span>
          </label>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={submit}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
            {editing ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

/* ─── Toggle switch ────────────────────────────────────────── */
function Switch({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-green-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-1'}`} />
    </button>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function PaymentConfig() {
  const [tab,      setTab]     = useState('coupons')
  const [coupons,  setCoupons] = useState(INIT_COUPONS)
  const [tax,      setTax]     = useState(INIT_TAX)
  const [editC,    setEditC]   = useState(null)
  const [showNew,  setShowNew] = useState(false)
  const [saved,    setSaved]   = useState(false)
  const [copiedId, setCopied]  = useState(null)

  function saveCoupon(c) {
    setCoupons((prev) => prev.some((x) => x.id === c.id)
      ? prev.map((x) => x.id === c.id ? c : x)
      : [c, ...prev]
    )
    setEditC(null)
    setShowNew(false)
  }

  function deleteCoupon(id) {
    setCoupons((prev) => prev.filter((c) => c.id !== id))
  }

  function toggleCoupon(id) {
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c))
  }

  function copyCode(code, id) {
    navigator.clipboard.writeText(code)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  function saveTax() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function updateTaxRate(plan, val) {
    setTax((prev) => ({ ...prev, taxRates: { ...prev.taxRates, [plan]: Number(val) } }))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Coupon Management & Tax Settings"
        description="Manage discount coupons, GST configuration and tax rates"
        breadcrumbs={['Admin', 'Billing', 'Config']}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'coupons', label: 'Coupon Management', icon: Tag    },
          { key: 'tax',     label: 'Tax Handling',      icon: Receipt },
          { key: 'gateway', label: 'Payment Gateways',  icon: Settings2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Coupon Management ── */}
        {tab === 'coupons' && (
          <motion.div
            key="coupons"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-xs text-gray-500">
                <span><span className="font-bold text-gray-900">{coupons.filter((c) => c.active).length}</span> active</span>
                <span><span className="font-bold text-gray-900">{coupons.filter((c) => !c.active).length}</span> disabled</span>
              </div>
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all"
              >
                <Plus size={14} /> Create Coupon
              </button>
            </div>

            <div className="space-y-2">
              {coupons.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.04 }}
                  className={`bg-white rounded-xl border shadow-sm p-4 ${c.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Code + discount */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900">{c.code}</span>
                        <button onClick={() => copyCode(c.code, c.id)} className="text-gray-400 hover:text-gray-700">
                          {copiedId === c.id ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">
                            {c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}
                          </span>
                          {c.firstTime && <Badge color="blue">First-time only</Badge>}
                          {!c.active && <Badge color="gray">Disabled</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.plans.map((p) => (
                            <span key={p} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Usage + expiry */}
                    <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-800">{c.used}</span>
                        <span>/ {c.maxUses ?? '∞'} uses</span>
                      </div>
                      {c.maxUses && (
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.used >= c.maxUses ? 'bg-red-400' : c.used / c.maxUses > 0.75 ? 'bg-amber-400' : 'bg-green-400'}`}
                            style={{ width: `${Math.min(100, (c.used / c.maxUses) * 100)}%` }}
                          />
                        </div>
                      )}
                      <span className="mt-1">Expires: {c.expiry}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleCoupon(c.id)} title={c.active ? 'Disable' : 'Enable'}>
                        {c.active
                          ? <ToggleRight size={20} className="text-green-500" />
                          : <ToggleLeft size={20} className="text-gray-400" />}
                      </button>
                      <button onClick={() => setEditC(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteCoupon(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {(showNew || editC) && (
                <CouponModal
                  coupon={editC}
                  onClose={() => { setShowNew(false); setEditC(null) }}
                  onSave={saveCoupon}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Tax Handling ── */}
        {tab === 'tax' && (
          <motion.div
            key="tax"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="space-y-4"
          >
            {/* GST config */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
              <p className="text-sm font-bold text-gray-900">GST Configuration</p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Enable GST</p>
                  <p className="text-xs text-gray-400">Adds GST to all invoices and shows tax breakdown</p>
                </div>
                <Switch on={tax.gstEnabled} onChange={(v) => setTax((t) => ({ ...t, gstEnabled: v }))} />
              </div>

              {tax.gstEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-2 border-t border-gray-100"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">GSTIN (GST Identification Number)</label>
                      <input value={tax.gstin} onChange={(e) => setTax((t) => ({ ...t, gstin: e.target.value }))}
                        placeholder="29AADCS0472M1ZK"
                        className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Place of Supply (State)</label>
                      <div className="relative">
                        <select value={tax.state} onChange={(e) => setTax((t) => ({ ...t, state: e.target.value }))}
                          className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
                          {STATES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">HSN / SAC Code</label>
                      <input value={tax.hsnCode} onChange={(e) => setTax((t) => ({ ...t, hsnCode: e.target.value }))}
                        placeholder="998314 (SaaS / software services)"
                        className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
                      <p className="text-[10px] text-gray-400 mt-1">998314 = IT enabled services / SaaS</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Effective From</label>
                      <input type="date" value={tax.effectiveFrom} onChange={(e) => setTax((t) => ({ ...t, effectiveFrom: e.target.value }))}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Include tax in displayed price</p>
                      <p className="text-xs text-gray-400">If enabled, pricing pages show GST-inclusive amounts</p>
                    </div>
                    <Switch on={tax.includeInPrice} onChange={(v) => setTax((t) => ({ ...t, includeInPrice: v }))} />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Tax rates per plan */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-bold text-gray-900 mb-4">GST Rate by Plan</p>
              <p className="text-xs text-gray-400 mb-4">Standard GST rate for SaaS in India is 18% (CGST 9% + SGST 9% for intra-state).</p>
              <div className="space-y-3">
                {ALL_PLANS.map((plan) => (
                  <div key={plan} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge color={{ Starter: 'gray', Growth: 'blue', Enterprise: 'purple' }[plan]}>{plan}</Badge>
                      <span className="text-xs text-gray-500">
                        Base: ₹{plan === 'Starter' ? '999' : plan === 'Growth' ? '2,499' : '7,999'}/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" max="100"
                        value={tax.taxRates[plan]}
                        onChange={(e) => updateTaxRate(plan, e.target.value)}
                        className="w-16 text-sm text-center border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <span className="text-sm text-gray-500">%</span>
                      <div className="text-xs text-gray-400 ml-2">
                        → GST: ₹{Math.round({ Starter: 999, Growth: 2499, Enterprise: 7999 }[plan] * tax.taxRates[plan] / 100).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice note */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-bold text-gray-900 mb-2">Tax Note on Invoices</p>
              <p className="text-xs text-gray-400 mb-3">Shown at the bottom of every generated invoice PDF.</p>
              <textarea
                value={tax.invoiceNote}
                onChange={(e) => setTax((t) => ({ ...t, invoiceNote: e.target.value }))}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveTax}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all"
              >
                {saved ? <><CheckCircle2 size={14} className="text-green-600" /> Saved!</> : 'Save Tax Settings'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Payment Gateways ── */}
        {tab === 'gateway' && (
          <motion.div
            key="gateway"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: EASE_OUT }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {[
              {
                name: 'Razorpay',
                badge: 'Primary',
                fields: [
                  { label: 'Key ID',      placeholder: 'rzp_live_...', type: 'text'     },
                  { label: 'Key Secret',  placeholder: '••••••••',     type: 'password'  },
                  { label: 'Webhook Secret', placeholder: 'whsec_...', type: 'password'  },
                ],
                note: 'Recommended for Indian clients. Supports UPI, cards, net banking.',
              },
              {
                name: 'Stripe',
                badge: 'Secondary',
                fields: [
                  { label: 'Publishable Key', placeholder: 'pk_live_...', type: 'text'    },
                  { label: 'Secret Key',      placeholder: 'sk_live_...', type: 'password' },
                  { label: 'Webhook Secret',  placeholder: 'whsec_...',   type: 'password' },
                ],
                note: 'For international clients. Supports cards and local payment methods globally.',
              },
            ].map((gw) => (
              <div key={gw.name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{gw.name}</p>
                    <Badge color={gw.badge === 'Primary' ? 'green' : 'gray'}>{gw.badge}</Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-4">{gw.note}</p>
                <div className="space-y-3">
                  {gw.fields.map((f) => (
                    <div key={f.label}>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder}
                        className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {}}
                  className="mt-4 w-full py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all"
                >
                  Save {gw.name} Config
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
