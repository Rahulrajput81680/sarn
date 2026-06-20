import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, CheckCheck, Eye, MessageSquare, XCircle, TrendingUp,
  TrendingDown, Users, Megaphone, Bot, UserCog, Download,
  X, Check,
} from 'lucide-react'
import LineChart  from '../../../components/charts/LineChart'
import BarChart   from '../../../components/charts/BarChart'
import PieChart   from '../../../components/charts/PieChart'
import PageHeader from '../../../components/layout/PageHeader'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Demo data ──────────────────────────────────────────── */

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const DAYS_30 = Array.from({ length: 30 }, (_, i) => {
  const sent      = rnd(320, 920)
  const delivered = Math.floor(sent * (rnd(92, 98) / 100))
  const read      = Math.floor(delivered * (rnd(68, 82) / 100))
  const reply     = Math.floor(read * (rnd(10, 18) / 100))
  return { name: `D${i + 1}`, sent, delivered, read, reply }
})

const MONTHS_12 = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'].map((m) => ({
  name: m, contacts: rnd(40, 180), optedIn: rnd(30, 140),
}))

const BEST_CAMPAIGNS = [
  { name: 'Summer Sale Blast',     sent: 2840, delivPct: 96.4, readPct: 78.2, replyPct: 14.1, template: 'Promo v2',   date: 'Jun 10' },
  { name: 'Flash Weekend Offer',   sent: 1920, delivPct: 97.1, readPct: 74.8, replyPct: 12.6, template: 'Flash Sale', date: 'Jun 06' },
  { name: 'Re-engagement Jun',     sent: 1480, delivPct: 94.2, readPct: 71.3, replyPct:  9.8, template: 'Win Back v1',date: 'Jun 01' },
  { name: 'Product Launch Update', sent: 3210, delivPct: 95.8, readPct: 76.5, replyPct: 11.4, template: 'Launch v3',  date: 'May 28' },
  { name: 'Monthly Newsletter',    sent: 2150, delivPct: 93.6, readPct: 68.9, replyPct:  7.2, template: 'Newsletter', date: 'May 15' },
  { name: 'VIP Early Access',      sent:  890, delivPct: 98.2, readPct: 84.1, replyPct: 22.3, template: 'VIP Invite', date: 'May 10' },
]

const TEMPLATE_PERF = [
  { name: 'Promo v2',   'Read %': 78, 'Reply %': 14 },
  { name: 'Flash Sale', 'Read %': 73, 'Reply %': 11 },
  { name: 'Newsletter', 'Read %': 68, 'Reply %':  7 },
  { name: 'VIP Invite', 'Read %': 84, 'Reply %': 22 },
  { name: 'Win Back',   'Read %': 70, 'Reply %':  9 },
]

const WEEKLY_CAMPAIGNS = Array.from({ length: 12 }, (_, i) => ({ name: `W${i + 1}`, campaigns: rnd(2, 8) }))

const CONTACT_SOURCE = [
  { name: 'Website', value: 38 }, { name: 'Facebook Ad', value: 28 },
  { name: 'WhatsApp', value: 18 }, { name: 'Referral', value: 10 }, { name: 'Event', value: 6 },
]

const TAG_DIST = [
  { name: 'Customer', value: 42 }, { name: 'Lead', value: 31 },
  { name: 'Interested', value: 17 }, { name: 'Follow-up', value: 10 },
]

const CHATBOT_FLOWS = [
  { name: 'Welcome Flow',  completion: 82, dropoff: 18, leads: 214, sessions: 1240 },
  { name: 'Order Status',  completion: 91, dropoff:  9, leads:  48, sessions:  870 },
  { name: 'Lead Capture',  completion: 68, dropoff: 32, leads: 391, sessions:  620 },
  { name: 'Re-engagement', completion: 74, dropoff: 26, leads:  87, sessions:  340 },
]

const DROPOFF_STEPS = [
  { name: 'Trigger',    value: 100 }, { name: 'First Msg',  value:  88 },
  { name: 'Question',   value:  74 }, { name: 'Condition',  value:  68 },
  { name: 'Assign Tag', value:  64 }, { name: 'End/Transfer', value: 58 },
]

const AGENTS = [
  { name: 'Rahul Sharma', chats: 148, resolved: 134, avgMin: 4.2, satisfaction: 94 },
  { name: 'Sneha Kapoor', chats: 127, resolved: 119, avgMin: 5.8, satisfaction: 91 },
  { name: 'Dev Kumar',    chats:  96, resolved:  88, avgMin: 7.1, satisfaction: 87 },
  { name: 'Priti Nair',   chats:  83, resolved:  76, avgMin: 6.4, satisfaction: 89 },
]

