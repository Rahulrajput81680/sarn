import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Building2, Mail, Phone, Calendar, CreditCard,
  MessageSquare, BarChart2, CheckCircle2, PauseCircle, Ban,
  Pencil, Trash2, LogIn, Clock, Save, X, AlertTriangle,
  ShieldCheck, Activity, MessageCircle,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Demo client data ───────────────────────────────────── */

const CLIENTS_MAP = {
  1:  { id: 1,  company: 'Flipkart Commerce',  avatar: 'FC', color: 'bg-purple-500', owner: 'Raj Mehta',    email: 'raj@flipkart.com',      phone: '+91 98100 00001', plan: 'Enterprise', status: 'active',    messages: 124000, conversations: 3841, contacts: 28400, templates: 34, agents: 18, created: 'Jan 5, 2026',  waPhone: '+91 98765 00001', waName: 'Flipkart Support', wabaid: 'WABA_001_FC', metaAppId: 'APP_001', renewsOn: 'Jul 5, 2026',   mrr: 7999 },
  2:  { id: 2,  company: 'QuickMart',           avatar: 'QM', color: 'bg-blue-500',   owner: 'Priya Verma',  email: 'info@quickmart.in',     phone: '+91 98100 00002', plan: 'Growth',     status: 'trial',     messages: 32100,  conversations: 890,  contacts: 4200,  templates: 12, agents: 5,  created: 'Jun 1, 2026',  waPhone: '+91 98765 00002', waName: 'QuickMart Bot',    wabaid: 'WABA_002_QM', metaAppId: 'APP_002', renewsOn: 'Jul 1, 2026',   mrr: 2499 },
  3:  { id: 3,  company: 'StyleHub',            avatar: 'SH', color: 'bg-pink-500',   owner: 'Sneha Kapoor', email: 'hello@stylehub.co',     phone: '+91 98100 00003', plan: 'Growth',     status: 'active',    messages: 87200,  conversations: 2104, contacts: 11200, templates: 21, agents: 8,  created: 'Feb 12, 2026', waPhone: '+91 98765 00003', waName: 'StyleHub CS',      wabaid: 'WABA_003_SH', metaAppId: 'APP_003', renewsOn: 'Aug 12, 2026',  mrr: 2499 },
  4:  { id: 4,  company: 'FoodZone',            avatar: 'FZ', color: 'bg-orange-500', owner: 'Arjun Singh',  email: 'ops@foodzone.in',       phone: '+91 98100 00004', plan: 'Starter',    status: 'active',    messages: 18500,  conversations: 612,  contacts: 2100,  templates: 8,  agents: 3,  created: 'Mar 3, 2026',  waPhone: '+91 98765 00004', waName: 'FoodZone',         wabaid: 'WABA_004_FZ', metaAppId: 'APP_004', renewsOn: 'Sep 3, 2026',   mrr: 999  },
  5:  { id: 5,  company: 'TechStart',           avatar: 'TS', color: 'bg-indigo-500', owner: 'Kunal Shah',   email: 'ceo@techstart.io',      phone: '+91 98100 00005', plan: 'Enterprise', status: 'active',    messages: 213000, conversations: 6120, contacts: 44800, templates: 57, agents: 24, created: 'Nov 20, 2025', waPhone: '+91 98765 00005', waName: 'TechStart AI',     wabaid: 'WABA_005_TS', metaAppId: 'APP_005', renewsOn: 'Dec 20, 2026',  mrr: 7999 },
  6:  { id: 6,  company: 'GreenLeaf',           avatar: 'GL', color: 'bg-green-500',  owner: 'Meera Nair',   email: 'admin@greenleaf.com',   phone: '+91 98100 00006', plan: 'Starter',    status: 'expired',   messages: 4900,   conversations: 148,  contacts: 820,   templates: 4,  agents: 2,  created: 'Apr 7, 2026',  waPhone: '+91 98765 00006', waName: 'GreenLeaf',        wabaid: 'WABA_006_GL', metaAppId: 'APP_006', renewsOn: 'Expired',       mrr: 0    },
  7:  { id: 7,  company: 'RapidDeliver',        avatar: 'RD', color: 'bg-cyan-500',   owner: 'Vikram Patel', email: 'vp@rapiddeliver.com',   phone: '+91 98100 00007', plan: 'Growth',     status: 'active',    messages: 56000,  conversations: 1430, contacts: 8700,  templates: 16, agents: 6,  created: 'Dec 14, 2025', waPhone: '+91 98765 00007', waName: 'RapidDeliver',     wabaid: 'WABA_007_RD', metaAppId: 'APP_007', renewsOn: 'Jan 14, 2027',  mrr: 2499 },
  8:  { id: 8,  company: 'EduBridge',           avatar: 'EB', color: 'bg-teal-500',   owner: 'Ananya Roy',   email: 'info@edubridge.in',     phone: '+91 98100 00008', plan: 'Starter',    status: 'suspended', messages: 2100,   conversations: 70,   contacts: 430,   templates: 3,  agents: 1,  created: 'May 22, 2026', waPhone: '+91 98765 00008', waName: 'EduBridge',        wabaid: 'WABA_008_EB', metaAppId: 'APP_008', renewsOn: 'Jun 22, 2026',  mrr: 999  },
  9:  { id: 9,  company: 'MediCare Plus',       avatar: 'MP', color: 'bg-red-500',    owner: 'Dr. S. Iyer',  email: 'admin@medicareplus.in', phone: '+91 98100 00009', plan: 'Enterprise', status: 'active',    messages: 98400,  conversations: 2910, contacts: 19200, templates: 42, agents: 15, created: 'Oct 9, 2025',  waPhone: '+91 98765 00009', waName: 'MediCare Plus',    wabaid: 'WABA_009_MP', metaAppId: 'APP_009', renewsOn: 'Nov 9, 2026',   mrr: 7999 },
  10: { id: 10, company: 'BrandCraft',          avatar: 'BC', color: 'bg-amber-500',  owner: 'Rohan Gupta',  email: 'hello@brandcraft.co',   phone: '+91 98100 00010', plan: 'Growth',     status: 'trial',     messages: 7800,   conversations: 220,  contacts: 1200,  templates: 9,  agents: 4,  created: 'Jun 5, 2026',  waPhone: '+91 98765 00010', waName: 'BrandCraft',       wabaid: 'WABA_010_BC', metaAppId: 'APP_010', renewsOn: 'Jul 5, 2026',   mrr: 2499 },
  11: { id: 11, company: 'UrbanRoots',          avatar: 'UR', color: 'bg-lime-600',   owner: 'Sonal Desai',  email: 'sonal@urbanroots.in',   phone: '+91 98100 00011', plan: 'Starter',    status: 'active',    messages: 11200,  conversations: 380,  contacts: 1900,  templates: 6,  agents: 2,  created: 'Mar 18, 2026', waPhone: '+91 98765 00011', waName: 'UrbanRoots',       wabaid: 'WABA_011_UR', metaAppId: 'APP_011', renewsOn: 'Sep 18, 2026',  mrr: 999  },
  12: { id: 12, company: 'CloudBazaar',         avatar: 'CB', color: 'bg-sky-500',    owner: 'Dev Kumar',    email: 'dev@cloudbazaar.com',   phone: '+91 98100 00012', plan: 'Growth',     status: 'active',    messages: 44300,  conversations: 1182, contacts: 7100,  templates: 18, agents: 7,  created: 'Jan 30, 2026', waPhone: '+91 98765 00012', waName: 'CloudBazaar',      wabaid: 'WABA_012_CB', metaAppId: 'APP_012', renewsOn: 'Jul 30, 2026',  mrr: 2499 },
}

