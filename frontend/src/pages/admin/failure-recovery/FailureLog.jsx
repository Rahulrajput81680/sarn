import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Check } from 'lucide-react'
import StatsCard from '../../../components/charts/StatsCard'
import Table from '../../../components/ui/Table'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import SearchBar from '../../../components/shared/SearchBar'
import PageHeader from '../../../components/layout/PageHeader'
import { toast } from 'sonner'

const MOCK = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  time: `2026-05-12 ${String(i % 24).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
  type: ['flow', 'api', 'webhook', 'job'][i % 4],
  tenant: ['Flipkart', 'QuickMart', 'StyleHub'][i % 3],
  description: ['WhatsApp API timeout', 'Flow execution failed', 'Webhook delivery failed', 'Scheduled job error'][i % 4],
  severity: ['critical', 'high', 'medium', 'low'][i % 4],
  retries: i % 3,
  status: i % 5 === 0 ? 'resolved' : i % 4 === 0 ? 'retrying' : 'failed',
  stack: `Error: Connection timeout\n  at sendMessage (/app/services/whatsapp.js:142)\n  at FlowExecutor.run (/app/flow/executor.js:89)`,
}))

export default function FailureLog() {
  const [records, setRecords] = useState(MOCK)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [detail, setDetail] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {}, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const filtered = records.filter((r) => {
    const q = search.toLowerCase()
    return (
      (!q || r.tenant.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) &&
      (!typeFilter || r.type === typeFilter)
    )
  })

  const resolveRecord = (id) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: 'resolved' } : r))
    toast.success('Marked as resolved')
  }

  const retryRecord = (id) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: 'retrying', retries: r.retries + 1 } : r))
    toast.info('Retry queued')
  }

  const failed = records.filter((r) => r.status !== 'resolved').length
  const critical = records.filter((r) => r.severity === 'critical').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Failure Log"
        breadcrumbs={['Admin', 'Recovery', 'Failure Log']}
        action={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto-refresh
            </label>
            <Button variant="secondary" size="sm">Retry All Selected</Button>
            <Button variant="outline" size="sm">Mark All Resolved</Button>
          </div>
        }
      />
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Failed Flows Today" value={String(failed)} delta="requires attention" deltaType="negative" icon={<AlertTriangle size={18} />} />
        <StatsCard title="Critical Failures" value={String(critical)} deltaType="negative" icon={<AlertTriangle size={18} />} />
        <StatsCard title="Pending Retry Queue" value="7" icon={<RefreshCw size={18} />} />
      </div>
      <div className="flex gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search failures…" className="w-72" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All types</option>
          <option>flow</option>
          <option>api</option>
          <option>webhook</option>
          <option>job</option>
        </select>
      </div>
      <Table
        columns={[
          { key: 'time', label: 'Time' },
          { key: 'type', label: 'Type', render: (v) => <Badge color={{ flow: 'blue', api: 'purple', webhook: 'cyan', job: 'yellow' }[v]}>{v}</Badge> },
          { key: 'tenant', label: 'Tenant' },
          { key: 'description', label: 'Description' },
          { key: 'severity', label: 'Severity', render: (v) => <Badge color={{ critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' }[v]}>{v}</Badge> },
          { key: 'retries', label: 'Retries' },
          { key: 'status', label: 'Status', render: (v) => <Badge color={{ failed: 'red', retrying: 'yellow', resolved: 'green' }[v]}>{v}</Badge> },
          {
            key: 'actions', label: '', sortable: false, render: (_, row) => (
              row.status !== 'resolved' ? (
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); retryRecord(row.id) }} className="text-xs text-blue-600 hover:underline px-1">Retry</button>
                  <button onClick={(e) => { e.stopPropagation(); resolveRecord(row.id) }} className="text-xs text-green-600 hover:underline px-1">Resolve</button>
                  <button onClick={(e) => { e.stopPropagation(); setDetail(row) }} className="text-xs text-gray-500 hover:underline px-1">Detail</button>
                </div>
              ) : <span className="text-xs text-green-500">✓ Resolved</span>
            ),
          },
        ]}
        data={filtered}
      />
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Failure Detail" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-400">Type</p><p className="font-medium capitalize">{detail.type}</p></div>
              <div><p className="text-gray-400">Tenant</p><p className="font-medium">{detail.tenant}</p></div>
              <div><p className="text-gray-400">Severity</p><Badge color={{ critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' }[detail.severity]}>{detail.severity}</Badge></div>
              <div><p className="text-gray-400">Retries</p><p className="font-medium">{detail.retries}</p></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Stack Trace</p>
              <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto font-mono">{detail.stack}</pre>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { retryRecord(detail.id); setDetail(null) }}>Retry Now</Button>
              <Button variant="secondary" size="sm" onClick={() => { resolveRecord(detail.id); setDetail(null) }}>Mark Resolved</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
