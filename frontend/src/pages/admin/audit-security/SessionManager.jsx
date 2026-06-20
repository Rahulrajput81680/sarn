import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Smartphone, Globe, LogIn, LogOut,
  CheckCircle2, XCircle, AlertTriangle, ShieldAlert,
  MapPin, Clock, Wifi, X, ChevronDown, Search,
  Ban, Eye, RefreshCw,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Active sessions ─────────────────────────────────────── */
const INIT_SESSIONS = [
  { id: 1,  user: 'Kunal Sharma',  role: 'Super Admin',   tenant: 'Platform',         device: 'Chrome 124 / macOS Sonoma',  browser: 'Chrome', os: 'macOS',   ip: '103.21.44.12', location: 'Mumbai, IN',    lastActive: '2 min ago',  type: 'desktop', current: true  },
  { id: 2,  user: 'Ravi Kumar',    role: 'Owner',         tenant: 'Flipkart Commerce', device: 'Safari / iPhone 15 Pro',     browser: 'Safari', os: 'iOS',     ip: '49.36.81.4',  location: 'Bengaluru, IN', lastActive: '6 min ago',  type: 'mobile',  current: false },
  { id: 3,  user: 'Neha Singh',    role: 'Owner',         tenant: 'TechStart',         device: 'Firefox 125 / Windows 11',   browser: 'Firefox',os: 'Windows', ip: '122.31.8.99', location: 'Delhi, IN',     lastActive: '14 min ago', type: 'desktop', current: false },
  { id: 4,  user: 'Arjun Mehta',  role: 'Support Admin', tenant: 'Platform',          device: 'Chrome 124 / Ubuntu 22',     browser: 'Chrome', os: 'Linux',   ip: '103.55.8.44', location: 'Pune, IN',      lastActive: '22 min ago', type: 'desktop', current: false },
  { id: 5,  user: 'Arya Verma',   role: 'Agent',         tenant: 'StyleHub',          device: 'Chrome / Android 14',        browser: 'Chrome', os: 'Android', ip: '103.77.12.8', location: 'Hyderabad, IN', lastActive: '1h ago',     type: 'mobile',  current: false },
  { id: 6,  user: 'Rohit Joshi',  role: 'Owner',         tenant: 'FoodZone',          device: 'Safari / iPad Pro',          browser: 'Safari', os: 'iPadOS',  ip: '49.204.11.3', location: 'Chennai, IN',   lastActive: '1h 20m ago', type: 'tablet',  current: false },
]

/* ─── Login history ───────────────────────────────────────── */
const LOGIN_HISTORY = [
  { id: 1,  user: 'Kunal Sharma',  role: 'Super Admin',   tenant: 'Platform',          device: 'Chrome / macOS',    ip: '103.21.44.12', location: 'Mumbai, IN',    time: 'Jun 15, 14:32', status: 'success', method: '2FA' },
  { id: 2,  user: 'Ravi Kumar',    role: 'Owner',         tenant: 'Flipkart Commerce', device: 'Safari / iPhone',   ip: '49.36.81.4',  location: 'Bengaluru, IN', time: 'Jun 15, 14:10', status: 'success', method: 'password' },
  { id: 3,  user: 'Unknown',       role: '—',             tenant: 'Platform',          device: 'Chrome / Windows',  ip: '185.44.9.22', location: 'Amsterdam, NL', time: 'Jun 15, 13:58', status: 'failed',  method: 'password' },
  { id: 4,  user: 'Arjun Mehta',  role: 'Support Admin', tenant: 'Platform',          device: 'Chrome / Ubuntu',   ip: '103.55.8.44', location: 'Pune, IN',      time: 'Jun 15, 09:22', status: 'failed',  method: 'password' },
  { id: 5,  user: 'Arjun Mehta',  role: 'Support Admin', tenant: 'Platform',          device: 'Chrome / Ubuntu',   ip: '103.55.8.44', location: 'Pune, IN',      time: 'Jun 15, 09:25', status: 'success', method: 'password' },
  { id: 6,  user: 'Neha Singh',   role: 'Owner',         tenant: 'TechStart',         device: 'Firefox / Windows', ip: '122.31.8.99', location: 'Delhi, IN',     time: 'Jun 15, 08:50', status: 'success', method: 'password' },
  { id: 7,  user: 'Unknown',       role: '—',             tenant: 'Platform',          device: 'Curl / Linux',      ip: '185.44.9.22', location: 'Amsterdam, NL', time: 'Jun 14, 23:41', status: 'failed',  method: 'api_key' },
  { id: 8,  user: 'Unknown',       role: '—',             tenant: 'Platform',          device: 'Curl / Linux',      ip: '185.44.9.22', location: 'Amsterdam, NL', time: 'Jun 14, 23:42', status: 'failed',  method: 'api_key' },
  { id: 9,  user: 'Unknown',       role: '—',             tenant: 'Platform',          device: 'Curl / Linux',      ip: '185.44.9.22', location: 'Amsterdam, NL', time: 'Jun 14, 23:43', status: 'failed',  method: 'api_key' },
  { id: 10, user: 'Arya Verma',   role: 'Agent',         tenant: 'StyleHub',          device: 'Chrome / Android',  ip: '103.77.12.8', location: 'Hyderabad, IN', time: 'Jun 14, 18:20', status: 'success', method: 'password' },
  { id: 11, user: 'Kunal Sharma',  role: 'Super Admin',   tenant: 'Platform',          device: 'Chrome / macOS',    ip: '103.21.44.12', location: 'Mumbai, IN',   time: 'Jun 14, 17:00', status: 'success', method: '2FA' },
  { id: 12, user: 'Rohit Joshi',  role: 'Owner',         tenant: 'FoodZone',          device: 'Safari / iPad',     ip: '49.204.11.3', location: 'Chennai, IN',   time: 'Jun 14, 14:10', status: 'success', method: 'password' },
]

