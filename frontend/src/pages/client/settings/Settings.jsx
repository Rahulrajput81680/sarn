import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Bell, Smartphone, AlertTriangle,
  Eye, EyeOff, Check, LogOut, Trash2,
  CheckCircle2, XCircle, Clock, Unplug,
  Key, Copy, RefreshCw,
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
  { id: 'account',       label: 'Account',           icon: Shield },
  { id: 'notifications', label: 'Notifications',      icon: Bell },
  { id: 'whatsapp',      label: 'WhatsApp Business',  icon: Smartphone },
  { id: 'developer',     label: 'API Access',         icon: Key },
  { id: 'danger',        label: 'Danger Zone',        icon: AlertTriangle },
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_SCHEDULE = DAYS.map((day, i) => ({
  day,
  enabled: i >= 1 && i <= 5,
  from: '09:00',
  to: '18:00',
}))

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
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pw,  setPw]      = useState({ current: '', newPw: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const strength = [
    pw.newPw.length >= 8,
    /[A-Z]/.test(pw.newPw),
    /[0-9]/.test(pw.newPw),
    /[^A-Za-z0-9]/.test(pw.newPw),
  ].filter(Boolean).length

  const handlePasswordSave = async () => {
    if (!pw.current)            { toast.error('Enter your current password'); return }
    if (pw.newPw.length < 8)    { toast.error('New password must be at least 8 characters'); return }
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
          {[
            { label: 'Current Password', key: 'current', show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'New Password',     key: 'newPw',   show: showNew,     toggle: () => setShowNew(v => !v) },
            { label: 'Confirm Password', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, key, show, toggle }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw[key]}
                  onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}

          {pw.newPw && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Password strength</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
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
                ))}
              </div>
            </div>
          )}

          <Button onClick={handlePasswordSave} loading={saving} size="sm" className="w-fit">
            Update Password
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}

