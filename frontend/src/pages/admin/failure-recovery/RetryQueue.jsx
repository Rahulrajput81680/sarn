import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Table from '../../../components/ui/Table'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { toast } from 'sonner'

const QUEUE = [
  { id: 1, job: 'send_campaign_message', tenant: 'QuickMart', attempts: 2, nextRetry: '14:45:00', payload: '{"campaignId":"C123"}' },
  { id: 2, job: 'webhook_dispatch', tenant: 'Flipkart', attempts: 1, nextRetry: '14:50:00', payload: '{"event":"message.delivered"}' },
  { id: 3, job: 'flow_resume', tenant: 'StyleHub', attempts: 3, nextRetry: '15:00:00', payload: '{"flowId":"F456","userId":"U789"}' },
]

export default function RetryQueue() {
  const [queue, setQueue] = useState(QUEUE)

  const retry = (id) => {
    setQueue((prev) => prev.filter((j) => j.id !== id))
    toast.success('Job retried and removed from queue')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Retry Queue"
        description={`${queue.length} jobs pending`}
        breadcrumbs={['Admin', 'Recovery', 'Retry Queue']}
        action={
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => { setQueue([]); toast.success('All jobs retried') }}>
            Retry All
          </Button>
        }
      />
      <Table
        columns={[
          { key: 'job', label: 'Job Name', render: (v) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{v}</code> },
          { key: 'tenant', label: 'Tenant' },
          { key: 'attempts', label: 'Attempts', render: (v) => <Badge color={v >= 3 ? 'red' : 'yellow'}>{v}x</Badge> },
          { key: 'nextRetry', label: 'Next Retry' },
          { key: 'payload', label: 'Payload', render: (v) => <code className="text-xs text-gray-500 truncate max-w-32 block">{v}</code> },
          { key: 'actions', label: '', sortable: false, render: (_, row) => (
            <Button size="xs" variant="outline" onClick={() => retry(row.id)}>Retry Now</Button>
          )},
        ]}
        data={queue}
        emptyMessage="No jobs in retry queue"
      />
    </div>
  )
}