/* ─── IP/Device anomalies ─────────────────────────────────── */
const IP_ANOMALIES = [
  {
    id: 1, type: 'brute_force', severity: 'critical',
    ip: '185.44.9.22', location: 'Amsterdam, NL',
    detail: '3 failed login attempts in 2 minutes targeting admin panel (api_key auth)',
    time: 'Jun 14, 23:43', attempts: 3, blocked: false,
  },
  {
    id: 2, type: 'new_device', severity: 'medium',
    ip: '103.55.8.44', location: 'Pune, IN',
    detail: 'Arjun Mehta logged in from unrecognised device (Chrome / Ubuntu). Previous device: Chrome / macOS.',
    time: 'Jun 15, 09:22', attempts: null, blocked: false,
  },
  {
    id: 3, type: 'geo_anomaly', severity: 'high',
    ip: '185.44.9.22', location: 'Amsterdam, NL',
    detail: 'Login attempt from NL — all previous logins from IN. User account: admin@wixabotic.io',
    time: 'Jun 14, 23:58', attempts: null, blocked: false,
  },
  {
    id: 4, type: 'simultaneous', severity: 'medium',
    ip: '49.36.81.4', location: 'Bengaluru, IN',
    detail: 'Ravi Kumar active simultaneously from Mumbai and Bengaluru within 10 minutes (possible session sharing)',
    time: 'Jun 15, 12:30', attempts: null, blocked: false,
  },
]

const ANOMALY_TYPES = {
  brute_force:  { label: 'Brute Force',          color: 'red',    icon: ShieldAlert },
  new_device:   { label: 'New Device Login',     color: 'yellow', icon: Monitor     },
  geo_anomaly:  { label: 'Geo Anomaly',          color: 'orange', icon: Globe       },
  simultaneous: { label: 'Simultaneous Sessions',color: 'blue',   icon: Wifi        },
}
const SEV_COLOR = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' }

const DEVICE_ICON = { mobile: Smartphone, desktop: Monitor, tablet: Monitor }
const OS_COLOR = { macOS: 'text-gray-600', Windows: 'text-blue-600', Linux: 'text-orange-500', iOS: 'text-gray-500', Android: 'text-green-600', iPadOS: 'text-blue-500' }

