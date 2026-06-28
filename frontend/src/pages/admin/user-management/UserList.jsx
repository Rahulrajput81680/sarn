import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Building2, ChevronRight, MoreVertical,
  CheckCircle2, PauseCircle, Ban, Clock, Filter, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import api from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

const COLORS = ['bg-purple-500','bg-blue-500','bg-pink-500','bg-orange-500','bg-indigo-500','bg-green-500','bg-cyan-500','bg-teal-500','bg-red-500','bg-amber-500']

const STATUS_FILTERS = ['all', 'active', 'suspended']
const PLAN_FILTERS   = ['all', 'Enterprise', 'Growth', 'Starter']

const statusColor = { active: 'green', suspended: 'gray' }
const planColor   = { Enterprise: 'purple', Growth: 'blue', Starter: 'gray' }

const statusIcon = {
  active:    <CheckCircle2 size={12} className="text-green-500" />,
  suspended: <PauseCircle  size={12} className="text-gray-400"  />,
}

function fmtNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function initials(name = '') {
  const w = name.trim().split(/\s+/)
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function normalizeTenant(t, i) {
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  return {
    id:       t._id,
    company:  t.name,
    avatar:   initials(t.name),
    color:    COLORS[i % COLORS.length],
    owner:    t.owner?.name  || '—',
    email:    t.owner?.email || '',
    phone:    t.owner?.phone || '',
    plan:     cap(t.plan),
    status:   t.isActive ? 'active' : 'suspended',
    messages: t.usage?.messages || 0,
    created:  new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    waPhone:  t.whatsapp?.phoneNumber || '—',
  }
}

/* ─── Row action menu ────────────────────────────────────── */

function ActionMenu({ client, onStatusChange, onDelete }) {
  const [open, setOpen] = useState(false)
  const actions = [
    client.status !== 'active'    && { label: 'Activate', color: 'text-green-600', fn: () => onStatusChange(client.id, true) },
    client.status !== 'suspended' && { label: 'Suspend',  color: 'text-amber-600', fn: () => onStatusChange(client.id, false) },
    { label: 'Delete', color: 'text-red-600', fn: () => onDelete(client) },
  ].filter(Boolean)

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((v) => !v)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
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
              className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden w-36"
            >
              {actions.map((a) => (
                <button key={a.label} onClick={() => { a.fn(); setOpen(false) }} className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-gray-50 transition-colors ${a.color}`}>
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

/* ─── Delete confirm modal ───────────────────────────────── */

function DeleteModal({ client, onClose, onConfirm }) {
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
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Ban size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Delete Client?</p>
            <p className="text-xs text-gray-400">{client.company}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">This will permanently delete the client account. This action cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600">Delete</button>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function UserList() {
  const navigate = useNavigate()
  const [clients, setClients]           = useState([])
  const [total,   setTotal]             = useState(0)
  const [loading, setLoading]           = useState(true)
  const [search,  setSearch]            = useState('')
  const [statusF, setStatusF]           = useState('all')
  const [planF,   setPlanF]             = useState('all')
  const [page,    setPage]              = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const perPage = 10

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: perPage })
      if (search)             params.set('search', search)
      if (statusF !== 'all')  params.set('status', statusF)
      if (planF   !== 'all')  params.set('plan',   planF.toLowerCase())

      const res = await api.get(`/api/v1/admin/tenants?${params}`)
      const raw  = res.data.data.tenants || []
      setClients(raw.map((t, i) => normalizeTenant(t, i)))
      setTotal(res.data.data.total || 0)
    } catch {
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [search, statusF, planF, page])

  useEffect(() => { fetchClients() }, [fetchClients])

  const handleStatusChange = async (id, isActive) => {
    try {
      await api.patch(`/api/v1/admin/tenants/${id}`, { isActive })
      toast.success(isActive ? 'Client activated' : 'Client suspended')
      fetchClients()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/api/v1/admin/tenants/${deleteTarget.id}`)
      toast.success('Client deleted')
      setDeleteTarget(null)
      fetchClients()
    } catch {
      toast.error('Failed to delete client')
    }
  }

  const summary = {
    active:    clients.filter((c) => c.status === 'active').length,
    suspended: clients.filter((c) => c.status === 'suspended').length,
  }

  const pages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Client Accounts"
        description={`${total} client account${total !== 1 ? 's' : ''} on the platform`}
        breadcrumbs={['Admin', 'User Management']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={fetchClients}>
              Refresh
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => navigate('/admin/tenants/new')}>
              Add Client
            </Button>
          </div>
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4"><div className="h-8 bg-gray-100 animate-pulse rounded-lg" /></td>
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    <Building2 size={32} className="mx-auto mb-2 text-gray-200" />
                    {search || statusF !== 'all' || planF !== 'all' ? 'No clients match your filters' : 'No clients yet'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {clients.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.03 }}
                      onClick={() => navigate(`/admin/tenants/${c.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
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
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-gray-800">{c.owner}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{c.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge color={planColor[c.plan] || 'gray'}>{c.plan}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {statusIcon[c.status]}
                          <Badge color={statusColor[c.status]}>{c.status}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-semibold text-gray-800">{fmtNum(c.messages)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-400">{c.created}</span>
                      </td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/tenants/${c.id}`) }}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            View <ChevronRight size={11} />
                          </button>
                          <ActionMenu
                            client={c}
                            onStatusChange={(id, isActive) => handleStatusChange(id, isActive)}
                            onDelete={(client) => setDeleteTarget(client)}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Prev</button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${p === page ? 'bg-green-500 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
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
