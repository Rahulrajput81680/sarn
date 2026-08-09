import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Edit3,
  Megaphone,
  MessageSquare,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import LineChart from '../../../components/charts/LineChart'
import PieChart from '../../../components/charts/PieChart'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

const LEAD_SOURCE = [
  { name: 'Keyword', value: 45 },
  { name: 'Flow',    value: 30 },
  { name: 'Campaign',value: 25 },
]

function SimpleKPI({ title, value, delta, deltaType, icon: Icon, index, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <span className="p-2 rounded-lg bg-green-50 text-green-600"><Icon size={16} /></span>
      </div>
      {loading
        ? <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
        : <p className="text-2xl font-bold text-gray-900">{value}</p>
      }
      {delta && (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
          deltaType === 'positive' ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'
        }`}>
          {deltaType === 'positive' && <TrendingUp size={11} />}
          {delta}
        </span>
      )}
    </motion.div>
  )
}

function DeliveryCard({ stats, loading, index }) {
  const DELIVERY = [
    { label: 'Delivered', value: stats?.delivered ?? 96.4, color: '#16a34a', bg: 'bg-green-500' },
    { label: 'Read',      value: stats?.read      ?? 73.2, color: '#2563eb', bg: 'bg-blue-500' },
    { label: 'Failed',    value: stats?.failed    ?? 3.6,  color: '#dc2626', bg: 'bg-red-500' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
    >
      <p className="text-sm font-medium text-gray-500">Delivered / Read / Failed</p>
      <div className="space-y-2.5">
        {DELIVERY.map(({ label, value, color, bg }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${bg}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">{value}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color, transition: 'width 600ms cubic-bezier(0.23,1,0.32,1)' }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Last 30 days</p>
    </motion.div>
  )
}

function UsageCard({ limits, usage, plan, index }) {
  const USAGE = [
    { label: 'Message Credits', used: usage?.messages ?? 0, total: limits?.messages ?? 5000 },
    { label: 'Contacts',        used: usage?.contacts  ?? 0, total: limits?.contacts  ?? 1000 },
    { label: 'Team Seats',      used: usage?.teamSeats ?? 1, total: limits?.teamSeats ?? 5 },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
    >
      <p className="text-sm font-medium text-gray-500">Subscription Usage</p>
      <div className="space-y-3">
        {USAGE.map(({ label, used, total }) => {
          const pct = Math.round((used / total) * 100)
          const warn = pct >= 80
          return (
            <div key={label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-xs font-semibold ${warn ? 'text-amber-600' : 'text-gray-900'}`}>
                  {used.toLocaleString()} / {total.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${warn ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width: `${pct}%`, transition: 'width 600ms cubic-bezier(0.23,1,0.32,1)' }} />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 capitalize">{plan ?? 'starter'} plan · resets monthly</p>
    </motion.div>
  )
}