/* ─── Tab: Active Sessions ────────────────────────────────── */
function SessionsTab() {
  const [sessions, setSessions] = useState(INIT_SESSIONS)

  function revoke(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  function revokeAll() {
    setSessions((prev) => prev.filter((s) => s.current))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{sessions.length} active session{sessions.length !== 1 ? 's' : ''}</p>
        <button onClick={revokeAll}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
          <LogOut size={13} /> Revoke All Others
        </button>
      </div>

      <div className="space-y-2">
        {sessions.map((s, i) => {
          const DevIcon = DEVICE_ICON[s.type] || Monitor
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.14, ease: EASE_OUT, delay: i * 0.04 }}
              className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 ${s.current ? 'border-green-200' : 'border-gray-100'}`}>
              <div className={`p-3 rounded-xl shrink-0 ${s.current ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                <DevIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{s.user}</p>
                  {s.current && <Badge color="green">Current session</Badge>}
                  <Badge color="gray">{s.role}</Badge>
                  <span className="text-[10px] text-gray-400">{s.tenant}</span>
                </div>
                <p className="text-xs text-gray-500">{s.device}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><MapPin size={9} />{s.location}</span>
                  <span className="font-mono">{s.ip}</span>
                  <span className="flex items-center gap-1"><Clock size={9} />Last active: {s.lastActive}</span>
                </div>
              </div>
              {!s.current && (
                <button onClick={() => revoke(s.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all shrink-0">
                  <X size={12} /> Revoke
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Tab: Login History ──────────────────────────────────── */
function LoginHistoryTab() {
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('')
  const [page,    setPage]    = useState(1)
  const perPage = 8

  const filtered = LOGIN_HISTORY.filter((r) => {
    const q = search.toLowerCase()
    return (!q || r.user.toLowerCase().includes(q) || r.ip.includes(q) || r.location.toLowerCase().includes(q))
      && (!statusF || r.status === statusF)
  })
  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  const failedCount = LOGIN_HISTORY.filter((r) => r.status === 'failed').length

  return (
    <div className="space-y-4">
      {failedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs font-medium text-red-700">
            {failedCount} failed login attempt{failedCount > 1 ? 's' : ''} detected in the last 48 hours — review for suspicious activity
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search user, IP, location…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div className="relative">
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1) }}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-700">
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Time', 'User', 'Role / Tenant', 'Device', 'IP', 'Location', 'Method', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.03 }}
                  className={`hover:bg-gray-50/60 transition-colors ${r.status === 'failed' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{r.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {r.status === 'success' ? <LogIn size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-red-500" />}
                      <span className="text-xs font-medium text-gray-800">{r.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[10px] text-gray-500">{r.role}</p>
                    <p className="text-[10px] text-gray-400">{r.tenant}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.device}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.ip}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} className="text-gray-400" />{r.location}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{r.method}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status === 'success' ? <CheckCircle2 size={13} className="text-green-500" /> : <XCircle size={13} className="text-red-500" />}
                      <Badge color={r.status === 'success' ? 'green' : 'red'}>{r.status}</Badge>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400">No entries found</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{filtered.length} entries</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Tab: IP / Device Monitoring ────────────────────────── */
function IPDeviceTab() {
  const [anomalies, setAnomalies] = useState(IP_ANOMALIES)
  const [blockedIPs, setBlockedIPs] = useState(['185.44.9.22'])
  const [newIP, setNewIP] = useState('')

  function dismiss(id) {
    setAnomalies((prev) => prev.filter((a) => a.id !== id))
  }

  function blockIP(ip) {
    if (!blockedIPs.includes(ip)) setBlockedIPs((prev) => [...prev, ip])
  }

  function unblockIP(ip) {
    setBlockedIPs((prev) => prev.filter((b) => b !== ip))
  }

  function addBlock() {
    if (newIP.trim() && !blockedIPs.includes(newIP.trim())) {
      setBlockedIPs((prev) => [...prev, newIP.trim()])
      setNewIP('')
    }
  }

  return (
    <div className="space-y-5">
      {/* Anomaly alerts */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-orange-500" />
          Security Anomalies
          {anomalies.length > 0 && <span className="text-xs font-bold text-white bg-orange-500 rounded-full px-2 py-0.5">{anomalies.length}</span>}
        </p>
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center py-8 bg-white rounded-xl border border-gray-100 text-gray-400">
            <CheckCircle2 size={24} className="text-green-400 mb-2" />
            <p className="text-sm">No anomalies detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((a, i) => {
              const at = ANOMALY_TYPES[a.type]
              const Icon = at.icon
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.14, ease: EASE_OUT, delay: i * 0.04 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${a.severity === 'critical' ? 'bg-red-50' : a.severity === 'high' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                        <Icon size={14} className={a.severity === 'critical' ? 'text-red-500' : a.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge color={at.color}>{at.label}</Badge>
                          <Badge color={SEV_COLOR[a.severity]} className="capitalize">{a.severity}</Badge>
                        </div>
                        <p className="text-xs text-gray-700">{a.detail}</p>
                        <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-gray-400">
                          <span className="font-mono">{a.ip}</span>
                          <span className="flex items-center gap-1"><MapPin size={9} />{a.location}</span>
                          <span>{a.time}</span>
                          {a.attempts && <span className="text-red-500">{a.attempts} attempts</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!blockedIPs.includes(a.ip) && (
                        <button onClick={() => blockIP(a.ip)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                          <Ban size={11} /> Block IP
                        </button>
                      )}
                      {blockedIPs.includes(a.ip) && (
                        <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700">
                          <Ban size={11} /> IP Blocked
                        </span>
                      )}
                      <button onClick={() => dismiss(a.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* IP blocklist */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Ban size={14} className="text-red-500" /> IP Blocklist
          <span className="text-xs font-normal text-gray-400">({blockedIPs.length} blocked)</span>
        </p>
        <div className="flex gap-2 mb-4">
          <input value={newIP} onChange={(e) => setNewIP(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addBlock()}
            placeholder="Add IP to block (e.g. 185.44.9.0/24)"
            className="flex-1 text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
          <button onClick={addBlock}
            className="px-4 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
            Block
          </button>
        </div>
        {blockedIPs.length === 0 ? (
          <p className="text-xs text-gray-400">No IPs blocked.</p>
        ) : (
          <div className="space-y-2">
            {blockedIPs.map((ip) => (
              <div key={ip} className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <Ban size={12} className="text-red-500" />
                  <span className="font-mono text-sm text-red-700">{ip}</span>
                </div>
                <button onClick={() => unblockIP(ip)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-100 transition-all">
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Known devices per user */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Known Devices</p>
        <div className="space-y-2">
          {[
            { user: 'Kunal Sharma',  role: 'Super Admin',   devices: [{ d: 'Chrome / macOS', ip: '103.21.44.12', last: 'Jun 15', trusted: true }, { d: 'Safari / iPhone', ip: '49.36.44.1', last: 'Jun 10', trusted: true }] },
            { user: 'Arjun Mehta',  role: 'Support Admin', devices: [{ d: 'Chrome / Ubuntu', ip: '103.55.8.44', last: 'Jun 15', trusted: false }, { d: 'Chrome / macOS', ip: '122.99.1.3', last: 'Jun 12', trusted: true }] },
            { user: 'Priya Sharma', role: 'Billing Admin',  devices: [{ d: 'Firefox / Windows', ip: '49.204.11.3', last: 'Jun 14', trusted: true }] },
          ].map((u) => (
            <div key={u.user} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{u.user}</p>
                  <p className="text-[10px] text-gray-400">{u.role}</p>
                </div>
                <span className="text-[10px] text-gray-400">{u.devices.length} device{u.devices.length !== 1 ? 's' : ''}</span>
              </div>
              {u.devices.map((dev, di) => (
                <div key={di} className="flex items-center justify-between px-4 py-2 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Monitor size={12} className="text-gray-400" />
                    <span>{dev.d}</span>
                    <span className="font-mono text-gray-400">{dev.ip}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">Last: {dev.last}</span>
                    {dev.trusted
                      ? <Badge color="green" className="text-[10px]">Trusted</Badge>
                      : <Badge color="yellow" className="text-[10px]">New</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
const TABS = [
  { key: 'sessions', label: 'Active Sessions', icon: Monitor  },
  { key: 'history',  label: 'Login History',   icon: LogIn    },
  { key: 'ipdevice', label: 'IP / Device',     icon: Globe    },
]

export default function SessionManager() {
  const [tab, setTab] = useState('sessions')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sessions, Login History & IP Monitoring"
        description="Active sessions, login history tracking and IP/device security monitoring"
        breadcrumbs={['Admin', 'Audit & Security', 'Sessions']}
      />

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}>
          {tab === 'sessions' && <SessionsTab />}
          {tab === 'history'  && <LoginHistoryTab />}
          {tab === 'ipdevice' && <IPDeviceTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
