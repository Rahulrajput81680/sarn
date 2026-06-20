import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, RefreshCw, CreditCard, Trash2, UserCheck } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Tabs from '../../../components/ui/Tabs'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Table from '../../../components/ui/Table'
import RoleBadge from '../../../components/shared/RoleBadge'
import { formatDate, formatNumber, formatPercent } from '../../../utils/formatters'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'Users', count: 12 },
  { key: 'subscription', label: 'Subscription' },
  { key: 'api', label: 'API Usage' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'support', label: 'Support', count: 3 },
]

const MOCK_USERS = [
  { id: 1, name: 'Ravi Kumar', email: 'ravi@tenant.com', role: 'admin', lastLogin: '2026-05-11' },
  { id: 2, name: 'Priya Sharma', email: 'priya@tenant.com', role: 'agent', lastLogin: '2026-05-10' },
  { id: 3, name: 'Amit Singh', email: 'amit@tenant.com', role: 'viewer', lastLogin: '2026-05-08' },
]

const MOCK_PAYMENTS = [
  { id: 1, date: '2026-05-01', amount: '$299', method: 'Card ending 4242', status: 'paid' },
  { id: 2, date: '2026-04-01', amount: '$299', method: 'Card ending 4242', status: 'paid' },
  { id: 3, date: '2026-03-01', amount: '$299', method: 'Card ending 4242', status: 'failed' },
]

const MOCK_AUDIT = [
  { id: 1, user: 'Ravi Kumar', action: 'Created campaign "May Sale"', ip: '103.x.x.x', time: '2026-05-11 14:32' },
  { id: 2, user: 'Priya Sharma', action: 'Updated bot keyword "hello"', ip: '103.x.x.x', time: '2026-05-10 10:15' },
]

export default function TenantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  const tenant = {
    id,
    name: 'Flipkart Commerce',
    owner: 'raj@flipkart.com',
    plan: 'Enterprise',
    waNumber: '+91 9876543210',
    status: 'active',
    joined: '2025-08-15',
    users: 12,
    limits: { messages: 500000, leads: 10000, campaigns: 100, users: 20 },
    usage: { messages: 347200, leads: 6420, campaigns: 43, users: 12 },
  }

  const pct = (used, limit) => Math.min((used / limit) * 100, 100)

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/admin/tenants')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={14} /> Back to tenants
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
            {tenant.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
              <Badge color="green">{tenant.status}</Badge>
              <Badge color="purple">{tenant.plan}</Badge>
            </div>
            <p className="text-sm text-gray-500">{tenant.owner} · {tenant.waNumber} · Joined {formatDate(tenant.joined)}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" icon={<UserCheck size={14} />}>Impersonate</Button>
            <Button variant="outline" size="sm" icon={<CreditCard size={14} />}>Change Plan</Button>
            <Button variant="secondary" size="sm" icon={<Ban size={14} />}>Suspend</Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={14} />}>Delete</Button>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="font-semibold text-gray-700">Usage vs Plan Limits</p>
            {[
              { label: 'Messages', used: tenant.usage.messages, limit: tenant.limits.messages },
              { label: 'Leads', used: tenant.usage.leads, limit: tenant.limits.leads },
              { label: 'Campaigns', used: tenant.usage.campaigns, limit: tenant.limits.campaigns },
              { label: 'Team Members', used: tenant.usage.users, limit: tenant.limits.users },
            ].map((item) => {
              const p = pct(item.used, item.limit)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-800">
                      {formatNumber(item.used)} / {formatNumber(item.limit)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p > 90 ? 'bg-red-500' : p > 70 ? 'bg-yellow-400' : 'bg-green-500'}`}
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
                ['Owner Email', tenant.owner],
                ['WhatsApp Number', tenant.waNumber],
                ['Plan', tenant.plan],
                ['Status', tenant.status],
                ['Joined', formatDate(tenant.joined)],
                ['Total Users', tenant.users],
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

      {tab === 'users' && (
        <Table
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role', render: (v) => <RoleBadge role={v} /> },
            { key: 'lastLogin', label: 'Last Login', render: (v) => formatDate(v) },
          ]}
          data={MOCK_USERS}
        />
      )}

      {tab === 'subscription' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="font-semibold text-gray-700 mb-4">Current Plan</p>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-purple-600">Enterprise</div>
              <div>
                <p className="text-sm text-gray-500">$299/month · Next renewal Jun 1, 2026</p>
                <Button variant="outline" size="sm" className="mt-2">Change Plan</Button>
              </div>
            </div>
          </div>
          <Table
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'amount', label: 'Amount' },
              { key: 'method', label: 'Payment Method' },
              { key: 'status', label: 'Status', render: (v) => <Badge color={v === 'paid' ? 'green' : 'red'}>{v}</Badge> },
            ]}
            data={MOCK_PAYMENTS}
          />
        </div>
      )}

      {tab === 'audit' && (
        <Table
          columns={[
            { key: 'time', label: 'Time' },
            { key: 'user', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'ip', label: 'IP Address' },
          ]}
          data={MOCK_AUDIT}
        />
      )}
    </div>
  )
}
