import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CheckCheck, Check, Send, StickyNote,
  Lock, Paperclip, Zap, ChevronRight, User,
  Tag, CheckCircle2, RefreshCw, X,
  FileText, MoreVertical, Phone,
  Smile, AtSign, Clock, AlertTriangle,
  LayoutTemplate, ArrowLeft, Plus, MessageSquarePlus,
  ChevronLeft, Image, Video, Music, Download, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import axiosInstance from '../../../api/axios'
import socket, { connectSocket, disconnectSocket } from '../../../api/socket'
import useAuthStore from '../../../store/authStore'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Constants ─────────────────────────────────────────── */

const TEAM_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-red-500', 'bg-green-500', 'bg-cyan-500']

const normalizeTeamMember = (u, i) => {
  const words    = (u.name || u.email || 'U').split(' ')
  const initials = words.map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return {
    id:       u._id,
    name:     u.name || u.email,
    initials,
    color:    TEAM_COLORS[i % TEAM_COLORS.length],
  }
}

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
                <Clock size={8} /> {fmtCountdown(c.window.expiresAt)} left
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

/* ─── Media preview inside bubble ───────────────────────────*/

function MediaContent({ msg }) {
  const [mediaUrl, setMediaUrl] = useState(msg.mediaUrl)
  const [loading,  setLoading]  = useState(false)

  // If mediaUrl looks like a Meta media ID (no slashes/dots), fetch the real URL
  useEffect(() => {
    if (!msg.mediaUrl || msg.mediaUrl.includes('/') || msg.mediaUrl.includes('.')) return
    setLoading(true)
    axiosInstance.get(`/api/v1/conversations/media/${msg.mediaUrl}`)
      .then(({ data }) => setMediaUrl(data.data?.url || msg.mediaUrl))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [msg.mediaUrl])

  if (loading) return <div className="w-48 h-32 bg-black/10 rounded-lg animate-pulse" />

  if (msg.mediaType === 'image') {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
        <img src={mediaUrl} alt="media" className="max-w-[220px] rounded-xl mb-1 cursor-pointer hover:opacity-90 transition-opacity" />
      </a>
    )
  }
  if (msg.mediaType === 'video') {
    return <video src={mediaUrl} controls className="max-w-[220px] rounded-xl mb-1" />
  }
  if (msg.mediaType === 'audio') {
    return <audio src={mediaUrl} controls className="max-w-[220px] mb-1" />
  }
  if (msg.mediaType === 'document') {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 mb-1 bg-black/10 rounded-lg hover:bg-black/15 transition-colors text-xs font-medium">
        <FileText size={14} /> <span className="truncate max-w-[160px]">{msg.text || 'Document'}</span>
        <Download size={12} className="ml-auto shrink-0" />
      </a>
    )
  }
  return null
}

/* ─── Message bubble ─────────────────────────────────────── */

