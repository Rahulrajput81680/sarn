import { useState } from 'react'
import { Copy, CheckCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'

const WEBHOOK_URL = 'https://api.wixabotic.com/webhook/meta/incoming'
const VERIFY_TOKEN = 'wxbt_' + Math.random().toString(36).substr(2, 16)

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!')
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input readOnly value={value} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono" />
        <button onClick={copy} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
          {copied ? <CheckCircle size={15} className="text-green-500" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  )
}

export default function MetaConfig() {
  const [creds, setCreds] = useState({ appId: '', appSecret: '' })
  const [health, setHealth] = useState({ version: 'v19.0', lastPing: '2026-05-12 14:32:01', rateLimit: '2,400/1,000' })

  const testWebhook = () => {
    toast.success('Webhook test sent — check Meta developer console')
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Meta WhatsApp Config" breadcrumbs={['Admin', 'Meta Integration', 'Config']} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <p className="font-semibold text-gray-700 mb-4">Platform Meta App Credentials</p>
          <div className="space-y-3">
            <Input label="Meta App ID" placeholder="1234567890" value={creds.appId} onChange={(e) => setCreds((c) => ({ ...c, appId: e.target.value }))} />
            <Input label="Meta App Secret" type="password" placeholder="••••••••" value={creds.appSecret} onChange={(e) => setCreds((c) => ({ ...c, appSecret: e.target.value }))} />
            <CopyField label="Webhook Verify Token" value={VERIFY_TOKEN} />
            <CopyField label="Webhook URL" value={WEBHOOK_URL} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => toast.success('Credentials saved')}>Save</Button>
              <Button variant="secondary" size="sm" onClick={testWebhook}>Test Webhook</Button>
            </div>
          </div>
        </Card>
        <Card>
          <p className="font-semibold text-gray-700 mb-4">Meta API Health</p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">API Version</dt>
              <dd className="font-mono font-medium">{health.version}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Last Successful Ping</dt>
              <dd className="font-medium">{health.lastPing}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Rate Limit Remaining</dt>
              <dd>
                <Badge color="green">{health.rateLimit} req remaining</Badge>
              </dd>
            </div>
          </dl>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} className="mt-4" onClick={() => toast.info('Pinging Meta API…')}>
            Ping Meta API
          </Button>
        </Card>
      </div>
    </div>
  )
}
