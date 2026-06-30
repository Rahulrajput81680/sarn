import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, CreditCard, Trash2, UserCheck, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Table from '../../../components/ui/Table'
import RoleBadge from '../../../components/shared/RoleBadge'
import { formatDate, formatNumber } from '../../../utils/formatters'
import api from '../../../api/axios'

const TABS = [
  { key: 'overview',      label: 'Overview' },
  { key: 'users',         label: 'Users' },
  { key: 'subscription',  label: 'Subscription' },
  { key: 'audit',         label: 'Audit Log' },
]

function Skeleton({ className = '' }) {
  return <div className={`bg-gray-100 animate-pulse rounded ${className}`} />
}

export default function TenantDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [tab, setTab]       = useState('overview')
  const [tenant, setTenant] = useState(null)
  const [users, setUsers]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const fetchTenant = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/v1/admin/tenants/${id}`)
      setTenant(res.data.data.tenant)
    } catch {
      toast.error('Failed to load tenant details')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const res = await api.get(`/api/v1/admin/users?tenant=${id}&limit=50`)
      setUsers(res.data.data.users)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [id])

  useEffect(() => { fetchTenant() }, [fetchTenant])

  useEffect(() => {
    if (tab === 'users' && users.length === 0) fetchUsers()
  }, [tab, fetchUsers, users.length])

  async function handleSuspend() {
    if (!tenant) return
    const next = !tenant.isActive
    if (!window.confirm(`${next ? 'Reactivate' : 'Suspend'} this tenant?`)) return
    try {
      setActionLoading('suspend')
      await api.patch(`/api/v1/admin/tenants/${id}`, { isActive: next })
      setTenant((t) => ({ ...t, isActive: next }))
      toast.success(`Tenant ${next ? 'reactivated' : 'suspended'}`)
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading('')
    }
  }

  async function handleDelete() {
    if (!window.confirm('Permanently delete this tenant and ALL their data? This cannot be undone.')) return
    try {
      setActionLoading('delete')
      await api.delete(`/api/v1/admin/tenants/${id}`)
      toast.success('Tenant deleted')
      navigate('/admin/tenants')
    } catch {
      toast.error('Delete failed')
    } finally {
      setActionLoading('')
    }
  }

  const pct = (used, limit) => (limit > 0 ? Math.min((used / limit) * 100, 100) : 0)

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-32" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!tenant) return null

  const waNumber   = tenant.whatsapp?.phoneNumber || '—'
  const ownerEmail = tenant.owner?.email || '—'
  const ownerName  = tenant.owner?.name  || '—'

  const usageRows = [
    { label: 'Messages',     used: tenant.usage?.messages  ?? 0, limit: tenant.limits?.messages  ?? 0 },
    { label: 'Contacts',     used: tenant.usage?.contacts  ?? 0, limit: tenant.limits?.contacts  ?? 0 },
    { label: 'Team Members', used: tenant.usage?.teamSeats ?? 0, limit: tenant.limits?.teamSeats ?? 0 },
  ]

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/admin/tenants')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={14} /> Back to tenants
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700 shrink-0">
            {tenant.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
              <Badge color={tenant.isActive ? 'green' : 'red'}>
                {tenant.isActive ? 'active' : 'suspended'}
              </Badge>
              <Badge color="purple">{tenant.plan}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {ownerEmail}
              {waNumber !== '—' && ` · ${waNumber}`}
              {' · Joined '}{formatDate(tenant.createdAt)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <Button variant="secondary" size="sm" icon={<UserCheck size={14} />}>Impersonate</Button>
            <Button variant="outline"   size="sm" icon={<CreditCard size={14} />}>Change Plan</Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Ban size={14} />}
              onClick={handleSuspend}
              disabled={!!actionLoading}
            >
              {tenant.isActive ? 'Suspend' : 'Reactivate'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={actionLoading === 'delete' ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              onClick={handleDelete}
              disabled={!!actionLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
            {key === 'users' && tenant.userCount != null && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {tenant.userCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="font-semibold text-gray-700">Usage vs Plan Limits</p>
            {usageRows.map(({ label, used, limit }) => {
              const p = pct(used, limit)
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">
                      {formatNumber(used)} / {formatNumber(limit)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p > 90 ? 'bg-red-500' : p > 70 ? 'bg-yellow-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="font-semibold text-gray-700 mb-4">Business Info</p>
            <dl className="space-y-3">
              {[
                ['Owner Name',      ownerName],
                ['Owner Email',     ownerEmail],
                ['WhatsApp Number', waNumber],
                ['WA Status',       tenant.whatsapp?.status || '—'],
                ['Plan',            tenant.plan],
                ['Status',          tenant.isActive ? 'Active' : 'Suspended'],
                ['Joined',          formatDate(tenant.createdAt)],
                ['Total Users',     tenant.userCount ?? '—'],
                ['Total Contacts',  tenant.contactCount ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-sm text-gray-500">{k}</dt>
                  <dd className="text-sm font-medium text-gray-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        usersLoading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : (
          <Table
            columns={[
              { key: 'name',      label: 'Name' },
              { key: 'email',     label: 'Email' },
              { key: 'role',      label: 'Role',       render: (v) => <RoleBadge role={v} /> },
              { key: 'lastLogin', label: 'Last Login',  render: (v) => v ? formatDate(v) : '—' },
            ]}
            data={users}
            emptyMessage="No users found for this tenant"
          />
        )
      )}

      {/* Subscription */}
      {tab === 'subscription' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <CreditCard size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-600">Subscription management coming soon</p>
          <p className="text-sm mt-1">Current plan: <span className="font-semibold text-gray-800 capitalize">{tenant.plan}</span></p>
        </div>
      )}

      {/* Audit */}
      {tab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <p className="font-medium text-gray-600">Audit log coming soon</p>
        </div>
      )}
    </div>
  )
}
