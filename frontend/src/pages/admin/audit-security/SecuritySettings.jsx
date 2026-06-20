import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Key, Globe, Shield, Bell, Clock,
  CheckCircle2, ChevronDown, Plus, X,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

function Switch({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-green-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-1'}`} />
    </button>
  )
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function NumberInput({ value, onChange, min, max, suffix }) {
  return (
    <div className="flex items-center gap-2">
      <input type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 text-sm text-center border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400" />
      {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
    </div>
  )
}

function SectionCard({ title, icon: Icon, iconColor, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={iconColor} />
        <p className="text-sm font-bold text-gray-900">{title}</p>
      </div>
      <div className="mt-2">{children}</div>
    </motion.div>
  )
}

export default function SecuritySettings() {
  const [saved,    setSaved]   = useState(false)
  const [newIp,    setNewIp]   = useState('')

  const [settings, setSettings] = useState({
    /* Auth */
    twoFARequired:         true,
    twoFAMethod:           'totp',
    minPasswordLen:        10,
    passwordExpiry:        90,
    maxLoginAttempts:      5,
    lockoutDuration:       30,
    /* Session */
    sessionTimeout:        60,
    rememberMeDays:        30,
    singleSession:         false,
    /* IP Whitelist */
    ipWhitelistEnabled:    false,
    allowedIPs:            ['103.21.0.0/16', '192.168.1.0/24'],
    /* Notifications */
    notifyNewDevice:       true,
    notifyFailedAttempts:  true,
    notifyPrivilegedAction:true,
    alertThresholdFailed:  5,
  })

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }))

  function addIP() {
    if (!newIp.trim() || settings.allowedIPs.includes(newIp.trim())) return
    set('allowedIPs', [...settings.allowedIPs, newIp.trim()])
    setNewIp('')
  }

  function removeIP(ip) {
    set('allowedIPs', settings.allowedIPs.filter((i) => i !== ip))
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Security Settings"
        description="Authentication, session controls, IP whitelist and security alerts"
        breadcrumbs={['Admin', 'Audit & Security', 'Settings']}
        action={
          <button onClick={save}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
            {saved ? <><CheckCircle2 size={14} className="text-green-600" /> Saved!</> : 'Save Settings'}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Authentication */}
        <SectionCard title="Authentication" icon={Key} iconColor="text-green-600">
          <SettingRow label="Require 2FA for all admins" desc="Enforces TOTP or SMS 2FA on every admin account">
            <Switch on={settings.twoFARequired} onChange={(v) => set('twoFARequired', v)} />
          </SettingRow>
          {settings.twoFARequired && (
            <SettingRow label="2FA Method" desc="TOTP (authenticator app) or SMS OTP">
              <div className="relative">
                <select value={settings.twoFAMethod} onChange={(e) => set('twoFAMethod', e.target.value)}
                  className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400">
                  <option value="totp">Authenticator App (TOTP)</option>
                  <option value="sms">SMS OTP</option>
                  <option value="both">Both (TOTP + SMS)</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </SettingRow>
          )}
          <SettingRow label="Minimum password length" desc="Applies to all admin and client accounts">
            <NumberInput value={settings.minPasswordLen} onChange={(v) => set('minPasswordLen', v)} min={8} max={32} suffix="characters" />
          </SettingRow>
          <SettingRow label="Password expiry" desc="Force reset after N days (0 = never)">
            <NumberInput value={settings.passwordExpiry} onChange={(v) => set('passwordExpiry', v)} min={0} max={365} suffix="days" />
          </SettingRow>
          <SettingRow label="Max login attempts" desc="Lockout account after N failed attempts">
            <NumberInput value={settings.maxLoginAttempts} onChange={(v) => set('maxLoginAttempts', v)} min={3} max={20} suffix="attempts" />
          </SettingRow>
          <SettingRow label="Lockout duration">
            <NumberInput value={settings.lockoutDuration} onChange={(v) => set('lockoutDuration', v)} min={5} max={1440} suffix="minutes" />
          </SettingRow>
        </SectionCard>

        {/* Session control */}
        <SectionCard title="Session Control" icon={Clock} iconColor="text-blue-500">
          <SettingRow label="Session timeout (inactivity)" desc="Auto-logout after N minutes of inactivity">
            <NumberInput value={settings.sessionTimeout} onChange={(v) => set('sessionTimeout', v)} min={5} max={480} suffix="minutes" />
          </SettingRow>
          <SettingRow label="Remember Me duration" desc="Keep login active for N days if Remember Me is checked">
            <NumberInput value={settings.rememberMeDays} onChange={(v) => set('rememberMeDays', v)} min={1} max={90} suffix="days" />
          </SettingRow>
          <SettingRow label="Single active session" desc="Logging in from a new device terminates previous sessions">
            <Switch on={settings.singleSession} onChange={(v) => set('singleSession', v)} />
          </SettingRow>
        </SectionCard>

        {/* IP Whitelist */}
        <SectionCard title="IP Whitelist" icon={Globe} iconColor="text-indigo-500">
          <SettingRow label="Enable admin panel IP whitelist" desc="Only listed IPs can access /admin routes">
            <Switch on={settings.ipWhitelistEnabled} onChange={(v) => set('ipWhitelistEnabled', v)} />
          </SettingRow>
          {settings.ipWhitelistEnabled && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input value={newIp} onChange={(e) => setNewIp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIP()}
                  placeholder="IP or CIDR e.g. 103.21.0.0/16"
                  className="flex-1 text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
                <button onClick={addIP}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
                  <Plus size={13} /> Add
                </button>
              </div>
              <div className="space-y-1.5">
                {settings.allowedIPs.map((ip) => (
                  <div key={ip} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                    <span className="font-mono text-xs text-gray-700">{ip}</span>
                    <button onClick={() => removeIP(ip)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {settings.allowedIPs.length === 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Warning: whitelist enabled but empty — all admin access is blocked!
                  </p>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Security notifications */}
        <SectionCard title="Security Alerts" icon={Bell} iconColor="text-orange-500">
          <SettingRow label="Alert on new device login" desc="Email super admin when a new device logs in">
            <Switch on={settings.notifyNewDevice} onChange={(v) => set('notifyNewDevice', v)} />
          </SettingRow>
          <SettingRow label="Alert on failed login attempts" desc="Send alert when threshold is exceeded">
            <Switch on={settings.notifyFailedAttempts} onChange={(v) => set('notifyFailedAttempts', v)} />
          </SettingRow>
          {settings.notifyFailedAttempts && (
            <SettingRow label="Alert threshold" desc="Number of failed attempts before alerting">
              <NumberInput value={settings.alertThresholdFailed} onChange={(v) => set('alertThresholdFailed', v)} min={2} max={20} suffix="attempts" />
            </SettingRow>
          )}
          <SettingRow label="Alert on privileged actions" desc="Email on impersonation, role changes, bulk exports">
            <Switch on={settings.notifyPrivilegedAction} onChange={(v) => set('notifyPrivilegedAction', v)} />
          </SettingRow>
        </SectionCard>
      </div>

      {/* Security posture summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-green-600" />
          <p className="text-sm font-bold text-gray-900">Security Posture Summary</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '2FA Enforced',     ok: settings.twoFARequired     },
            { label: 'IP Whitelist',     ok: settings.ipWhitelistEnabled },
            { label: 'Login Alerts',     ok: settings.notifyFailedAttempts },
            { label: 'Action Alerts',    ok: settings.notifyPrivilegedAction },
          ].map(({ label, ok }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${ok ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-xs font-medium ${ok ? 'text-green-700' : 'text-gray-500'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
