import { Users, Megaphone, MessageSquare, Bot, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import LineChart from '../../../components/charts/LineChart'
import PieChart from '../../../components/charts/PieChart'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/ui/Button'
import { useNavigate } from 'react-router-dom'

const EASE_OUT = [0.23, 1, 0.32, 1]

const msgData = Array.from({ length: 30 }, (_, i) => ({
  name: `D${i + 1}`,
  value: Math.floor(100 + Math.random() * 900),
}))

const leadSourceData = [
  { name: 'Keyword', value: 45 },
  { name: 'Flow', value: 30 },
  { name: 'Campaign', value: 25 },
]

const CONVERSATIONS = [
  { id: 1, name: 'Priya Sharma', msg: 'Is my order still on the way?', time: '2 min ago', unread: true },
  { id: 2, name: 'Raj Patel', msg: 'Thanks for the quick response!', time: '18 min ago', unread: false },
  { id: 3, name: 'Amit Kumar', msg: 'I need help with my account', time: '1h ago', unread: true },
  { id: 4, name: 'Neha Singh', msg: 'When will my refund arrive?', time: '3h ago', unread: false },
]

const DELIVERY = [
  { label: 'Delivered', value: 96.4, color: '#16a34a', bg: 'bg-green-500' },
  { label: 'Read',      value: 73.2, color: '#2563eb', bg: 'bg-blue-500' },
  { label: 'Failed',    value: 3.6,  color: '#dc2626', bg: 'bg-red-500' },
]

const USAGE = [
  { label: 'Message Credits', used: 3240, total: 5000 },
  { label: 'Contacts',        used: 847,  total: 1000 },
  { label: 'Team Seats',      used: 4,    total: 5 },
]

function SimpleKPI({ title, value, delta, deltaType, icon: Icon, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <span className="p-2 rounded-lg bg-green-50 text-green-600">
          <Icon size={16} />
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
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

function DeliveryCard({ index }) {
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
              <div
                className="h-full rounded-full"
                style={{
                  width: `${value}%`,
                  backgroundColor: color,
                  transition: 'width 600ms cubic-bezier(0.23,1,0.32,1)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Last 30 days · recent period</p>
    </motion.div>
  )
}

function SubscriptionCard({ index }) {
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
                <div
                  className={`h-full rounded-full ${warn ? 'bg-amber-400' : 'bg-green-500'}`}
                  style={{
                    width: `${pct}%`,
                    transition: 'width 600ms cubic-bezier(0.23,1,0.32,1)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-400">Starter plan · resets monthly</p>
    </motion.div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your WhatsApp automation overview" />

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SimpleKPI index={0} title="Total Contacts"       value="2,847" delta="+124 this month" deltaType="positive" icon={Users} />
        <SimpleKPI index={1} title="Total Campaigns Sent" value="134"   delta="+12 this week"  deltaType="positive" icon={Megaphone} />
        <SimpleKPI index={2} title="Replies Received"     value="489"   delta="+38 today"       deltaType="positive" icon={MessageSquare} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DeliveryCard index={3} />
        <SimpleKPI index={4} title="Active Chatbot Flows" value="7" delta="2 published today" deltaType="positive" icon={Bot} />
        <SubscriptionCard index={5} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LineChart data={msgData} lines={[{ key: 'value', color: '#16a34a', label: 'Messages' }]} title="Messages Sent (Last 30 Days)" />
        </div>
        <PieChart data={leadSourceData} title="Lead Sources" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Recent Conversations</p>
            <button onClick={() => navigate('/inbox')} className="text-xs text-green-600 hover:underline">View inbox</button>
          </div>
          <div className="space-y-3">
            {CONVERSATIONS.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <span className="text-green-700 text-sm font-bold">{c.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.msg}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-400">{c.time}</span>
                  {c.unread && <span className="w-2 h-2 rounded-full bg-green-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</p>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="secondary" onClick={() => navigate('/campaigns')}>
              📣 New Campaign
            </Button>
            <Button className="w-full justify-start" variant="secondary" onClick={() => navigate('/chatbot')}>
              🤖 Chatbot Flows
            </Button>
            <Button className="w-full justify-start" variant="secondary" onClick={() => navigate('/contacts')}>
              👥 View Contacts
            </Button>
            <Button className="w-full justify-start" variant="secondary" onClick={() => navigate('/analytics')}>
              📊 Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
