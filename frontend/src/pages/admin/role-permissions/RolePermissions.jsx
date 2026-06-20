import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, HeadphonesIcon, CreditCard, ClipboardList,
  Plus, Save, Check, X, Pencil, Trash2, ChevronDown,
  ChevronRight, Lock, Eye, EyeOff, Settings, UserPlus,
  Mail, KeyRound, User, CheckCircle2, XCircle as XCircleIcon,
  ChevronRight as Next,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Permission features ────────────────────────────────── */

const PERMISSION_SECTIONS = [
  {
    section: 'User & Client Management',
    perms: [
      { key: 'users.view',       label: 'View client accounts' },
      { key: 'users.edit',       label: 'Edit client details' },
      { key: 'users.create',     label: 'Create new clients' },
      { key: 'users.delete',     label: 'Delete / archive accounts' },
      { key: 'users.impersonate',label: 'Impersonate client (support)' },
      { key: 'users.status',     label: 'Activate / suspend / block' },
    ],
  },
  {
    section: 'Subscriptions & Plans',
    perms: [
      { key: 'subs.view',       label: 'View subscriptions' },
      { key: 'subs.plans',      label: 'Edit pricing plans' },
      { key: 'subs.extend',     label: 'Manual extension / override' },
      { key: 'subs.upgrade',    label: 'Upgrade / downgrade clients' },
      { key: 'subs.lock',       label: 'Manage expiry lock rules' },
    ],
  },
  {
    section: 'Billing & Revenue',
    perms: [
      { key: 'billing.view',    label: 'View invoices & revenue' },
      { key: 'billing.refund',  label: 'Issue refunds' },
      { key: 'billing.config',  label: 'Payment gateway config' },
      { key: 'billing.export',  label: 'Export billing reports' },
    ],
  },
  {
    section: 'API Usage & Webhooks',
    perms: [
      { key: 'api.view',        label: 'View API monitor & logs' },
      { key: 'api.ratelimits',  label: 'Configure rate limits' },
      { key: 'api.throttle',    label: 'Throttle / block clients' },
      { key: 'api.webhooks',    label: 'View webhook logs & retry' },
    ],
  },
  {
    section: 'Template Approval',
    perms: [
      { key: 'tpl.view',        label: 'View submitted templates' },
      { key: 'tpl.approve',     label: 'Approve / reject templates' },
      { key: 'tpl.history',     label: 'View approval history' },
    ],
  },
  {
    section: 'System Analytics',
    perms: [
      { key: 'analytics.view',  label: 'View platform analytics' },
      { key: 'analytics.revenue',label: 'View revenue & MRR data' },
      { key: 'analytics.churn', label: 'View churn analytics' },
      { key: 'analytics.export',label: 'Export analytics reports' },
    ],
  },
  {
    section: 'Audit & Compliance',
    perms: [
      { key: 'audit.view',      label: 'View audit logs' },
      { key: 'audit.export',    label: 'Export audit logs' },
      { key: 'moderation.view', label: 'View flagged content' },
      { key: 'moderation.action',label: 'Action on flagged content' },
      { key: 'sessions.view',   label: 'View active sessions' },
      { key: 'sessions.revoke', label: 'Revoke sessions' },
    ],
  },
  {
    section: 'Communication',
    perms: [
      { key: 'comms.announce',  label: 'Send platform announcements' },
      { key: 'comms.email',     label: 'Manage email templates' },
    ],
  },
  {
    section: 'System Settings',
    perms: [
      { key: 'sys.meta',        label: 'Meta / WhatsApp config' },
      { key: 'sys.security',    label: 'Security settings' },
      { key: 'sys.roles',       label: 'Manage admin roles' },
    ],
  },
]

const ALL_PERM_KEYS = PERMISSION_SECTIONS.flatMap((s) => s.perms.map((p) => p.key))

/* ─── Preset roles ───────────────────────────────────────── */

