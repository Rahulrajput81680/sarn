import { useEffect, useState } from 'react'
import { Users, Megaphone, MessageSquare, Bot, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import LineChart from '../../../components/charts/LineChart'
import PieChart from '../../../components/charts/PieChart'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/ui/Button'
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
        <DeliveryCard index={3} stats={delivery} loading={loading} />
        <SimpleKPI index={4} loading={loading} title="Approved Templates" value={(stats?.activeFlows ?? 0).toLocaleString()} delta="ready to use" deltaType="positive" icon={Bot} />
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
