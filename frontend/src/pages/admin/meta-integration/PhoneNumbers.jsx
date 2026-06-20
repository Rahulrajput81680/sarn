import PageHeader from '../../../components/layout/PageHeader'
import Table from '../../../components/ui/Table'
import Badge from '../../../components/ui/Badge'

const NUMBERS = [
  { id: 1, tenant: 'Flipkart Commerce', number: '+91 9876543210', displayName: 'Flipkart Support', quality: 'high', status: 'active', tier: '10,000 msg/day' },
  { id: 2, tenant: 'QuickMart', number: '+91 8765432109', displayName: 'QuickMart Alerts', quality: 'medium', status: 'active', tier: '1,000 msg/day' },
  { id: 3, tenant: 'StyleHub', number: '+91 7654321098', displayName: 'StyleHub Store', quality: 'low', status: 'limited', tier: '250 msg/day' },
  { id: 4, tenant: 'FoodZone', number: '+91 6543210987', displayName: 'FoodZone Orders', quality: 'high', status: 'active', tier: '10,000 msg/day' },
]

const qualityColors = { high: 'green', medium: 'yellow', low: 'red' }
const statusColors = { active: 'green', limited: 'yellow', banned: 'red' }

export default function PhoneNumbers() {
  return (
    <div className="space-y-5">
      <PageHeader title="Registered Phone Numbers" description="All WhatsApp Business numbers on the platform" breadcrumbs={['Admin', 'Meta Integration', 'Numbers']} />
      <Table
        columns={[
          { key: 'tenant', label: 'Tenant' },
          { key: 'number', label: 'Phone Number' },
          { key: 'displayName', label: 'Display Name' },
          { key: 'quality', label: 'Quality Rating', render: (v) => <Badge color={qualityColors[v]}>{v}</Badge> },
          { key: 'status', label: 'Status', render: (v) => <Badge color={statusColors[v]}>{v}</Badge> },
          { key: 'tier', label: 'Message Limit Tier' },
          { key: 'actions', label: '', sortable: false, render: () => (
            <button className="text-xs text-blue-600 hover:underline">View on Meta</button>
          )},
        ]}
        data={NUMBERS}
      />
    </div>
  )
}