const PRESET_ROLES = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    desc: 'Full unrestricted access to all platform features and settings.',
    icon: ShieldCheck,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'red',
    preset: true,
    permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, true])),
  },
  {
    id: 'support_admin',
    name: 'Support Admin',
    desc: 'Client-facing support: view/edit accounts, impersonate, manage tickets.',
    icon: HeadphonesIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'blue',
    preset: true,
    permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k,
      ['users.view','users.edit','users.status','users.impersonate','subs.view','api.view','api.webhooks','tpl.view','analytics.view','audit.view','sessions.view','sessions.revoke'].includes(k)
    ])),
  },
  {
    id: 'billing_admin',
    name: 'Billing Admin',
    desc: 'Manage subscriptions, invoices, refunds, and revenue reporting.',
    icon: CreditCard,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'green',
    preset: true,
    permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k,
      ['users.view','subs.view','subs.plans','subs.extend','subs.upgrade','subs.lock','billing.view','billing.refund','billing.config','billing.export','analytics.view','analytics.revenue','analytics.export'].includes(k)
    ])),
  },
  {
    id: 'compliance_admin',
    name: 'Compliance Admin',
    desc: 'Audit logs, content moderation, security monitoring and exports.',
    icon: ClipboardList,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'purple',
    preset: true,
    permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k,
      ['users.view','audit.view','audit.export','moderation.view','moderation.action','sessions.view','sessions.revoke','analytics.view','analytics.churn','sys.security'].includes(k)
    ])),
  },
]

const BLANK_ROLE = {
  id: '', name: '', desc: '', icon: Settings,
  color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', badge: 'gray',
  preset: false,
  permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, false])),
}

const badgeColor = { super_admin: 'red', support_admin: 'blue', billing_admin: 'green', compliance_admin: 'purple' }

/* ─── Toggle switch ──────────────────────────────────────── */

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <motion.div
        animate={{ x: checked ? 16 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  )
}

/* ─── Role card ──────────────────────────────────────────── */

function RoleCard({ role, onEdit, onDelete, isSelected, onClick }) {
  const enabledCount = Object.values(role.permissions).filter(Boolean).length
  const totalCount   = ALL_PERM_KEYS.length
  const pct          = Math.round((enabledCount / totalCount) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      onClick={onClick}
      className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? `${role.border} shadow-md` : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${role.bg} flex items-center justify-center`}>
          <role.icon size={18} className={role.color} />
        </div>
        <div className="flex items-center gap-1.5">
          {role.preset && (
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">PRESET</span>
          )}
          {!role.preset && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(role) }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(role.id) }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      <p className="font-bold text-gray-900 text-sm">{role.name}</p>
      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{role.desc}</p>

      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Permissions enabled</span>
          <span className={`font-bold ${role.color}`}>{enabledCount}/{totalCount}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className={`h-full rounded-full ${role.id === 'super_admin' ? 'bg-red-500' : role.id === 'support_admin' ? 'bg-blue-500' : role.id === 'billing_admin' ? 'bg-green-500' : role.id === 'compliance_admin' ? 'bg-purple-500' : 'bg-gray-500'}`}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5 text-right">{pct}% access</p>
      </div>

      {isSelected && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${role.color}`}>
          <Eye size={11} /> Viewing matrix below
        </div>
      )}
    </motion.div>
  )
}

/* ─── Create / Edit role modal ───────────────────────────── */

