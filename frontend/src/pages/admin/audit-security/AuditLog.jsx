import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Users, ShieldAlert, Download, Search,
  CheckCircle2, XCircle, ChevronDown, X, Eye, ChevronRight,
  UserCog, Pencil, Trash2, LogIn, LogOut, CreditCard,
  Settings, UserX, RefreshCw, FileText, AlertTriangle,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Admin actors ────────────────────────────────────────── */
const ADMINS = [
  { name: 'Kunal Sharma',  role: 'Super Admin',      avatar: 'KS', color: 'bg-red-500'    },
  { name: 'Arjun Mehta',   role: 'Support Admin',    avatar: 'AM', color: 'bg-blue-500'   },
  { name: 'Priya Sharma',  role: 'Billing Admin',    avatar: 'PS', color: 'bg-green-500'  },
  { name: 'Dev Patel',     role: 'Support Admin',    avatar: 'DP', color: 'bg-violet-500' },
  { name: 'Sneha Rao',     role: 'Compliance Admin', avatar: 'SR', color: 'bg-teal-500'   },
]

const CLIENTS = [
  { name: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500' },
  { name: 'TechStart',         avatar: 'TS', color: 'bg-indigo-500' },
  { name: 'StyleHub',          avatar: 'SH', color: 'bg-pink-500'   },
  { name: 'FoodZone',          avatar: 'FZ', color: 'bg-orange-500' },
  { name: 'QuickMart',         avatar: 'QM', color: 'bg-blue-500'   },
  { name: 'MediCare Plus',     avatar: 'MP', color: 'bg-red-500'    },
  { name: 'RapidDeliver',      avatar: 'RD', color: 'bg-cyan-500'   },
  { name: 'CloudBazaar',       avatar: 'CB', color: 'bg-sky-500'    },
]

/* ─── Admin activity log ──────────────────────────────────── */
const ADMIN_ACTIONS = {
  login:            { label: 'Logged in',             icon: LogIn,       color: 'green'  },
  logout:           { label: 'Logged out',            icon: LogOut,      color: 'gray'   },
  create_user:      { label: 'Created user',          icon: UserCog,     color: 'blue'   },
  update_user:      { label: 'Updated user',          icon: Pencil,      color: 'cyan'   },
  suspend_user:     { label: 'Suspended user',        icon: UserX,       color: 'orange' },
  delete_user:      { label: 'Deleted user',          icon: Trash2,      color: 'red'    },
  plan_change:      { label: 'Changed plan',          icon: RefreshCw,   color: 'purple' },
  billing_update:   { label: 'Updated billing',       icon: CreditCard,  color: 'blue'   },
  impersonate:      { label: 'Impersonated client',   icon: UserCog,     color: 'yellow' },
  config_change:    { label: 'Changed system config', icon: Settings,    color: 'gray'   },
  template_approve: { label: 'Approved template',     icon: CheckCircle2,color: 'green'  },
  template_reject:  { label: 'Rejected template',     icon: XCircle,     color: 'red'    },
  export_data:      { label: 'Exported data',         icon: Download,    color: 'blue'   },
  role_change:      { label: 'Changed role',          icon: ShieldAlert, color: 'purple' },
}

const ADMIN_LOG_RAW = [
  { id: 1,  aIdx: 0, action: 'login',            target: 'Admin Panel',          cIdx: null, ip: '103.21.44.12',  time: 'Jun 15, 14:32', status: 'success' },
  { id: 2,  aIdx: 1, action: 'suspend_user',     target: 'StyleHub (cIdx 2)',    cIdx: 2,    ip: '122.31.8.99',   time: 'Jun 15, 13:55', status: 'success' },
  { id: 3,  aIdx: 2, action: 'billing_update',   target: 'FoodZone Invoice',     cIdx: 3,    ip: '49.204.11.3',   time: 'Jun 15, 13:20', status: 'success' },
  { id: 4,  aIdx: 0, action: 'impersonate',      target: 'RapidDeliver session', cIdx: 6,    ip: '103.21.44.12',  time: 'Jun 15, 12:44', status: 'success' },
  { id: 5,  aIdx: 3, action: 'template_approve', target: 'order_confirmation',   cIdx: 0,    ip: '115.99.22.8',   time: 'Jun 15, 11:30', status: 'success' },
  { id: 6,  aIdx: 1, action: 'update_user',      target: 'QuickMart owner',      cIdx: 4,    ip: '122.31.8.99',   time: 'Jun 15, 10:55', status: 'success' },
  { id: 7,  aIdx: 4, action: 'export_data',      target: 'Compliance report',    cIdx: null, ip: '103.77.44.2',   time: 'Jun 15, 10:11', status: 'success' },
  { id: 8,  aIdx: 2, action: 'plan_change',      target: 'StyleHub → Growth',    cIdx: 2,    ip: '49.204.11.3',   time: 'Jun 14, 16:40', status: 'success' },
  { id: 9,  aIdx: 0, action: 'delete_user',      target: 'Team member #12',      cIdx: 5,    ip: '103.21.44.12',  time: 'Jun 14, 15:28', status: 'success' },
  { id: 10, aIdx: 3, action: 'template_reject',  target: 'promo_blast_v2',       cIdx: 3,    ip: '115.99.22.8',   time: 'Jun 14, 14:05', status: 'success' },
  { id: 11, aIdx: 1, action: 'login',            target: 'Admin Panel',          cIdx: null, ip: '103.55.8.44',   time: 'Jun 14, 09:22', status: 'failed'  },
  { id: 12, aIdx: 0, action: 'config_change',    target: 'Rate limit: Enterprise',cIdx:null, ip: '103.21.44.12',  time: 'Jun 13, 17:10', status: 'success' },
  { id: 13, aIdx: 2, action: 'create_user',      target: 'New tenant: EduBridge',cIdx: null, ip: '49.204.11.3',   time: 'Jun 13, 15:00', status: 'success' },
  { id: 14, aIdx: 4, action: 'role_change',      target: 'Dev Patel → Support',  cIdx: null, ip: '103.77.44.2',   time: 'Jun 13, 11:44', status: 'success' },
  { id: 15, aIdx: 0, action: 'export_data',      target: 'All invoices CSV',     cIdx: null, ip: '103.21.44.12',  time: 'Jun 12, 18:00', status: 'success' },
]

const ADMIN_LOG = ADMIN_LOG_RAW.map((r) => ({
  ...r,
  admin:  ADMINS[r.aIdx],
  client: r.cIdx !== null ? CLIENTS[r.cIdx] : null,
  meta:   ADMIN_ACTIONS[r.action],
}))

/* ─── Client action log ───────────────────────────────────── */
const CLIENT_ACTIONS = {
  template_submitted: { label: 'Submitted template',  color: 'blue'   },
  campaign_sent:      { label: 'Campaign sent',       color: 'green'  },
  contact_imported:   { label: 'Contacts imported',   color: 'cyan'   },
  settings_changed:   { label: 'Settings changed',    color: 'gray'   },
  team_member_added:  { label: 'Team member added',   color: 'indigo' },
  bulk_message_sent:  { label: 'Bulk messages sent',  color: 'purple' },
  flow_created:       { label: 'Bot flow created',    color: 'teal'   },
  billing_updated:    { label: 'Billing updated',     color: 'orange' },
  number_added:       { label: 'Phone number added',  color: 'yellow' },
}

const CLIENT_LOG_RAW = [
  { id: 1,  cIdx: 0, user: 'Ravi Kumar',     action: 'campaign_sent',      detail: '4,200 messages · Summer Sale',  time: 'Jun 15, 14:10', status: 'success' },
  { id: 2,  cIdx: 1, user: 'Neha Singh',     action: 'template_submitted', detail: 'order_alert_v3 (UTILITY)',      time: 'Jun 15, 13:30', status: 'success' },
  { id: 3,  cIdx: 2, user: 'Arya Verma',     action: 'contact_imported',   detail: '1,240 contacts from CSV',       time: 'Jun 15, 12:55', status: 'success' },
  { id: 4,  cIdx: 3, user: 'Rohit Joshi',    action: 'bulk_message_sent',  detail: '890 OTPs via API',              time: 'Jun 15, 12:00', status: 'success' },
  { id: 5,  cIdx: 4, user: 'Meena Iyer',     action: 'team_member_added',  detail: 'Vikram Nair (Agent role)',      time: 'Jun 15, 11:15', status: 'success' },
  { id: 6,  cIdx: 5, user: 'Suresh Nair',    action: 'flow_created',       detail: 'Appointment Booking Flow',      time: 'Jun 15, 10:40', status: 'success' },
  { id: 7,  cIdx: 6, user: 'Divya Patel',    action: 'number_added',       detail: '+91 98765 43210',               time: 'Jun 15, 09:50', status: 'failed'  },
  { id: 8,  cIdx: 7, user: 'Anil Sharma',    action: 'settings_changed',   detail: 'Webhook URL updated',           time: 'Jun 14, 17:30', status: 'success' },
  { id: 9,  cIdx: 0, user: 'Ravi Kumar',     action: 'billing_updated',    detail: 'Added card ending ••4242',      time: 'Jun 14, 16:10', status: 'success' },
  { id: 10, cIdx: 2, user: 'Arya Verma',     action: 'template_submitted', detail: 'promo_flash_sale (MARKETING)',  time: 'Jun 14, 15:00', status: 'success' },
  { id: 11, cIdx: 3, user: 'Rohit Joshi',    action: 'campaign_sent',      detail: '2,100 messages · Daily Update', time: 'Jun 14, 13:45', status: 'success' },
  { id: 12, cIdx: 5, user: 'Suresh Nair',    action: 'contact_imported',   detail: '340 contacts (3 failed rows)',   time: 'Jun 13, 11:20', status: 'success' },
]

const CLIENT_LOG = CLIENT_LOG_RAW.map((r) => ({
  ...r, client: CLIENTS[r.cIdx], meta: CLIENT_ACTIONS[r.action],
}))

/* ─── Sensitive actions ───────────────────────────────────── */
const SENSITIVE_TYPES = {
  impersonation:       { label: 'Client Impersonation',    risk: 'high',     icon: UserCog,    color: 'yellow' },
  account_suspension:  { label: 'Account Suspension',      risk: 'high',     icon: UserX,      color: 'orange' },
  bulk_data_export:    { label: 'Bulk Data Export',        risk: 'medium',   icon: Download,   color: 'blue'   },
  billing_change:      { label: 'Billing Modification',    risk: 'medium',   icon: CreditCard, color: 'purple' },
  role_escalation:     { label: 'Role Escalation',         risk: 'critical', icon: ShieldAlert,color: 'red'    },
  config_override:     { label: 'System Config Override',  risk: 'critical', icon: Settings,   color: 'red'    },
  template_force_approve:{ label:'Template Force-Approved',risk: 'medium',   icon: FileText,   color: 'cyan'   },
}

const SENSITIVE_LOG = [
  { id: 1,  aIdx: 0, type: 'impersonation',        detail: 'RapidDeliver — 28min session',   time: 'Jun 15, 12:44', confirmed: true  },
  { id: 2,  aIdx: 0, type: 'role_escalation',      detail: 'Sneha Rao promoted to Compliance Admin', time: 'Jun 13, 11:44', confirmed: true  },
  { id: 3,  aIdx: 2, type: 'billing_change',       detail: 'FoodZone invoice marked paid manually', time: 'Jun 15, 13:20', confirmed: true  },
  { id: 4,  aIdx: 1, type: 'account_suspension',   detail: 'StyleHub — reason: compliance review', time: 'Jun 15, 13:55', confirmed: true  },
  { id: 5,  aIdx: 0, type: 'bulk_data_export',     detail: 'All invoices export (312 records)',time: 'Jun 12, 18:00', confirmed: true  },
  { id: 6,  aIdx: 4, type: 'bulk_data_export',     detail: 'Compliance report — all clients', time: 'Jun 15, 10:11', confirmed: true  },
  { id: 7,  aIdx: 0, type: 'config_override',      detail: 'Rate limits for Enterprise overridden', time: 'Jun 13, 17:10', confirmed: false },
  { id: 8,  aIdx: 3, type: 'template_force_approve',detail: 'order_confirmation — manual override', time: 'Jun 15, 11:30', confirmed: true  },
].map((r) => ({ ...r, admin: ADMINS[r.aIdx], meta: SENSITIVE_TYPES[r.type] }))

const RISK_COLOR = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' }

/* ─── Shared helpers ──────────────────────────────────────── */
function AvatarChip({ admin }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full ${admin.color} flex items-center justify-center shrink-0`}>
        <span className="text-white text-[9px] font-bold">{admin.avatar}</span>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-800 whitespace-nowrap">{admin.name}</p>
        <p className="text-[10px] text-gray-400">{admin.role}</p>
      </div>
    </div>
  )
}

function ClientChip({ client }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-lg ${client.color} flex items-center justify-center shrink-0`}>
        <span className="text-white text-[9px] font-bold">{client.avatar}</span>
      </div>
      <span className="text-xs font-medium text-gray-800 whitespace-nowrap">{client.name}</span>
    </div>
  )
}

