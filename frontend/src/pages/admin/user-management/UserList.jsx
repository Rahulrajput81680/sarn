import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Building2, ChevronRight, MoreVertical,
  CheckCircle2, PauseCircle, Ban, Clock, Filter,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Demo data ──────────────────────────────────────────── */

const CLIENTS = [
  { id: 1,  company: 'Flipkart Commerce',    avatar: 'FC', color: 'bg-purple-500', owner: 'Raj Mehta',       email: 'raj@flipkart.com',      phone: '+91 98100 00001', plan: 'Enterprise', status: 'active',    messages: 124000, conversations: 3841, created: 'Jan 5, 2026',  waPhone: '+91 98765 00001' },
  { id: 2,  company: 'QuickMart',            avatar: 'QM', color: 'bg-blue-500',   owner: 'Priya Verma',     email: 'info@quickmart.in',     phone: '+91 98100 00002', plan: 'Growth',     status: 'trial',     messages: 32100,  conversations: 890,  created: 'Jun 1, 2026',  waPhone: '+91 98765 00002' },
  { id: 3,  company: 'StyleHub',             avatar: 'SH', color: 'bg-pink-500',   owner: 'Sneha Kapoor',    email: 'hello@stylehub.co',     phone: '+91 98100 00003', plan: 'Growth',     status: 'active',    messages: 87200,  conversations: 2104, created: 'Feb 12, 2026', waPhone: '+91 98765 00003' },
  { id: 4,  company: 'FoodZone',             avatar: 'FZ', color: 'bg-orange-500', owner: 'Arjun Singh',     email: 'ops@foodzone.in',       phone: '+91 98100 00004', plan: 'Starter',    status: 'active',    messages: 18500,  conversations: 612,  created: 'Mar 3, 2026',  waPhone: '+91 98765 00004' },
  { id: 5,  company: 'TechStart',            avatar: 'TS', color: 'bg-indigo-500', owner: 'Kunal Shah',      email: 'ceo@techstart.io',      phone: '+91 98100 00005', plan: 'Enterprise', status: 'active',    messages: 213000, conversations: 6120, created: 'Nov 20, 2025', waPhone: '+91 98765 00005' },
  { id: 6,  company: 'GreenLeaf',            avatar: 'GL', color: 'bg-green-500',  owner: 'Meera Nair',      email: 'admin@greenleaf.com',   phone: '+91 98100 00006', plan: 'Starter',    status: 'expired',   messages: 4900,   conversations: 148,  created: 'Apr 7, 2026',  waPhone: '+91 98765 00006' },
  { id: 7,  company: 'RapidDeliver',         avatar: 'RD', color: 'bg-cyan-500',   owner: 'Vikram Patel',    email: 'vp@rapiddeliver.com',   phone: '+91 98100 00007', plan: 'Growth',     status: 'active',    messages: 56000,  conversations: 1430, created: 'Dec 14, 2025', waPhone: '+91 98765 00007' },
  { id: 8,  company: 'EduBridge',            avatar: 'EB', color: 'bg-teal-500',   owner: 'Ananya Roy',      email: 'info@edubridge.in',     phone: '+91 98100 00008', plan: 'Starter',    status: 'suspended', messages: 2100,   conversations: 70,   created: 'May 22, 2026', waPhone: '+91 98765 00008' },
  { id: 9,  company: 'MediCare Plus',        avatar: 'MP', color: 'bg-red-500',    owner: 'Dr. S. Iyer',     email: 'admin@medicareplus.in', phone: '+91 98100 00009', plan: 'Enterprise', status: 'active',    messages: 98400,  conversations: 2910, created: 'Oct 9, 2025',  waPhone: '+91 98765 00009' },
  { id: 10, company: 'BrandCraft',           avatar: 'BC', color: 'bg-amber-500',  owner: 'Rohan Gupta',     email: 'hello@brandcraft.co',   phone: '+91 98100 00010', plan: 'Growth',     status: 'trial',     messages: 7800,   conversations: 220,  created: 'Jun 5, 2026',  waPhone: '+91 98765 00010' },
  { id: 11, company: 'UrbanRoots',           avatar: 'UR', color: 'bg-lime-600',   owner: 'Sonal Desai',     email: 'sonal@urbanroots.in',   phone: '+91 98100 00011', plan: 'Starter',    status: 'active',    messages: 11200,  conversations: 380,  created: 'Mar 18, 2026', waPhone: '+91 98765 00011' },
  { id: 12, company: 'CloudBazaar',          avatar: 'CB', color: 'bg-sky-500',    owner: 'Dev Kumar',       email: 'dev@cloudbazaar.com',   phone: '+91 98100 00012', plan: 'Growth',     status: 'active',    messages: 44300,  conversations: 1182, created: 'Jan 30, 2026', waPhone: '+91 98765 00012' },
]

const STATUS_FILTERS = ['all', 'active', 'trial', 'expired', 'suspended']
const PLAN_FILTERS   = ['all', 'Enterprise', 'Growth', 'Starter']

