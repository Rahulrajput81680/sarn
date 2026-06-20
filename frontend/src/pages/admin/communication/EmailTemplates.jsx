import { useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/ui/Button'

const TEMPLATES = [
  { id: 'welcome', label: 'Welcome Email', subject: 'Welcome to Wixabotic!', body: 'Hi {{name}},\n\nWelcome to Wixabotic! Get started by connecting your WhatsApp number.\n\nBest,\nWixabotic Team' },
  { id: 'trial_expiry', label: 'Trial Expiry Reminder', subject: 'Your trial ends in 3 days', body: 'Hi {{name}},\n\nYour free trial ends on {{date}}. Upgrade to Pro to keep access.\n\nBest,\nWixabotic Team' },
  { id: 'payment_failed', label: 'Payment Failed', subject: 'Action required: Payment failed', body: 'Hi {{name}},\n\nYour payment of {{amount}} failed. Please update your payment method.\n\nBest,\nWixabotic Team' },
  { id: 'password_reset', label: 'Password Reset', subject: 'Reset your password', body: 'Hi {{name}},\n\nClick the link below to reset your password:\n{{reset_link}}\n\nBest,\nWixabotic Team' },
]

export default function EmailTemplates() {
  const [selected, setSelected] = useState(TEMPLATES[0])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ subject: selected.subject, body: selected.body })

  const selectTemplate = (t) => {
    setSelected(t)
    setForm({ subject: t.subject, body: t.body })
    setEditing(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Email Templates" description="System email template editor" breadcrumbs={['Admin', 'Communication', 'Email Templates']} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${selected.id === t.id ? 'bg-green-50 border-l-2 border-l-green-500' : ''}`}
            >
              <p className={`text-sm font-medium ${selected.id === t.id ? 'text-green-700' : 'text-gray-800'}`}>{t.label}</p>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-700">{selected.label}</p>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? 'Preview' : 'Edit'}
            </Button>
          </div>
          {editing ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Body</label>
                <textarea rows={8} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <Button onClick={() => { toast.success('Template saved'); setEditing(false) }}>Save Template</Button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Subject: <span className="font-normal">{form.subject}</span></p>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans mt-3 border-t border-gray-200 pt-3">{form.body}</pre>
              <p className="text-xs text-gray-400 mt-3">Variables: {'{{'}<span>name</span>{'}}'}, {'{{'}<span>date</span>{'}}'}, {'{{'}<span>amount</span>{'}}'}, etc.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
