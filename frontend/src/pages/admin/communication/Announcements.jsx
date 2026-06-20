import { useState } from 'react'
import { Megaphone, Send } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { formatDateTime } from '../../../utils/formatters'

const PAST = [
  { id: 1, title: 'Scheduled Maintenance', msg: 'API will be down 2–4 AM UTC on May 15', sentTo: 'All tenants', time: '2026-05-10 09:00', type: 'warning' },
  { id: 2, title: 'New Feature: Flow Builder', msg: 'Visual flow builder is now live for Pro+ plans', sentTo: 'Pro + Enterprise', time: '2026-05-05 14:00', type: 'info' },
]

export default function Announcements() {
  const [form, setForm] = useState({ title: '', message: '', audience: 'all' })
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!form.title || !form.message) { toast.error('Fill in all fields'); return }
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast.success(`Announcement sent to ${form.audience === 'all' ? 'all tenants' : form.audience}`)
    setForm({ title: '', message: '', audience: 'all' })
    setSending(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Announcements" description="Send platform-wide messages to tenants" breadcrumbs={['Admin', 'Communication', 'Announcements']} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <p className="font-semibold text-gray-700 mb-4">Send New Announcement</p>
          <div className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Scheduled Maintenance" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Write your announcement…"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Audience</label>
              <select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="all">All Tenants</option>
                <option value="pro_enterprise">Pro + Enterprise</option>
                <option value="enterprise">Enterprise Only</option>
                <option value="trial">Trial Users</option>
              </select>
            </div>
            <Button icon={<Send size={14} />} loading={sending} onClick={send}>Send Announcement</Button>
          </div>
        </Card>
        <Card>
          <p className="font-semibold text-gray-700 mb-4">Recent Announcements</p>
          <div className="space-y-3">
            {PAST.map((a) => (
              <div key={a.id} className={`p-4 rounded-xl border ${a.type === 'warning' ? 'bg-yellow-50 border-yellow-100' : 'bg-blue-50 border-blue-100'}`}>
                <div className="flex items-start gap-2">
                  <Megaphone size={16} className={a.type === 'warning' ? 'text-yellow-600 mt-0.5' : 'text-blue-600 mt-0.5'} />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{a.msg}</p>
                    <p className="text-xs text-gray-400 mt-1">Sent to {a.sentTo} · {a.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
