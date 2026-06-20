import { useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Toggle from '../../../components/ui/Toggle'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

export default function EscalationConfig() {
  const [config, setConfig] = useState({
    emailEnabled: true,
    slackEnabled: false,
    emails: 'admin@wixabotic.com\ndev@wixabotic.com',
    slackWebhook: '',
    criticalThreshold: 5,
    highThreshold: 20,
  })
  const set = (k, v) => setConfig((c) => ({ ...c, [k]: v }))

  return (
    <div className="space-y-5">
      <PageHeader title="Escalation Config" description="Who gets notified on critical failures" breadcrumbs={['Admin', 'Recovery', 'Escalation']} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <p className="font-semibold text-gray-700 mb-4">Email Notifications</p>
          <div className="space-y-4">
            <Toggle checked={config.emailEnabled} onChange={(v) => set('emailEnabled', v)} label="Enable email escalation" />
            {config.emailEnabled && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Notify these emails (one per line)</label>
                <textarea rows={4} value={config.emails} onChange={(e) => set('emails', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            )}
          </div>
        </Card>
        <Card>
          <p className="font-semibold text-gray-700 mb-4">Slack Notifications</p>
          <div className="space-y-4">
            <Toggle checked={config.slackEnabled} onChange={(v) => set('slackEnabled', v)} label="Enable Slack escalation" />
            {config.slackEnabled && (
              <Input label="Slack Webhook URL" placeholder="https://hooks.slack.com/..." value={config.slackWebhook} onChange={(e) => set('slackWebhook', e.target.value)} />
            )}
          </div>
        </Card>
        <Card>
          <p className="font-semibold text-gray-700 mb-4">Thresholds</p>
          <div className="space-y-3">
            <Input label="Escalate on X critical failures" type="number" value={config.criticalThreshold} onChange={(e) => set('criticalThreshold', +e.target.value)} />
            <Input label="Escalate on X high failures" type="number" value={config.highThreshold} onChange={(e) => set('highThreshold', +e.target.value)} />
          </div>
        </Card>
      </div>
      <Button onClick={() => toast.success('Escalation config saved')}>Save Configuration</Button>
    </div>
  )
}
