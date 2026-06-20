import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, Lock, User, Clock, CheckCircle2, Circle,
  AlertCircle, Flame, AlertTriangle, ChevronDown, Timer,
  MessageSquare, StickyNote, Tag, Calendar, RefreshCw,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Static data ─────────────────────────────────────────── */
const STAFF = [
  { id: 1, name: 'Arjun Mehta',  avatar: 'AM', color: 'bg-blue-500'   },
  { id: 2, name: 'Priya Sharma', avatar: 'PS', color: 'bg-pink-500'   },
  { id: 3, name: 'Dev Patel',    avatar: 'DP', color: 'bg-violet-500' },
  { id: 4, name: 'Sneha Rao',    avatar: 'SR', color: 'bg-teal-500'   },
  { id: 5, name: 'Vikram Singh', avatar: 'VS', color: 'bg-amber-500'  },
]

const SLA_HOURS   = { critical: 2, high: 8, medium: 24, low: 72 }

const TICKET_DB = {
  'TKT-1001': {
    id: 'TKT-1001', subject: 'WhatsApp connection keeps dropping',
    category: 'Integration', priority: 'critical', status: 'open',
    client: { name: 'Flipkart Commerce', avatar: 'FC', color: 'bg-purple-500' },
    reporter: 'Ravi Kumar', reporterEmail: 'ravi@flipkart.com',
    staffId: 1, createdHoursAgo: 1.2,
    thread: [
      { id: 1, from: 'Ravi Kumar', role: 'client', msg: 'Our WhatsApp connection keeps dropping after exactly 30 minutes. The dashboard shows "Disconnected" and we have to manually reconnect.', time: '14:10', internal: false },
      { id: 2, from: 'Arjun Mehta', role: 'agent', msg: 'Hi Ravi, thanks for reaching out. Can you share your Phone Number ID from Meta Business dashboard? Also, which region are you on?', time: '14:25', internal: false },
      { id: 3, from: 'Ravi Kumar', role: 'client', msg: 'Phone Number ID: 1234567890123456. We are on Asia-South region.', time: '14:30', internal: false },
      { id: 4, from: 'Arjun Mehta', role: 'agent', msg: 'Checking with Meta Cloud API team — there is a known session expiry issue on their Asia region nodes. ETA for fix: 2h.', time: '14:45', internal: true },
    ],
    notes: [
      { id: 1, author: 'Arjun Mehta', text: 'Meta support ticket raised: META-88271. This is a known infra issue on AS region. Client downtime ~45min already.', time: '14:50' },
    ],
  },
  'TKT-1007': {
    id: 'TKT-1007', subject: 'Phone number verification failed — OTP error',
    category: 'Integration', priority: 'critical', status: 'in_progress',
    client: { name: 'RapidDeliver', avatar: 'RD', color: 'bg-cyan-500' },
    reporter: 'Divya Patel', reporterEmail: 'divya@rapiddeliver.com',
    staffId: 5, createdHoursAgo: 0.5,
    thread: [
      { id: 1, from: 'Divya Patel', role: 'client', msg: 'We tried to add a new phone number but OTP verification keeps failing. We have retried 5 times now.', time: '10:20', internal: false },
      { id: 2, from: 'Vikram Singh', role: 'agent', msg: 'Hi Divya! Are you using a mobile number or landline? Meta only sends OTP to mobile numbers. Please confirm.', time: '10:28', internal: false },
    ],
    notes: [],
  },
}

const FALLBACK_TICKET = {
  id: 'TKT-???', subject: 'Ticket not found in demo data',
  category: 'General', priority: 'medium', status: 'open',
  client: { name: 'Unknown Client', avatar: '??', color: 'bg-gray-400' },
  reporter: 'Unknown', reporterEmail: 'unknown@example.com',
  staffId: null, createdHoursAgo: 12,
  thread: [{ id: 1, from: 'Client', role: 'client', msg: 'Demo ticket — add more entries to TICKET_DB for full detail view.', time: '12:00', internal: false }],
  notes: [],
}

/* ─── Helpers ─────────────────────────────────────────────── */
const PRIORITY_ICON = {
  critical: <Flame size={14} className="text-red-500" />,
  high:     <AlertCircle size={14} className="text-orange-500" />,
  medium:   <AlertTriangle size={14} className="text-yellow-500" />,
  low:      <AlertTriangle size={14} className="text-blue-400" />,
}
const PRIORITY_COLOR = { critical: 'red', high: 'orange', medium: 'yellow', low: 'blue' }
const STATUS_COLOR   = { open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'gray' }
const STATUS_LABEL   = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }

const STATUS_TRANSITIONS = {
  open:        ['in_progress'],
  in_progress: ['resolved'],
  resolved:    ['closed', 'open'],
  closed:      [],
}