const totalSent      = DAYS_30.reduce((s, d) => s + d.sent, 0)
const totalDelivered = DAYS_30.reduce((s, d) => s + d.delivered, 0)
const totalRead      = DAYS_30.reduce((s, d) => s + d.read, 0)
const totalReply     = DAYS_30.reduce((s, d) => s + d.reply, 0)
const delivPct       = ((totalDelivered / totalSent) * 100).toFixed(1)
const readPct        = ((totalRead / totalDelivered) * 100).toFixed(1)
const replyPct       = ((totalReply / totalDelivered) * 100).toFixed(1)
const failPct        = (100 - +delivPct).toFixed(1)

const DATE_RANGES = ['7D', '30D', '90D', '1Y']
const TABS = [
  { key: 'messaging', label: 'Messaging',       icon: MessageSquare },
  { key: 'campaigns', label: 'Campaigns',        icon: Megaphone },
  { key: 'contacts',  label: 'Contact Growth',   icon: Users },
  { key: 'chatbot',   label: 'Chatbot',          icon: Bot },
  { key: 'agents',    label: 'Agent Performance',icon: UserCog },
]

/* ─── Shared UI ──────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, sub, subPositive, color = 'green', index = 0 }) {
  const palette = {
    green:  { bg: 'bg-green-50',  ic: 'text-green-600'  },
    blue:   { bg: 'bg-blue-50',   ic: 'text-blue-600'   },
    amber:  { bg: 'bg-amber-50',  ic: 'text-amber-600'  },
    red:    { bg: 'bg-red-50',    ic: 'text-red-600'    },
    purple: { bg: 'bg-purple-50', ic: 'text-purple-600' },
  }
  const c = palette[color] || palette.green
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT, delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <span className={`p-1.5 rounded-lg ${c.bg}`}><Icon size={14} className={c.ic} /></span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
          subPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
        }`}>
          {subPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {sub}
        </span>
      )}
    </motion.div>
  )
}

function ProgressBar({ pct, color = 'green' }) {
  const colors = { green: '#16a34a', blue: '#2563eb', red: '#dc2626', amber: '#d97706', purple: '#7c3aed' }
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[color], transition: 'width 600ms cubic-bezier(0.23,1,0.32,1)' }} />
    </div>
  )
}

/* ─── Export modal ───────────────────────────────────────── */