function RoleModal({ role, onClose, onSave }) {
  const [form, setForm] = useState({
    ...role,
    permissions: { ...role.permissions },
  })
  const [openSections, setOpenSections] = useState(
    Object.fromEntries(PERMISSION_SECTIONS.map((s) => [s.section, true]))
  )

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const togglePerm = (key) => setForm((f) => ({
    ...f,
    permissions: { ...f.permissions, [key]: !f.permissions[key] },
  }))
  const toggleSection = (section, val) => {
    const keys = PERMISSION_SECTIONS.find((s) => s.section === section)?.perms.map((p) => p.key) || []
    setForm((f) => ({
      ...f,
      permissions: { ...f.permissions, ...Object.fromEntries(keys.map((k) => [k, val])) },
    }))
  }
  const toggleSectionOpen = (s) => setOpenSections((o) => ({ ...o, [s]: !o[s] }))

  const isNew = !role.id

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <p className="font-semibold text-gray-900">{isNew ? 'Create Custom Role' : `Edit — ${role.name}`}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto max-h-[70vh] space-y-5">
          {/* Name + desc */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Role Name</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Content Manager"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
              <textarea
                value={form.desc}
                onChange={(e) => set('desc', e.target.value)}
                rows={2}
                placeholder="What this role can do…"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400 resize-none"
              />
            </div>
          </div>

          {/* Permission sections */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Permissions</p>
            <div className="space-y-2">
              {PERMISSION_SECTIONS.map((s) => {
                const keys = s.perms.map((p) => p.key)
                const allOn  = keys.every((k) => form.permissions[k])
                const someOn = keys.some((k) => form.permissions[k])
                const isOpen = openSections[s.section]
                return (
                  <div key={s.section} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSectionOpen(s.section)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
                        <span className="text-xs font-semibold text-gray-700">{s.section}</span>
                        <span className="text-[10px] text-gray-400">({keys.filter((k) => form.permissions[k]).length}/{keys.length})</span>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-gray-400">All</span>
                        <Toggle checked={allOn} onChange={(v) => toggleSection(s.section, v)} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: EASE_OUT }}
                          className="overflow-hidden"
                        >
                          <div className="divide-y divide-gray-100 px-4">
                            {s.perms.map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between py-2.5">
                                <span className="text-xs text-gray-700">{label}</span>
                                <Toggle
                                  checked={!!form.permissions[key]}
                                  onChange={() => togglePerm(key)}
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-5 sticky bottom-0 bg-white border-t border-gray-100 pt-4 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            disabled={!form.name.trim()}
            onClick={() => form.name.trim() && onSave(form)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              form.name.trim()
                ? 'bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={14} /> {isNew ? 'Create Role' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

/* ─── Permission matrix (read-only view for selected role) ── */

function PermissionMatrix({ role, allRoles, onToggle }) {
  const [openSections, setOpenSections] = useState(
    Object.fromEntries(PERMISSION_SECTIONS.map((s) => [s.section, true]))
  )

  const toggleSectionOpen = (s) => setOpenSections((o) => ({ ...o, [s]: !o[s] }))

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${role.bg} flex items-center justify-center`}>
            <role.icon size={15} className={role.color} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{role.name} — Permission Matrix</p>
            <p className="text-xs text-gray-400">{role.desc}</p>
          </div>
        </div>
        {role.preset && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
            <Lock size={11} />
            Preset role — read only
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {PERMISSION_SECTIONS.map((s) => {
          const keys     = s.perms.map((p) => p.key)
          const enabledN = keys.filter((k) => role.permissions[k]).length
          const isOpen   = openSections[s.section]
          return (
            <div key={s.section}>
              <button
                onClick={() => toggleSectionOpen(s.section)}
                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50/60 hover:bg-gray-100/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                  <span className="text-xs font-semibold text-gray-600">{s.section}</span>
                </div>
                <span className={`text-xs font-semibold ${enabledN === keys.length ? 'text-green-600' : enabledN === 0 ? 'text-gray-400' : 'text-amber-600'}`}>
                  {enabledN}/{keys.length} enabled
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    className="overflow-hidden"
                  >
                    {s.perms.map(({ key, label }) => {
                      const enabled = !!role.permissions[key]
                      return (
                        <div
                          key={key}
                          className={`flex items-center justify-between px-5 py-2.5 border-t border-gray-50 ${enabled ? '' : 'opacity-50'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            {enabled
                              ? <CheckCircle className="text-green-500" />
                              : <XCircle className="text-gray-300" />
                            }
                            <span className="text-xs text-gray-700">{label}</span>
                          </div>
                          <Toggle
                            checked={enabled}
                            onChange={(v) => !role.preset && onToggle(role.id, key, v)}
                            disabled={role.preset}
                          />
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CheckCircle({ className }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
}
function XCircle({ className }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
}

/* ─── Create Admin Modal (3 steps) ──────────────────────── */

const ADMIN_ROLE_OPTIONS = [
  { id: 'support_admin',    label: 'Support Admin',    color: 'blue',   desc: 'Client support, impersonation, ticket management' },
  { id: 'billing_admin',    label: 'Billing Admin',    color: 'green',  desc: 'Subscriptions, invoices, refunds, revenue reports' },
  { id: 'compliance_admin', label: 'Compliance Admin', color: 'purple', desc: 'Audit logs, moderation, security, compliance alerts' },
  { id: 'custom',           label: 'Custom Role',      color: 'gray',   desc: 'Define granular section-by-section access below' },
]

const ROLE_OPTION_BG = { blue: 'border-blue-300 bg-blue-50', green: 'border-green-300 bg-green-50', purple: 'border-purple-300 bg-purple-50', gray: 'border-gray-300 bg-gray-50' }
const ROLE_OPTION_TEXT = { blue: 'text-blue-700', green: 'text-green-700', purple: 'text-purple-700', gray: 'text-gray-700' }

function CreateAdminModal({ presetRoles, onClose, onCreate }) {
  const [step,     setStep]     = useState(1)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw,setConfirmPw]= useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showCPw,  setShowCPw]  = useState(false)
  const [roleId,   setRoleId]   = useState('support_admin')
  const [perms,    setPerms]    = useState(() =>
    Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, false]))
  )
  const [openSecs, setOpenSecs] = useState(
    Object.fromEntries(PERMISSION_SECTIONS.map((s) => [s.section, true]))
  )

  /* When role selection changes, seed permissions from that preset */
  function selectRole(id) {
    setRoleId(id)
    if (id !== 'custom') {
      const preset = presetRoles.find((r) => r.id === id)
      if (preset) setPerms({ ...preset.permissions })
    }
  }

  function togglePerm(key) {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleSection(section, val) {
    const keys = PERMISSION_SECTIONS.find((s) => s.section === section)?.perms.map((p) => p.key) || []
    setPerms((prev) => ({ ...prev, ...Object.fromEntries(keys.map((k) => [k, val])) }))
  }

  const step1Valid = name.trim() && email.trim() && password.length >= 6 && password === confirmPw
  const pwMismatch = confirmPw && password !== confirmPw
  const enabledCount = Object.values(perms).filter(Boolean).length

  function handleCreate() {
    const selectedLabel = ADMIN_ROLE_OPTIONS.find((r) => r.id === roleId)?.label || 'Custom'
    onCreate({
      id:          Date.now(),
      name:        name.trim(),
      email:       email.trim(),
      roleId,
      roleLabel:   selectedLabel,
      permissions: { ...perms },
      createdAt:   new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status:      'active',
    })
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-green-600" />
            <p className="font-bold text-gray-900">Create Admin Account</p>
          </div>
          <button onClick={onClose}><X size={16} className="text-gray-400 hover:text-gray-700" /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-0">
          {[['1', 'Credentials'], ['2', 'Role'], ['3', 'Section Access']].map(([n, label], i) => (
            <div key={n} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > i + 1 ? <Check size={11} /> : n}
              </div>
              <span className={`text-xs font-medium ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
              {i < 2 && <Next size={11} className="text-gray-300 ml-1" />}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* ── Step 1: Credentials ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arjun Mehta"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Admin Email (User ID)</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@wixabotic.io"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showCPw ? 'text' : 'password'} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter password"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 ${pwMismatch ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-green-400'}`} />
                  <button type="button" onClick={() => setShowCPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {pwMismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Role selection ── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">Choose a starting role. You can fine-tune section access in the next step.</p>
              {ADMIN_ROLE_OPTIONS.map((opt) => (
                <button key={opt.id} onClick={() => selectRole(opt.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${roleId === opt.id ? ROLE_OPTION_BG[opt.color] : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${roleId === opt.id ? 'border-current' : 'border-gray-300'} ${ROLE_OPTION_TEXT[opt.color]}`}>
                    {roleId === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${roleId === opt.id ? ROLE_OPTION_TEXT[opt.color] : 'text-gray-900'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Step 3: Section-wise access ── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Toggle access per section or individual permission.</p>
                <span className="text-xs font-semibold text-green-600">{enabledCount}/{ALL_PERM_KEYS.length} enabled</span>
              </div>
              {PERMISSION_SECTIONS.map((s) => {
                const keys   = s.perms.map((p) => p.key)
                const allOn  = keys.every((k) => perms[k])
                const isOpen = openSecs[s.section]
                const onCount= keys.filter((k) => perms[k]).length
                return (
                  <div key={s.section} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenSecs((o) => ({ ...o, [s.section]: !o[s.section] }))}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                        <span className="text-xs font-semibold text-gray-700">{s.section}</span>
                        <span className="text-[10px] text-gray-400">({onCount}/{keys.length})</span>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-gray-400">All</span>
                        <Toggle checked={allOn} onChange={(v) => toggleSection(s.section, v)} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16, ease: EASE_OUT }} className="overflow-hidden">
                          <div className="divide-y divide-gray-100 px-4">
                            {s.perms.map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between py-2.5">
                                <span className="text-xs text-gray-700">{label}</span>
                                <Toggle checked={!!perms[key]} onChange={() => togglePerm(key)} />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </motion.div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex gap-2 px-6 pb-5 pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button onClick={() => setStep((s) => s - 1)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Back</button>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !step1Valid}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all disabled:opacity-40">
              Next →
            </button>
          ) : (
            <button onClick={handleCreate}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all flex items-center justify-center gap-2">
              <UserPlus size={14} /> Create Admin
            </button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

/* ─── Main ───────────────────────────────────────────────── */

const SEED_ADMINS = [
  {
    id: 1,
    name: 'Arjun Mehta',
    email: 'support@wixabotic.io',
    roleId: 'support_admin',
    roleLabel: 'Support Admin',
    createdAt: '12 Jan 2026',
    status: 'active',
    permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k,
      ['users.view','users.edit','users.status','users.impersonate','subs.view','api.view','api.webhooks','tpl.view','analytics.view','audit.view','sessions.view','sessions.revoke'].includes(k)
    ])),
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'billing@wixabotic.io',
    roleId: 'billing_admin',
    roleLabel: 'Billing Admin',
    createdAt: '15 Jan 2026',
    status: 'active',
    permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k,
      ['users.view','subs.view','subs.plans','subs.extend','subs.upgrade','subs.lock','billing.view','billing.refund','billing.config','billing.export','analytics.view','analytics.revenue','analytics.export'].includes(k)
    ])),
  },
  {
    id: 3,
    name: 'Sneha Rao',
    email: 'compliance@wixabotic.io',
    roleId: 'compliance_admin',
    roleLabel: 'Compliance Admin',
    createdAt: '20 Jan 2026',
    status: 'active',
    permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k,
      ['users.view','audit.view','audit.export','moderation.view','moderation.action','sessions.view','sessions.revoke','analytics.view','analytics.churn','sys.security'].includes(k)
    ])),
  },
  {
    id: 4,
    name: 'Dev Patel',
    email: 'dev@wixabotic.io',
    roleId: 'support_admin',
    roleLabel: 'Support Admin',
    createdAt: '3 Feb 2026',
    status: 'inactive',
    permissions: Object.fromEntries(ALL_PERM_KEYS.map((k) => [k,
      ['users.view','users.edit','users.status','users.impersonate','subs.view','api.view','api.webhooks'].includes(k)
    ])),
  },
]

const ROLE_BADGE_COLOR = { support_admin: 'bg-blue-100 text-blue-700', billing_admin: 'bg-green-100 text-green-700', compliance_admin: 'bg-purple-100 text-purple-700', custom: 'bg-gray-100 text-gray-600' }

export default function RolePermissions() {
  const [roles, setRoles]               = useState(PRESET_ROLES)
  const [selectedRole, setSelected]     = useState(PRESET_ROLES[0])
  const [modal, setModal]               = useState(null)
  const [saved, setSaved]               = useState(false)
  const [showCreateAdmin, setShowCreate]= useState(false)
  const [adminAccounts, setAdminAccounts]= useState(SEED_ADMINS)
  const [resetTarget, setResetTarget]   = useState(null)

  const handleSaveRole = (form) => {
    const isNew = !roles.find((r) => r.id === form.id)
    const newRole = {
      ...form,
      id: form.id || `custom_${Date.now()}`,
      icon: Settings,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      badge: 'gray',
      preset: false,
    }
    setRoles((prev) => isNew ? [...prev, newRole] : prev.map((r) => r.id === newRole.id ? newRole : r))
    setSelected(newRole)
    setModal(null)
  }

  const handleDelete = (id) => {
    setRoles((prev) => prev.filter((r) => r.id !== id))
    if (selectedRole.id === id) setSelected(roles[0])
  }

  const handleTogglePerm = (roleId, permKey, val) => {
    setRoles((prev) => prev.map((r) =>
      r.id === roleId ? { ...r, permissions: { ...r.permissions, [permKey]: val } } : r
    ))
    setSelected((s) => s.id === roleId ? { ...s, permissions: { ...s.permissions, [permKey]: val } } : s)
  }

  const handleSaveMatrix = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const customRoles = roles.filter((r) => !r.preset)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based Permissions"
        description="Manage admin roles and their access to platform features"
        breadcrumbs={['Admin', 'Role Permissions']}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal({ ...BLANK_ROLE })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 text-sm font-semibold transition-all"
            >
              <Plus size={14} /> Custom Role
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-semibold transition-all"
            >
              <UserPlus size={14} /> Create Admin
            </button>
          </div>
        }
      />

      {/* Preset role cards */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preset Admin Roles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.filter((r) => r.preset).map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              isSelected={selectedRole?.id === role.id}
              onClick={() => setSelected(role)}
              onEdit={(r) => setModal(r)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Custom roles */}
      {customRoles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Custom Roles ({customRoles.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {customRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isSelected={selectedRole?.id === role.id}
                onClick={() => setSelected(role)}
                onEdit={(r) => setModal(r)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Permission matrix for selected role */}
      {selectedRole && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Custom Permission Matrix — <span className={selectedRole.color}>{selectedRole.name}</span>
            </p>
            {!selectedRole.preset && (
              <button
                onClick={handleSaveMatrix}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  saved ? 'bg-green-500 text-white' : 'bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45'
                }`}
              >
                {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Permissions</>}
              </button>
            )}
          </div>
          <PermissionMatrix
            role={selectedRole}
            allRoles={roles}
            onToggle={handleTogglePerm}
          />
        </div>
      )}

      {/* Admin Accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Admin Accounts ({adminAccounts.length})
          </p>
          <span className="text-xs text-gray-400">{adminAccounts.filter((a) => a.status === 'active').length} active</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Admin', 'Email', 'Role', 'Permissions', 'Created', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {adminAccounts.map((acc) => {
                const enabledCnt = Object.values(acc.permissions).filter(Boolean).length
                return (
                  <motion.tr key={acc.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: EASE_OUT }}
                    className={`hover:bg-gray-50/50 transition-colors ${acc.status === 'inactive' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                          {acc.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-gray-800">{acc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{acc.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_BADGE_COLOR[acc.roleId] || 'bg-gray-100 text-gray-600'}`}>
                        {acc.roleLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.round((enabledCnt / ALL_PERM_KEYS.length) * 100)}%` }} />
                        </div>
                        <span className="text-gray-400">{enabledCnt}/{ALL_PERM_KEYS.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{acc.createdAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${acc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {acc.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="Toggle active/inactive"
                          onClick={() => setAdminAccounts((prev) => prev.map((a) => a.id === acc.id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a))}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors">
                          <Lock size={12} />
                        </button>
                        <button
                          title="Reset password"
                          onClick={() => setResetTarget(acc)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                          <KeyRound size={12} />
                        </button>
                        <button
                          title="Remove admin"
                          onClick={() => setAdminAccounts((prev) => prev.filter((a) => a.id !== acc.id))}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          {adminAccounts.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-xs">No admin accounts yet. Click "Create Admin" to add one.</div>
          )}
        </div>
      </div>

      {/* Reset password mini-modal */}
      <AnimatePresence>
        {resetTarget && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound size={16} className="text-blue-500" />
                <p className="font-bold text-gray-900 text-sm">Reset Password — {resetTarget.name}</p>
              </div>
              <ResetPasswordInner onClose={() => setResetTarget(null)} />
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* Create / Edit role modal */}
      <AnimatePresence>
        {modal && (
          <RoleModal
            role={modal}
            onClose={() => setModal(null)}
            onSave={handleSaveRole}
          />
        )}
      </AnimatePresence>

      {/* Create Admin modal */}
      <AnimatePresence>
        {showCreateAdmin && (
          <CreateAdminModal
            presetRoles={PRESET_ROLES}
            onClose={() => setShowCreate(false)}
            onCreate={(acc) => setAdminAccounts((prev) => [...prev, acc])}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ResetPasswordInner({ onClose }) {
  const [pw, setPw]     = useState('')
  const [done, setDone] = useState(false)
  const [show, setShow] = useState(false)
  function submit() { if (pw.length >= 6) { setDone(true); setTimeout(onClose, 1200) } }
  return (
    <div className="space-y-3">
      <div className="relative">
        <KeyRound size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="New password (min 6 chars)"
          className="w-full pl-8 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600">Cancel</button>
        <button onClick={submit} disabled={pw.length < 6}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${done ? 'bg-green-500 text-white' : 'border-2 border-blue-300 bg-blue-50 text-blue-700 disabled:opacity-40'}`}>
          {done ? <><Check size={12} /> Done!</> : 'Reset Password'}
        </button>
      </div>
    </div>
  )
}