const statusColor = { active: 'green', trial: 'yellow', expired: 'red', suspended: 'gray' }
const planColor   = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }

const statusIcon = {
  active:    <CheckCircle2 size={12} className="text-green-500" />,
  trial:     <Clock size={12} className="text-amber-500" />,
  expired:   <Ban size={12} className="text-red-400" />,
  suspended: <PauseCircle size={12} className="text-gray-400" />,
}

function fmtNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/* ─── Row action menu ────────────────────────────────────── */

function ActionMenu({ client, onStatusChange, onDelete }) {
  const [open, setOpen] = useState(false)

  const actions = [
    client.status !== 'active'    && { label: 'Activate',  color: 'text-green-600', fn: () => onStatusChange(client.id, 'active') },
    client.status !== 'suspended' && { label: 'Suspend',   color: 'text-amber-600', fn: () => onStatusChange(client.id, 'suspended') },
    client.status !== 'expired'   && { label: 'Block',     color: 'text-red-500',   fn: () => onStatusChange(client.id, 'expired') },
    { label: 'Delete / Archive', color: 'text-red-600', fn: () => onDelete(client.id) },
  ].filter(Boolean)

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12, ease: EASE_OUT }}
              className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden w-44"
            >
              {actions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { a.fn(); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-gray-50 transition-colors ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Delete/Archive confirm modal ───────────────────────── */

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
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Ban size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Remove Client Account</p>
            <p className="text-xs text-gray-400">{client.company}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5">
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
            <p className="text-xs font-medium text-red-700">This action is irreversible. All client data, messages, contacts, and templates will be permanently deleted.</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
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

export default function UserList() {
  const navigate = useNavigate()
  const [clients, setClients] = useState(CLIENTS)
  const [search, setSearch]       = useState('')
  const [statusF, setStatusF]     = useState('all')
  const [planF, setPlanF]         = useState('all')
  const [page, setPage]           = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const perPage = 10

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    const matchQ = !q || c.company.toLowerCase().includes(q) || c.owner.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    const matchS = statusF === 'all' || c.status === statusF
    const matchP = planF   === 'all' || c.plan   === planF
    return matchQ && matchS && matchP
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const curPage = Math.min(page, pages)
  const paginated = filtered.slice((curPage - 1) * perPage, curPage * perPage)

  const handleStatusChange = (id, newStatus) => {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c))
  }

  const handleDelete = (mode) => {
    if (mode === 'delete') setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    else setClients((prev) => prev.map((c) => c.id === deleteTarget.id ? { ...c, status: 'expired' } : c))
    setDeleteTarget(null)
  }

  const summary = {
    active:    clients.filter((c) => c.status === 'active').length,
    trial:     clients.filter((c) => c.status === 'trial').length,
    expired:   clients.filter((c) => c.status === 'expired').length,
    suspended: clients.filter((c) => c.status === 'suspended').length,
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Client Accounts"
        description={`${clients.length} client accounts on the platform`}
        breadcrumbs={['Admin', 'User Management']}
        action={
          <Button size="sm" icon={<Plus size={14} />} onClick={() => navigate('/admin/users/new')}>
            Add Client
          </Button>
        }
      />

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(summary).map(([s, count]) => (
          <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            {statusIcon[s]}
            <span className="text-xs font-semibold text-gray-700 capitalize">{s}</span>
            <span className="text-xs font-bold text-gray-500">{count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by company, owner or email…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-400"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5">
          <Filter size={12} className="text-gray-400" />
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1) }} className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer pr-1">
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-1.5">
          <select value={planF} onChange={(e) => { setPlanF(e.target.value); setPage(1) }} className="text-xs font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer pr-1">
            {PLAN_FILTERS.map((p) => <option key={p} value={p}>{p === 'all' ? 'All plans' : p}</option>)}
          </select>
        </div>

        {(search || statusF !== 'all' || planF !== 'all') && (
          <button onClick={() => { setSearch(''); setStatusF('all'); setPlanF('all'); setPage(1) }} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{total} result{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400">Messages</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">Created</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {paginated.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.03 }}
                    onClick={() => navigate(`/admin/users/${c.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {/* Company */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-xs font-bold">{c.avatar}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.company}</p>
                          <p className="text-xs text-gray-400">{c.waPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{c.owner}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{c.email}</p>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5">
                      <Badge color={planColor[c.plan]}>{c.plan}</Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {statusIcon[c.status]}
                        <Badge color={statusColor[c.status]}>{c.status}</Badge>
                      </div>
                    </td>

                    {/* Messages */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-800">{fmtNum(c.messages)}</span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-400">{c.created}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${c.id}`) }}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          View <ChevronRight size={11} />
                        </button>
                        <ActionMenu
                          client={c}
                          onStatusChange={handleStatusChange}
                          onDelete={(id) => setDeleteTarget(clients.find((x) => x.id === id))}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    <Building2 size={32} className="mx-auto mb-2 text-gray-200" />
                    No clients match your filters
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
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={curPage === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${p === curPage ? 'bg-green-500 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={curPage === pages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            client={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