/* ───────── TAB: NOTIFICATIONS ───────── */
function NotificationsTab({ initialNotifs }) {
  const [notifs, setNotifs] = useState(initialNotifs)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setNotifs(initialNotifs) }, [initialNotifs])

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
    { key: 'campaignReport',   label: 'Campaign Delivery Reports',  desc: 'Get notified when a campaign finishes' },
    { key: 'newMessage',       label: 'New Incoming Message',        desc: 'Alert when a customer replies' },
    { key: 'deliveryFailure',  label: 'Message Delivery Failures',   desc: 'Notify when messages fail to deliver' },
    { key: 'weeklyDigest',     label: 'Weekly Performance Digest',   desc: 'Summary of metrics every Monday' },
    { key: 'templateApproval', label: 'Template Approval Updates',   desc: 'When Meta approves or rejects a template' },
    { key: 'loginAlert',       label: 'New Login Alerts',            desc: 'Notify for logins from new devices' },
  ]

  return (
    <div className="space-y-4">
      <SectionCard title="Notification Preferences" delay={0}>
        <div className="divide-y divide-gray-50">
          {rows.map(row => (
            <div key={row.key} className="py-3 first:pt-0 last:pb-0">
              <SettingRow label={row.label} description={row.desc}>
                <Toggle checked={!!notifs[row.key]} onChange={() => toggle(row.key)} />
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

/* ───────── WhatsApp connection status / connect / disconnect ───────── */
const EXPIRY_WARNING_DAYS = 3

function WhatsAppConnectionCard({ whatsapp, onChange }) {
  const [form, setForm] = useState({ phoneNumberId: '', wabaId: '', accessToken: '' })
  const [showToken, setShowToken] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const [error, setError] = useState('')

  const isConnected = whatsapp?.status === 'connected'
  const expiresAt = whatsapp?.tokenExpiresAt ? new Date(whatsapp.tokenExpiresAt) : null
  const isExpired = expiresAt && expiresAt <= new Date()
  const isExpiringSoon = expiresAt && !isExpired && expiresAt <= new Date(Date.now() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000)

  const handleConnect = async () => {
    if (!form.phoneNumberId.trim() || !form.wabaId.trim() || !form.accessToken.trim()) return
    setConnecting(true)
    setError('')
    try {
      await axiosInstance.put('/api/v1/profile/wa-connect', {
        phoneNumberId: form.phoneNumberId.trim(),
        wabaId: form.wabaId.trim(),
        accessToken: form.accessToken.trim(),
      })
      setForm({ phoneNumberId: '', wabaId: '', accessToken: '' })
      toast.success('WhatsApp connected successfully')
      onChange()
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Check your details and try again.')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await axiosInstance.put('/api/v1/profile/wa-disconnect')
      toast.success('WhatsApp disconnected')
      setConfirmingDisconnect(false)
      onChange()
    } catch {
      toast.error('Failed to disconnect. Please try again.')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <SectionCard title="WhatsApp Connection" description="Your own WhatsApp Business number, used only for your messages" delay={0}>
      <div className={clsx(
        'flex items-center gap-3 px-3.5 py-3 rounded-lg border',
        isConnected ? (isExpired ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200') : 'bg-red-50 border-red-200'
      )}>
        {isConnected ? (
          isExpired
            ? <AlertTriangle size={18} className="text-red-600 shrink-0" />
            : <CheckCircle2 size={18} className="text-green-600 shrink-0" />
        ) : (
          <XCircle size={18} className="text-red-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-semibold', isConnected ? (isExpired ? 'text-red-700' : 'text-green-700') : 'text-red-700')}>
            {isConnected ? (isExpired ? 'Connection Expired' : 'Connected') : 'Not Connected'}
          </p>
          {isConnected ? (
            <p className="text-xs text-gray-500 mt-0.5">
              {whatsapp.displayName || 'WhatsApp Business'} · {whatsapp.phoneNumber}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">Connect your WhatsApp Business number to start sending messages</p>
          )}
        </div>
        {isConnected && (
          confirmingDisconnect ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="danger" size="sm" loading={disconnecting} onClick={handleDisconnect}>Confirm</Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmingDisconnect(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" icon={<Unplug size={13} />} onClick={() => setConfirmingDisconnect(true)}>
              Disconnect
            </Button>
          )
        )}
      </div>

      {isConnected && isExpiringSoon && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <Clock size={13} className="shrink-0" />
          Your access token expires on {expiresAt.toLocaleDateString()}. Generate a new one and reconnect below before it expires.
        </div>
      )}
      {isConnected && isExpired && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertTriangle size={13} className="shrink-0" />
          Your access token has expired. Sending is blocked until you reconnect with a new token below.
        </div>
      )}

      {(!isConnected || isExpired) && (
        <div className="space-y-3 pt-1">
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-3">
            <p className="text-xs text-gray-500">
              From{' '}
              <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Meta Developer Console</a>
              {' '}→ WhatsApp → API Setup. We verify these against Meta and fetch your number and business name automatically.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number ID</label>
              <input type="text" placeholder="123456789012345" value={form.phoneNumberId}
                onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">WABA ID</label>
              <input type="text" placeholder="987654321098765" value={form.wabaId}
                onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Permanent Access Token</label>
              <div className="relative">
                <input type={showToken ? 'text' : 'password'} placeholder="EAA..."
                  value={form.accessToken}
                  onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                  className="w-full px-3 py-2 pr-9 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono" />
                <button type="button" onClick={() => setShowToken((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Use a System User permanent token — never a temporary one</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              loading={connecting}
              disabled={!form.phoneNumberId.trim() || !form.wabaId.trim() || !form.accessToken.trim()}
              onClick={handleConnect}
            >
              {isExpired ? 'Reconnect' : 'Connect'}
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

/* ───────── TAB: WHATSAPP BUSINESS ───────── */
function WhatsAppTab({ initialWASettings, whatsapp, onWhatsAppChange }) {
  const [businessHours, setBusinessHours] = useState({
    enabled:  initialWASettings?.businessHours?.enabled  ?? false,
    schedule: initialWASettings?.businessHours?.schedule?.length
      ? initialWASettings.businessHours.schedule
      : DEFAULT_SCHEDULE,
  })
  const [awayMsg, setAwayMsg] = useState({
    enabled: initialWASettings?.awayMessage?.enabled ?? false,
    message: initialWASettings?.awayMessage?.message ?? "We're currently away. Our team will get back to you during business hours.",
  })
  const [autoReply, setAutoReply] = useState({
    enabled: initialWASettings?.autoReply?.enabled ?? false,
    message: initialWASettings?.autoReply?.message ?? 'Hi {{name}}! Thanks for reaching out. How can we help you today?',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!initialWASettings) return
    setBusinessHours({
      enabled:  initialWASettings.businessHours?.enabled  ?? false,
      schedule: initialWASettings.businessHours?.schedule?.length
        ? initialWASettings.businessHours.schedule
        : DEFAULT_SCHEDULE,
    })
    setAwayMsg({
      enabled: initialWASettings.awayMessage?.enabled ?? false,
      message: initialWASettings.awayMessage?.message ?? "We're currently away.",
    })
    setAutoReply({
      enabled: initialWASettings.autoReply?.enabled ?? false,
      message: initialWASettings.autoReply?.message ?? 'Hi {{name}}!',
    })
  }, [initialWASettings])

  const toggleDay    = idx => setBusinessHours(h => ({ ...h, schedule: h.schedule.map((d, i) => i === idx ? { ...d, enabled: !d.enabled } : d) }))
  const updateTime   = (idx, field, val) => setBusinessHours(h => ({ ...h, schedule: h.schedule.map((d, i) => i === idx ? { ...d, [field]: val } : d) }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await axiosInstance.put('/api/v1/profile/wa-settings', { businessHours, awayMessage: awayMsg, autoReply })
      toast.success('WhatsApp Business settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <WhatsAppConnectionCard whatsapp={whatsapp} onChange={onWhatsAppChange} />

      <SectionCard title="Business Hours" description="Define when your team is available" delay={0.04}>
        <SettingRow label="Enable Business Hours" description="Restrict auto-replies to these hours">
          <Toggle checked={businessHours.enabled} onChange={v => setBusinessHours(h => ({ ...h, enabled: v }))} />
        </SettingRow>
        {businessHours.enabled && (
          <div className="space-y-2 pt-1">
            {businessHours.schedule.map((d, i) => (
              <div key={d.day} className={clsx('flex items-center gap-3 py-2 px-3 rounded-lg', d.enabled ? 'bg-green-50' : 'bg-gray-50')}>
                <Toggle checked={d.enabled} onChange={() => toggleDay(i)} />
                <span className={clsx('text-sm font-medium w-24 shrink-0', d.enabled ? 'text-gray-800' : 'text-gray-400')}>
                  {d.day.slice(0, 3)}
                </span>
                {d.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={d.from} onChange={e => updateTime(i, 'from', e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <span className="text-xs text-gray-400">to</span>
                    <input type="time" value={d.to}   onChange={e => updateTime(i, 'to',   e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Closed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Away Message" description="Auto-reply sent outside business hours" delay={0.08}>
        <SettingRow label="Enable Away Message">
          <Toggle checked={awayMsg.enabled} onChange={v => setAwayMsg(a => ({ ...a, enabled: v }))} />
        </SettingRow>
        {awayMsg.enabled && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Message Text</label>
            <textarea
              rows={3}
              value={awayMsg.message}
              onChange={e => setAwayMsg(a => ({ ...a, message: e.target.value.slice(0, 1024) }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{awayMsg.message.length} / 1024</p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="First Contact Auto-Reply" description="Greet new contacts on their first message" delay={0.12}>
        <SettingRow label="Enable Auto-Reply">
          <Toggle checked={autoReply.enabled} onChange={v => setAutoReply(a => ({ ...a, enabled: v }))} />
        </SettingRow>
        {autoReply.enabled && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Welcome Message</label>
            <textarea
              rows={3}
              value={autoReply.message}
              onChange={e => setAutoReply(a => ({ ...a, message: e.target.value.slice(0, 1024) }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-400">
              Use <code className="bg-gray-100 px-1 rounded text-gray-600">{'{{name}}'}</code> to personalise with contact name.
            </p>
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>Save Settings</Button>
      </div>
    </div>
  )
}

/* ───────── TAB: API ACCESS ───────── */
function DeveloperTab({ apiKeyLastGenerated, onGenerated }) {
  const [generating, setGenerating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [copied, setCopied] = useState(false)

  const hasExistingKey = !!apiKeyLastGenerated

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const { data } = await axiosInstance.post('/api/v1/profile/api-key')
      setNewKey(data.data.apiKey)
      setConfirming(false)
      setCopied(false)
      onGenerated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate API key')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select and copy manually')
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="API Access"
        description="Authenticate external requests — like triggering an OTP send — from your own backend"
        delay={0}
      >
        <p className="text-xs text-gray-500 leading-relaxed">
          Use this key to call SarnConnect's API from your own website or server, outside the
          dashboard. Send it as{' '}
          <code className="bg-gray-100 px-1 rounded text-gray-700">Authorization: Bearer &lt;key&gt;</code>{' '}
          or an{' '}
          <code className="bg-gray-100 px-1 rounded text-gray-700">X-API-Key</code>{' '}
          header — for example, to send a one-time passcode via <code className="bg-gray-100 px-1 rounded text-gray-700">POST /api/v1/otp/send</code>.
        </p>

        {newKey ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <AlertTriangle size={13} className="shrink-0" />
              This is the only time you'll see this key. Copy it now — it can't be shown again.
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto whitespace-nowrap">
                {newKey}
              </code>
              <Button variant="secondary" size="sm" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-lg border bg-gray-50 border-gray-100">
            <Key size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">
                {hasExistingKey ? 'API key active' : 'No API key generated yet'}
              </p>
              {hasExistingKey && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Last generated {new Date(apiKeyLastGenerated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {confirming ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-red-600 flex-1">Regenerating invalidates the current key immediately — anything using it will stop working.</p>
            <Button variant="danger" size="sm" loading={generating} onClick={handleGenerate}>Confirm</Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              size="sm"
              icon={hasExistingKey ? <RefreshCw size={13} /> : <Key size={13} />}
              loading={generating}
              onClick={() => hasExistingKey ? setConfirming(true) : handleGenerate()}
            >
              {hasExistingKey ? 'Regenerate API Key' : 'Generate API Key'}
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ───────── TAB: DANGER ZONE ───────── */
function DangerTab() {
  const { logout } = useAuthStore()
  const [confirmDelete, setConfirmDelete] = useState('')
  const [deleting, setDeleting] = useState(false)

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

        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Log out everywhere</p>
            <p className="text-xs text-gray-400 mt-0.5">Sign out of your account on all devices</p>
          </div>
          <Button variant="secondary" size="sm" icon={<LogOut size={13} />} onClick={logout}>
            Logout
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-red-700">Delete Account</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Permanently deletes your workspace, all contacts, campaigns, and templates.
              This action <strong>cannot be undone.</strong>
            </p>
          </div>
          <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 space-y-0.5">
            <p>• All message history will be permanently erased</p>
            <p>• Your WhatsApp number will be disconnected</p>
          </div>
          <div className="flex flex-col gap-2 max-w-xs">
            <Input label='Type "DELETE" to confirm' value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder="DELETE" />
            <Button variant="danger" size="sm" loading={deleting} disabled={confirmDelete !== 'DELETE'} icon={<Trash2 size={13} />} onClick={handleDelete}>
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
  const [profile, setProfile]     = useState(null)
  const { updateUser } = useAuthStore()

  const fetchProfile = () => {
    axiosInstance.get('/api/v1/profile').then(({ data }) => {
      setProfile(data.data.user)
      // Keep the sidebar/dashboard's cached tenant.whatsapp in sync after connect/disconnect
      updateUser({ tenant: data.data.user.tenant })
    }).catch(() => {})
  }

  useEffect(() => { fetchProfile() }, [])

  const initialNotifs = profile?.notifications ?? {
    campaignReport: true, newMessage: true, deliveryFailure: true,
    weeklyDigest: false, templateApproval: true, loginAlert: true,
  }

  const TAB_CONTENT = {
    account:       <AccountTab />,
    notifications: <NotificationsTab initialNotifs={initialNotifs} />,
    whatsapp:      <WhatsAppTab initialWASettings={profile?.waSettings} whatsapp={profile?.tenant?.whatsapp} onWhatsAppChange={fetchProfile} />,
    developer:     <DeveloperTab apiKeyLastGenerated={profile?.apiKeyLastGenerated} onGenerated={fetchProfile} />,
    danger:        <DangerTab />,
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Manage your account, notifications, and integrations" />

      <div className="flex flex-col lg:flex-row gap-6">
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