function DetailDrawer({ entry, onClose }) {
  if (!entry) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.16, ease: EASE_OUT }}
      className="bg-gray-900 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-mono">Audit entry detail</p>
        <button onClick={onClose}><X size={14} className="text-gray-500 hover:text-gray-300" /></button>
      </div>
      <pre className="text-xs text-green-400 font-mono overflow-x-auto leading-relaxed">
        {JSON.stringify(entry, null, 2)}
      </pre>
    </motion.div>
  )
}

function FilterBar({ search, setSearch, actionF, setActionF, statusF, setStatusF, actions, onReset }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" />
      </div>
      {actions && (
        <div className="relative">
          <select value={actionF} onChange={(e) => setActionF(e.target.value)}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-700">
            <option value="">All Actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      )}
      <div className="relative">
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
          className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-700">
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {(search || actionF || statusF) && (
        <button onClick={onReset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700">
          <X size={11} /> Clear
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — ADMIN ACTIVITY LOGS
══════════════════════════════════════════════════════════════ */
function AdminActivityTab() {
  const [search,  setSearch]  = useState('')
  const [actionF, setActionF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [page,    setPage]    = useState(1)
  const [detail,  setDetail]  = useState(null)
  const perPage = 8

  const filtered = ADMIN_LOG.filter((r) => {
    const q = search.toLowerCase()
    return (!q || r.admin.name.toLowerCase().includes(q) || r.target.toLowerCase().includes(q) || (r.client?.name || '').toLowerCase().includes(q))
      && (!actionF || r.action === actionF)
      && (!statusF || r.status === statusF)
  })
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-4">
      <FilterBar search={search} setSearch={setSearch} actionF={actionF} setActionF={setActionF}
        statusF={statusF} setStatusF={setStatusF}
        actions={Object.keys(ADMIN_ACTIONS)}
        onReset={() => { setSearch(''); setActionF(''); setStatusF(''); setPage(1) }} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Time', 'Admin', 'Action', 'Target / Resource', 'IP Address', 'Status', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((r, i) => {
                const ActionIcon = r.meta.icon
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.03 }}
                    className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{r.time}</td>
                    <td className="px-4 py-3"><AvatarChip admin={r.admin} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ActionIcon size={13} className="text-gray-400 shrink-0" />
                        <Badge color={r.meta.color} className="whitespace-nowrap">{r.meta.label}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700 max-w-[200px] truncate">{r.target}</p>
                      {r.client && <ClientChip client={r.client} />}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.ip}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status === 'success' ? <CheckCircle2 size={13} className="text-green-500" /> : <XCircle size={13} className="text-red-500" />}
                        <Badge color={r.status === 'success' ? 'green' : 'red'}>{r.status}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(detail?.id === r.id ? null : r)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                        <Eye size={13} />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
              {paginated.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400">No entries match filters</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{filtered.length} entries</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>{detail && <DetailDrawer entry={{ id: detail.id, admin: detail.admin.name, action: detail.action, target: detail.target, ip: detail.ip, time: detail.time, status: detail.status }} onClose={() => setDetail(null)} />}</AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — CLIENT ACTION LOGS
══════════════════════════════════════════════════════════════ */
function ClientActionsTab() {
  const [search,  setSearch]  = useState('')
  const [actionF, setActionF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [page,    setPage]    = useState(1)
  const perPage = 8

  const filtered = CLIENT_LOG.filter((r) => {
    const q = search.toLowerCase()
    return (!q || r.client.name.toLowerCase().includes(q) || r.user.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q))
      && (!actionF || r.action === actionF)
      && (!statusF || r.status === statusF)
  })
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-4">
      <FilterBar search={search} setSearch={setSearch} actionF={actionF} setActionF={setActionF}
        statusF={statusF} setStatusF={setStatusF}
        actions={Object.keys(CLIENT_ACTIONS)}
        onReset={() => { setSearch(''); setActionF(''); setStatusF(''); setPage(1) }} />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Time', 'Client', 'User', 'Action', 'Details', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.03 }}
                  className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{r.time}</td>
                  <td className="px-4 py-3"><ClientChip client={r.client} /></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.user}</td>
                  <td className="px-4 py-3"><Badge color={r.meta.color} className="whitespace-nowrap">{r.meta.label}</Badge></td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{r.detail}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status === 'success' ? <CheckCircle2 size={13} className="text-green-500" /> : <XCircle size={13} className="text-red-500" />}
                      <Badge color={r.status === 'success' ? 'green' : 'red'}>{r.status}</Badge>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-400">No entries match filters</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{filtered.length} entries</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — SENSITIVE ACTION TRACKING
══════════════════════════════════════════════════════════════ */
function SensitiveTab() {
  const [filter, setFilter] = useState('')

  const filtered = SENSITIVE_LOG.filter((r) => !filter || r.type === filter)

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
        <ShieldAlert size={15} className="text-red-500 shrink-0" />
        <p className="text-xs font-medium text-red-700">
          Sensitive actions create a permanent immutable audit trail. All entries below are verified and cannot be deleted.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-700">
            <option value="">All Sensitive Actions</option>
            {Object.entries(SENSITIVE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <span className="text-xs text-gray-400">{filtered.length} records</span>
      </div>

      <div className="space-y-2">
        {filtered.map((r, i) => {
          const Icon = r.meta.icon
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.04 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${r.meta.risk === 'critical' ? 'bg-red-50' : r.meta.risk === 'high' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                    <Icon size={14} className={r.meta.risk === 'critical' ? 'text-red-500' : r.meta.risk === 'high' ? 'text-orange-500' : 'text-yellow-500'} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{r.meta.label}</p>
                      <Badge color={RISK_COLOR[r.meta.risk]} className="capitalize">{r.meta.risk} risk</Badge>
                      {r.confirmed && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={9} /> Confirmed by admin
                        </span>
                      )}
                    </div>
                    <AvatarChip admin={r.admin} />
                    <p className="text-xs text-gray-500 mt-1.5">{r.detail}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400 whitespace-nowrap">{r.time}</p>
                  <span className="text-[10px] font-mono text-gray-300">#{String(r.id).padStart(6, '0')}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'admin',     label: 'Admin Activity',        icon: Activity   },
  { key: 'client',    label: 'Client Actions',        icon: Users      },
  { key: 'sensitive', label: 'Sensitive Actions',     icon: ShieldAlert },
]

export default function AuditLog() {
  const [tab, setTab] = useState('admin')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Logs"
        description="Admin activity logs, client action logs and sensitive action tracking"
        breadcrumbs={['Admin', 'Audit & Security', 'Audit Logs']}
        action={
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
            <Download size={14} /> Export CSV
          </button>
        }
      />

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}>
          {tab === 'admin'     && <AdminActivityTab />}
          {tab === 'client'    && <ClientActionsTab />}
          {tab === 'sensitive' && <SensitiveTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