function ExportModal({ onClose }) {
  const [format,  setFormat]  = useState('csv')
  const [section, setSection] = useState('all')
  const [done,    setDone]    = useState(false)

  const handleExport = () => {
    setDone(true)
    setTimeout(() => { setDone(false); onClose() }, 1800)
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Export Report</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={15} /></button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Format</label>
          <div className="flex gap-2">
            {['csv', 'pdf', 'xlsx'].map((f) => (
              <button key={f} onClick={() => setFormat(f)}
                className={`flex-1 py-2 text-xs font-semibold uppercase rounded-lg border-2 transition-colors ${format === f ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Section</label>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="all">All Analytics</option>
            <option value="messaging">Messaging Analytics</option>
            <option value="campaigns">Campaign Analytics</option>
            <option value="contacts">Contact Growth</option>
            <option value="chatbot">Chatbot Analytics</option>
            <option value="agents">Agent Performance</option>
          </select>
        </div>
        <AnimatePresence mode="wait">
          {done
            ? <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 py-2 text-sm font-medium text-green-700"><Check size={15} className="text-green-600" /> Preparing download…</motion.div>
            : <motion.button key="btn" whileTap={{ scale: 0.97 }} onClick={handleExport} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl" style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}>
                <Download size={14} /> Export {format.toUpperCase()}
              </motion.button>
          }
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

/* ─── Tab: Messaging ─────────────────────────────────────── */

function MessagingTab({ range }) {
  const slice = range === '7D' ? 7 : 30
  const data  = DAYS_30.slice(0, slice)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard index={0} icon={Send}          label="Total Sent"   value={totalSent.toLocaleString()} sub="+8.4% vs last period" subPositive color="blue"   />
        <StatCard index={1} icon={CheckCheck}    label="Delivered"    value={`${delivPct}%`}             sub="+1.2% vs last period" subPositive color="green"  />
        <StatCard index={2} icon={Eye}           label="Read Rate"    value={`${readPct}%`}              sub="+3.1% vs last period" subPositive color="purple" />
        <StatCard index={3} icon={MessageSquare} label="Reply Rate"   value={`${replyPct}%`}             sub="+0.8% vs last period" subPositive color="amber"  />
        <StatCard index={4} icon={XCircle}       label="Failure Rate" value={`${failPct}%`}              sub="-0.6% vs last period" subPositive color="red"    />
      </div>

      <LineChart
        data={data}
        height={240}
        title="Messages Over Time"
        lines={[
          { key: 'sent',      color: '#3b82f6', label: 'Sent' },
          { key: 'delivered', color: '#16a34a', label: 'Delivered' },
          { key: 'read',      color: '#8b5cf6', label: 'Read' },
          { key: 'reply',     color: '#f59e0b', label: 'Replies' },
        ]}
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Delivery Funnel</p>
        <div className="space-y-3">
          {[
            { label: 'Sent',      pct: 100,       color: 'blue',   val: totalSent.toLocaleString() },
            { label: 'Delivered', pct: +delivPct,  color: 'green',  val: `${delivPct}%` },
            { label: 'Read',      pct: +readPct,   color: 'purple', val: `${readPct}%` },
            { label: 'Replied',   pct: +replyPct,  color: 'amber',  val: `${replyPct}%` },
            { label: 'Failed',    pct: +failPct,   color: 'red',    val: `${failPct}%` },
          ].map(({ label, pct, color, val }, i) => (
            <motion.div key={label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.06 }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{label}</span>
                <span className="text-xs font-semibold text-gray-900">{val}</span>
              </div>
              <ProgressBar pct={pct} color={color} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Tab: Campaigns ─────────────────────────────────────── */

function CampaignsTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index={0} icon={Megaphone}     label="Total Campaigns"  value="48"    sub="+6 this month"  subPositive color="blue"   />
        <StatCard index={1} icon={Send}          label="Total Msgs Sent"  value="38.4K" sub="+12% vs last"   subPositive color="green"  />
        <StatCard index={2} icon={Eye}           label="Avg Read Rate"    value="74.6%" sub="+3.2% vs last"  subPositive color="purple" />
        <StatCard index={3} icon={TrendingUp}    label="Best Reply Rate"  value="22.3%" sub="VIP Invite"     subPositive color="amber"  />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Best Performing Campaigns</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
                <th className="text-left px-5 py-3">Campaign</th>
                <th className="text-left px-4 py-3">Template</th>
                <th className="text-left px-4 py-3">Sent</th>
                <th className="text-left px-4 py-3 min-w-[120px]">Delivered</th>
                <th className="text-left px-4 py-3 min-w-[120px]">Read</th>
                <th className="text-left px-4 py-3">Reply</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {BEST_CAMPAIGNS.map((c, i) => (
                <motion.tr key={c.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.04 }} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.template}</td>
                  <td className="px-4 py-3 text-gray-700">{c.sent.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><ProgressBar pct={c.delivPct} color="green" /></div>
                      <span className="text-xs font-semibold text-green-600 w-10 shrink-0">{c.delivPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><ProgressBar pct={c.readPct} color="blue" /></div>
                      <span className="text-xs font-semibold text-blue-600 w-10 shrink-0">{c.readPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-amber-600">{c.replyPct}%</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{c.date}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart data={WEEKLY_CAMPAIGNS} height={220} title="Time-wise Campaign Volume (Weekly)" bars={[{ key: 'campaigns', color: '#16a34a', label: 'Campaigns' }]} />
        <BarChart data={TEMPLATE_PERF}    height={220} title="Template-wise Performance" bars={[{ key: 'Read %', color: '#3b82f6', label: 'Read %' }, { key: 'Reply %', color: '#f59e0b', label: 'Reply %' }]} />
      </div>
    </div>
  )
}

/* ─── Tab: Contact Growth ────────────────────────────────── */

function ContactsTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index={0} icon={Users}      label="Total Contacts" value="2,847"  sub="+124 this month" subPositive color="blue"   />
        <StatCard index={1} icon={TrendingUp} label="New This Month" value="124"    sub="+18% vs last"    subPositive color="green"  />
        <StatCard index={2} icon={CheckCheck} label="Opted In"       value="2,304"  sub="80.9% of total"  subPositive color="purple" />
        <StatCard index={3} icon={XCircle}    label="Opted Out"      value="543"    sub="19.1% of total"  subPositive={false} color="amber" />
      </div>

      <LineChart
        data={MONTHS_12}
        height={240}
        title="Contact Growth (Last 12 Months)"
        lines={[
          { key: 'contacts', color: '#16a34a', label: 'New Contacts' },
          { key: 'optedIn',  color: '#3b82f6', label: 'Opted In' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChart data={CONTACT_SOURCE} title="Contact Sources"  height={240} />
        <PieChart data={TAG_DIST}       title="Tag Distribution" height={240} />
      </div>
    </div>
  )
}

/* ─── Tab: Chatbot ───────────────────────────────────────── */

function ChatbotTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index={0} icon={Bot}         label="Total Sessions"   value="3,070"  sub="+210 this week"  subPositive color="blue"   />
        <StatCard index={1} icon={CheckCheck}  label="Avg Completion"   value="78.8%"  sub="+4.2% vs last"   subPositive color="green"  />
        <StatCard index={2} icon={XCircle}     label="Avg Drop-off"     value="21.2%"  sub="-4.2% vs last"   subPositive color="red"    />
        <StatCard index={3} icon={Users}       label="Leads Captured"   value="740"    sub="+86 this month"  subPositive color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Flow-wise Performance</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
              <th className="text-left px-5 py-3">Flow</th>
              <th className="text-left px-4 py-3">Sessions</th>
              <th className="text-left px-4 py-3 min-w-[140px]">Completion Rate</th>
              <th className="text-left px-4 py-3 min-w-[140px]">Drop-off Rate</th>
              <th className="text-left px-4 py-3">Leads</th>
            </tr>
          </thead>
          <tbody>
            {CHATBOT_FLOWS.map((f, i) => (
              <motion.tr key={f.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.05 }} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900">{f.name}</td>
                <td className="px-4 py-3 text-gray-600">{f.sessions.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[80px]"><ProgressBar pct={f.completion} color="green" /></div>
                    <span className="text-xs font-semibold text-green-600">{f.completion}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[80px]"><ProgressBar pct={f.dropoff} color="red" /></div>
                    <span className="text-xs font-semibold text-red-500">{f.dropoff}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                    <Users size={10} /> {f.leads}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart data={DROPOFF_STEPS} height={220} title="Drop-off Points (Average across flows)" bars={[{ key: 'value', color: '#ef4444', label: 'Users remaining %' }]} />
        <BarChart data={CHATBOT_FLOWS.map((f) => ({ name: f.name.split(' ')[0], leads: f.leads }))} height={220} title="Leads Captured per Flow" bars={[{ key: 'leads', color: '#8b5cf6', label: 'Leads' }]} />
      </div>
    </div>
  )
}

/* ─── Tab: Agent Performance ─────────────────────────────── */

function AgentsTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard index={0} icon={UserCog}       label="Active Agents"      value="4"       sub="All online now"  subPositive color="blue"   />
        <StatCard index={1} icon={MessageSquare} label="Total Chats"        value="454"     sub="+42 this week"   subPositive color="green"  />
        <StatCard index={2} icon={CheckCheck}    label="Resolution Rate"    value="90.7%"   sub="+1.8% vs last"   subPositive color="purple" />
        <StatCard index={3} icon={TrendingUp}    label="Avg Response Time"  value="5.9 min" sub="-0.4 min"        subPositive color="amber"  />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Agent Performance</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
              <th className="text-left px-5 py-3">Agent</th>
              <th className="text-left px-4 py-3">Chats</th>
              <th className="text-left px-4 py-3 min-w-[160px]">Resolved</th>
              <th className="text-left px-4 py-3">Avg Response</th>
              <th className="text-left px-4 py-3">Satisfaction</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((a, i) => (
              <motion.tr key={a.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.05 }} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <span className="text-green-700 text-xs font-bold">{a.name[0]}</span>
                    </div>
                    <span className="font-medium text-gray-900">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{a.chats}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[80px]"><ProgressBar pct={Math.round((a.resolved / a.chats) * 100)} color="green" /></div>
                    <span className="text-xs font-semibold text-green-600">{a.resolved} ({Math.round((a.resolved / a.chats) * 100)}%)</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">{a.avgMin} min</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.satisfaction >= 90 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {a.satisfaction}% ★
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart
          data={AGENTS.map((a) => ({ name: a.name.split(' ')[0], Chats: a.chats, Resolved: a.resolved }))}
          height={220} title="Chats Handled vs Resolved"
          bars={[{ key: 'Chats', color: '#3b82f6', label: 'Total Chats' }, { key: 'Resolved', color: '#16a34a', label: 'Resolved' }]}
        />
        <BarChart
          data={AGENTS.map((a) => ({ name: a.name.split(' ')[0], 'Avg (min)': a.avgMin }))}
          height={220} title="Avg Response Time (minutes)"
          bars={[{ key: 'Avg (min)', color: '#f59e0b', label: 'Avg Response' }]}
        />
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function Analytics() {
  const [tab,        setTab]        = useState('messaging')
  const [range,      setRange]      = useState('30D')
  const [showExport, setShowExport] = useState(false)

  const tabContent = {
    messaging: <MessagingTab range={range} />,
    campaigns: <CampaignsTab />,
    contacts:  <ContactsTab />,
    chatbot:   <ChatbotTab />,
    agents:    <AgentsTab />,
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader title="Analytics" description="Track performance across messaging, campaigns, contacts and chatbot flows" />
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 bg-white transition-colors"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Download size={14} /> Export
          </motion.button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-0.5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab + range}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
        >
          {tabContent[tab]}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      </AnimatePresence>
    </div>
  )
}
