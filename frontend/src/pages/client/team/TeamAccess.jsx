import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, Shield, Users, Activity, X, Check, Clock,
  MoreVertical, Trash2, Mail, ChevronDown, Monitor,
  Smartphone, Globe, AlertCircle, Power, Eye,
} from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

const ROLES = {
  owner:     { label: 'Owner',    color: 'bg-purple-100 text-purple-700 border border-purple-200' },
  manager:   { label: 'Manager',  color: 'bg-blue-100 text-blue-700 border border-blue-200' },
  agent:     { label: 'Agent',    color: 'bg-green-100 text-green-700 border border-green-200' },
  marketing: { label: 'Marketing', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
}

const PERMISSIONS = [
  { key: 'campaigns',  label: 'Campaign creation' },
  { key: 'contacts',   label: 'Contact upload' },
  { key: 'templates',  label: 'Template creation' },
  { key: 'inbox',      label: 'Inbox access' },
  { key: 'analytics',  label: 'Analytics access' },
]

const INIT_MEMBERS = [
  {
    id: 1, name: 'Kunal Mehta',   email: 'kunal@wixabotic.com',  role: 'owner',     active: true,
    avatar: 'KM', color: 'bg-purple-500', joinedAt: 'Jan 2025', lastLogin: 'Today, 9:12 AM',
    permissions: { campaigns: true, contacts: true, templates: true, inbox: true, analytics: true },
  },
  {
    id: 2, name: 'Rahul Sharma',  email: 'rahul@wixabotic.com',  role: 'manager',   active: true,
    avatar: 'RS', color: 'bg-blue-500',   joinedAt: 'Feb 2025', lastLogin: 'Today, 8:45 AM',
    permissions: { campaigns: true, contacts: true, templates: true, inbox: true, analytics: true },
  },
  {
    id: 3, name: 'Sneha Kapoor',  email: 'sneha@wixabotic.com',  role: 'agent',     active: true,
    avatar: 'SK', color: 'bg-emerald-500', joinedAt: 'Mar 2025', lastLogin: 'Yesterday, 6:30 PM',
    permissions: { campaigns: false, contacts: false, templates: false, inbox: true, analytics: false },
  },
  {
    id: 4, name: 'Dev Kumar',     email: 'dev@wixabotic.com',    role: 'agent',     active: true,
    avatar: 'DK', color: 'bg-teal-500',   joinedAt: 'Mar 2025', lastLogin: 'Yesterday, 4:10 PM',
    permissions: { campaigns: false, contacts: false, templates: false, inbox: true, analytics: true },
  },
  {
    id: 5, name: 'Priti Nair',    email: 'priti@wixabotic.com',  role: 'marketing', active: true,
    avatar: 'PN', color: 'bg-orange-500', joinedAt: 'Apr 2025', lastLogin: '2 days ago, 11:20 AM',
    permissions: { campaigns: true, contacts: true, templates: true, inbox: false, analytics: false },
  },
  {
    id: 6, name: 'Arjun Patel',   email: 'arjun@wixabotic.com',  role: 'marketing', active: false,
    avatar: 'AP', color: 'bg-gray-400',   joinedAt: 'May 2025', lastLogin: '19 days ago',
    permissions: { campaigns: true, contacts: false, templates: false, inbox: false, analytics: false },
  },
]

const ACTIVITY_LOGS = [
  { id: 1, user: 'Kunal Mehta',  action: 'Login',         time: 'Today, 9:12 AM',          ip: '103.21.58.14', device: 'Chrome / macOS',   status: 'success' },
  { id: 2, user: 'Rahul Sharma', action: 'Login',         time: 'Today, 8:45 AM',          ip: '49.36.11.82',  device: 'Chrome / Windows', status: 'success' },
  { id: 3, user: 'Sneha Kapoor', action: 'Login',         time: 'Yesterday, 6:30 PM',      ip: '103.21.58.90', device: 'Safari / iOS',     status: 'success' },
  { id: 4, user: 'Dev Kumar',    action: 'Login',         time: 'Yesterday, 4:10 PM',      ip: '157.47.22.3',  device: 'Chrome / Android', status: 'success' },
  { id: 5, user: 'Arjun Patel',  action: 'Login attempt', time: 'Yesterday, 9:00 AM',      ip: '192.168.1.12', device: 'Chrome / Windows', status: 'failed'  },
  { id: 6, user: 'Priti Nair',   action: 'Login',         time: '2 days ago, 11:20 AM',    ip: '103.21.58.44', device: 'Firefox / macOS',  status: 'success' },
  { id: 7, user: 'Rahul Sharma', action: 'Login',         time: '3 days ago, 10:05 AM',    ip: '49.36.11.82',  device: 'Chrome / Windows', status: 'success' },
  { id: 8, user: 'Arjun Patel',  action: 'Login attempt', time: '4 days ago, 3:45 PM',     ip: '45.112.10.1',  device: 'Unknown',          status: 'failed'  },
  { id: 9, user: 'Dev Kumar',    action: 'Login',         time: '5 days ago, 9:30 AM',     ip: '157.47.22.3',  device: 'Chrome / Android', status: 'success' },
]

function Toggle({ value, onChange, disabled }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={clsx(
        'relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0',
        value ? 'bg-green-500' : 'bg-gray-200',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
      whileTap={!disabled ? { scale: 0.93 } : {}}
      style={{ transition: 'background-color 200ms ease' }}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ x: value ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
    </motion.button>
  )
}

function RoleBadge({ role, onChange, locked }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => !locked && setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
          ROLES[role].color,
          !locked && 'hover:opacity-80 cursor-pointer',
          locked && 'cursor-default'
        )}
      >
        {ROLES[role].label}
        {!locked && <ChevronDown size={10} />}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className="absolute left-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 min-w-[140px]"
            >
              {Object.entries(ROLES).map(([key, { label, color }]) => (
                <button
                  key={key}
                  onClick={() => { onChange(key); setOpen(false) }}
                  className={clsx(
                    'flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-left',
                    role === key && 'font-semibold'
                  )}
                >
                  <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${color}`}>{label}</span>
                  {role === key && <Check size={10} className="ml-auto text-green-600" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TeamAccess() {
  const [members, setMembers] = useState(INIT_MEMBERS)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [permDrawer, setPermDrawer] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'agent' })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const activeCount = members.filter((m) => m.active).length
  const roleCount = Object.keys(ROLES).filter((r) => members.some((m) => m.role === r)).length

  const updateMember = (id, patch) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))

  const togglePermission = (id, key) =>
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, permissions: { ...m.permissions, [key]: !m.permissions[key] } } : m
      )
    )

  const handleInvite = () => {
    if (!inviteForm.name || !inviteForm.email) return
    const initials = inviteForm.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    const colors = ['bg-sky-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500']
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(), name: inviteForm.name, email: inviteForm.email, role: inviteForm.role,
        active: true, avatar: initials, color: colors[prev.length % colors.length],
        joinedAt: 'Just now', lastLogin: 'Never',
        permissions: { campaigns: false, contacts: false, templates: false, inbox: true, analytics: false },
      },
    ])
    setInviteForm({ name: '', email: '', role: 'agent' })
    setInviteOpen(false)
  }

  const selectedMember = permDrawer ? members.find((m) => m.id === permDrawer) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Team & Access" description="Manage team members, roles, and permissions" />
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setActivityOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shrink-0"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Activity size={14} /> Login Activity
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-gray-800 shadow-sm shadow-green-500 border-2 border-green-400 text-sm font-medium rounded-lg shrink-0 hover:bg-white/45"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <UserPlus size={14} /> Invite Member
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Members', value: members.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Now',    value: activeCount,    icon: Check,  color: 'text-green-600 bg-green-50' },
          { label: 'Roles in Use',  value: roleCount,      icon: Shield, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Members table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Team Members</h3>
          <span className="text-xs text-gray-400">{members.length} members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 w-64">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Permissions</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-24">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">Last Login</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((member) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx('group', !member.active && 'opacity-60')}
                >
                  {/* Member info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${member.color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-xs font-bold">{member.avatar}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-4">
                    <RoleBadge
                      role={member.role}
                      locked={member.role === 'owner'}
                      onChange={(role) => updateMember(member.id, { role })}
                    />
                  </td>

                  {/* Permissions — compact dots + edit */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {PERMISSIONS.map(({ key, label }) => (
                        <div
                          key={key}
                          title={label}
                          className={clsx(
                            'w-2.5 h-2.5 rounded-full transition-colors',
                            member.permissions[key] ? 'bg-green-500' : 'bg-gray-200'
                          )}
                        />
                      ))}
                      <button
                        onClick={() => setPermDrawer(member.id)}
                        className="ml-2 text-[10px] text-gray-400 hover:text-green-600 font-medium transition-colors underline underline-offset-2"
                      >
                        edit
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {PERMISSIONS.filter(({ key }) => member.permissions[key]).length} / {PERMISSIONS.length} enabled
                    </p>
                  </td>

                  {/* Status toggle */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Toggle
                        value={member.active}
                        disabled={member.role === 'owner'}
                        onChange={(v) => updateMember(member.id, { active: v })}
                      />
                      <span className={clsx(
                        'text-xs font-medium',
                        member.active ? 'text-green-600' : 'text-gray-400'
                      )}>
                        {member.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </td>

                  {/* Last login */}
                  <td className="px-4 py-4">
                    <p className="text-xs text-gray-500 leading-tight">{member.lastLogin}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Since {member.joinedAt}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={14} />
                      </button>
                      <AnimatePresence>
                        {menuOpen === member.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.13, ease: EASE_OUT }}
                              className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 min-w-[160px]"
                            >
                              <button
                                onClick={() => { setPermDrawer(member.id); setMenuOpen(null) }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Shield size={13} className="text-gray-400" /> Edit Permissions
                              </button>
                              <button
                                onClick={() => { setActivityOpen(true); setMenuOpen(null) }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Eye size={13} className="text-gray-400" /> View Activity
                              </button>
                              {member.role !== 'owner' && (
                                <>
                                  <button
                                    onClick={() => { updateMember(member.id, { active: !member.active }); setMenuOpen(null) }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Power size={13} className="text-gray-400" />
                                    {member.active ? 'Disable Access' : 'Enable Access'}
                                  </button>
                                  <div className="my-1 border-t border-gray-100" />
                                  <button
                                    onClick={() => { setDeleteConfirm(member.id); setMenuOpen(null) }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={13} /> Remove Member
                                  </button>
                                </>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Permissions drawer ── */}
      <AnimatePresence>
        {permDrawer && selectedMember && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 bg-black/25 backdrop-blur-sm"
              onClick={() => setPermDrawer(null)}
            />
            <motion.aside
              initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="w-80 bg-white h-screen flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Edit Permissions</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedMember.name}</p>
                </div>
                <button onClick={() => setPermDrawer(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <div className={`w-10 h-10 rounded-full ${selectedMember.color} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{selectedMember.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedMember.name}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${ROLES[selectedMember.role].color}`}>
                      {ROLES[selectedMember.role].label}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Access Permissions</p>
                {PERMISSIONS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                    </div>
                    <Toggle
                      value={selectedMember.permissions[key]}
                      disabled={selectedMember.role === 'owner'}
                      onChange={() => togglePermission(selectedMember.id, key)}
                    />
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => setPermDrawer(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-green-100 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ── Login Activity drawer ── */}
      <AnimatePresence>
        {activityOpen && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 bg-black/25 backdrop-blur-sm"
              onClick={() => setActivityOpen(false)}
            />
            <motion.aside
              initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="w-[500px] bg-white h-screen flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Login Activity</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Recent sign-in history for all members</p>
                </div>
                <button onClick={() => setActivityOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Member</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">IP / Device</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ACTIVITY_LOGS.map((log) => {
                      const member = members.find((m) => m.name === log.user)
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full ${member?.color || 'bg-gray-400'} flex items-center justify-center shrink-0`}>
                                <span className="text-white text-[10px] font-bold">{member?.avatar || '?'}</span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{log.user}</p>
                                <p className="text-[10px] text-gray-400">{log.action}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock size={10} className="text-gray-400" /> {log.time}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs text-gray-600">{log.ip}</p>
                            <p className="text-[10px] text-gray-400">{log.device}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={clsx(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                              log.status === 'success'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-600'
                            )}>
                              {log.status === 'success' ? <Check size={8} /> : <AlertCircle size={8} />}
                              {log.status === 'success' ? 'Success' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ── Invite Modal ── */}
      <AnimatePresence>
        {inviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setInviteOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Invite Team Member</h2>
                  <p className="text-xs text-gray-400 mt-0.5">They'll receive an email invitation</p>
                </div>
                <button onClick={() => setInviteOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assign Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ROLES).filter(([k]) => k !== 'owner').map(([key, { label, color }]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setInviteForm((f) => ({ ...f, role: key }))}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all text-sm font-medium',
                          inviteForm.role === key
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        )}
                      >
                        <span className={`w-2 h-2 rounded-full ${key === 'manager' ? 'bg-blue-500' : key === 'agent' ? 'bg-green-500' : 'bg-orange-500'}`} />
                        {label}
                        {inviteForm.role === key && <Check size={12} className="ml-auto text-green-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setInviteOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteForm.name || !inviteForm.email}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-green-100 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6 z-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Remove Member</h3>
              <p className="text-xs text-gray-500 mb-5">
                This will revoke <strong>{members.find((m) => m.id === deleteConfirm)?.name}'s</strong> access immediately. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setMembers((p) => p.filter((m) => m.id !== deleteConfirm)); setDeleteConfirm(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