function WhatsAppStatusCard({ status, loading, index }) {
  const [showIssues, setShowIssues] = useState(false)
  const isConnected = status?.connectionStatus === 'connected'
  const displayName = status?.displayName || 'WhatsApp Business'
  const phoneNumber = status?.phoneNumber || 'Connect your number'
  const dailyLimit = status?.messagingLimitLabel || 'Unknown'
  const qualityLabel = status?.qualityLabel || 'Unknown'
  const messagingLabel = isConnected ? (status?.phoneStatus || 'Unknown') : 'Setup needed'
  const issueCount = status?.issueCount ?? 0
  const isVerified = !!status?.verified
  const issues = status?.issues?.length ? status.issues : ['No issues detected']

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="rounded-3xl border-4 border-green-50 bg-white/90 p-4 sm:p-5 shadow-sm"
    >
      {loading ? (
        <div className="space-y-5">
          <div className="h-14 w-full rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-8 w-2/3 rounded-lg bg-gray-100 animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-12 w-12 shrink-0 rounded-full bg-[#25D366] text-white shadow-sm ring-4 ring-green-50 flex items-center justify-center">
                <svg
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  className="h-7 w-7"
                  fill="currentColor"
                >
                  <path d="M16.02 4.2c-6.4 0-11.6 5.1-11.6 11.4 0 2.2.7 4.4 1.9 6.2L4.1 28l6.5-2.1c1.7.9 3.5 1.3 5.4 1.3 6.4 0 11.6-5.1 11.6-11.5S22.42 4.2 16.02 4.2Zm0 20.9c-1.7 0-3.3-.4-4.7-1.3l-.3-.2-3.8 1.2 1.2-3.6-.2-.4c-1.1-1.5-1.7-3.3-1.7-5.1 0-5.1 4.2-9.3 9.5-9.3s9.5 4.2 9.5 9.3-4.2 9.4-9.5 9.4Zm5.2-7c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.3-.5-.4Z" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-white flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">WhatsApp</p>
                <h2 className="mt-2 flex items-center gap-2 text-lg font-bold text-gray-900 truncate">
                  <span className="truncate">{displayName}</span>
                  {/* <Edit3 size={16} className="shrink-0 text-gray-400" /> */}
                </h2>
                <p className="mt-0.5 text-base font-medium text-gray-500 truncate">{phoneNumber}</p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1.5 text-xs font-bold text-cyan-700">
              <Star size={14} fill="currentColor" />
              Primary
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {isConnected ? 'Active' : 'Pending'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <CheckCircle2 size={14} />
              {status?.registered ? 'Registered' : 'Not registered'}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isVerified ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'
            }`}>
              <ShieldCheck size={14} />
              {isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <p className="text-xs font-bold uppercase text-gray-400">Quality</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {qualityLabel}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <p className="text-xs font-bold uppercase text-gray-400">Messaging</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {messagingLabel}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <p className="text-xs font-bold uppercase text-gray-400">Limit</p>
              <p className="mt-2 text-sm font-semibold text-gray-700">{dailyLimit}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIssues(true)}
            className="flex w-fit items-center gap-1.5 rounded-lg text-xs font-bold uppercase text-orange-600 transition-colors hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <AlertTriangle size={16} />
            {issueCount} {issueCount === 1 ? 'Issue' : 'Issues'}
          </button>

          <Modal isOpen={showIssues} onClose={() => setShowIssues(false)} title="WhatsApp Issues" size="sm">
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-400">Account</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{displayName}</p>
                <p className="text-sm text-gray-500">{phoneNumber || 'No number connected'}</p>
              </div>

              <div className="space-y-2">
                {issues.map((issue) => (
                  <div key={issue} className="flex gap-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2.5 text-sm text-orange-800">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Phone</p>
                  <p className="mt-1 font-medium text-gray-700">{status?.phoneStatus || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Name</p>
                  <p className="mt-1 font-medium text-gray-700">{status?.nameStatus || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Code</p>
                  <p className="mt-1 font-medium text-gray-700">{status?.codeVerificationStatus || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Source</p>
                  <p className="mt-1 font-medium capitalize text-gray-700">{status?.source || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </motion.div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [trend, setTrend] = useState([])
  const [delivery, setDelivery] = useState(null)
  const [recentConvs, setRecentConvs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, t, d, r] = await Promise.all([
          axiosInstance.get('/api/v1/dashboard/stats'),
          axiosInstance.get('/api/v1/dashboard/message-trend'),
          axiosInstance.get('/api/v1/dashboard/delivery-stats'),
          axiosInstance.get('/api/v1/dashboard/recent-conversations'),
        ])
        setStats(s.data.data)
        setTrend(t.data.data.trend)
        setDelivery(d.data.data)
        setRecentConvs(r.data.data.conversations)
      } catch {
        // fallback silently — dashboard shows zeros
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const chartData = trend.map((d, i) => ({ name: `D${i + 1}`, value: d.value }))

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your WhatsApp automation overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <SimpleKPI index={0} loading={loading} title="Total Contacts"        value={(stats?.totalContacts ?? 0).toLocaleString()} delta="+this month" deltaType="positive" icon={Users} />
        <SimpleKPI index={1} loading={loading} title="Campaigns Sent"        value={(stats?.totalCampaigns ?? 0).toLocaleString()} delta="all time"    deltaType="positive" icon={Megaphone} />
        <SimpleKPI index={2} loading={loading} title="Replies Received"      value={(stats?.totalReplies ?? 0).toLocaleString()}  delta="all time"    deltaType="positive" icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WhatsAppStatusCard index={3} status={stats?.whatsappStatus} loading={loading} />
        <DeliveryCard index={4} stats={delivery} loading={loading} />
        <SimpleKPI index={5} loading={loading} title="Approved Templates" value={(stats?.activeFlows ?? 0).toLocaleString()} delta="ready to use" deltaType="positive" icon={Bot} />
        {/* <UsageCard index={5} limits={stats?.limits} usage={stats?.usage} plan={stats?.plan} /> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LineChart
            data={chartData.length ? chartData : Array.from({ length: 30 }, (_, i) => ({ name: `D${i + 1}`, value: 0 }))}
            lines={[{ key: 'value', color: '#16a34a', label: 'Messages' }]}
            title="Messages Sent (Last 30 Days)"
          />
        </div>
        {/* <PieChart data={LEAD_SOURCE} title="Lead Sources" /> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Recent Conversations</p>
            <button onClick={() => navigate('/inbox')} className="text-xs text-green-600 hover:underline">View inbox</button>
          </div>
          {loading
            ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
            : recentConvs.length === 0
              ? <p className="text-sm text-gray-400 text-center py-8">No conversations yet</p>
              : (
                <div className="space-y-3">
                  {recentConvs.map((c) => (
                    <div key={c._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/inbox')}>
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <span className="text-green-700 text-sm font-bold">
                          {(c.contact?.name || 'U')[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{c.contact?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400 truncate">{c.lastMessage?.text || 'No messages yet'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-400">{c.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
          }
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</p>
          <div className="space-y-2">
            <Button className="w-full justify-start text-left" variant="secondary" onClick={() => navigate('/contacts')}>View Contacts</Button>
            <Button className="w-full justify-start text-left" variant="secondary" onClick={() => navigate('/bulk-messaging')}>Bulk Messaging</Button>
            <Button className="w-full justify-start text-left" variant="secondary" onClick={() => navigate('/inbox')}>Open Inbox</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
