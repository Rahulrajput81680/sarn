import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, MessageSquare, Image, HelpCircle, Save, GitBranch,
  Tag, Users, Square, Plus, Edit2, Trash2, Play, Globe,
  EyeOff, X, Check, ArrowDown, ArrowUp, Hash, Mail, Phone,
  List, MousePointerClick, Clock, Bot, AlignLeft,
  CheckCircle2, Send, QrCode, LayoutList,
} from 'lucide-react'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Node type definitions ─────────────────────────────── */

const NODE_DEFS = {
  trigger:          { label: 'Trigger',             icon: Zap,              color: '#16a34a', bg: 'bg-green-500',  text: 'text-green-700',   border: 'border-green-400',   light: 'bg-green-50'   },
  send_text:        { label: 'Send Text',            icon: MessageSquare,    color: '#2563eb', bg: 'bg-blue-500',   text: 'text-blue-700',    border: 'border-blue-400',    light: 'bg-blue-50'    },
  interactive_btn:  { label: 'Interactive Buttons',  icon: MousePointerClick,color: '#0284c7', bg: 'bg-sky-500',   text: 'text-sky-700',     border: 'border-sky-400',     light: 'bg-sky-50'     },
  interactive_list: { label: 'Interactive List',     icon: LayoutList,       color: '#6366f1', bg: 'bg-violet-500',text: 'text-violet-700',  border: 'border-violet-400',  light: 'bg-violet-50'  },
  send_media:       { label: 'Send Media',           icon: Image,            color: '#7c3aed', bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-400',  light: 'bg-purple-50'  },
  ask_question:     { label: 'Ask Question',         icon: HelpCircle,       color: '#ea580c', bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-400',  light: 'bg-orange-50'  },
  save_response:    { label: 'Save Response',        icon: Save,             color: '#0891b2', bg: 'bg-cyan-500',   text: 'text-cyan-700',   border: 'border-cyan-400',    light: 'bg-cyan-50'    },
  condition:        { label: 'Condition Branch',     icon: GitBranch,        color: '#ca8a04', bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-400',  light: 'bg-yellow-50'  },
  assign_tag:       { label: 'Assign Tag',           icon: Tag,              color: '#db2777', bg: 'bg-pink-500',   text: 'text-pink-700',   border: 'border-pink-400',    light: 'bg-pink-50'    },
  transfer:         { label: 'Transfer to Human',    icon: Users,            color: '#4f46e5', bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-400',  light: 'bg-indigo-50'  },
  end_flow:         { label: 'End Flow',             icon: Square,           color: '#dc2626', bg: 'bg-red-500',    text: 'text-red-700',    border: 'border-red-400',     light: 'bg-red-50'     },
}

const TRIGGER_TYPES = [
  { key: 'keyword',     label: 'Keyword Trigger',         icon: Hash,             desc: 'Fires when user sends a specific keyword' },
  { key: 'welcome',     label: 'QR Code / Link Trigger',  icon: QrCode,           desc: 'Fires when user scans your QR code or taps a wa.me link (pre-fills a keyword)' },
  { key: 'no_response', label: 'No-Response Follow-up',   icon: Clock,            desc: 'Fires if the user has not replied within a set number of hours' },
  { key: 'cta_click',   label: 'Template Button Click',   icon: MousePointerClick,desc: 'Fires when user taps a Quick Reply button on a sent template' },
]

const ACTION_TYPES = [
  { key: 'send_text',        desc: 'Send a plain text message to the user' },
  { key: 'interactive_btn',  desc: 'Native WhatsApp tappable buttons (max 3)' },
  { key: 'interactive_list', desc: 'Scrollable menu of options (max 10 items)' },
  { key: 'send_media',       desc: 'Send an image, video, or document' },
  { key: 'ask_question',     desc: 'Ask a question and capture the response' },
  { key: 'save_response',    desc: 'Save a user response to a variable' },
  { key: 'condition',        desc: 'Branch the flow based on a condition' },
  { key: 'assign_tag',       desc: 'Assign a tag to the contact' },
  { key: 'transfer',         desc: 'Hand off to a human team member' },
  { key: 'end_flow',         desc: 'End the chatbot flow' },
]

const TAGS = ['Lead', 'Customer', 'Interested', 'Follow-up']

/* ─── Demo data ─────────────────────────────────────────── */

const DEMO_FLOWS = [
  { id: 'f1', name: 'Welcome Flow',   trigger: 'welcome',     published: true,  nodeCount: 6, version: 3 },
  { id: 'f2', name: 'Order Status',   trigger: 'keyword',     published: true,  nodeCount: 7, version: 2 },
  { id: 'f3', name: 'Lead Capture',   trigger: 'cta_click',   published: false, nodeCount: 5, version: 1 },
  { id: 'f4', name: 'Re-engagement',  trigger: 'no_response', published: false, nodeCount: 4, version: 1 },
]

const mkNode = (id, type, data) => ({ id, type, data })
const BLANK_DATA = { text: '', message: '', question: '', keyword: '', triggerType: 'keyword', buttons: [], listItems: [], listSectionTitle: '', listButtonLabel: 'Choose an option', choices: [], inputType: 'text', tag: 'Lead', variable: '', saveAs: '', operator: 'equals', value: '', yesLabel: 'Yes', noLabel: 'No', mediaType: 'image', url: '', caption: '', responseType: 'text', delay: 24 }

const DEMO_NODES = {
  f1: [
    mkNode('n1', 'trigger',     { ...BLANK_DATA, triggerType: 'welcome' }),
    mkNode('n2', 'send_text',   { ...BLANK_DATA, text: "Hi {{name}}! 👋 Welcome to Wixabotic. We're excited to have you here!", buttons: ['Browse Products', 'Track Order', 'Talk to Us'] }),
    mkNode('n3', 'ask_question',{ ...BLANK_DATA, question: 'What are you looking for today?', inputType: 'choice', choices: ['Products', 'Support', 'Pricing'], saveAs: 'user_intent' }),
    mkNode('n4', 'condition',   { ...BLANK_DATA, variable: 'user_intent', operator: 'equals', value: 'Support', yesLabel: 'Support path', noLabel: 'Products path' }),
    mkNode('n5', 'assign_tag',  { ...BLANK_DATA, tag: 'Lead' }),
    mkNode('n6', 'transfer',    { ...BLANK_DATA, message: "I'm connecting you with our support team. Please hold on! 🙏" }),
  ],
  f2: [
    mkNode('n1', 'trigger',      { ...BLANK_DATA, triggerType: 'keyword', keyword: 'ORDER STATUS' }),
    mkNode('n2', 'send_text',    { ...BLANK_DATA, text: "Sure! Please share your order ID and I'll check right away.", buttons: [] }),
    mkNode('n3', 'ask_question', { ...BLANK_DATA, question: 'What is your order ID?', inputType: 'text', choices: [], saveAs: 'order_id' }),
    mkNode('n4', 'save_response',{ ...BLANK_DATA, variable: 'order_id', responseType: 'text' }),
    mkNode('n5', 'send_text',    { ...BLANK_DATA, text: 'Found it! Your order {{order_id}} is out for delivery. Expected tonight.', buttons: [] }),
    mkNode('n6', 'assign_tag',   { ...BLANK_DATA, tag: 'Customer' }),
    mkNode('n7', 'end_flow',     { ...BLANK_DATA, message: 'Thanks for checking with us! Have a great day 😊' }),
  ],
  f3: [
    mkNode('n1', 'trigger',      { ...BLANK_DATA, triggerType: 'cta_click' }),
    mkNode('n2', 'ask_question', { ...BLANK_DATA, question: 'What is your name?', inputType: 'name', saveAs: 'contact_name' }),
    mkNode('n3', 'ask_question', { ...BLANK_DATA, question: 'What is your email?', inputType: 'email', saveAs: 'contact_email' }),
    mkNode('n4', 'assign_tag',   { ...BLANK_DATA, tag: 'Interested' }),
    mkNode('n5', 'end_flow',     { ...BLANK_DATA, message: "Thanks {{contact_name}}! Our team will reach out to {{contact_email}} shortly 🎉" }),
  ],
  f4: [
    mkNode('n1', 'trigger',    { ...BLANK_DATA, triggerType: 'no_response', delay: 24 }),
    mkNode('n2', 'send_text',  { ...BLANK_DATA, text: "Hey {{name}}, we noticed you haven't responded. Need help? We're here! 😊", buttons: ['Yes, help me', 'No, thanks'] }),
    mkNode('n3', 'assign_tag', { ...BLANK_DATA, tag: 'Follow-up' }),
    mkNode('n4', 'end_flow',   { ...BLANK_DATA, message: "No worries! Feel free to reach out anytime 👋" }),
  ],
}

/* ─── Node type picker modal ─────────────────────────────── */

function NodeTypePicker({ onSelect, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">Add Node</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={15} /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ACTION_TYPES.map(({ key, desc }) => {
            const def = NODE_DEFS[key]
            const Icon = def.icon
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onSelect(key); onClose() }}
                className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-left transition-colors"
                style={{ transition: 'background-color 100ms ease, border-color 100ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
              >
                <span className={`p-2 rounded-lg ${def.light} shrink-0`}>
                  <Icon size={14} style={{ color: def.color }} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{def.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Canvas node card ───────────────────────────────────── */

function NodeCard({ node, index, total, selected, onSelect, onDelete, onMoveUp, onMoveDown, onInsertBelow }) {
  const def = NODE_DEFS[node.type]
  const Icon = def.icon
  const d = node.data

  const preview = () => {
    if (node.type === 'trigger') {
      const t = TRIGGER_TYPES.find((t) => t.key === d.triggerType)
      return (t?.label || '') + (d.keyword ? ` · "${d.keyword}"` : '')
    }
    if (node.type === 'send_text')        return (d.text || 'No message').slice(0, 64) + (d.text?.length > 64 ? '…' : '')
    if (node.type === 'interactive_btn')  return (d.text || 'No message').slice(0, 48) + ` · ${(d.buttons || []).filter(Boolean).length} button(s)`
    if (node.type === 'interactive_list') return (d.text || 'No message').slice(0, 40) + ` · ${(d.listItems || []).length} items`
    if (node.type === 'ask_question')  return d.question?.slice(0, 64) || 'No question set'
    if (node.type === 'condition')     return `If {{${d.variable || '?'}}} ${d.operator || 'equals'} "${d.value || '?'}"`
    if (node.type === 'assign_tag')    return `Assign tag: ${d.tag || 'None'}`
    if (node.type === 'transfer')      return (d.message || 'Transfer to team').slice(0, 64)
    if (node.type === 'end_flow')      return (d.message || 'End of flow').slice(0, 64)
    if (node.type === 'send_media')    return `Media · ${d.mediaType || 'image'}`
    if (node.type === 'save_response') return `Save to {{${d.variable || '?'}}}`
    return ''
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Arrow from above */}
      {index > 0 && (
        <div className="flex flex-col items-center py-0.5">
          <div className="w-px h-5 bg-gray-300" />
          <div className="w-2 h-2 rotate-45 border-b-2 border-r-2 border-gray-300 -mt-1.5" />
        </div>
      )}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: EASE_OUT, delay: index * 0.04 }}
        onClick={() => onSelect(node.id)}
        className={`relative w-72 cursor-pointer rounded-xl border-2 bg-white shadow-sm transition-all duration-150 ${
          selected ? `${def.border} shadow-md ring-1 ring-offset-1 ${def.border.replace('border-', 'ring-')}` : 'border-gray-200 hover:border-gray-300 hover:shadow'
        }`}
      >
        {/* Accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${def.bg}`} />

        {/* Step number */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-500">{index + 1}</span>
        </div>

        <div className="pl-4 pr-2 py-3">
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className={`p-1.5 rounded-lg ${def.light} shrink-0 mt-0.5`}>
                <Icon size={12} style={{ color: def.color }} />
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${def.text}`}>{def.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{preview()}</p>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {index > 1 && (
                <button onClick={onMoveUp} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Move up">
                  <ArrowUp size={11} />
                </button>
              )}
              {index < total - 1 && index > 0 && (
                <button onClick={onMoveDown} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Move down">
                  <ArrowDown size={11} />
                </button>
              )}
              {node.type !== 'trigger' && (
                <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Button previews */}
          {node.type === 'send_text' && d.buttons?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 ml-7">
              {d.buttons.map((b, i) => b && (
                <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">{b}</span>
              ))}
            </div>
          )}

          {/* Condition branch badges */}
          {node.type === 'condition' && (
            <div className="flex items-center gap-2 mt-2 ml-7">
              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full">✓ {d.yesLabel || 'Yes'}</span>
              <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full">✗ {d.noLabel || 'No'}</span>
            </div>
          )}

          {/* Choice previews */}
          {node.type === 'ask_question' && d.inputType === 'choice' && d.choices?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 ml-7">
              {d.choices.slice(0, 3).map((c, i) => c && (
                <span key={i} className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full">{c}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Insert between button */}
      {index < total - 1 && (
        <button
          onClick={onInsertBelow}
          className="mt-1.5 mb-0.5 w-6 h-6 rounded-full border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 flex items-center justify-center text-gray-300 hover:text-green-600 transition-colors"
          title="Insert node here"
        >
          <Plus size={11} />
        </button>
      )}
    </div>
  )
}

/* ─── Node editor panel ──────────────────────────────────── */

function NodeEditor({ node, onChange, onClose }) {
  const def = NODE_DEFS[node.type]
  const Icon = def.icon
  const d = node.data
  const set = (key, val) => onChange({ ...node, data: { ...d, [key]: val } })

  const setBtn = (i, val) => { const b = [...(d.buttons || [])]; b[i] = val; set('buttons', b) }
  const addBtn = () => { if ((d.buttons || []).length < 3) set('buttons', [...(d.buttons || []), '']) }
  const removeBtn = (i) => { const b = [...(d.buttons || [])]; b.splice(i, 1); set('buttons', b) }

  const setChoice = (i, val) => { const c = [...(d.choices || [])]; c[i] = val; set('choices', c) }
  const addChoice = () => set('choices', [...(d.choices || []), ''])
  const removeChoice = (i) => { const c = [...(d.choices || [])]; c.splice(i, 1); set('choices', c) }

  return (
    <div className="w-72 border-l border-gray-100 bg-white flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 ${def.light}`}>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-white/70"><Icon size={13} style={{ color: def.color }} /></span>
          <p className={`text-xs font-semibold ${def.text}`}>{def.label}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── TRIGGER ── */}
        {node.type === 'trigger' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Trigger Type</label>
              <div className="space-y-1.5">
                {TRIGGER_TYPES.map(({ key, label, icon: TIcon, desc }) => (
                  <button
                    key={key}
                    onClick={() => set('triggerType', key)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border-2 text-left transition-colors ${
                      d.triggerType === key ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <TIcon size={12} className={`mt-0.5 shrink-0 ${d.triggerType === key ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-xs font-medium ${d.triggerType === key ? 'text-green-800' : 'text-gray-700'}`}>{label}</p>
                      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {d.triggerType === 'keyword' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Keyword</label>
                <input
                  value={d.keyword || ''}
                  onChange={(e) => set('keyword', e.target.value.toUpperCase())}
                  placeholder="e.g. ORDER STATUS"
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">Case-insensitive match.</p>
              </div>
            )}
            {d.triggerType === 'no_response' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delay (hours)</label>
                <input
                  type="number"
                  value={d.delay || 24}
                  onChange={(e) => set('delay', +e.target.value)}
                  min={1} max={72}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
          </>
        )}

        {/* ── SEND TEXT ── */}
        {node.type === 'send_text' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message</label>
              <textarea
                rows={4}
                value={d.text || ''}
                onChange={(e) => set('text', e.target.value)}
                placeholder="Type your message… use {{variable}} for dynamic values"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Use {'{{name}}'}, {'{{phone}}'}, etc.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quick Reply Buttons <span className="text-gray-400 font-normal">(max 3)</span></label>
              <div className="space-y-2">
                {(d.buttons || []).map((btn, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={btn}
                      onChange={(e) => setBtn(i, e.target.value)}
                      placeholder={`Button ${i + 1}`}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={() => removeBtn(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X size={12} /></button>
                  </div>
                ))}
                {(d.buttons || []).length < 3 && (
                  <button onClick={addBtn} className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors">
                    <Plus size={11} /> Add button
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── INTERACTIVE BUTTONS ── */}
        {node.type === 'interactive_btn' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message Body</label>
              <textarea
                rows={3}
                value={d.text || ''}
                onChange={(e) => set('text', e.target.value)}
                placeholder="What would you like to do?"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Buttons <span className="text-gray-400 font-normal">(max 3 · native WhatsApp tap)</span></label>
              <div className="space-y-2">
                {(d.buttons || []).map((btn, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={btn}
                      onChange={(e) => setBtn(i, e.target.value)}
                      placeholder={`Button ${i + 1} label`}
                      maxLength={20}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button onClick={() => removeBtn(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X size={12} /></button>
                  </div>
                ))}
                {(d.buttons || []).length < 3 && (
                  <button onClick={addBtn} className="flex items-center gap-1 text-xs text-sky-600 font-medium hover:text-sky-700 transition-colors">
                    <Plus size={11} /> Add button
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Max 20 chars per button. Users tap — no typing needed.</p>
            </div>
          </>
        )}

        {/* ── INTERACTIVE LIST ── */}
        {node.type === 'interactive_list' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message Body</label>
              <textarea
                rows={3}
                value={d.text || ''}
                onChange={(e) => set('text', e.target.value)}
                placeholder="Please select an option from the list below."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Section Title</label>
                <input
                  value={d.listSectionTitle || ''}
                  onChange={(e) => set('listSectionTitle', e.target.value)}
                  placeholder="Choose an option"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Button Label</label>
                <input
                  value={d.listButtonLabel || ''}
                  onChange={(e) => set('listButtonLabel', e.target.value)}
                  placeholder="View Options"
                  maxLength={20}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">List Items <span className="text-gray-400 font-normal">(max 10)</span></label>
              <div className="space-y-1.5">
                {(d.listItems || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center shrink-0">{i + 1}.</span>
                    <input
                      value={item}
                      onChange={(e) => { const li = [...(d.listItems || [])]; li[i] = e.target.value; set('listItems', li) }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400"
                    />
                    <button onClick={() => { const li = [...(d.listItems || [])]; li.splice(i, 1); set('listItems', li) }} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X size={11} /></button>
                  </div>
                ))}
                {(d.listItems || []).length < 10 && (
                  <button onClick={() => set('listItems', [...(d.listItems || []), ''])} className="flex items-center gap-1 text-xs text-violet-600 font-medium hover:text-violet-700 transition-colors">
                    <Plus size={11} /> Add item
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── SEND MEDIA ── */}
        {node.type === 'send_media' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Media Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['image', 'video', 'document'].map((t) => (
                  <button
                    key={t}
                    onClick={() => set('mediaType', t)}
                    className={`py-2 rounded-lg border-2 text-xs font-medium capitalize transition-colors ${
                      d.mediaType === t ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Media URL</label>
              <input value={d.url || ''} onChange={(e) => set('url', e.target.value)} placeholder="https://…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Caption</label>
              <textarea rows={2} value={d.caption || ''} onChange={(e) => set('caption', e.target.value)} placeholder="Optional caption…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>
          </>
        )}

        {/* ── ASK QUESTION ── */}
        {node.type === 'ask_question' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Question</label>
              <textarea rows={3} value={d.question || ''} onChange={(e) => set('question', e.target.value)} placeholder="What is your question?" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Input Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'text',   label: 'Text',   icon: AlignLeft },
                  { key: 'name',   label: 'Name',   icon: Users },
                  { key: 'email',  label: 'Email',  icon: Mail },
                  { key: 'phone',  label: 'Phone',  icon: Phone },
                  { key: 'choice', label: 'Choice', icon: List },
                ].map(({ key, label, icon: IIcon }) => (
                  <button
                    key={key}
                    onClick={() => set('inputType', key)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                      d.inputType === key ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <IIcon size={11} /> {label}
                  </button>
                ))}
              </div>
            </div>
            {d.inputType === 'choice' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Choices</label>
                <div className="space-y-1.5">
                  {(d.choices || []).map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={c} onChange={(e) => setChoice(i, e.target.value)} placeholder={`Choice ${i + 1}`} className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400" />
                      <button onClick={() => removeChoice(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><X size={11} /></button>
                    </div>
                  ))}
                  <button onClick={addChoice} className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:text-orange-700 transition-colors"><Plus size={11} /> Add choice</button>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Save response as</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">{'{{'}</span>
                <input value={d.saveAs || ''} onChange={(e) => set('saveAs', e.target.value.replace(/\s/g, '_').toLowerCase())} placeholder="variable_name" className="w-full pl-7 pr-7 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">{'}}'}</span>
              </div>
            </div>
          </>
        )}

        {/* ── SAVE RESPONSE ── */}
        {node.type === 'save_response' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Variable name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">{'{{'}</span>
                <input value={d.variable || ''} onChange={(e) => set('variable', e.target.value.replace(/\s/g, '_').toLowerCase())} placeholder="variable_name" className="w-full pl-7 pr-7 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">{'}}'}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Response type</label>
              {['text', 'number', 'date', 'email', 'phone'].map((t) => (
                <label key={t} className="flex items-center gap-2 text-xs text-gray-700 mb-1.5 cursor-pointer capitalize">
                  <input type="radio" name="responseType" checked={d.responseType === t} onChange={() => set('responseType', t)} className="accent-cyan-500" /> {t}
                </label>
              ))}
            </div>
          </>
        )}

        {/* ── CONDITION ── */}
        {node.type === 'condition' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Variable</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">{'{{'}</span>
                <input value={d.variable || ''} onChange={(e) => set('variable', e.target.value)} placeholder="variable_name" className="w-full pl-7 pr-7 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">{'}}'}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Operator</label>
              <select value={d.operator || 'equals'} onChange={(e) => set('operator', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white">
                {['equals', 'not equals', 'contains', 'starts with', 'ends with', 'is empty', 'is not empty'].map((op) => (
                  <option key={op}>{op}</option>
                ))}
              </select>
            </div>
            {!['is empty', 'is not empty'].includes(d.operator) && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Value</label>
                <input value={d.value || ''} onChange={(e) => set('value', e.target.value)} placeholder="Value to compare" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-green-600 mb-1.5">✓ Yes path</label>
                <input value={d.yesLabel || ''} onChange={(e) => set('yesLabel', e.target.value)} placeholder="Yes label" className="w-full px-2.5 py-1.5 text-xs border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-red-500 mb-1.5">✗ No path</label>
                <input value={d.noLabel || ''} onChange={(e) => set('noLabel', e.target.value)} placeholder="No label" className="w-full px-2.5 py-1.5 text-xs border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
          </>
        )}

        {/* ── ASSIGN TAG ── */}
        {node.type === 'assign_tag' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Assign tag</label>
            <div className="space-y-1.5">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => set('tag', tag)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm text-left transition-colors ${
                    d.tag === tag ? 'border-pink-400 bg-pink-50 text-pink-800' : 'border-gray-100 text-gray-700 hover:border-gray-200'
                  }`}
                >
                  <Tag size={12} style={{ color: d.tag === tag ? '#db2777' : '#9ca3af' }} />
                  {tag}
                  {d.tag === tag && <Check size={12} className="ml-auto text-pink-600" />}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Links to your Contacts tagging system.</p>
          </div>
        )}

        {/* ── TRANSFER ── */}
        {node.type === 'transfer' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message before transfer</label>
            <textarea rows={4} value={d.message || ''} onChange={(e) => set('message', e.target.value)} placeholder="Let me connect you with our team…" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <p className="text-xs text-gray-400 mt-1">Sent before handing off to Team Inbox.</p>
          </div>
        )}

        {/* ── END FLOW ── */}
        {node.type === 'end_flow' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Closing message</label>
            <textarea rows={4} value={d.message || ''} onChange={(e) => set('message', e.target.value)} placeholder="Thanks for chatting! Have a great day 😊" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Test bot modal ─────────────────────────────────────── */

function TestModal({ flow, nodes, onClose }) {
  const firstContent = nodes.find((n) => n.type === 'send_text' || n.type === 'ask_question')
  const [msgs, setMsgs] = useState([
    { id: 0, from: 'bot', text: '👋 Test mode active. Simulating flow…', system: true },
    ...(firstContent
      ? [{ id: 1, from: 'bot', text: firstContent.data.text || firstContent.data.question || '…' }]
      : []),
  ])
  const [input, setInput] = useState('')
  const [stepIdx, setStepIdx] = useState(firstContent ? nodes.indexOf(firstContent) : 0)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = () => {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), from: 'user', text: input }
    const nextNode = nodes[stepIdx + 1]
    const botReply = nextNode
      ? nextNode.type === 'send_text'     ? { id: Date.now() + 1, from: 'bot', text: nextNode.data.text || '…' }
      : nextNode.type === 'ask_question'  ? { id: Date.now() + 1, from: 'bot', text: nextNode.data.question || '…' }
      : nextNode.type === 'assign_tag'    ? { id: Date.now() + 1, from: 'bot', text: `[System: Tag "${nextNode.data.tag}" applied]`, system: true }
      : nextNode.type === 'transfer'      ? { id: Date.now() + 1, from: 'bot', text: nextNode.data.message || 'Transferring to a team member…' }
      : nextNode.type === 'end_flow'      ? { id: Date.now() + 1, from: 'bot', text: nextNode.data.message || 'End of flow.' }
      : nextNode.type === 'condition'     ? { id: Date.now() + 1, from: 'bot', text: `[Condition] If {{${nextNode.data.variable}}} ${nextNode.data.operator} "${nextNode.data.value}"`, system: true }
      : { id: Date.now() + 1, from: 'bot', text: `[${NODE_DEFS[nextNode.type]?.label}]`, system: true }
      : { id: Date.now() + 1, from: 'bot', text: '✅ Flow completed.', system: true }

    setMsgs((m) => [...m, userMsg, botReply])
    setStepIdx((s) => Math.min(s + 1, nodes.length - 1))
    setInput('')
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden"
        style={{ height: 520 }}
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white shrink-0">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"><Bot size={14} /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{flow.name}</p>
            <p className="text-xs text-green-200">Test Mode · Not sent to real users</p>
          </div>
          <button onClick={onClose} className="text-green-200 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 space-y-2">
          {msgs.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: EASE_OUT }}
              className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[82%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                m.from === 'user'
                  ? 'bg-green-600 text-white rounded-br-sm'
                  : m.system
                    ? 'bg-amber-100 border border-amber-200 text-amber-800 text-xs italic'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            placeholder="Type a test reply…"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={send}
            className="p-2.5 bg-green-600 text-white rounded-lg"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Send size={14} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */

export default function ChatbotBuilder() {
  const [flows,      setFlows]      = useState(DEMO_FLOWS)
  const [nodesMap,   setNodesMap]   = useState(DEMO_NODES)
  const [activeFlow, setActiveFlow] = useState('f1')
  const [selectedId, setSelectedId] = useState(null)
  const [insertIdx,  setInsertIdx]  = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showTest,   setShowTest]   = useState(false)
  const [editName,   setEditName]   = useState(false)
  const [nameInput,  setNameInput]  = useState('')
  const [toast,      setToast]      = useState(null)

  const flow     = flows.find((f) => f.id === activeFlow)
  const nodes    = nodesMap[activeFlow] || []
  const selNode  = nodes.find((n) => n.id === selectedId)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handlePublish = () => {
    setFlows((fs) => fs.map((f) => f.id === activeFlow ? { ...f, published: !f.published } : f))
    showToast(flow?.published ? 'Flow unpublished.' : 'Flow published successfully!')
  }

  const handleSave = () => {
    setFlows((fs) => fs.map((f) => f.id === activeFlow ? { ...f, version: f.version + 1 } : f))
    showToast(`Flow saved (v${(flow?.version || 0) + 1}).`)
  }

  const handleNewFlow = () => {
    const id = `f${Date.now()}`
    setFlows((fs) => [...fs, { id, name: 'New Flow', trigger: 'keyword', published: false, nodeCount: 1, version: 1 }])
    setNodesMap((m) => ({ ...m, [id]: [mkNode('n_trigger', 'trigger', { ...BLANK_DATA, triggerType: 'keyword' })] }))
    setActiveFlow(id)
    setSelectedId(null)
  }

  const handleAddNode = (type) => {
    const newNode = mkNode(`n${Date.now()}`, type, { ...BLANK_DATA })
    const insertAt = insertIdx !== null ? insertIdx + 1 : nodes.length
    const next = [...nodes]
    next.splice(insertAt, 0, newNode)
    setNodesMap((m) => ({ ...m, [activeFlow]: next }))
    setSelectedId(newNode.id)
    setInsertIdx(null)
  }

  const handleDeleteNode = (id) => {
    setNodesMap((m) => ({ ...m, [activeFlow]: nodes.filter((n) => n.id !== id) }))
    if (selectedId === id) setSelectedId(null)
  }

  const swap = (i, j) => {
    const next = [...nodes]
    ;[next[i], next[j]] = [next[j], next[i]]
    setNodesMap((m) => ({ ...m, [activeFlow]: next }))
  }

  const handleNodeChange = (updated) =>
    setNodesMap((m) => ({ ...m, [activeFlow]: nodes.map((n) => n.id === updated.id ? updated : n) }))

  const commitName = (val) => {
    if (val.trim()) setFlows((fs) => fs.map((f) => f.id === activeFlow ? { ...f, name: val.trim() } : f))
    setEditName(false)
  }

  return (
    <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 7.5rem)' }}>

      {/* ── Left: flow list ── */}
      <div className="w-52 flex flex-col border-r border-gray-100 shrink-0">
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chatbot Flows</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNewFlow}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Plus size={12} /> New Flow
          </motion.button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {flows.map((f, i) => {
            const tDef = TRIGGER_TYPES.find((t) => t.key === f.trigger) || TRIGGER_TYPES[0]
            const TI   = tDef.icon
            return (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.14, ease: EASE_OUT, delay: i * 0.04 }}
                onClick={() => { setActiveFlow(f.id); setSelectedId(null) }}
                className={`w-full text-left px-3 py-2.5 border-l-2 transition-colors ${
                  activeFlow === f.id ? 'border-l-green-500 bg-green-50' : 'border-l-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className={`text-xs font-semibold truncate ${activeFlow === f.id ? 'text-green-800' : 'text-gray-800'}`}>{f.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${f.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {f.published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <TI size={9} /> <span className="truncate">{tDef.label}</span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">{nodesMap[f.id]?.length || f.nodeCount} nodes · v{f.version}</p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Center: canvas ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/60">
        {flow ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100 shrink-0">
              {editName ? (
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={() => commitName(nameInput)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitName(nameInput); if (e.key === 'Escape') setEditName(false) }}
                  className="text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-green-400 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => { setEditName(true); setNameInput(flow.name) }}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-green-700 transition-colors"
                >
                  {flow.name} <Edit2 size={11} className="text-gray-400" />
                </button>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${flow.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {flow.published ? '🟢 Live' : '⚪ Draft'}
              </span>
              <span className="text-xs text-gray-400">v{flow.version}</span>

              <div className="ml-auto flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowTest(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 bg-white transition-colors" style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}>
                  <Play size={11} /> Test
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 bg-white transition-colors" style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}>
                  <Save size={11} /> Save
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePublish}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${flow.published ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45'}`}
                  style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
                >
                  {flow.published ? <><EyeOff size={11} /> Unpublish</> : <><Globe size={11} /> Publish</>}
                </motion.button>
              </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-800"
                >
                  <CheckCircle2 size={13} className="text-green-600 shrink-0" /> {toast}
                  <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={11} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Node canvas */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="flex flex-col items-center">
                {nodes.map((node, i) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    index={i}
                    total={nodes.length}
                    selected={selectedId === node.id}
                    onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
                    onDelete={() => handleDeleteNode(node.id)}
                    onMoveUp={() => swap(i, i - 1)}
                    onMoveDown={() => swap(i, i + 1)}
                    onInsertBelow={() => { setInsertIdx(i); setShowPicker(true) }}
                  />
                ))}

                {/* Add node at end */}
                <div className="flex flex-col items-center mt-1">
                  <div className="w-px h-5 bg-gray-300" />
                  <div className="w-2 h-2 rotate-45 border-b-2 border-r-2 border-gray-300 -mt-1.5" />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setInsertIdx(nodes.length - 1); setShowPicker(true) }}
                    className="mt-2 flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-green-400 hover:text-green-600 text-gray-400 text-xs font-medium rounded-xl transition-colors"
                    style={{ transition: 'border-color 150ms ease, color 150ms ease, transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
                  >
                    <Plus size={13} /> Add Node
                  </motion.button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
            <Bot size={32} />
            <p className="text-sm">Select or create a flow</p>
          </div>
        )}
      </div>

      {/* ── Right: node editor ── */}
      <AnimatePresence>
        {selNode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="overflow-hidden shrink-0"
          >
            <NodeEditor node={selNode} onChange={handleNodeChange} onClose={() => setSelectedId(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showPicker && (
          <NodeTypePicker onSelect={handleAddNode} onClose={() => { setShowPicker(false); setInsertIdx(null) }} />
        )}
        {showTest && flow && (
          <TestModal flow={flow} nodes={nodes} onClose={() => setShowTest(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
