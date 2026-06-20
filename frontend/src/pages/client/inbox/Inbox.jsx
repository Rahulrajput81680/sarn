import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CheckCheck, Check, Send, StickyNote,
  Lock, Paperclip, Zap, ChevronRight, User,
  Tag, UserPlus, CheckCircle2, RefreshCw, X,
  Image, FileText, MoreVertical, Phone, Circle,
  Smile, AtSign, ChevronDown, Clock, AlertTriangle,
  LayoutTemplate,
} from 'lucide-react'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Constants ─────────────────────────────────────────── */

const TEAM = [
  { id: 't1', name: 'Rahul Sharma',  initials: 'RS', color: 'bg-blue-500' },
  { id: 't2', name: 'Sneha Kapoor',  initials: 'SK', color: 'bg-purple-500' },
  { id: 't3', name: 'Dev Kumar',     initials: 'DK', color: 'bg-amber-500' },
  { id: 't4', name: 'Priti Nair',    initials: 'PN', color: 'bg-pink-500' },
]

const LABELS = [
  { key: 'support',   label: 'Support',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'sales',     label: 'Sales',     color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'vip',       label: 'VIP',       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'technical', label: 'Technical', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { key: 'follow-up', label: 'Follow-up', color: 'bg-orange-50 text-orange-700 border-orange-200' },
]

const CANNED = [
  { id: 'c1', shortcut: '/hi',      text: 'Hi! Thank you for reaching out. How can I help you today?' },
  { id: 'c2', shortcut: '/looking', text: "I'll look into this right away and get back to you shortly." },
  { id: 'c3', shortcut: '/resolved',text: "Your issue has been resolved. Please let us know if you need anything else!" },
  { id: 'c4', shortcut: '/orderid', text: 'Could you please share your order ID so I can assist you better?' },
  { id: 'c5', shortcut: '/wait',    text: 'Thank you for your patience! We are working on this.' },
  { id: 'c6', shortcut: '/callback',text: 'Would you like us to arrange a callback? Please share your preferred time.' },
]

const ATTACHMENTS = [
  { id: 'a1', name: 'invoice_june.pdf', type: 'pdf',   size: '84 KB',  time: '10:32 AM' },
  { id: 'a2', name: 'screenshot.png',   type: 'image', size: '240 KB', time: 'Yesterday' },
  { id: 'a3', name: 'warranty.pdf',     type: 'pdf',   size: '120 KB', time: '2 days ago' },
]

/* ─── Demo data ─────────────────────────────────────────── */

const CONVERSATIONS = [
  { id: 1, name: 'Priya Sharma',  phone: '+91 98765 43210', status: 'open',     unread: 3,  assignee: 't1', labels: ['vip', 'sales'],      lastMsg: 'Is my order still on the way?',   time: '2m',  avatar: 'PS', color: 'bg-green-500',  window: { open: true,  expiresIn: '23h 52m' } },
  { id: 2, name: 'Raj Patel',     phone: '+91 87654 32109', status: 'open',     unread: 0,  assignee: null, labels: ['support'],            lastMsg: 'Thanks for the quick response!',  time: '18m', avatar: 'RP', color: 'bg-blue-500',   window: { open: true,  expiresIn: '23h 42m' } },
  { id: 3, name: 'Amit Kumar',    phone: '+91 76543 21098', status: 'open',     unread: 1,  assignee: null, labels: ['technical'],          lastMsg: 'I need help with my account',     time: '1h',  avatar: 'AK', color: 'bg-purple-500', window: { open: true,  expiresIn: '23h' } },
  { id: 4, name: 'Neha Singh',    phone: '+91 65432 10987', status: 'resolved', unread: 0,  assignee: 't2', labels: ['support'],            lastMsg: 'When will my refund arrive?',     time: '3h',  avatar: 'NS', color: 'bg-pink-500',   window: { open: false, expiresIn: null } },
  { id: 5, name: 'Vikram Mehta',  phone: '+91 54321 09876', status: 'open',     unread: 0,  assignee: 't3', labels: ['sales', 'follow-up'], lastMsg: 'Interested in bulk pricing',      time: '1d',  avatar: 'VM', color: 'bg-amber-500',  window: { open: false, expiresIn: null } },
  { id: 6, name: 'Sneha Rao',     phone: '+91 43210 98765', status: 'resolved', unread: 0,  assignee: 't1', labels: ['vip'],                lastMsg: 'Perfect, thank you so much!',    time: '2d',  avatar: 'SR', color: 'bg-red-500',    window: { open: false, expiresIn: null } },
]

const MSG_MAP = {
  1: [
    { id: 1, type: 'customer', text: 'Hi, I placed an order 3 days ago but haven\'t received any update.', time: '10:02 AM', status: 'read' },
    { id: 2, type: 'agent',    text: 'Hello Priya! Let me check on that right away.', time: '10:03 AM', status: 'read', agent: 't1' },
    { id: 3, type: 'note',     text: 'Check with logistics — order #ORD-4821 may have been delayed at the courier hub.', time: '10:04 AM', agent: 't1' },
    { id: 4, type: 'customer', text: 'It shows out for delivery since yesterday but nothing arrived.', time: '10:08 AM', status: 'read' },
    { id: 5, type: 'agent',    text: 'I can see the order is with our courier partner. I\'ve escalated this for same-day delivery. You\'ll receive a confirmation SMS shortly.', time: '10:11 AM', status: 'delivered', agent: 't1' },
    { id: 6, type: 'customer', text: 'Is my order still on the way?', time: '10:24 AM', status: 'delivered' },
  ],
  2: [
    { id: 1, type: 'customer', text: 'I need help resetting my password.', time: '9:10 AM', status: 'read' },
    { id: 2, type: 'agent',    text: 'Sure! I\'ve sent a reset link to your registered email.', time: '9:12 AM', status: 'read', agent: 't2' },
    { id: 3, type: 'customer', text: 'Got it, thank you!', time: '9:18 AM', status: 'read' },
    { id: 4, type: 'customer', text: 'Thanks for the quick response!', time: '9:20 AM', status: 'read' },
  ],
  3: [
    { id: 1, type: 'customer', text: 'I need help with my account — I can\'t login.', time: '8:45 AM', status: 'read' },
    { id: 2, type: 'note',     text: 'Unassigned — pick this up ASAP. Account may be locked.', time: '8:46 AM', agent: 't3' },
  ],
  4: [
    { id: 1, type: 'customer', text: 'I returned the product last week, when will my refund arrive?', time: 'Yesterday', status: 'read' },
    { id: 2, type: 'agent',    text: 'Hi Neha! Refunds typically take 5-7 business days. Yours was initiated on June 6th.', time: 'Yesterday', status: 'read', agent: 't2' },
    { id: 3, type: 'customer', text: 'When will my refund arrive?', time: 'Yesterday', status: 'read' },
    { id: 4, type: 'agent',    text: 'It should reflect by June 13th. I\'ve flagged your case for priority processing!', time: 'Yesterday', status: 'read', agent: 't2' },
  ],
  5: [
    { id: 1, type: 'customer', text: 'Hi, I\'m interested in bulk pricing for 500+ units.', time: '2 days ago', status: 'read' },
    { id: 2, type: 'agent',    text: 'That\'s great! I\'ve passed your inquiry to our sales team. They\'ll reach out within 24 hours.', time: '2 days ago', status: 'read', agent: 't3' },
    { id: 3, type: 'customer', text: 'Interested in bulk pricing', time: '1 day ago', status: 'read' },
  ],
  6: [
    { id: 1, type: 'customer', text: 'My discount code isn\'t working at checkout.', time: '3 days ago', status: 'read' },
    { id: 2, type: 'agent',    text: 'Let me check that code for you!', time: '3 days ago', status: 'read', agent: 't1' },
    { id: 3, type: 'agent',    text: 'The code SAVE20 is now active on your account. Try again!', time: '3 days ago', status: 'read', agent: 't1' },
    { id: 4, type: 'customer', text: 'Perfect, thank you so much!', time: '3 days ago', status: 'read' },
  ],
}

/* ─── Helpers ────────────────────────────────────────────── */

function Avatar({ initials, color = 'bg-green-500', size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-9 h-9 text-xs'
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  )
}

function LabelChip({ labelKey }) {
  const l = LABELS.find((l) => l.key === labelKey)
  if (!l) return null
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${l.color}`}>{l.label}</span>
}

/* ─── Conversation list item ─────────────────────────────── */

function ConvItem({ c, active, onClick }) {
  const assignee = TEAM.find((t) => t.id === c.assignee)
  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-gray-100 transition-colors duration-100 ${
        active ? 'bg-green-50 border-l-2 border-l-green-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
      }`}
      style={{ transition: 'background-color 120ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar initials={c.avatar} color={c.color} />
          {c.status === 'resolved' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <Check size={7} className="text-white" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`text-sm truncate ${c.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>{c.name}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-gray-400">{c.time}</span>
              {c.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                  {c.unread}
                </span>
              )}
            </div>
          </div>
          <p className={`text-xs truncate mb-1.5 ${c.unread ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{c.lastMsg}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {c.labels.slice(0, 2).map((l) => <LabelChip key={l} labelKey={l} />)}
            {c.window && !c.window.open && c.status !== 'resolved' && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                <Clock size={8} /> Template only
              </span>
            )}
            {c.window?.open && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                <Clock size={8} /> {c.window.expiresIn}
              </span>
            )}
            {assignee && (
              <span className={`ml-auto w-5 h-5 ${assignee.color} rounded-full text-white text-xs font-bold flex items-center justify-center`}>
                {assignee.initials[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

/* ─── Message bubble ─────────────────────────────────────── */

function MsgBubble({ msg }) {
  const agentMember = TEAM.find((t) => t.id === msg.agent)

  if (msg.type === 'note') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="flex justify-center"
      >
        <div className="max-w-[80%] bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Lock size={10} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-600">Internal Note</span>
            {agentMember && <span className="text-xs text-amber-400">· {agentMember.name}</span>}
          </div>
          <p className="text-sm text-amber-800">{msg.text}</p>
          <p className="text-xs text-amber-400 mt-1">{msg.time}</p>
        </div>
      </motion.div>
    )
  }

  const isAgent = msg.type === 'agent'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={`flex gap-2 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isAgent && <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 self-end"><User size={13} className="text-gray-500" /></div>}
      <div className={`max-w-[68%] group`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAgent
            ? 'bg-green-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm'
        }`}>
          {msg.text}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isAgent ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-400">{msg.time}</span>
          {isAgent && (
            msg.status === 'read'
              ? <CheckCheck size={12} className="text-blue-400" />
              : <CheckCheck size={12} className="text-gray-400" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Quick replies picker ───────────────────────────────── */

function QuickReplies({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const filtered = CANNED.filter((c) =>
    c.shortcut.includes(query.toLowerCase()) || c.text.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20"
    >
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search canned responses…"
            className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div className="max-h-44 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => { onSelect(c.text); onClose() }}
            className="w-full text-left px-3 py-2.5 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0"
          >
            <span className="text-xs font-mono font-semibold text-green-600 mr-2">{c.shortcut}</span>
            <span className="text-xs text-gray-600 line-clamp-1">{c.text}</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="px-3 py-3 text-xs text-gray-400 text-center">No matches</p>}
      </div>
    </motion.div>
  )
}

/* ─── Assign dropdown ────────────────────────────────────── */

function AssignDropdown({ current, onAssign, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[176px] z-30"
    >
      <button
        onClick={() => { onAssign(null); onClose() }}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${!current ? 'text-green-600 font-medium' : 'text-gray-700'}`}
      >
        <Circle size={13} className="text-gray-300" /> Unassigned
      </button>
      {TEAM.map((m) => (
        <button
          key={m.id}
          onClick={() => { onAssign(m.id); onClose() }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${current === m.id ? 'text-green-600 font-medium' : 'text-gray-700'}`}
        >
          <span className={`w-5 h-5 ${m.color} rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0`}>
            {m.initials[0]}
          </span>
          {m.name}
          {current === m.id && <Check size={12} className="ml-auto text-green-600" />}
        </button>
      ))}
    </motion.div>
  )
}

/* ─── Label picker ───────────────────────────────────────── */

function LabelPicker({ active, onToggle, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] z-30"
    >
      {LABELS.map((l) => (
        <button
          key={l.key}
          onClick={() => onToggle(l.key)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className={`text-xs px-2 py-0.5 rounded-full border ${l.color}`}>{l.label}</span>
          {active.includes(l.key) && <Check size={12} className="ml-auto text-green-600" />}
        </button>
      ))}
    </motion.div>
  )
}

/* ─── Profile panel ─────────────────────────────────────── */

function ProfilePanel({ conv, assignee, onAssign, onToggleLabel }) {
  const [tab, setTab] = useState('info')
  const [showAssign, setShowAssign] = useState(false)
  const [showLabels, setShowLabels] = useState(false)

  return (
    <div className="w-64 border-l border-gray-100 bg-white flex flex-col shrink-0 overflow-hidden">
      {/* Contact info */}
      <div className="p-4 border-b border-gray-100 text-center">
        <div className={`w-12 h-12 ${conv.color} rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-2`}>
          {conv.avatar}
        </div>
        <p className="text-sm font-semibold text-gray-900">{conv.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{conv.phone}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 text-xs font-medium">
        {['info', 'attachments'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 capitalize transition-colors ${tab === t ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t === 'info' ? 'Profile' : 'Files'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'info' && (
          <>
            {/* Assign */}
            <div className="relative">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Assigned To</p>
              <button
                onClick={() => setShowAssign((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors text-sm"
              >
                {assignee
                  ? <>
                      <span className={`w-5 h-5 ${assignee.color} rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0`}>{assignee.initials[0]}</span>
                      <span className="flex-1 text-left text-gray-800 text-xs">{assignee.name}</span>
                    </>
                  : <>
                      <UserPlus size={13} className="text-gray-400" />
                      <span className="flex-1 text-left text-gray-400 text-xs">Unassigned</span>
                    </>
                }
                <ChevronDown size={12} className="text-gray-300" />
              </button>
              <AnimatePresence>
                {showAssign && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowAssign(false)} />
                    <AssignDropdown current={conv.assignee} onAssign={onAssign} onClose={() => setShowAssign(false)} />
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Labels */}
            <div className="relative">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Labels</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {conv.labels.map((l) => <LabelChip key={l} labelKey={l} />)}
                {conv.labels.length === 0 && <span className="text-xs text-gray-300">No labels</span>}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowLabels((o) => !o)}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  <Tag size={11} /> Manage labels
                </button>
                <AnimatePresence>
                  {showLabels && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowLabels(false)} />
                      <LabelPicker active={conv.labels} onToggle={onToggleLabel} onClose={() => setShowLabels(false)} />
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Details */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Details</p>
              <div className="space-y-2">
                {[
                  { label: 'Status', value: conv.status === 'resolved' ? 'Resolved' : 'Open' },
                  { label: 'Channel', value: 'WhatsApp' },
                  { label: 'First contact', value: '2 days ago' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'attachments' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Shared Files</p>
            {ATTACHMENTS.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
                className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'image' ? 'bg-blue-100' : 'bg-red-100'}`}>
                  {a.type === 'image' ? <Image size={14} className="text-blue-500" /> : <FileText size={14} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.size} · {a.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Inbox ─────────────────────────────────────────── */

export default function Inbox() {
  const [convs,       setConvs]       = useState(CONVERSATIONS)
  const [messages,    setMessages]    = useState(MSG_MAP)
  const [activeId,    setActiveId]    = useState(1)
  const [search,      setSearch]      = useState('')
  const [filterTab,   setFilterTab]   = useState('all')
  const [replyText,   setReplyText]   = useState('')
  const [replyMode,   setReplyMode]   = useState('reply')   // 'reply' | 'note'
  const [showCanned,  setShowCanned]  = useState(false)
  const [showProfile, setShowProfile] = useState(true)
  const [showAssignHeader, setShowAssignHeader] = useState(false)
  const [showLabelHeader,  setShowLabelHeader]  = useState(false)
  const msgEndRef = useRef(null)

  const conv = convs.find((c) => c.id === activeId)
  const msgs = messages[activeId] || []
  const assignee = TEAM.find((t) => t.id === conv?.assignee)

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const filteredConvs = convs.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTab === 'unread')   return c.unread > 0
    if (filterTab === 'assigned') return !!c.assignee
    if (filterTab === 'resolved') return c.status === 'resolved'
    return true
  })

  const handleSend = () => {
    if (!replyText.trim()) return
    const newMsg = {
      id: Date.now(),
      type: replyMode === 'note' ? 'note' : 'agent',
      text: replyText.trim(),
      time: 'Just now',
      status: 'delivered',
      agent: 't1',
    }
    setMessages((m) => ({ ...m, [activeId]: [...(m[activeId] || []), newMsg] }))
    setConvs((cs) => cs.map((c) => c.id === activeId ? { ...c, lastMsg: replyText.trim(), unread: 0 } : c))
    setReplyText('')
  }

  const handleResolve = () => {
    setConvs((cs) => cs.map((c) =>
      c.id === activeId ? { ...c, status: c.status === 'resolved' ? 'open' : 'resolved' } : c
    ))
  }

  const handleAssign = (memberId) => {
    setConvs((cs) => cs.map((c) => c.id === activeId ? { ...c, assignee: memberId } : c))
  }

  const handleToggleLabel = (labelKey) => {
    setConvs((cs) => cs.map((c) => {
      if (c.id !== activeId) return c
      const labels = c.labels.includes(labelKey)
        ? c.labels.filter((l) => l !== labelKey)
        : [...c.labels, labelKey]
      return { ...c, labels }
    }))
  }

  const FILTER_TABS = ['all', 'unread', 'assigned', 'resolved']

  return (
    <div
      className="flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      style={{ height: 'calc(100vh - 7.5rem)' }}
    >
      {/* ── Left: conversation list ── */}
      <div className="w-72 flex flex-col border-r border-gray-100 shrink-0">
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-gray-100 text-xs font-medium">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`flex-1 py-2 capitalize transition-colors ${filterTab === tab ? 'text-green-600 border-b-2 border-green-500 bg-green-50/40' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <p className="text-xs">No conversations</p>
            </div>
          )}
          {filteredConvs.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, ease: EASE_OUT, delay: i * 0.03 }}
            >
              <ConvItem
                c={c}
                active={c.id === activeId}
                onClick={() => {
                  setActiveId(c.id)
                  setConvs((cs) => cs.map((x) => x.id === c.id ? { ...x, unread: 0 } : x))
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Center: chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {conv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
              <Avatar initials={conv.avatar} color={conv.color} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{conv.name}</p>
                  {conv.status === 'resolved' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Resolved</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {conv.labels.map((l) => <LabelChip key={l} labelKey={l} />)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Assign */}
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowAssignHeader((o) => !o); setShowLabelHeader(false) }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 bg-white transition-colors"
                    style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
                  >
                    <UserPlus size={12} />
                    {assignee ? assignee.name.split(' ')[0] : 'Assign'}
                  </motion.button>
                  <AnimatePresence>
                    {showAssignHeader && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowAssignHeader(false)} />
                        <AssignDropdown current={conv.assignee} onAssign={handleAssign} onClose={() => setShowAssignHeader(false)} />
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Labels */}
                <div className="relative">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowLabelHeader((o) => !o); setShowAssignHeader(false) }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 bg-white transition-colors"
                    style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
                  >
                    <Tag size={12} /> Label
                  </motion.button>
                  <AnimatePresence>
                    {showLabelHeader && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowLabelHeader(false)} />
                        <LabelPicker active={conv.labels} onToggle={handleToggleLabel} onClose={() => setShowLabelHeader(false)} />
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Resolve / Reopen */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResolve}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    conv.status === 'resolved'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
                >
                  {conv.status === 'resolved'
                    ? <><RefreshCw size={12} /> Reopen</>
                    : <><CheckCircle2 size={12} /> Resolve</>
                  }
                </motion.button>

                {/* Profile toggle */}
                <button
                  onClick={() => setShowProfile((s) => !s)}
                  className={`p-2 rounded-lg border transition-colors ${showProfile ? 'bg-green-50 border-green-200 text-green-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                >
                  <User size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
              {msgs.map((msg) => <MsgBubble key={msg.id} msg={msg} />)}
              <div ref={msgEndRef} />
            </div>

            {/* Reply box */}
            <div className="border-t border-gray-100 bg-white px-4 pt-2 pb-3 shrink-0">
              {/* 24-hour window banner */}
              {conv.window && !conv.window.open && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 flex-1">
                    <strong>24h window expired.</strong> Customer must message first, or use an approved template.
                  </p>
                  <button className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors shrink-0">
                    <LayoutTemplate size={10} /> Use Template
                  </button>
                </div>
              )}
              {conv.window?.open && (
                <div className="flex items-center gap-1.5 mb-1.5 text-xs text-green-600">
                  <Clock size={10} /> <span>24h window open · closes in <strong>{conv.window.expiresIn}</strong></span>
                </div>
              )}

              {/* Mode tabs */}
              <div className="flex items-center gap-1 mb-2">
                {[
                  { key: 'reply', label: 'Reply',         icon: Send },
                  { key: 'note',  label: 'Internal Note', icon: Lock },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setReplyMode(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      replyMode === key
                        ? key === 'note' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="relative">
                <AnimatePresence>
                  {showCanned && (
                    <QuickReplies
                      onSelect={(text) => setReplyText(text)}
                      onClose={() => setShowCanned(false)}
                    />
                  )}
                </AnimatePresence>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={replyMode === 'note' ? 'Add an internal note (only visible to team)…' : 'Type a message… (Enter to send)'}
                  className={`w-full px-3 py-2.5 text-sm rounded-xl resize-none focus:outline-none focus:ring-2 transition-shadow border ${
                    replyMode === 'note'
                      ? 'bg-amber-50 border-amber-200 text-amber-900 placeholder:text-amber-400 focus:ring-amber-300'
                      : 'bg-white border-gray-200 focus:ring-green-500'
                  }`}
                />
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowCanned((s) => !s)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showCanned ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    <Zap size={11} /> Quick replies
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <Paperclip size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <Smile size={14} />
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!replyText.trim()}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                    replyMode === 'note'
                      ? 'bg-amber-500 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                  style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
                >
                  {replyMode === 'note' ? <Lock size={12} /> : <Send size={12} />}
                  {replyMode === 'note' ? 'Add Note' : 'Send'}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300 flex-col gap-2">
            <Phone size={32} />
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </div>

      {/* ── Right: profile panel ── */}
      <AnimatePresence>
        {showProfile && conv && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <ProfilePanel
              conv={conv}
              assignee={assignee}
              onAssign={handleAssign}
              onToggleLabel={handleToggleLabel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
