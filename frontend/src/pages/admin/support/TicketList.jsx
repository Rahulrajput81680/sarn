import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, AlertCircle, Clock, CheckCircle2, Circle,
  ArrowUpRight, Flame, AlertTriangle, ChevronDown,
  User, Timer, Filter,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Support staff ───────────────────────────────────────── */
const STAFF = [
  { id: 1, name: 'Arjun Mehta',   avatar: 'AM', color: 'bg-blue-500'   },
  { id: 2, name: 'Priya Sharma',  avatar: 'PS', color: 'bg-pink-500'   },
  { id: 3, name: 'Dev Patel',     avatar: 'DP', color: 'bg-violet-500' },
  { id: 4, name: 'Sneha Rao',     avatar: 'SR', color: 'bg-teal-500'   },
  { id: 5, name: 'Vikram Singh',  avatar: 'VS', color: 'bg-amber-500'  },
]

/* ─── Ticket data ─────────────────────────────────────────── */
const CLIENTS = [
  { name: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500' },
  { name: 'TechStart',         avatar: 'TS', color: 'bg-indigo-500' },
  { name: 'StyleHub',          avatar: 'SH', color: 'bg-pink-500'   },
  { name: 'FoodZone',          avatar: 'FZ', color: 'bg-orange-500' },
  { name: 'QuickMart',         avatar: 'QM', color: 'bg-blue-500'   },
  { name: 'MediCare Plus',     avatar: 'MP', color: 'bg-red-500'    },
  { name: 'RapidDeliver',      avatar: 'RD', color: 'bg-cyan-500'   },
  { name: 'CloudBazaar',       avatar: 'CB', color: 'bg-sky-500'    },
]

const SLA_HOURS = { critical: 2, high: 8, medium: 24, low: 72 }

const RAW_TICKETS = [
  { id: 'TKT-1001', subject: 'WhatsApp connection keeps dropping',        category: 'Integration',  priority: 'critical', status: 'open',        clientIdx: 0, staffIdx: 0, createdHoursAgo: 1.2,  reporter: 'Ravi Kumar'    },
  { id: 'TKT-1002', subject: 'Template rejected — PROMOTIONAL_IN_UTILITY', category: 'Templates',   priority: 'high',     status: 'in_progress', clientIdx: 1, staffIdx: 1, createdHoursAgo: 5,    reporter: 'Neha Singh'    },
  { id: 'TKT-1003', subject: 'Invoice amount incorrect for May 2026',      category: 'Billing',     priority: 'medium',   status: 'open',        clientIdx: 2, staffIdx: null, createdHoursAgo: 22, reporter: 'Arya Verma'   },
  { id: 'TKT-1004', subject: 'API returning 429 — rate limit hit',         category: 'API',         priority: 'high',     status: 'resolved',    clientIdx: 3, staffIdx: 2, createdHoursAgo: 30,   reporter: 'Rohit Joshi'   },
  { id: 'TKT-1005', subject: 'Chatbot flow not triggering after keyword',   category: 'Chatbot',     priority: 'high',     status: 'in_progress', clientIdx: 4, staffIdx: 3, createdHoursAgo: 7,    reporter: 'Meena Iyer'    },
  { id: 'TKT-1006', subject: 'Message delivery stuck at "sent" — no read', category: 'Messaging',   priority: 'medium',   status: 'open',        clientIdx: 5, staffIdx: null, createdHoursAgo: 18, reporter: 'Suresh Nair'  },
  { id: 'TKT-1007', subject: 'Phone number verification failed — OTP error',category: 'Integration', priority: 'critical', status: 'in_progress', clientIdx: 6, staffIdx: 4, createdHoursAgo: 0.5,  reporter: 'Divya Patel'  },
  { id: 'TKT-1008', subject: 'Contact import CSV stuck at 34%',            category: 'Contacts',    priority: 'medium',   status: 'open',        clientIdx: 7, staffIdx: null, createdHoursAgo: 15, reporter: 'Anil Sharma'  },
  { id: 'TKT-1009', subject: 'Bulk campaign sent to wrong segment',         category: 'Campaigns',   priority: 'high',     status: 'resolved',    clientIdx: 0, staffIdx: 1, createdHoursAgo: 48,   reporter: 'Ravi Kumar'    },
  { id: 'TKT-1010', subject: 'Team member cannot login — 2FA issue',        category: 'Account',     priority: 'low',      status: 'open',        clientIdx: 1, staffIdx: null, createdHoursAgo: 36, reporter: 'Neha Singh'   },
  { id: 'TKT-1011', subject: 'Webhook not receiving message events',        category: 'API',         priority: 'high',     status: 'closed',      clientIdx: 2, staffIdx: 2, createdHoursAgo: 72,   reporter: 'Arya Verma'    },
  { id: 'TKT-1012', subject: 'Subscription auto-renewal failed',            category: 'Billing',     priority: 'medium',   status: 'in_progress', clientIdx: 3, staffIdx: 0, createdHoursAgo: 10,   reporter: 'Rohit Joshi'  },
  { id: 'TKT-1013', subject: 'Analytics export always shows empty CSV',     category: 'Analytics',   priority: 'low',      status: 'open',        clientIdx: 4, staffIdx: null, createdHoursAgo: 28, reporter: 'Meena Iyer'  },
  { id: 'TKT-1014', subject: 'WABA account suspended by Meta',              category: 'Integration', priority: 'critical', status: 'in_progress', clientIdx: 5, staffIdx: 3, createdHoursAgo: 2,    reporter: 'Suresh Nair'  },
  { id: 'TKT-1015', subject: 'Flow variable {{name}} not populating',       category: 'Chatbot',     priority: 'medium',   status: 'resolved',    clientIdx: 6, staffIdx: 4, createdHoursAgo: 60,   reporter: 'Divya Patel'  },
  { id: 'TKT-1016', subject: 'Duplicate messages sent to contacts',         category: 'Messaging',   priority: 'high',     status: 'closed',      clientIdx: 7, staffIdx: 1, createdHoursAgo: 90,   reporter: 'Anil Sharma'  },
  { id: 'TKT-1017', subject: 'Cannot add new team member — seat limit hit', category: 'Account',     priority: 'low',      status: 'resolved',    clientIdx: 0, staffIdx: 2, createdHoursAgo: 100,  reporter: 'Ravi Kumar'   },
  { id: 'TKT-1018', subject: 'Image media messages failing to deliver',     category: 'Messaging',   priority: 'high',     status: 'open',        clientIdx: 1, staffIdx: null, createdHoursAgo: 6,  reporter: 'Neha Singh'  },
  { id: 'TKT-1019', subject: 'Dashboard shows incorrect message count',     category: 'Analytics',   priority: 'low',      status: 'closed',      clientIdx: 2, staffIdx: 3, createdHoursAgo: 120,  reporter: 'Arya Verma'   },
  { id: 'TKT-1020', subject: 'Template approval taking more than 48h',      category: 'Templates',   priority: 'medium',   status: 'open',        clientIdx: 3, staffIdx: null, createdHoursAgo: 20, reporter: 'Rohit Joshi' },
]

function buildTickets() {
  const now = Date.now()
  return RAW_TICKETS.map((t) => {
    const createdAt = new Date(now - t.createdHoursAgo * 3_600_000)
    const slaHours  = SLA_HOURS[t.priority]
    const slaDeadline = new Date(createdAt.getTime() + slaHours * 3_600_000)
    const slaMinLeft  = Math.round((slaDeadline - now) / 60_000)
    const slaBreached = slaMinLeft < 0 && t.status !== 'resolved' && t.status !== 'closed'
    const slaNear     = slaMinLeft >= 0 && slaMinLeft < slaHours * 60 * 0.25 && t.status !== 'resolved' && t.status !== 'closed'
    return {
      ...t,
      client:      CLIENTS[t.clientIdx],
      staff:       t.staffIdx !== null ? STAFF[t.staffIdx] : null,
      createdAt,
      slaDeadline,
      slaMinLeft,
      slaBreached,
      slaNear,
    }
  })
}

const TICKETS = buildTickets()

/* ─── Helpers ─────────────────────────────────────────────── */
const PRIORITY_COLOR = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' }
const STATUS_COLOR   = { open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'gray' }

const STATUS_ICON = {
  open:        <Circle size={13} className="text-red-500" />,
  in_progress: <Clock  size={13} className="text-yellow-500" />,
  resolved:    <CheckCircle2 size={13} className="text-green-500" />,
  closed:      <CheckCircle2 size={13} className="text-gray-400" />,
}

const PRIORITY_ICON = {
  critical: <Flame size={13} className="text-red-500" />,
  high:     <AlertCircle size={13} className="text-orange-500" />,
  medium:   <AlertTriangle size={13} className="text-yellow-500" />,
  low:      <ArrowUpRight size={13} className="text-blue-400" />,
}

function fmtSla(minLeft, breached, status) {
  if (status === 'resolved' || status === 'closed') return null
  if (breached) {
    const over = Math.abs(minLeft)
    return { label: `Breached ${over >= 60 ? Math.floor(over / 60) + 'h' : over + 'm'} ago`, cls: 'text-red-600 bg-red-50' }
  }
  if (minLeft < 60)  return { label: `${minLeft}m left`, cls: 'text-orange-600 bg-orange-50' }
  return { label: `${Math.floor(minLeft / 60)}h left`, cls: 'text-gray-500 bg-gray-50' }
}

function timeAgo(date) {
  const m = Math.round((Date.now() - date) / 60_000)
  if (m < 60)  return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

/* ─── Main ───────────────────────────────────────────────────*/
export default function TicketList() {
  const navigate = useNavigate()
  const [search,     setSearch]     = useState('')
  const [statusF,    setStatusF]    = useState('')
  const [priorityF,  setPriorityF]  = useState('')
  const [staffF,     setStaffF]     = useState('')
  const [slaF,       setSlaF]       = useState('')
  const [page,       setPage]       = useState(1)
  const perPage = 8

  const open       = TICKETS.filter((t) => t.status === 'open').length
  const inProgress = TICKETS.filter((t) => t.status === 'in_progress').length
  const breached   = TICKETS.filter((t) => t.slaBreached).length
  const resolved   = TICKETS.filter((t) => t.status === 'resolved' || t.status === 'closed').length

  const filtered = TICKETS.filter((t) => {
    const q = search.toLowerCase()
    const matchQ   = !q || t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.client.name.toLowerCase().includes(q)
    const matchSt  = !statusF   || t.status === statusF
    const matchPr  = !priorityF || t.priority === priorityF
    const matchSt2 = !staffF    || (staffF === 'unassigned' ? !t.staff : t.staff?.name === staffF)
    const matchSla = !slaF      || (slaF === 'breached' ? t.slaBreached : slaF === 'near' ? t.slaNear : true)
    return matchQ && matchSt && matchPr && matchSt2 && matchSla
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage)

  const reset = () => { setSearch(''); setStatusF(''); setPriorityF(''); setStaffF(''); setSlaF(''); setPage(1) }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Support & Ticketing"
        description="Client support tickets, SLA tracking and staff assignment"
        breadcrumbs={['Admin', 'Support', 'Tickets']}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open',        value: open,       icon: Circle,        color: 'text-red-500',    bg: 'bg-red-50'    },
          { label: 'In Progress', value: inProgress, icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'SLA Breached',value: breached,   icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50'    },
          { label: 'Resolved',    value: resolved,   icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50'  },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.05 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search ticket ID, subject, client…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: statusF,   onChange: (v) => { setStatusF(v);   setPage(1) }, options: [['', 'All Status'], ['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved'], ['closed', 'Closed']] },
              { value: priorityF, onChange: (v) => { setPriorityF(v); setPage(1) }, options: [['', 'All Priority'], ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] },
              { value: slaF,      onChange: (v) => { setSlaF(v);      setPage(1) }, options: [['', 'All SLA'], ['breached', 'Breached'], ['near', 'Near Breach']] },
              { value: staffF,    onChange: (v) => { setStaffF(v);    setPage(1) }, options: [['', 'All Staff'], ['unassigned', 'Unassigned'], ...STAFF.map((s) => [s.name, s.name])] },
            ].map((sel, si) => (
              <div key={si} className="relative">
                <select
                  value={sel.value}
                  onChange={(e) => sel.onChange(e.target.value)}
                  className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-700"
                >
                  {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            ))}
            {(search || statusF || priorityF || staffF || slaF) && (
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 px-2">
                <Filter size={12} /> Clear
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Ticket', 'Client', 'Priority', 'Status', 'Assigned To', 'SLA', 'Created'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((t, i) => {
                const sla = fmtSla(t.slaMinLeft, t.slaBreached, t.status)
                return (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.14, ease: EASE_OUT, delay: i * 0.03 }}
                    onClick={() => navigate(`/admin/support/${t.id}`)}
                    className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                  >
                    {/* Ticket ID + subject */}
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="font-mono text-xs text-gray-400">{t.id}</p>
                      <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{t.subject}</p>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{t.category}</span>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${t.client.color} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-[10px] font-bold">{t.client.avatar}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800 whitespace-nowrap">{t.client.name}</p>
                          <p className="text-[10px] text-gray-400">{t.reporter}</p>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {PRIORITY_ICON[t.priority]}
                        <Badge color={PRIORITY_COLOR[t.priority]} className="capitalize">{t.priority}</Badge>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICON[t.status]}
                        <Badge color={STATUS_COLOR[t.status]} className="capitalize">{t.status.replace('_', ' ')}</Badge>
                      </div>
                    </td>

                    {/* Assigned to */}
                    <td className="px-4 py-3">
                      {t.staff ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${t.staff.color} flex items-center justify-center shrink-0`}>
                            <span className="text-white text-[9px] font-bold">{t.staff.avatar}</span>
                          </div>
                          <span className="text-xs text-gray-700 whitespace-nowrap">{t.staff.name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-400">
                          <User size={12} />
                          <span className="text-xs">Unassigned</span>
                        </div>
                      )}
                    </td>

                    {/* SLA */}
                    <td className="px-4 py-3">
                      {sla ? (
                        <div className="flex items-center gap-1">
                          <Timer size={12} className={t.slaBreached ? 'text-red-500' : t.slaNear ? 'text-orange-500' : 'text-gray-400'} />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sla.cls}`}>{sla.label}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{timeAgo(t.createdAt)}</td>
                  </motion.tr>
                )
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">No tickets match the current filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >Prev</button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
