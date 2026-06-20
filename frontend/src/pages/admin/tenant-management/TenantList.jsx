import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, MoreVertical, Ban, RefreshCw } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Table from '../../../components/ui/Table'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import SearchBar from '../../../components/shared/SearchBar'
import Pagination from '../../../components/shared/Pagination'
import ConfirmDialog from '../../../components/shared/ConfirmDialog'
import { formatDate } from '../../../utils/formatters'

const MOCK = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: ['TechFlow', 'ShopBot', 'QuickMart', 'StyleHub', 'FoodZone', 'EduLearn', 'MedConnect', 'FinWise'][i % 8] + ` ${i + 1}`,
  owner: `owner${i + 1}@example.com`,
  plan: ['Free', 'Pro', 'Enterprise'][i % 3],
  waNumber: `+91 98765${String(i).padStart(5, '0')}`,
  users: Math.floor(Math.random() * 20) + 1,
  messages: Math.floor(Math.random() * 50000),
  status: ['active', 'trial', 'suspended', 'churned'][i % 4],
  joined: new Date(2025, 0, i + 1).toISOString(),
}))

const planColors = { Enterprise: 'purple', Pro: 'blue', Free: 'gray' }
const statusColors = { active: 'green', trial: 'yellow', suspended: 'red', churned: 'gray' }

export default function TenantList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [suspendId, setSuspendId] = useState(null)
  const perPage = 10

  const filtered = MOCK.filter((t) => {
    const q = search.toLowerCase()
    return (
      (!q || t.name.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q)) &&
      (!planFilter || t.plan === planFilter) &&
      (!statusFilter || t.status === statusFilter)
    )
  })
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const columns = [
    { key: 'name', label: 'Tenant', render: (v, row) => (
      <div>
        <p className="font-medium text-gray-900">{v}</p>
        <p className="text-xs text-gray-400">{row.owner}</p>
      </div>
    )},
    { key: 'plan', label: 'Plan', render: (v) => <Badge color={planColors[v]}>{v}</Badge> },
    { key: 'waNumber', label: 'WA Number' },
    { key: 'users', label: 'Users' },
    { key: 'messages', label: 'Msg/Month', render: (v) => v.toLocaleString() },
    { key: 'status', label: 'Status', render: (v) => <Badge color={statusColors[v]}>{v}</Badge> },
    { key: 'joined', label: 'Joined', render: (v) => formatDate(v) },
    {
      key: 'actions', label: '', sortable: false, render: (_, row) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/tenants/${row.id}`) }}
            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium"
          >
            View
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSuspendId(row.id) }}
            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded font-medium"
          >
            Suspend
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tenants"
        description={`${MOCK.length} total organizations`}
        breadcrumbs={['Admin', 'Tenants']}
        action={
          <Button icon={<Plus size={14} />} size="sm" onClick={() => navigate('/admin/tenants/new')}>
            New Tenant
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search tenants…" className="w-64" />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All plans</option>
          <option>Free</option>
          <option>Pro</option>
          <option>Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All statuses</option>
          <option>active</option>
          <option>trial</option>
          <option>suspended</option>
          <option>churned</option>
        </select>
        <button className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <Table
        columns={columns}
        data={paginated}
        onRowClick={(row) => navigate(`/admin/tenants/${row.id}`)}
      />

      <div className="flex justify-end">
        <Pagination page={page} total={filtered.length} perPage={perPage} onChange={setPage} />
      </div>

      <ConfirmDialog
        isOpen={!!suspendId}
        title="Suspend Tenant"
        message="Are you sure you want to suspend this tenant? They will lose access immediately."
        confirmLabel="Suspend"
        danger
        onConfirm={() => setSuspendId(null)}
        onCancel={() => setSuspendId(null)}
      />
    </div>
  )
}