function SlaBar({ createdHoursAgo, priority, status }) {
  const slaHours    = SLA_HOURS[priority]
  const now         = Date.now()
  const createdAt   = now - createdHoursAgo * 3_600_000
  const deadline    = createdAt + slaHours * 3_600_000
  const elapsed     = Math.min(now - createdAt, slaHours * 3_600_000)
  const pct         = Math.min(100, (elapsed / (slaHours * 3_600_000)) * 100)
  const minLeft     = Math.round((deadline - now) / 60_000)
  const breached    = minLeft < 0
  const resolved    = status === 'resolved' || status === 'closed'

  const barColor = resolved ? 'bg-green-400' : breached ? 'bg-red-500' : pct > 75 ? 'bg-orange-400' : 'bg-green-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Timer size={13} className={breached && !resolved ? 'text-red-500' : 'text-gray-400'} />
          <span className="text-xs font-semibold text-gray-700">SLA Deadline</span>
          <span className="text-xs text-gray-400">({slaHours}h for {priority})</span>
        </div>
        {resolved ? (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Resolved in time</span>
        ) : breached ? (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            Breached {Math.abs(minLeft) >= 60 ? `${Math.floor(Math.abs(minLeft) / 60)}h` : `${Math.abs(minLeft)}m`} ago
          </span>
        ) : (
          <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
            {minLeft >= 60 ? `${Math.floor(minLeft / 60)}h ${minLeft % 60}m left` : `${minLeft}m left`}
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        Deadline: {new Date(deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function TicketDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const base      = TICKET_DB[id] || { ...FALLBACK_TICKET, id }

  const [ticket,  setTicket]  = useState(base)
  const [tab,     setTab]     = useState('thread')
  const [reply,   setReply]   = useState('')
  const [isInternal, setInternal] = useState(false)
  const [noteText, setNoteText]   = useState('')
  const [statusSaving, setStatusSaving] = useState(false)

  const assignedStaff = STAFF.find((s) => s.id === ticket.staffId) || null

  /* helpers */
  function sendReply() {
    if (!reply.trim()) return
    const msg = {
      id: ticket.thread.length + 1,
      from:  isInternal ? (assignedStaff?.name || 'Admin') : (assignedStaff?.name || 'Support'),
      role:  'agent',
      msg:   reply,
      time:  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      internal: isInternal,
    }
    setTicket((prev) => ({ ...prev, thread: [...prev.thread, msg] }))
    setReply('')
  }

  function addNote() {
    if (!noteText.trim()) return
    const note = {
      id:     ticket.notes.length + 1,
      author: assignedStaff?.name || 'Admin',
      text:   noteText,
      time:   new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    setTicket((prev) => ({ ...prev, notes: [...prev.notes, note] }))
    setNoteText('')
  }

  function changeStatus(newStatus) {
    setStatusSaving(true)
    setTimeout(() => {
      setTicket((prev) => ({ ...prev, status: newStatus }))
      setStatusSaving(false)
    }, 500)
  }

  function assignStaff(staffId) {
    setTicket((prev) => ({ ...prev, staffId: staffId === '' ? null : Number(staffId) }))
  }

  const transitions = STATUS_TRANSITIONS[ticket.status] || []

  return (
    <div className="space-y-5">
      {/* Header */}
      <button onClick={() => navigate('/admin/support')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={14} /> Back to tickets
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
        <PageHeader
          title={ticket.subject}
          description={`${ticket.id} · ${ticket.category}`}
          breadcrumbs={['Admin', 'Support', ticket.id]}
        />
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {PRIORITY_ICON[ticket.priority]}
            <Badge color={PRIORITY_COLOR[ticket.priority]} className="capitalize">{ticket.priority}</Badge>
          </div>
          <Badge color={STATUS_COLOR[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
          {transitions.map((next) => (
            <button
              key={next}
              onClick={() => changeStatus(next)}
              disabled={statusSaving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all disabled:opacity-50"
            >
              {statusSaving ? <RefreshCw size={11} className="animate-spin" /> : null}
              → {STATUS_LABEL[next]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left sidebar ───────────────────────────── */}
        <div className="space-y-4">

          {/* Client info */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Client</p>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${ticket.client.color} flex items-center justify-center shrink-0`}>
                <span className="text-white text-xs font-bold">{ticket.client.avatar}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{ticket.client.name}</p>
                <p className="text-xs text-gray-400">{ticket.reporter}</p>
                <p className="text-xs text-gray-400">{base.reporterEmail}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2"><Tag size={11} className="text-gray-400" />{ticket.category}</div>
              <div className="flex items-center gap-2"><Calendar size={11} className="text-gray-400" />
                Opened {new Date(Date.now() - ticket.createdHoursAgo * 3_600_000).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </motion.div>

          {/* SLA tracker */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT, delay: 0.05 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">SLA Tracking</p>
            <SlaBar createdHoursAgo={ticket.createdHoursAgo} priority={ticket.priority} status={ticket.status} />
          </motion.div>

          {/* Assign support staff */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT, delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Assigned Staff</p>
            {assignedStaff ? (
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-full ${assignedStaff.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{assignedStaff.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{assignedStaff.name}</p>
                  <p className="text-xs text-gray-400">Support Agent</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400 mb-3">
                <User size={14} />
                <span className="text-sm">Unassigned</span>
              </div>
            )}
            <div className="relative">
              <select
                value={ticket.staffId || ''}
                onChange={(e) => assignStaff(e.target.value)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Unassign</option>
                {STAFF.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </motion.div>

          {/* Status quick-actions */}
          {transitions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: EASE_OUT, delay: 0.15 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Status Actions</p>
              <div className="space-y-2">
                {transitions.map((next) => (
                  <button
                    key={next}
                    onClick={() => changeStatus(next)}
                    disabled={statusSaving}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all disabled:opacity-50"
                  >
                    {statusSaving && <RefreshCw size={13} className="animate-spin" />}
                    Mark as {STATUS_LABEL[next]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Right: thread + notes ───────────────────── */}
        <div className="lg:col-span-2 flex flex-col space-y-4">

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { key: 'thread', label: 'Conversation', icon: MessageSquare },
              { key: 'notes',  label: `Internal Notes${ticket.notes.length ? ` (${ticket.notes.length})` : ''}`, icon: StickyNote },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Conversation thread ── */}
            {tab === 'thread' && (
              <motion.div
                key="thread"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col"
              >
                <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[420px]">
                  {ticket.thread.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.04 }}
                      className={`flex ${m.role === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        m.internal
                          ? 'bg-amber-50 border border-amber-200 text-amber-900'
                          : m.role === 'agent'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-xs font-semibold ${m.internal ? 'text-amber-700' : m.role === 'agent' ? 'text-green-200' : 'text-gray-500'}`}>{m.from}</p>
                          {m.internal && <span className="flex items-center gap-0.5 text-[10px] text-amber-600"><Lock size={9} /> Internal</span>}
                        </div>
                        <p className="leading-relaxed">{m.msg}</p>
                        <p className={`text-xs mt-1.5 ${m.internal ? 'text-amber-500' : m.role === 'agent' ? 'text-green-200' : 'text-gray-400'}`}>{m.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Reply box */}
                <div className="border-t border-gray-100 p-4">
                  {/* Toggle: public / internal */}
                  <div className="flex gap-1 mb-2 bg-gray-100 rounded-lg p-0.5 w-fit">
                    {[
                      { val: false, label: 'Public Reply',   icon: MessageSquare },
                      { val: true,  label: 'Internal Note',  icon: Lock },
                    ].map(({ val, label, icon: Icon }) => (
                      <button
                        key={String(val)}
                        onClick={() => setInternal(val)}
                        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${isInternal === val ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                      >
                        <Icon size={11} /> {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendReply())}
                      placeholder={isInternal ? 'Write an internal note (not visible to client)…' : 'Write a reply to the client…'}
                      className={`flex-1 text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 ${isInternal ? 'border-amber-200 bg-amber-50 focus:ring-amber-300 placeholder:text-amber-400' : 'border-gray-200 focus:ring-green-400'}`}
                    />
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim()}
                      className="self-end px-4 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Send size={13} /> Send
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Internal Notes ── */}
            {tab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-amber-50/40">
                  <Lock size={13} className="text-amber-600" />
                  <p className="text-xs font-semibold text-amber-700">Internal notes are only visible to support staff — not to clients</p>
                </div>

                <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[340px]">
                  {ticket.notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <StickyNote size={28} className="mb-2 opacity-40" />
                      <p className="text-sm">No internal notes yet</p>
                    </div>
                  ) : (
                    ticket.notes.map((n, i) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.05 }}
                        className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Lock size={11} className="text-amber-600" />
                            <span className="text-xs font-semibold text-amber-800">{n.author}</span>
                          </div>
                          <span className="text-[10px] text-amber-500">{n.time}</span>
                        </div>
                        <p className="text-sm text-amber-900 leading-relaxed">{n.text}</p>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Add note */}
                <div className="border-t border-amber-100 p-4">
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add an internal note for your team…"
                      className="flex-1 text-sm border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-amber-400"
                    />
                    <button
                      onClick={addNote}
                      disabled={!noteText.trim()}
                      className="self-end px-4 py-2 text-sm font-semibold rounded-lg bg-amber-100 border-2 border-amber-400 text-amber-800 hover:bg-amber-50 transition-all disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <StickyNote size={13} /> Save
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