function MsgBubble({ msg, team }) {
  const agentMember = team ? team.find((t) => t.id === msg.agent) : null

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

  if (msg.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="flex justify-center"
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-500">
          <Info size={10} /> {msg.text}
        </div>
      </motion.div>
    )
  }

  const isAgent = msg.type === 'agent'
  const hasMedia = msg.mediaType && msg.mediaUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={`flex gap-2 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isAgent && <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 self-end"><User size={13} className="text-gray-500" /></div>}
      <div className="max-w-[68%] group">
        {hasMedia && <MediaContent msg={msg} />}
        {(!hasMedia || msg.text) && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isAgent
              ? 'bg-green-600 text-white rounded-br-sm'
              : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm'
          } ${hasMedia ? 'mt-1' : ''}`}>
            {msg.text}
          </div>
        )}
        <div className={`flex items-center gap-1 mt-0.5 ${isAgent ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-400">{msg.time}</span>
          {isAgent && msg.status === 'failed' && (
            <span className="flex items-center gap-0.5 text-red-500" title={msg.error || 'Message failed to send'}>
              <AlertTriangle size={11} />
              <span className="text-xs font-medium">Failed</span>
            </span>
          )}
          {isAgent && msg.status === 'read' && <CheckCheck size={12} className="text-blue-400" />}
          {isAgent && msg.status === 'delivered' && <CheckCheck size={12} className="text-gray-400" />}
          {isAgent && (msg.status === 'sent' || msg.status === 'queued') && <Check size={12} className="text-gray-400" />}
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

/* ─── Emoji picker ───────────────────────────────────────── */

const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩',
  '😘','😗','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','😐','😑',
  '😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮',
  '🤧','🥵','🥶','😵','🤯','🥳','😎','🤓','🧐','😕','🙁','😮','😯','😲','😳','🥺',
  '😢','😭','😱','😖','😣','😩','😫','😤','😡','😠','🤬','😈','👻','💀','🤡','👍',
  '👎','👊','✊','🤞','✌️','🤟','🤘','👌','👈','👉','👆','👇','☝️','✋','🖐️','👋',
  '🙏','🤝','🙌','👏','💪','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💕','💯',
  '🔥','✨','🎉','🎊','🎁','🏆','⭐','✅','❌','❓','❗','💬','📌','📍','📞','⏰',
]

function EmojiPicker({ onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg z-30 w-64 max-w-[90vw]"
    >
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500">Emoji</span>
      </div>
      <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-8 gap-0.5">
        {EMOJI_LIST.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(emoji)}
            className="w-7 h-7 flex items-center justify-center text-lg rounded-lg hover:bg-gray-100 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
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

function ProfilePanel({ conv, onToggleLabel }) {
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

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
      </div>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────── */

const COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-red-500']
const colorFor = (name) => COLORS[(name || 'U').charCodeAt(0) % COLORS.length]

const fmtTime = (d) => {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = (now - date) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return date.toLocaleDateString()
}

// Time remaining until a future timestamp (the WhatsApp 24h reply window) — the
// opposite direction from fmtTime, which formats how long ago something was.
const fmtCountdown = (expiresAt) => {
  if (!expiresAt) return ''
  const diff = (new Date(expiresAt) - Date.now()) / 1000
  if (diff <= 0) return 'expired'
  if (diff < 60) return `${Math.ceil(diff)}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

const normalizeConv = (c) => ({
  id: c._id,
  contactId: c.contact?._id || c.contact || null,
  name: c.contact?.name || 'Unknown',
  phone: c.contact?.phone || '',
  avatar: (c.contact?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  color: colorFor(c.contact?.name),
  status: c.status,
  unread: c.unreadCount || 0,
  labels: c.labels || [],
  lastMsg: c.lastMessage?.text || '',
  time: fmtTime(c.updatedAt),
  window: { open: !!c.window?.open, expiresAt: c.window?.expiresAt || null },
  _id: c._id,
})

const normalizeMsg = (m) => ({
  id:        m._id,
  type:      m.type,
  text:      m.text,
  mediaUrl:  m.mediaUrl  || null,
  mediaType: m.mediaType || null,
  time:      fmtTime(m.timestamp || m.createdAt),
  status:    m.status,
  error:     m.error || null,
  agent:     m.sentBy?._id || m.sentBy || null,
})

/* ─── New Conversation Modal ─────────────────────────────── */

function NewConversationModal({ onClose, onStarted, initialContact = null }) {
  // Reused for both "+ New" (no preset contact, starts at step 1) and the inline
  // "Use Template" re-engage action on an existing conversation (skips straight to step 2).
  const [step,         setStep]         = useState(initialContact ? 2 : 1)
  const [contactQ,     setContactQ]     = useState('')
  const [contacts,     setContacts]     = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [selectedContact, setSelectedContact] = useState(initialContact)
  const [templates,    setTemplates]    = useState([])
  const [tplLoading,   setTplLoading]   = useState(false)
  const [selectedTpl,  setSelectedTpl]  = useState(null)
  const [variables,    setVariables]    = useState([])          // values for {{1}}, {{2}}...
  const [sending,      setSending]      = useState(false)

  // Fetch contacts when search changes
  useEffect(() => {
    setContactsLoading(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await axiosInstance.get('/api/v1/contacts', { params: { search: contactQ, limit: 20 } })
        setContacts(data.data?.contacts || [])
      } catch { setContacts([]) }
      finally { setContactsLoading(false) }
    }, 280)
    return () => clearTimeout(t)
  }, [contactQ])

  // Fetch approved templates when entering step 2
  useEffect(() => {
    if (step !== 2) return
    setTplLoading(true)
    axiosInstance.get('/api/v1/templates', { params: { status: 'APPROVED', limit: 50 } })
      .then(({ data }) => setTemplates(data.data?.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setTplLoading(false))
  }, [step])

  const varCount = (tpl) => {
    const matches = (tpl?.components?.find(c => c.type === 'BODY')?.text || '').match(/\{\{\d+\}\}/g) || []
    return [...new Set(matches)].length
  }

  const handleSelectTemplate = (tpl) => {
    setSelectedTpl(tpl)
    setVariables(Array(varCount(tpl)).fill(''))
  }

  const bodyText = selectedTpl?.components?.find(c => c.type === 'BODY')?.text || ''
  const previewText = bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) => variables[Number(n) - 1] || `{{${n}}}`)

  const canSend = selectedContact && selectedTpl && variables.every(v => v.trim())

  const handleSend = async () => {
    if (!canSend || sending) return
    setSending(true)
    try {
      const { data } = await axiosInstance.post('/api/v1/conversations', {
        contactId:    selectedContact._id,
        templateName: selectedTpl.name,
        language:     selectedTpl.language || 'en',
        variables,
      })
      toast.success(`Message sent to ${selectedContact.name}`)
      onStarted(data.data.conversation, data.data.message)
      onClose()
    } catch (err) {
      const msg  = err.response?.data?.message || 'Failed to send message'
      const code = err.response?.data?.code
      toast.error(msg, {
        duration: code === 131030 ? 8000 : 4000,
        description: code === 131030
          ? 'Go to developers.facebook.com → WhatsApp → API Setup to add this number.'
          : undefined,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          {step === 2 && (
            <button onClick={() => { setStep(1); setSelectedTpl(null); setVariables([]) }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <ChevronLeft size={16} />
            </button>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{initialContact ? 'Re-engage with a Template' : 'New Conversation'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 1 ? 'Step 1 of 2 — Select a contact' : `Step 2 of 2 — Choose a template · ${selectedContact?.name}`}
            </p>
          </div>
          {/* Step dots */}
          <div className="flex gap-1.5">
            {[1, 2].map(s => (
              <div key={s} className={`w-5 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-green-500' : 'bg-gray-200'}`} />
            ))}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── Step 1: Contact picker ── */}
        {step === 1 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={contactQ}
                  onChange={e => setContactQ(e.target.value)}
                  placeholder="Search contacts by name or phone…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {contactsLoading ? (
                <div className="space-y-2 mt-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <User size={28} className="mb-2" />
                  <p className="text-sm">No contacts found</p>
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  {contacts.map(c => (
                    <button
                      key={c._id}
                      onClick={() => { setSelectedContact(c); setStep(2) }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-left border ${
                        !c.isOptedIn ? 'opacity-50 cursor-not-allowed' : 'border-transparent hover:border-green-200'
                      }`}
                      disabled={!c.isOptedIn}
                      title={!c.isOptedIn ? 'Contact has opted out' : ''}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${colorFor(c.name)}`}>
                        {(c.name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{c.phone}</p>
                      </div>
                      {c.isOptedIn
                        ? <ChevronRight size={14} className="text-gray-300 shrink-0" />
                        : <span className="text-xs text-red-400 shrink-0">Opted out</span>
                      }
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Template picker + variables ── */}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {!selectedTpl ? (
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {tplLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                    <LayoutTemplate size={28} className="mb-2" />
                    <p className="text-sm text-gray-400">No approved templates</p>
                    <p className="text-xs text-gray-300 mt-1">Create a template and wait for Meta approval first</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map(tpl => {
                      const body = tpl.components?.find(c => c.type === 'BODY')?.text || ''
                      const vc   = varCount(tpl)
                      return (
                        <button
                          key={tpl._id}
                          onClick={() => handleSelectTemplate(tpl)}
                          className="w-full text-left p-3.5 rounded-xl border-2 border-gray-100 hover:border-green-300 hover:bg-green-50/40 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <code className="text-xs font-semibold text-gray-800">{tpl.name}</code>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 capitalize">{tpl.category?.toLowerCase()}</span>
                            {vc > 0 && <span className="text-xs text-green-600 ml-auto">{vc} variable{vc > 1 ? 's' : ''}</span>}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{body || 'No body text'}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {/* Selected template info */}
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <LayoutTemplate size={14} className="text-green-600 shrink-0" />
                  <code className="text-xs font-semibold text-green-800 flex-1">{selectedTpl.name}</code>
                  <button onClick={() => { setSelectedTpl(null); setVariables([]) }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Change</button>
                </div>

                {/* Variable inputs */}
                {variables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fill in variables</p>
                    {variables.map((val, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-green-700 w-10 shrink-0">{`{{${i+1}}}`}</span>
                        <input
                          autoFocus={i === 0}
                          value={val}
                          onChange={e => { const v = [...variables]; v[i] = e.target.value; setVariables(v) }}
                          placeholder={`Value for {{${i+1}}}`}
                          className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</p>
                  <div className="bg-[#e5ddd5] rounded-xl p-3">
                    <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-3 py-2.5 max-w-[85%] text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {previewText || <span className="text-gray-300 italic">Message preview…</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              {selectedTpl ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSend}
                  disabled={!canSend || sending}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
                >
                  <Send size={13} />
                  {sending ? 'Sending…' : `Send to ${selectedContact?.name}`}
                </motion.button>
              ) : (
                <p className="flex-1 text-xs text-gray-400 text-center">Select a template above</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* ─── Main Inbox ─────────────────────────────────────────── */

export default function Inbox() {
  const { user, token } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [convs,       setConvs]       = useState([])
  const [messages,    setMessages]    = useState({})
  const [team,        setTeam]        = useState([])
  const [activeId,    setActiveId]    = useState(null)
  const [search,      setSearch]      = useState('')
  const [filterTab,   setFilterTab]   = useState('all')
  const [replyText,   setReplyText]   = useState('')
  const [replyMode,   setReplyMode]   = useState('reply')
  const [showCanned,  setShowCanned]  = useState(false)
  const [showEmoji,   setShowEmoji]   = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(true)
  const [showLabelHeader,  setShowLabelHeader]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [sending,     setSending]     = useState(false)
  const [showList,    setShowList]    = useState(true)
  const [showNewConv, setShowNewConv] = useState(false)
  const [mediaFile,   setMediaFile]   = useState(null)   // { file, preview, type }
  const [sendingMedia, setSendingMedia] = useState(false)
  const msgEndRef  = useRef(null)
  const fileInputRef = useRef(null)
  const replyTextareaRef = useRef(null)
  const [, setClockTick] = useState(0) // forces re-render so window countdowns stay live

  const conv     = convs.find((c) => c.id === activeId)
  const msgs     = messages[activeId] || []

  // Re-render every 30s so the 24h window countdown ("closes in Xh Ym") ticks
  // down in real time instead of freezing at whatever it read on last fetch.
  useEffect(() => {
    const t = setInterval(() => setClockTick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // ── Fetch team members ───────────────────────────────────
  useEffect(() => {
    axiosInstance.get('/api/v1/profile/team')
      .then(({ data }) => {
        setTeam((data.data?.users || []).map(normalizeTeamMember))
      })
      .catch(() => {})
  }, [])

  // ── Fetch conversations ──────────────────────────────────
  // Deep link from the header search ("jump to this conversation") — read once on mount,
  // ref so it doesn't need to be a dependency and doesn't retrigger on later refetches.
  const deepLinkIdRef = useRef(searchParams.get('conversationId'))

  const fetchConvs = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/api/v1/conversations', { params: { filter: filterTab } })
      const normalized = (data.data?.conversations || []).map(normalizeConv)
      setConvs(normalized)
      if (!activeId) {
        const deepLinkId = deepLinkIdRef.current
        const match = deepLinkId && normalized.find(c => c.id === deepLinkId)
        if (match) {
          deepLinkIdRef.current = null
          setActiveId(match.id)
          setShowList(false)
          setSearchParams({}, { replace: true })
        } else if (normalized.length) {
          setActiveId(normalized[0].id)
        }
      }
    } catch {
      setConvs([])
    } finally {
      setLoading(false)
    }
  }, [filterTab])

  useEffect(() => { fetchConvs() }, [fetchConvs])

  // ── Fetch messages when conversation changes ─────────────
  useEffect(() => {
    if (!activeId || messages[activeId]) return
    axiosInstance.get(`/api/v1/conversations/${activeId}/messages`)
      .then(({ data }) => {
        setMessages(m => ({ ...m, [activeId]: (data.data?.messages || []).map(normalizeMsg) }))
      })
      .catch(() => {
        setMessages(m => ({ ...m, [activeId]: [] }))
      })
  }, [activeId])

  // ── Socket.io real-time ──────────────────────────────────
  // Connect once per session — must NOT depend on activeId, or switching
  // conversations tears down and reopens the whole socket on every click,
  // dropping any event that arrives mid-reconnect.
  useEffect(() => {
    connectSocket(token) // sends JWT; backend middleware auto-joins tenant room

    socket.on('new_message', ({ message }) => {
      const convId = message.conversation
      // Only append if that conversation's history is already loaded — otherwise this
      // would seed messages[convId] with just this one message, and the fetch effect
      // above (which skips fetching once messages[activeId] is set) would never pull
      // the real history when the conversation is opened later.
      setMessages(m => (m[convId] ? { ...m, [convId]: [...m[convId], normalizeMsg(message)] } : m))
      setConvs(cs => cs.map(c => c.id === convId
        ? { ...c, lastMsg: message.text, unread: message.type === 'customer' ? c.unread + 1 : c.unread }
        : c
      ))
    })

    socket.on('new_conversation_message', ({ conversationId }) => {
      // Refresh conversations on new message without overwriting optimistic local state.
      // Also inserts conversations that don't exist locally yet — e.g. a brand-new
      // contact's first-ever message — which a plain "update matching rows" merge
      // would silently drop until the next manual reload.
      axiosInstance.get('/api/v1/conversations', { params: { filter: filterTab } })
        .then(({ data }) => {
          const fresh = (data.data?.conversations || []).map(normalizeConv)
          setConvs(cs => {
            const merged = cs.map(c => {
              const updated = fresh.find(f => f.id === c.id)
              return updated ? { ...c, ...updated, labels: c.labels } : c
            })
            const newOnes = fresh.filter(f => !cs.some(c => c.id === f.id))
            return [...newOnes, ...merged]
          })
        })
        .catch(() => {})
    })

    socket.on('conversation_updated', ({ conversation }) => {
      setConvs(cs => cs.map(c => c.id === conversation._id ? { ...c, ...normalizeConv(conversation), labels: conversation.labels || c.labels } : c))
    })

    // Backend emits this on every delivered/read/failed webhook update — without it, a message
    // that later fails keeps showing its original "sent" checkmark until the chat is reopened.
    socket.on('message_status', ({ messageId, status, error }) => {
      setMessages(m => {
        const next = { ...m }
        for (const convId of Object.keys(next)) {
          const idx = next[convId].findIndex(msg => msg.id === messageId)
          if (idx === -1) continue
          const updated = [...next[convId]]
          updated[idx] = { ...updated[idx], status, error: error ?? updated[idx].error }
          next[convId] = updated
          break
        }
        return next
      })
    })

    return () => {
      socket.off('new_message')
      socket.off('new_conversation_message')
      socket.off('conversation_updated')
      socket.off('message_status')
      disconnectSocket()
    }
  }, [token])

  // Join/leave the active conversation's room independently of the socket
  // connection lifecycle above.
  useEffect(() => {
    if (!activeId) return
    socket.emit('join_conversation', activeId)
    return () => socket.emit('leave_conversation', activeId)
  }, [activeId])

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const filteredConvs = convs.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTab === 'unread')   return c.unread > 0
    if (filterTab === 'resolved') return c.status === 'resolved'
    return true
  })

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    setMediaFile({ file, preview, name: file.name, mimeType: file.type })
    e.target.value = ''
  }

  const handleSendMedia = async () => {
    if (!mediaFile || sendingMedia) return
    setSendingMedia(true)
    const form = new FormData()
    form.append('file', mediaFile.file)
    if (replyText.trim()) form.append('caption', replyText.trim())
    try {
      const { data } = await axiosInstance.post(
        `/api/v1/conversations/${activeId}/messages/media`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      const newMsg = normalizeMsg(data.data.message)
      setMessages(m => ({ ...m, [activeId]: [...(m[activeId] || []), newMsg] }))
      setConvs(cs => cs.map(c => c.id === activeId ? { ...c, lastMsg: newMsg.text } : c))
      setMediaFile(null)
      setReplyText('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send file')
    } finally {
      setSendingMedia(false)
    }
  }

  const insertEmoji = (emoji) => {
    const el = replyTextareaRef.current
    if (!el) { setReplyText(t => t + emoji); return }
    const start = el.selectionStart ?? replyText.length
    const end = el.selectionEnd ?? replyText.length
    const next = replyText.slice(0, start) + emoji + replyText.slice(end)
    setReplyText(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  const handleSend = async () => {
    if (!replyText.trim() || sending) return
    const type = replyMode === 'note' ? 'note' : 'agent'
    const text = replyText.trim()
    setSending(true)
    setReplyText('')
    try {
      await axiosInstance.post(`/api/v1/conversations/${activeId}/messages`, { text, type })
    } catch {
      // Optimistic local update so the UI doesn't stall
      const newMsg = { id: Date.now(), type, text, time: 'just now', status: 'sent', agent: user?._id || user?.id || null }
      setMessages(m => ({ ...m, [activeId]: [...(m[activeId] || []), newMsg] }))
      setConvs(cs => cs.map(c => c.id === activeId ? { ...c, lastMsg: text } : c))
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    const newStatus = conv?.status === 'resolved' ? 'open' : 'resolved'
    setConvs(cs => cs.map(c => c.id === activeId ? { ...c, status: newStatus } : c))
    try {
      await axiosInstance.patch(`/api/v1/conversations/${activeId}`, { status: newStatus })
    } catch {}
  }

  const handleToggleLabel = async (labelKey) => {
    const conv = convs.find(c => c.id === activeId)
    if (!conv) return
    const newLabels = conv.labels.includes(labelKey)
      ? conv.labels.filter(l => l !== labelKey)
      : [...conv.labels, labelKey]
    setConvs(cs => cs.map(c => c.id === activeId ? { ...c, labels: newLabels } : c))
    try {
      await axiosInstance.patch(`/api/v1/conversations/${activeId}`, { labels: newLabels })
    } catch {}
  }

  const FILTER_TABS = ['all', 'unread', 'resolved']

  return (
    <div
      className="flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      style={{ height: 'calc(100vh - 7.5rem)' }}
    >
      {/* ── Left: conversation list ── */}
      <div className={`w-full md:w-72 flex flex-col border-r border-gray-100 shrink-0 ${!showList && conv ? 'hidden md:flex' : ''}`}>
        {/* Header: title + new conversation button */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversations</span>
          <motion.button
            whileTap={user?.tenant?.whatsapp?.phoneNumber ? { scale: 0.93 } : {}}
            onClick={() => user?.tenant?.whatsapp?.phoneNumber && setShowNewConv(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm ${
              user?.tenant?.whatsapp?.phoneNumber
                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={user?.tenant?.whatsapp?.phoneNumber ? 'Start a new conversation' : 'Connect WhatsApp first to start conversations'}
          >
            <Plus size={12} />
            New
          </motion.button>
        </div>
        {/* Search */}
        <div className="px-3 pb-3 border-b border-gray-100">
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
                  setShowList(false)
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
            <div className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-3 border-b border-gray-100 bg-white shrink-0">
              {/* Mobile back button */}
              <button
                onClick={() => { setActiveId(null); setShowList(true) }}
                className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
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
              <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
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
            <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-3 bg-gray-50">
              {msgs.map((msg) => <MsgBubble key={msg.id} msg={msg} team={team} />)}
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
                  <button
                    onClick={() => setShowNewConv({ _id: conv.contactId, name: conv.name, phone: conv.phone, isOptedIn: true })}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors shrink-0"
                  >
                    <LayoutTemplate size={10} /> Use Template
                  </button>
                </div>
              )}
              {conv.window?.open && (
                <div className="flex items-center gap-1.5 mb-1.5 text-xs text-green-600">
                  <Clock size={10} /> <span>24h window open · closes in <strong>{fmtCountdown(conv.window.expiresAt)}</strong></span>
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
                  ref={replyTextareaRef}
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

              {/* Media preview bar */}
              <AnimatePresence>
                {mediaFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 mb-2 p-2 bg-green-50 border border-green-200 rounded-xl overflow-hidden"
                  >
                    {mediaFile.preview
                      ? <img src={mediaFile.preview} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-green-600" />
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{mediaFile.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{mediaFile.mimeType.split('/')[0]}</p>
                    </div>
                    <button onClick={() => setMediaFile(null)} className="p-1 rounded-lg hover:bg-green-100 text-gray-400">
                      <X size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toolbar */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  {!mediaFile && (
                    <button
                      onClick={() => { setShowCanned((s) => !s); setShowEmoji(false); setShowAttachMenu(false) }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showCanned ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      <Zap size={11} /> Quick replies
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4,audio/*,application/pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={handleMediaSelect}
                  />
                  {/* Attach: file upload or send a template (available anytime, not just when the 24h window is closed) */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowAttachMenu((s) => !s); setShowEmoji(false); setShowCanned(false) }}
                      className={`p-1.5 rounded-lg transition-colors ${mediaFile || showAttachMenu ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="Attach file or send a template"
                    >
                      <Paperclip size={14} />
                    </button>
                    <AnimatePresence>
                      {showAttachMenu && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setShowAttachMenu(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.18, ease: EASE_OUT }}
                            className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[190px] z-30"
                          >
                            {/* <button
                              onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Paperclip size={13} className="text-gray-400" /> Attach file
                            </button> */}
                            <button
                              onClick={() => {
                                setShowNewConv({ _id: conv.contactId, name: conv.name, phone: conv.phone, isOptedIn: true })
                                setShowAttachMenu(false)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <LayoutTemplate size={13} className="text-gray-400" /> Send template
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => { setShowEmoji((s) => !s); setShowCanned(false); setShowAttachMenu(false) }}
                      className={`p-1.5 rounded-lg transition-colors ${showEmoji ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="Emoji"
                    >
                      <Smile size={14} />
                    </button>
                    <AnimatePresence>
                      {showEmoji && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setShowEmoji(false)} />
                          <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {mediaFile ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMedia}
                    disabled={sendingMedia}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-green-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
                  >
                    <Send size={12} />
                    {sendingMedia ? 'Sending…' : 'Send File'}
                  </motion.button>
                ) : (
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
                )}
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
      {/* Desktop: side panel */}
      <div className="hidden lg:block">
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
                onToggleLabel={handleToggleLabel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Mobile: profile overlay */}
      <AnimatePresence>
        {showProfile && conv && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.24, ease: EASE_OUT }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl"
            >
              <ProfilePanel
                conv={conv}
                onToggleLabel={handleToggleLabel}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Conversation Modal ── */}
      <AnimatePresence>
        {showNewConv && (
          <NewConversationModal
            initialContact={typeof showNewConv === 'object' ? showNewConv : null}
            onClose={() => setShowNewConv(false)}
            onStarted={(newConv, newMsg) => {
              const normalized = normalizeConv(newConv)
              setConvs(cs => {
                const exists = cs.find(c => c.id === normalized.id)
                return exists
                  ? cs.map(c => c.id === normalized.id ? normalized : c)
                  : [normalized, ...cs]
              })
              // Only append if this conversation's history is already loaded — otherwise this
              // would seed messages[id] with just this one message, and the fetch effect (which
              // skips fetching once messages[activeId] is set) would never pull the real history.
              if (newMsg) {
                setMessages(m => (m[normalized.id] ? { ...m, [normalized.id]: [...m[normalized.id], normalizeMsg(newMsg)] } : m))
              }
              setActiveId(normalized.id)
              setShowList(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
