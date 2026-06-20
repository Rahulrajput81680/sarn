import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, X, Shield, Flame, Link2,
  MessageSquare, ChevronDown, CheckCircle2,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import Badge from '../../../components/ui/Badge'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Rule data ───────────────────────────────────────────── */
const CATEGORIES = ['Spam', 'Phishing', 'Prohibited Content', 'Hate Speech', 'Gambling', 'Crypto', 'Adult Content']
const ACTIONS    = ['flag', 'block', 'warn_client', 'throttle']
const ACTION_COLOR = { flag: 'yellow', block: 'red', warn_client: 'orange', throttle: 'blue' }
const ACTION_LABEL = { flag: 'Flag for review', block: 'Auto-block message', warn_client: 'Warn client', throttle: 'Throttle client sending' }

const INIT_RULES = [
  { id: 1,  type: 'keyword', pattern: 'earn money fast',    category: 'Spam',               action: 'flag',         enabled: true  },
  { id: 2,  type: 'keyword', pattern: 'click this link',    category: 'Phishing',           action: 'block',        enabled: true  },
  { id: 3,  type: 'keyword', pattern: 'free giveaway',      category: 'Spam',               action: 'flag',         enabled: false },
  { id: 4,  type: 'keyword', pattern: 'crypto investment',  category: 'Crypto',             action: 'block',        enabled: true  },
  { id: 5,  type: 'keyword', pattern: 'guaranteed returns', category: 'Prohibited Content', action: 'warn_client',  enabled: true  },
  { id: 6,  type: 'url',     pattern: 'bit.ly',             category: 'Phishing',           action: 'flag',         enabled: true  },
  { id: 7,  type: 'url',     pattern: 't.me/promo',         category: 'Spam',               action: 'block',        enabled: true  },
  { id: 8,  type: 'keyword', pattern: 'adult content',      category: 'Adult Content',      action: 'block',        enabled: true  },
  { id: 9,  type: 'keyword', pattern: 'win lottery',        category: 'Gambling',           action: 'block',        enabled: false },
  { id: 10, type: 'keyword', pattern: 'hate speech sample', category: 'Hate Speech',        action: 'block',        enabled: true  },
]

const TYPE_ICON = { keyword: MessageSquare, url: Link2 }
const TYPE_COLOR = { keyword: 'text-gray-500 bg-gray-100', url: 'text-blue-500 bg-blue-50' }

/* ─── Add Rule Modal ───────────────────────────────────────── */
function RuleModal({ onClose, onSave }) {
  const [type,     setType]     = useState('keyword')
  const [pattern,  setPattern]  = useState('')
  const [category, setCategory] = useState('Spam')
  const [action,   setAction]   = useState('flag')

  function submit() {
    if (!pattern.trim()) return
    onSave({ type, pattern: pattern.trim(), category, action })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: EASE_OUT }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-base font-bold text-gray-900">Add Moderation Rule</p>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Rule Type</label>
            <div className="flex gap-2">
              {[['keyword', 'Keyword / Phrase', MessageSquare], ['url', 'URL Pattern', Link2]].map(([v, l, Icon]) => (
                <button key={v} onClick={() => setType(v)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${type === v ? 'border-green-400 bg-green-100 text-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <Icon size={12} />{l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{type === 'url' ? 'URL Pattern' : 'Keyword or Phrase'}</label>
            <input value={pattern} onChange={(e) => setPattern(e.target.value)}
              placeholder={type === 'url' ? 'e.g. bit.ly or suspicious.com' : 'e.g. earn money fast'}
              className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
            <div className="relative">
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Action</label>
            <div className="relative">
              <select value={action} onChange={(e) => setAction(e.target.value)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400">
                {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={submit}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
            Add Rule
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

/* ─── Switch ───────────────────────────────────────────────── */
function Switch({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${on ? 'bg-green-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-4' : 'left-0.5'}`} />
    </button>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function ModerationRules() {
  const [rules,    setRules]    = useState(INIT_RULES)
  const [showAdd,  setShowAdd]  = useState(false)
  const [catFilter,setCatFilter]= useState('')
  const [typeFilter,setTypeFilter]=useState('')
  const [saved,    setSaved]    = useState(null)

  function addRule({ type, pattern, category, action }) {
    const rule = { id: Date.now(), type, pattern, category, action, enabled: true }
    setRules((prev) => [rule, ...prev])
    setShowAdd(false)
    setSaved(rule.id)
    setTimeout(() => setSaved(null), 2000)
  }

  function deleteRule(id) { setRules((prev) => prev.filter((r) => r.id !== id)) }
  function toggleRule(id, v) { setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: v } : r)) }

  const filtered = rules.filter((r) => (!catFilter || r.category === catFilter) && (!typeFilter || r.type === typeFilter))

  const enabledCount  = rules.filter((r) => r.enabled).length
  const disabledCount = rules.filter((r) => !r.enabled).length
  const blockCount    = rules.filter((r) => r.action === 'block' && r.enabled).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Moderation Rules"
        description="Keyword and URL-based auto-flagging, blocking and throttle rules"
        breadcrumbs={['Admin', 'Compliance', 'Moderation Rules']}
        action={
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border-2 border-green-400 bg-green-100 text-gray-800 shadow-sm shadow-green-500 hover:bg-white/45 transition-all">
            <Plus size={14} /> Add Rule
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Rules',   value: enabledCount,  icon: Shield,  bg: 'bg-green-50',  color: 'text-green-600'  },
          { label: 'Disabled',       value: disabledCount, icon: X,       bg: 'bg-gray-50',   color: 'text-gray-500'   },
          { label: 'Auto-block',     value: blockCount,    icon: Flame,   bg: 'bg-red-50',    color: 'text-red-500'    },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <Icon size={18} className={color} />
            <div><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-700">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-gray-700">
            <option value="">All Types</option>
            <option value="keyword">Keyword</option>
            <option value="url">URL Pattern</option>
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <span className="self-center text-xs text-gray-400">{filtered.length} rule{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Rules list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filtered.map((rule, i) => {
            const Icon = TYPE_ICON[rule.type]
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12, ease: EASE_OUT, delay: i * 0.03 }}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors ${!rule.enabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Switch on={rule.enabled} onChange={(v) => toggleRule(rule.id, v)} />
                  <div className={`p-1.5 rounded-lg ${TYPE_COLOR[rule.type]}`}>
                    <Icon size={13} />
                  </div>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">{rule.pattern}</code>
                  {saved === rule.id && <CheckCircle2 size={13} className="text-green-500" />}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-gray-400 hidden sm:block">{rule.category}</span>
                  <Badge color={ACTION_COLOR[rule.action]} className="capitalize whitespace-nowrap hidden sm:flex">
                    {ACTION_LABEL[rule.action]}
                  </Badge>
                  <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">No rules match the current filters</div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdd && <RuleModal onClose={() => setShowAdd(false)} onSave={addRule} />}
      </AnimatePresence>
    </div>
  )
}
