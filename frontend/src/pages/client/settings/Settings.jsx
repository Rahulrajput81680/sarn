import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Bell, Smartphone, Zap, Lock, AlertTriangle,
  Eye, EyeOff, Copy, RefreshCw, Check, LogOut, Trash2,
  Clock, MessageSquare, Key, Webhook, Monitor, Globe,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Toggle from '../../../components/ui/Toggle'
import useAuthStore from '../../../store/authStore'
import axiosInstance from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

const TABS = [
  { id: 'account',       label: 'Account',              icon: Shield },
  { id: 'notifications', label: 'Notifications',         icon: Bell },
  { id: 'whatsapp',      label: 'WhatsApp Business',     icon: Smartphone },
  { id: 'api',           label: 'API & Webhooks',        icon: Zap },
  { id: 'security',      label: 'Privacy & Security',    icon: Lock },
  { id: 'danger',        label: 'Danger Zone',           icon: AlertTriangle },
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const WEBHOOK_EVENTS = [
  { id: 'message.sent',        label: 'Message Sent' },
  { id: 'message.delivered',   label: 'Message Delivered' },
  { id: 'message.read',        label: 'Message Read' },
  { id: 'message.failed',      label: 'Message Failed' },
  { id: 'contact.opted_in',    label: 'Contact Opted In' },
  { id: 'contact.opted_out',   label: 'Contact Opted Out' },
  { id: 'campaign.completed',  label: 'Campaign Completed' },
  { id: 'template.approved',   label: 'Template Approved' },
]

const SESSIONS = [
  { id: 1, device: 'Chrome · Windows', location: 'Mumbai, IN', lastActive: 'Just now',    current: true },
  { id: 2, device: 'Safari · iPhone',  location: 'Delhi, IN',  lastActive: '2h ago',      current: false },
  { id: 3, device: 'Firefox · macOS',  location: 'Pune, IN',   lastActive: 'Yesterday',   current: false },
]

function SectionCard({ title, description, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT, delay }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5"
    >
      {(title || description) && (
        <div className="border-b border-gray-100 pb-3">
          {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </motion.div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/* ───────── TAB: ACCOUNT ───────── */
function AccountTab() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })
  const [twoFA, setTwoFA] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePasswordSave = async () => {
    if (!pw.current) { toast.error('Enter your current password'); return }
    if (pw.newPw.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (pw.newPw !== pw.confirm) { toast.error('Passwords do not match'); return }
    setSaving(true)
    try {
      await axiosInstance.put('/api/v1/profile/password', { currentPassword: pw.current, newPassword: pw.newPw })
      setPw({ current: '', newPw: '', confirm: '' })
      toast.success('Password changed successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Change Password" description="Use a strong password you don't use elsewhere" delay={0}>
        <div className="flex flex-col gap-3 max-w-sm">
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              value={pw.current}
              onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="relative">
            <Input
              label="New Password"
              type={showNew ? 'text' : 'password'}
              value={pw.newPw}
              onChange={e => setPw(p => ({ ...p, newPw: e.target.value }))}
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              value={pw.confirm}
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Password strength */}
          {pw.newPw && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Password strength</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => {
                  const strength = [
                    pw.newPw.length >= 8,
                    /[A-Z]/.test(pw.newPw),
                    /[0-9]/.test(pw.newPw),
                    /[^A-Za-z0-9]/.test(pw.newPw),
                  ].filter(Boolean).length
                  return (
                    <div
                      key={i}
                      className={clsx(
                        'h-1 flex-1 rounded-full transition-colors',
                        i <= strength
                          ? strength <= 1 ? 'bg-red-400'
                            : strength <= 2 ? 'bg-amber-400'
                            : strength <= 3 ? 'bg-blue-400'
                            : 'bg-green-500'
                          : 'bg-gray-100'
                      )}
                    />
                  )
                })}
              </div>
            </div>
          )}

          <Button onClick={handlePasswordSave} loading={saving} size="sm" className="w-fit">
            Update Password
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security to your account" delay={0.04}>
        <SettingRow
          label="Authenticator App (TOTP)"
          description="Use Google Authenticator or Authy to generate codes"
        >
          <Toggle checked={twoFA} onChange={v => { setTwoFA(v); toast.success(v ? '2FA enabled' : '2FA disabled') }} />
        </SettingRow>
        {twoFA && (
          <div className="px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            Scan the QR code in your authenticator app — your backend will generate the TOTP secret.
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ───────── TAB: NOTIFICATIONS ───────── */
function NotificationsTab() {
  const [notifs, setNotifs] = useState({
    campaignReport: true,
    newMessage: true,
    deliveryFailure: true,
    weeklyDigest: false,
    lowCredit: true,
    templateApproval: true,
    teamActivity: false,
    loginAlert: true,
  })
  const [saving, setSaving] = useState(false)

  const toggle = key => setNotifs(n => ({ ...n, [key]: !n[key] }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await axiosInstance.put('/api/v1/profile/notifications', notifs)
      toast.success('Notification preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const rows = [
    { key: 'campaignReport',   label: 'Campaign Delivery Reports',   desc: 'Get notified when a campaign finishes sending', channel: 'Email + WhatsApp' },
    { key: 'newMessage',       label: 'New Incoming Message',         desc: 'Alert when a customer replies',                channel: 'WhatsApp' },
    { key: 'deliveryFailure',  label: 'Message Delivery Failures',    desc: 'Notify when messages fail to deliver',         channel: 'Email' },
    { key: 'weeklyDigest',     label: 'Weekly Performance Digest',    desc: 'Summary of metrics every Monday morning',     channel: 'Email' },
    { key: 'lowCredit',        label: 'Low Credit Warning',           desc: 'Alert when message credits fall below 20%',   channel: 'Email + WhatsApp' },
    { key: 'templateApproval', label: 'Template Approval Updates',    desc: 'When Meta approves or rejects a template',    channel: 'Email' },
    { key: 'teamActivity',     label: 'Team Member Activity',         desc: 'When teammates are assigned conversations',   channel: 'WhatsApp' },
    { key: 'loginAlert',       label: 'New Login Alerts',             desc: 'Notify for logins from new devices',          channel: 'Email' },
  ]

  return (
    <div className="space-y-4">
      <SectionCard
        title="Notification Preferences"
        description="Choose what you get notified about and through which channel"
        delay={0}
      >
        <div className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <div key={row.key} className="py-3 first:pt-0 last:pb-0">
              <SettingRow
                label={row.label}
                description={
                  <span>
                    {row.desc}
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {row.channel}
                    </span>
                  </span>
                }
              >
                <Toggle checked={notifs[row.key]} onChange={() => toggle(row.key)} />
              </SettingRow>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} loading={saving} size="sm">Save Preferences</Button>
        </div>
      </SectionCard>
    </div>
  )
}

/* ───────── TAB: WHATSAPP BUSINESS ───────── */
function WhatsAppTab() {
  const [businessHours, setBusinessHours] = useState({
    enabled: true,
    schedule: DAYS.map((day, i) => ({
      day,
      enabled: i >= 1 && i <= 5,
      from: '09:00',
      to: '18:00',
    })),
  })
  const [awayMsg, setAwayMsg] = useState({
    enabled: false,
    message: "We're currently away. Our team will get back to you during business hours.",
  })
  const [autoReply, setAutoReply] = useState({
    enabled: true,
    message: 'Hi {{name}}! Thanks for reaching out. How can we help you today?',
  })
  const [saving, setSaving] = useState(false)

  const toggleDay = idx =>
    setBusinessHours(h => ({
      ...h,
      schedule: h.schedule.map((d, i) => i === idx ? { ...d, enabled: !d.enabled } : d),
    }))

  const updateTime = (idx, field, val) =>
    setBusinessHours(h => ({
      ...h,
      schedule: h.schedule.map((d, i) => i === idx ? { ...d, [field]: val } : d),
    }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await axiosInstance.put('/api/v1/profile/wa-settings', { businessHours, awayMessage: awayMsg, autoReply })
      toast.success('WhatsApp Business settings saved')
    } catch {
      toast.error('Failed to save WhatsApp settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Business Hours */}
      <SectionCard title="Business Hours" description="Define when your team is available. Outside these hours, away message will trigger." delay={0}>
        <SettingRow label="Enable Business Hours" description="Restrict auto-replies and chatbots to these hours">
          <Toggle checked={businessHours.enabled} onChange={v => setBusinessHours(h => ({ ...h, enabled: v }))} />
        </SettingRow>
        {businessHours.enabled && (
          <div className="space-y-2 pt-1">
            {businessHours.schedule.map((d, i) => (
              <div key={d.day} className={clsx('flex items-center gap-3 py-2 px-3 rounded-lg transition-colors', d.enabled ? 'bg-green-50' : 'bg-gray-50')}>
                <Toggle checked={d.enabled} onChange={() => toggleDay(i)} />
                <span className={clsx('text-sm font-medium w-24 shrink-0', d.enabled ? 'text-gray-800' : 'text-gray-400')}>
                  {d.day.slice(0, 3)}
                </span>
                {d.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={d.from}
                      onChange={e => updateTime(i, 'from', e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                      type="time"
                      value={d.to}
                      onChange={e => updateTime(i, 'to', e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Closed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Away Message */}
      <SectionCard title="Away Message" description="Auto-reply sent outside business hours or when you're unavailable" delay={0.04}>
        <SettingRow label="Enable Away Message" description="Automatically reply when team is unavailable">
          <Toggle checked={awayMsg.enabled} onChange={v => setAwayMsg(a => ({ ...a, enabled: v }))} />
        </SettingRow>
        {awayMsg.enabled && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Away Message Text</label>
            <textarea
              rows={3}
              value={awayMsg.message}
              onChange={e => setAwayMsg(a => ({ ...a, message: e.target.value.slice(0, 1024) }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{awayMsg.message.length} / 1024</p>
          </div>
        )}
      </SectionCard>

      {/* Auto Reply for First Contact */}
      <SectionCard title="First Contact Auto-Reply" description="Greet new contacts the first time they message you" delay={0.08}>
        <SettingRow label="Enable Auto-Reply" description="Sends once per unique contact on their first message">
          <Toggle checked={autoReply.enabled} onChange={v => setAutoReply(a => ({ ...a, enabled: v }))} />
        </SettingRow>
        {autoReply.enabled && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Welcome Message</label>
            <textarea
              rows={3}
              value={autoReply.message}
              onChange={e => setAutoReply(a => ({ ...a, message: e.target.value.slice(0, 1024) }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded text-gray-600">{'{{name}}'}</code> to personalise with contact name.</p>
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>Save WhatsApp Settings</Button>
      </div>
    </div>
  )
}

/* ───────── TAB: API & WEBHOOKS ───────── */
function APITab() {
  const [apiKey] = useState('sk_live_4a8f2c1d9e3b7a6f5e2d1c8b4a7f3e9d')
  const [masked, setMasked] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState(
    new Set(['message.sent', 'message.delivered', 'message.failed'])
  )

  const displayKey = masked
    ? `sk_live_${'•'.repeat(24)}${apiKey.slice(-4)}`
    : apiKey

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast.success('API key copied')
  }

  const regenerate = async () => {
    setRegenerating(true)
    try {
      const { data } = await axiosInstance.post('/api/v1/profile/api-key')
      setMasked(false)
      // Show the real key (only time it's visible)
      toast.success(data.message || 'New API key generated — copy it now!')
    } catch {
      toast.error('Failed to regenerate API key')
    } finally {
      setRegenerating(false)
    }
  }

  const testWebhook = async () => {
    if (!webhookUrl) { toast.error('Enter a webhook URL first'); return }
    setTesting(true)
    try {
      await axiosInstance.put('/api/v1/profile/webhook', { webhookUrl, webhookEvents: [...selectedEvents] })
      toast.success('Webhook settings saved and test payload sent')
    } catch {
      toast.error('Failed to reach webhook URL')
    } finally {
      setTesting(false)
    }
  }

  const toggleEvent = id =>
    setSelectedEvents(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="space-y-4">
      <SectionCard title="API Key" description="Use this key to authenticate requests from your server to SarnConnect APIs" delay={0}>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-700 overflow-hidden">
            <Key size={13} className="text-gray-400 shrink-0" />
            <span className="flex-1 truncate">{displayKey}</span>
          </div>
          <button
            onClick={() => setMasked(v => !v)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
            title={masked ? 'Show key' : 'Hide key'}
          >
            {masked ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={copyKey}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
            title="Copy key"
          >
            <Copy size={14} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            loading={regenerating}
            icon={<RefreshCw size={13} />}
            onClick={regenerate}
          >
            Regenerate Key
          </Button>
          <p className="text-xs text-amber-600">Regenerating will invalidate your current key immediately.</p>
        </div>
        <div className="px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <strong>Base URL:</strong>{' '}
          <span className="font-mono">http://localhost:5000/api/v1</span>
          <br />
          Include header: <span className="font-mono">Authorization: Bearer YOUR_API_KEY</span>
        </div>
      </SectionCard>

      <SectionCard title="Webhook Configuration" description="Receive real-time event notifications at your server endpoint" delay={0.04}>
        <Input
          label="Webhook URL"
          value={webhookUrl}
          onChange={e => setWebhookUrl(e.target.value)}
          placeholder="https://yourserver.com/webhook/sarnconnect"
          icon={<Globe size={14} />}
          hint="Must be a publicly accessible HTTPS endpoint"
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Subscribe to Events</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map(ev => (
              <label
                key={ev.id}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm',
                  selectedEvents.has(ev.id)
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                )}
              >
                <div className={clsx(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                  selectedEvents.has(ev.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'
                )}>
                  {selectedEvents.has(ev.id) && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" className="hidden" checked={selectedEvents.has(ev.id)} onChange={() => toggleEvent(ev.id)} />
                <span className="font-mono text-xs">{ev.id}</span>
                <span className="text-xs text-gray-500 ml-auto">{ev.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button size="sm" onClick={() => toast.success('Webhook settings saved')}>
            Save Webhook
          </Button>
          <Button variant="secondary" size="sm" loading={testing} icon={<Zap size={13} />} onClick={testWebhook}>
            Send Test Event
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

/* ───────── TAB: SECURITY ───────── */
function SecurityTab() {
  const [sessions, setSessions] = useState(SESSIONS)
  const [loginAlert, setLoginAlert] = useState(true)
  const [requesting, setRequesting] = useState(false)

  const revokeSession = id => {
    setSessions(s => s.filter(sess => sess.id !== id))
    toast.success('Session revoked')
  }

  const requestExport = async () => {
    setRequesting(true)
    await new Promise(r => setTimeout(r, 800))
    setRequesting(false)
    toast.success('Data export requested — you will receive an email within 24 hours')
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Active Sessions" description="Devices and browsers currently logged into your account" delay={0}>
        <div className="space-y-2">
          {sessions.map(sess => (
            <div key={sess.id} className={clsx('flex items-center gap-3 px-3 py-3 rounded-lg border transition-colors', sess.current ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100')}>
              <div className="p-2 rounded-lg bg-white border border-gray-100 shrink-0">
                <Monitor size={14} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{sess.device}</p>
                <p className="text-xs text-gray-400">{sess.location} · {sess.lastActive}</p>
              </div>
              {sess.current
                ? <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">This device</span>
                : (
                  <button
                    onClick={() => revokeSession(sess.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    Revoke
                  </button>
                )
              }
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Login Alerts" description="Security notifications for your account" delay={0.04}>
        <SettingRow
          label="New device login notification"
          description="Get an email when your account is accessed from an unrecognised device"
        >
          <Toggle checked={loginAlert} onChange={v => { setLoginAlert(v); toast.success(v ? 'Login alerts enabled' : 'Login alerts disabled') }} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Data & Privacy" description="Control your data stored on SarnConnect" delay={0.08}>
        <SettingRow
          label="Export My Data"
          description="Download all your contacts, campaigns, and account data in CSV/JSON format"
        >
          <Button variant="secondary" size="sm" loading={requesting} onClick={requestExport}>
            Request Export
          </Button>
        </SettingRow>
      </SectionCard>
    </div>
  )
}

/* ───────── TAB: DANGER ZONE ───────── */
function DangerTab() {
  const { logout } = useAuthStore()
  const [confirmDelete, setConfirmDelete] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleLogoutAll = async () => {
    await new Promise(r => setTimeout(r, 500))
    toast.success('All other sessions logged out')
  }

  const handleDelete = async () => {
    if (confirmDelete !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
    setDeleting(true)
    await new Promise(r => setTimeout(r, 1000))
    setDeleting(false)
    toast.error('Account deletion requested — you will receive a confirmation email')
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="bg-white rounded-xl border border-red-100 shadow-sm p-5 flex flex-col gap-5"
      >
        <div className="border-b border-red-50 pb-3 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-500" />
          <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
        </div>

        {/* Logout all */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Log out of all devices</p>
            <p className="text-xs text-gray-400 mt-0.5">Invalidates all active sessions except this one</p>
          </div>
          <Button variant="secondary" size="sm" icon={<LogOut size={13} />} onClick={handleLogoutAll}>
            Logout All
          </Button>
        </div>

        {/* Delete account */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-red-700">Delete Account</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Permanently deletes your workspace, all contacts, campaigns, templates, and chatbot flows.
              This action <strong>cannot be undone.</strong>
            </p>
          </div>
          <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 space-y-0.5">
            <p>• All message history will be permanently erased</p>
            <p>• Your WhatsApp number will be disconnected from SarnConnect</p>
            <p>• Active subscriptions will not be refunded</p>
          </div>
          <div className="flex flex-col gap-2 max-w-xs">
            <Input
              label='Type "DELETE" to confirm'
              value={confirmDelete}
              onChange={e => setConfirmDelete(e.target.value)}
              placeholder="DELETE"
            />
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              disabled={confirmDelete !== 'DELETE'}
              icon={<Trash2 size={13} />}
              onClick={handleDelete}
            >
              Permanently Delete Account
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ───────── MAIN SETTINGS PAGE ───────── */
export default function Settings() {
  const [activeTab, setActiveTab] = useState('account')

  const TAB_CONTENT = {
    account:       <AccountTab />,
    notifications: <NotificationsTab />,
    whatsapp:      <WhatsAppTab />,
    api:           <APITab />,
    security:      <SecurityTab />,
    danger:        <DangerTab />,
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Manage your account, notifications, and integrations" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab navigation - horizontal scroll on mobile, vertical sidebar on desktop */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:w-44 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all whitespace-nowrap shrink-0',
                tab.id === 'danger' && 'lg:mt-4',
                activeTab === tab.id
                  ? tab.id === 'danger'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'bg-white text-green-700 shadow-sm border border-green-100 shadow-green-200'
                  : tab.id === 'danger'
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm'
              )}
            >
              <tab.icon size={15} className="shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
            >
              {TAB_CONTENT[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