const ACTIVITY_LOG = [
  { id: 1, action: 'Bulk campaign sent',    detail: '4,200 messages · Marketing template',   time: 'Jun 14, 2026 · 11:32 AM', icon: MessageCircle, color: 'text-blue-500',  bg: 'bg-blue-50'  },
  { id: 2, action: 'Agent login',           detail: 'sneha@stylehub.co · Chrome / macOS',    time: 'Jun 14, 2026 · 10:15 AM', icon: LogIn,         color: 'text-green-600', bg: 'bg-green-50' },
  { id: 3, action: 'Template approved',     detail: 'order_confirmation · Meta reviewed',    time: 'Jun 13, 2026 · 04:42 PM', icon: ShieldCheck,   color: 'text-purple-600',bg: 'bg-purple-50'},
  { id: 4, action: 'Plan renewal',          detail: 'Growth plan · ₹2,499 charged',          time: 'Jun 1, 2026 · 12:00 AM',  icon: CreditCard,    color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 5, action: 'New contact uploaded',  detail: '850 contacts imported via CSV',         time: 'May 28, 2026 · 03:10 PM', icon: Activity,      color: 'text-cyan-600',  bg: 'bg-cyan-50'  },
]

const STATUS_TRANSITIONS = {
  active:    [{ label: 'Suspend Account', to: 'suspended', icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }, { label: 'Block Account', to: 'expired', icon: Ban, color: 'text-red-600', bg: 'bg-red-50 border-red-200' }],
  suspended: [{ label: 'Activate Account', to: 'active', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' }, { label: 'Block Account', to: 'expired', icon: Ban, color: 'text-red-600', bg: 'bg-red-50 border-red-200' }],
  expired:   [{ label: 'Activate Account', to: 'active', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' }, { label: 'Suspend Account', to: 'suspended', icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }],
  trial:     [{ label: 'Activate Account', to: 'active', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' }, { label: 'Suspend Account', to: 'suspended', icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }],
}

const planColor   = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }
const statusColor = { active: 'green', trial: 'yellow', expired: 'red', suspended: 'gray' }

function fmtNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/* ─── Edit modal ─────────────────────────────────────────── */

function EditModal({ client, onClose, onSave }) {
  const [form, setForm] = useState({
    company: client.company,
    owner:   client.owner,
    email:   client.email,
    phone:   client.phone,
    plan:    client.plan,
    waName:  client.waName,
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-900">Edit Client Details</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Company Name', key: 'company', icon: Building2 },
            { label: 'Owner Name',   key: 'owner',   icon: null },
            { label: 'Owner Email',  key: 'email',   icon: Mail, type: 'email' },
            { label: 'Phone',        key: 'phone',   icon: Phone },
            { label: 'WA Display Name', key: 'waName', icon: MessageSquare },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Plan</label>
            <select
              value={form.plan}
              onChange={(e) => set('plan', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400 bg-white"
            >
              {['Starter', 'Growth', 'Enterprise'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-semibold transition-all"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Impersonate confirm ────────────────────────────────── */

function ImpersonateModal({ client, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <LogIn size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Impersonate Client</p>
            <p className="text-xs text-gray-400">{client.company}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex gap-2.5">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-700">
            You will be logged in as this client's account for support purposes. All actions will be logged in the audit trail. Remember to exit impersonation when done.
          </p>
        </div>
        <div className="text-xs space-y-1.5 mb-5">
          <div className="flex justify-between"><span className="text-gray-400">Logging in as</span><span className="font-medium text-gray-800">{client.owner}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Workspace</span><span className="font-medium text-gray-800">{client.company}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Session expires</span><span className="font-medium text-gray-800">30 minutes</span></div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            <LogIn size={14} /> Enter as Client
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Delete/Archive confirm ─────────────────────────────── */

function DeleteModal({ client, onClose, onConfirm }) {
  const [mode, setMode] = useState('archive')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Trash2 size={18} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-gray-900">Remove Client Account</p>
            <p className="text-xs text-gray-400">{client.company}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['archive', 'delete'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${mode === m ? (m === 'delete' ? 'border-red-400 bg-red-50' : 'border-amber-400 bg-amber-50') : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-sm font-semibold capitalize ${mode === m ? (m === 'delete' ? 'text-red-700' : 'text-amber-700') : 'text-gray-700'}`}>{m}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m === 'archive' ? 'Hides account, data retained' : 'Permanently removes all data'}</p>
            </button>
          ))}
        </div>
        {mode === 'delete' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-medium text-red-700">This cannot be undone. All messages, contacts, templates and flows will be permanently deleted.</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm(mode)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${mode === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            Confirm {mode === 'archive' ? 'Archive' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const raw = CLIENTS_MAP[Number(id)] || CLIENTS_MAP[1]
  const [client, setClient] = useState(raw)
  const [tab, setTab]       = useState('overview')
  const [modal, setModal]   = useState(null) // 'edit' | 'impersonate' | 'delete' | 'status-confirm'
  const [pendingStatus, setPendingStatus] = useState(null)

  const handleEdit = (form) => {
    setClient((c) => ({ ...c, ...form }))
    setModal(null)
  }

  const handleStatusChange = (to) => {
    setClient((c) => ({ ...c, status: to }))
    setPendingStatus(null)
    setModal(null)
  }

  const handleDelete = (mode) => {
    if (mode === 'delete') navigate('/admin/users')
    else { setClient((c) => ({ ...c, status: 'expired' })); setModal(null) }
  }

  const TABS = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'activity',  label: 'Activity'  },
  ]

  const transitions = STATUS_TRANSITIONS[client.status] || []

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Client Accounts
      </button>

      <PageHeader
        title={client.company}
        description={`Client profile · ${client.waPhone}`}
        breadcrumbs={['Admin', 'User Management', client.company]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left panel: Profile ─── */}
        <div className="space-y-4">

          {/* Identity card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex flex-col items-center text-center mb-5">
              <div className={`w-16 h-16 rounded-2xl ${client.color} flex items-center justify-center text-xl font-bold text-white mb-3 shadow-sm`}>
                {client.avatar}
              </div>
              <p className="font-bold text-gray-900 text-lg leading-tight">{client.company}</p>
              <p className="text-sm text-gray-500 mt-0.5">{client.waName}</p>
              <div className="flex items-center gap-2 mt-2.5">
                <Badge color={planColor[client.plan]}>{client.plan}</Badge>
                <Badge color={statusColor[client.status]}>{client.status}</Badge>
              </div>
            </div>

            <dl className="space-y-3 text-sm border-t border-gray-100 pt-4">
              {[
                { icon: Building2,   label: 'Owner',      val: client.owner },
                { icon: Mail,        label: 'Email',      val: client.email },
                { icon: Phone,       label: 'Phone',      val: client.phone },
                { icon: MessageSquare, label: 'WA Phone', val: client.waPhone },
                { icon: CreditCard,  label: 'MRR',        val: client.mrr ? `₹${client.mrr.toLocaleString()}` : '—' },
                { icon: Calendar,    label: 'Created',    val: client.created },
                { icon: Clock,       label: 'Renews on',  val: client.renewsOn },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
                    <Icon size={12} />
                    <span className="text-xs">{label}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-800 text-right break-all">{val}</span>
                </div>
              ))}
            </dl>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Meta Integration</p>
              {[
                { label: 'WABA ID',   val: client.wabaid },
                { label: 'App ID',    val: client.metaAppId },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-mono font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{val}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Actions card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT, delay: 0.06 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Actions</p>

            {/* Edit */}
            <button
              onClick={() => setModal('edit')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              <Pencil size={14} className="text-gray-400" /> Edit Client Details
            </button>

            {/* Impersonate */}
            <button
              onClick={() => setModal('impersonate')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-blue-200 hover:bg-blue-50 text-sm font-medium text-blue-700 transition-colors"
            >
              <LogIn size={14} className="text-blue-500" /> Impersonate for Support
            </button>

            {/* Status transitions */}
            {transitions.map(({ label, to, icon: Icon, color, bg }) => (
              <button
                key={to}
                onClick={() => { setPendingStatus({ label, to }); setModal('status-confirm') }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${bg} ${color}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}

            {/* Delete */}
            <button
              onClick={() => setModal('delete')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-sm font-medium text-red-600 transition-colors"
            >
              <Trash2 size={14} /> Delete / Archive Account
            </button>
          </motion.div>
        </div>

        {/* ── Right panel ─── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Usage stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Messages',      val: fmtNum(client.messages),      icon: MessageSquare, bg: 'bg-blue-50 text-blue-600' },
              { label: 'Conversations', val: fmtNum(client.conversations),  icon: BarChart2,     bg: 'bg-green-50 text-green-600' },
              { label: 'Contacts',      val: fmtNum(client.contacts),       icon: Building2,     bg: 'bg-purple-50 text-purple-600' },
              { label: 'Templates',     val: client.templates,              icon: MessageCircle, bg: 'bg-amber-50 text-amber-600' },
            ].map(({ label, val, icon: Icon, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.04 + 0.08 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${bg}`}>
                  <Icon size={15} />
                </div>
                <p className="text-xl font-bold text-gray-900">{val}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 px-5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative py-3.5 px-4 text-sm font-medium transition-colors ${tab === t.key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t.label}
                  {tab === t.key && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {tab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Agents',    val: client.agents,  icon: Building2 },
                        { label: 'Plan',      val: client.plan,    icon: CreditCard },
                        { label: 'WABA ID',   val: client.wabaid, icon: ShieldCheck },
                      ].map(({ label, val, icon: Icon }) => (
                        <div key={label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                          <p className="text-sm font-semibold text-gray-800 truncate">{val}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Conversation Breakdown (this month)</p>
                      {[
                        { label: 'Marketing',       val: Math.round(client.conversations * 0.48), color: 'bg-blue-500',   pct: 48 },
                        { label: 'Utility',         val: Math.round(client.conversations * 0.32), color: 'bg-green-500',  pct: 32 },
                        { label: 'Authentication',  val: Math.round(client.conversations * 0.12), color: 'bg-purple-500', pct: 12 },
                        { label: 'Service',         val: Math.round(client.conversations * 0.08), color: 'bg-gray-400',   pct: 8  },
                      ].map(({ label, val, color, pct }) => (
                        <div key={label} className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: EASE_OUT }}
                              className={`h-full rounded-full ${color}`}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-12 text-right">{fmtNum(val)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {tab === 'activity' && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    className="space-y-3"
                  >
                    {ACTIVITY_LOG.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.14, ease: EASE_OUT, delay: i * 0.04 }}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
                          <item.icon size={14} className={item.color} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.action}</p>
                          <p className="text-xs text-gray-400">{item.detail}</p>
                        </div>
                        <span className="text-xs text-gray-300 shrink-0 ml-auto">{item.time}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'edit' && (
          <EditModal client={client} onClose={() => setModal(null)} onSave={handleEdit} />
        )}
        {modal === 'impersonate' && (
          <ImpersonateModal client={client} onClose={() => setModal(null)} />
        )}
        {modal === 'delete' && (
          <DeleteModal client={client} onClose={() => setModal(null)} onConfirm={handleDelete} />
        )}
        {modal === 'status-confirm' && pendingStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <p className="font-semibold text-gray-900 mb-1">{pendingStatus.label}?</p>
              <p className="text-sm text-gray-400 mb-5">This will immediately change the account status for <span className="font-medium text-gray-700">{client.company}</span>.</p>
              <div className="flex gap-2">
                <button onClick={() => { setModal(null); setPendingStatus(null) }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => handleStatusChange(pendingStatus.to)}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
