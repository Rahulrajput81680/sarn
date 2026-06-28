import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import Table from '../../../components/ui/Table'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import SearchBar from '../../../components/shared/SearchBar'
import Pagination from '../../../components/shared/Pagination'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import { formatDate } from '../../../utils/formatters'
import api from '../../../api/axios'

const planColors   = { starter: 'gray', growth: 'blue', enterprise: 'purple' }
const statusColors = { active: 'green', suspended: 'red' }

function normalizeTenant(t) {
  return {
    id:        t._id,
    name:      t.name,
    owner:     t.owner?.email || '—',
    plan:      t.plan,
    waNumber:  t.whatsapp?.phoneNumber || '—',
    users:     t.usage?.teamSeats || 0,
    messages:  t.usage?.messages  || 0,
    status:    t.isActive ? 'active' : 'suspended',
    joined:    t.createdAt,
    isActive:  t.isActive,
  }
}

export default function TenantList() {
  const navigate  = useNavigate()
  const [tenants,     setTenants]     = useState([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [planFilter,  setPlanFilter]  = useState('')
  const [statusFilter,setStatusFilter]= useState('')
  const [page,        setPage]        = useState(1)
  const [suspendId,   setSuspendId]   = useState(null)
  const perPage = 10

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: perPage })
      if (search)       params.set('search', search)
      if (planFilter)   params.set('plan',   planFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res  = await api.get(`/api/v1/admin/tenants?${params}`)
      const raw  = res.data.data.tenants || []
      setTenants(raw.map(normalizeTenant))
      setTotal(res.data.data.total || 0)
    } catch {
      toast.error('Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }, [search, planFilter, statusFilter, page])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  const handleSuspend = async () => {
    if (!suspendId) return
    const tenant = tenants.find((t) => t.id === suspendId)
    if (!tenant) return setSuspendId(null)
    try {
      await api.patch(`/api/v1/admin/tenants/${suspendId}`, { isActive: false })
      toast.success('Tenant suspended')
      fetchTenants()
    } catch {
      toast.error('Failed to suspend tenant')
    } finally {
      setSuspendId(null)
    }
  }

  const columns = [
    {
      key: 'name', label: 'Tenant', render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900">{v}</p>
          <p className="text-xs text-gray-400">{row.owner}</p>
        </div>
      ),
    },
    { key: 'plan',     label: 'Plan',     render: (v) => <Badge color={planColors[v] || 'gray'}>{v ? v.charAt(0).toUpperCase() + v.slice(1) : '—'}</Badge> },
    { key: 'waNumber', label: 'WA Number' },
    { key: 'users',    label: 'Seats',    render: (v) => v.toLocaleString() },
    { key: 'messages', label: 'Msg Used', render: (v) => v.toLocaleString() },
    { key: 'status',   label: 'Status',   render: (v) => <Badge color={statusColors[v] || 'gray'}>{v}</Badge> },
    { key: 'joined',   label: 'Joined',   render: (v) => formatDate(v) },
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/tenants/${row.id}`) }}
            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium"
          >
            View
          </button>
          {row.isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); setSuspendId(row.id) }}
              className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded font-medium"
            >
              Suspend
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tenants"
        description={`${total} total organization${total !== 1 ? 's' : ''}`}
        breadcrumbs={['Admin', 'Tenants']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={fetchTenants}>
              Refresh
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => navigate('/admin/tenants/new')}>
              New Tenant
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search tenants…"
          className="w-64"
        />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-white border border-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          data={tenants}
          onRowClick={(row) => navigate(`/admin/tenants/${row.id}`)}
        />
      )}

      <div className="flex justify-end">
        <Pagination page={page} total={total} perPage={perPage} onChange={setPage} />
      </div>

      <ConfirmDialog
        isOpen={!!suspendId}
        title="Suspend Tenant"
        message="Are you sure you want to suspend this tenant? They will lose access immediately."
        confirmLabel="Suspend"
        danger
        onConfirm={handleSuspend}
        onCancel={() => setSuspendId(null)}
      />
    </div>
  )
}
