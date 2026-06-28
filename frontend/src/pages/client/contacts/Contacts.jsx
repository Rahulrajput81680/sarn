import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Upload, Download, X, Check, ChevronDown,
  Edit2, Trash2, Ban, StickyNote, Tag, Filter, Phone,
  CheckCircle2, XCircle, AlertTriangle, MoreHorizontal,
  FileDown, Clock, Sliders,
} from 'lucide-react'
import PageHeader from '../../../components/layout/PageHeader'
import api from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Constants ─────────────────────────────────────────── */

const ALL_TAGS   = ['Lead', 'Customer', 'Interested', 'Follow-up']
const TAG_COLOR  = {
  Lead:       'bg-blue-50 text-blue-700 border-blue-200',
  Customer:   'bg-green-50 text-green-700 border-green-200',
  Interested: 'bg-purple-50 text-purple-700 border-purple-200',
  'Follow-up':'bg-amber-50 text-amber-700 border-amber-200',
}
const SOURCES    = ['Website', 'Facebook Ad', 'WhatsApp', 'Referral', 'Event', 'Other']
const PRODUCTS   = ['Basic Plan', 'Pro Plan', 'Enterprise', 'Add-on A', 'Add-on B']
const CITIES     = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata']

/* ─── Helpers ────────────────────────────────────────────── */

function normalizeContact(c) {
  return {
    id: c._id || c.id,
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    tags: c.tags || [],
    optIn: c.isOptedIn !== false,
    blocked: c.status === 'blocked',
    lastInteraction: c.lastContactDate
      ? new Date(c.lastContactDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : 'Never',
    city: c.city || '',
    product: c.product || '',
    source: c.source || '',
    notes: c.notes || '',
  }
}

function TagChip({ label, onRemove }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${TAG_COLOR[label] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {label}
      {onRemove && (
        <button onClick={() => onRemove(label)} className="hover:opacity-70 transition-opacity ml-0.5">
          <X size={9} />
        </button>
      )}
    </span>
  )
}

/* ─── Add / Edit drawer ──────────────────────────────────── */

const EMPTY = { name: '', phone: '', tags: [], optIn: true, blocked: false, city: '', product: '', source: '', notes: '' }

function ContactDrawer({ contact, onSave, onClose }) {
  const [form, setForm] = useState(contact ? { ...contact } : { ...EMPTY })

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  const valid = form.name.trim() && form.phone.trim()

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">{contact ? 'Edit Contact' : 'Add Contact'}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile Number *</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                    form.tags.includes(tag)
                      ? TAG_COLOR[tag]
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {form.tags.includes(tag) && <Check size={10} className="inline mr-1" />}
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Opt-in + Blocked toggles */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'optIn',   label: 'WhatsApp Opt-in', desc: 'Agreed to receive messages' },
              { key: 'blocked', label: 'Blocklisted',     desc: 'No messages will be sent' },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                className={`p-3 rounded-xl border-2 ${form[key] ? (key === 'blocked' ? 'border-red-300 bg-red-50' : 'border-green-400 bg-green-50') : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-semibold text-gray-900">{label}</p>
                  <button
                    onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                    className={`relative transition-colors duration-200 rounded-full`}
                    style={{ width: 36, height: 20, backgroundColor: form[key] ? (key === 'blocked' ? '#ef4444' : '#16a34a') : '#d1d5db' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200"
                      style={{ transform: form[key] ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>

          {/* Custom fields */}
          <div className="pt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Fields</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">City</label>
                <select
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Select city</option>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Product Interest</label>
                <select
                  value={form.product}
                  onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Select product</option>
                  {PRODUCTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Source</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Select source</option>
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1.5">
              <StickyNote size={11} /> Contact Notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Add notes about this contact…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none transition-shadow"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!valid}
            onClick={() => { onSave(form); onClose() }}
            className="flex items-center gap-2 px-5 py-2 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Check size={14} />
            {contact ? 'Save Changes' : 'Add Contact'}
          </motion.button>
        </div>
      </motion.aside>
    </motion.div>,
    document.body
  )
}

/* ─── Import modal ───────────────────────────────────────── */

function ImportModal({ onClose, onImport }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Import Contacts</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-150 ${
            dragging ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
          <Upload size={22} className={`mx-auto mb-2 ${dragging ? 'text-green-500' : 'text-gray-300'}`} />
          {file ? (
            <p className="text-sm font-medium text-green-700">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-600">Drop CSV here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Columns: name, phone, tags, city, product, source</p>
            </>
          )}
        </div>

        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Duplicates (by phone number) will be skipped automatically.</p>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">Cancel</button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!file}
            onClick={() => { onImport(file); onClose() }}
            className="flex items-center gap-2 px-5 py-2 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Upload size={14} /> Import
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

/* ─── Row action menu ────────────────────────────────────── */

function RowMenu({ contact, onEdit, onDelete, onToggleBlock, onNotes }) {
  const [open, setOpen] = useState(false)
  const items = [
    { key: 'edit',   label: 'Edit',              icon: Edit2 },
    { key: 'notes',  label: 'View Notes',         icon: StickyNote },
    { key: 'block',  label: contact.blocked ? 'Unblock' : 'Blocklist', icon: Ban, danger: !contact.blocked },
    { key: 'delete', label: 'Delete',             icon: Trash2, danger: true },
  ]
  const handlers = { edit: onEdit, notes: onNotes, block: onToggleBlock, delete: onDelete }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[148px]"
            >
              {items.map(({ key, label, icon: Icon, danger }) => (
                <button
                  key={key}
                  onClick={() => { handlers[key](); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${danger ? 'text-red-600' : 'text-gray-700'}`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Notes panel ────────────────────────────────────────── */

function NotesPanel({ contact, onClose, onSave }) {
  const [text, setText] = useState(contact.notes || '')
  return createPortal(
    <motion.div className="fixed inset-0 z-50 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.26, ease: EASE_OUT }}
        className="w-80 bg-white h-full flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Contact Notes</p>
            <p className="text-xs text-gray-400">{contact.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={15} /></button>
        </div>
        <div className="flex-1 p-4">
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write notes about this contact…"
            className="w-full h-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
          />
        </div>
        <div className="border-t border-gray-100 px-4 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">Cancel</button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { onSave(text); onClose() }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-medium rounded-lg"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Check size={13} /> Save Note
          </motion.button>
        </div>
      </motion.aside>
    </motion.div>,
    document.body
  )
}

/* ─── Filter panel ───────────────────────────────────────── */

function FilterPanel({ filters, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
        {/* By Tag */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">By Tag</label>
          <div className="space-y-1">
            {ALL_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.tags.includes(tag)}
                  onChange={() => onChange('tags', tag)}
                  className="accent-green-600"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
        {/* By Campaign activity */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Campaign Activity</label>
          {['Any', 'Engaged', 'Not Engaged', 'Never Received'].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer mb-1">
              <input
                type="radio"
                name="campaignActivity"
                checked={filters.campaignActivity === opt}
                onChange={() => onChange('campaignActivity', opt)}
                className="accent-green-600"
              />
              {opt}
            </label>
          ))}
        </div>
        {/* By Last response */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Last Response</label>
          {['Any', 'Today', 'This Week', 'This Month', 'Never'].map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer mb-1">
              <input
                type="radio"
                name="lastResponse"
                checked={filters.lastResponse === opt}
                onChange={() => onChange('lastResponse', opt)}
                className="accent-green-600"
              />
              {opt}
            </label>
          ))}
        </div>
        {/* By Custom field */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Custom Field</label>
          <select
            value={filters.city}
            onChange={(e) => onChange('city', e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white mb-2 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All cities</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={filters.source}
            onChange={(e) => onChange('source', e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main page ──────────────────────────────────────────── */

const DEFAULT_FILTERS = { tags: [], campaignActivity: 'Any', lastResponse: 'Any', city: '', source: '' }

export default function Contacts() {
  const [contacts,   setContacts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [editTarget, setEditTarget] = useState(null)   // null=closed, false=new, obj=editing
  const [notesTarget,setNotesTarget]= useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showFilters,setShowFilters]= useState(false)
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS)
  const [toast,      setToast]      = useState(null)
  const [selected,   setSelected]   = useState([])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/contacts?limit=200')
      setContacts((data.data?.contacts || []).map(normalizeContact))
    } catch {
      showToast('Failed to load contacts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  /* Filter logic */
  const filtered = contacts.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false
    if (filters.tags.length && !filters.tags.some((t) => c.tags.includes(t))) return false
    if (filters.city && c.city !== filters.city) return false
    if (filters.source && c.source !== filters.source) return false
    return true
  })

  const updateFilter = (key, value) => {
    if (key === 'tags') {
      setFilters((f) => ({
        ...f,
        tags: f.tags.includes(value) ? f.tags.filter((t) => t !== value) : [...f.tags, value],
      }))
    } else {
      setFilters((f) => ({ ...f, [key]: value }))
    }
  }

  const activeFilterCount = filters.tags.length + (filters.campaignActivity !== 'Any' ? 1 : 0) +
    (filters.lastResponse !== 'Any' ? 1 : 0) + (filters.city ? 1 : 0) + (filters.source ? 1 : 0)

  /* CRUD */
  const handleSave = async (form) => {
    const payload = {
      name: form.name, phone: form.phone, email: form.email || '',
      tags: form.tags, notes: form.notes || '', source: form.source || '',
      isOptedIn: form.optIn, city: form.city || '', product: form.product || '',
      status: form.blocked ? 'blocked' : (form.optIn ? 'active' : 'opted-out'),
    }
    try {
      if (form.id) {
        const { data } = await api.put(`/api/v1/contacts/${form.id}`, payload)
        setContacts((cs) => cs.map((c) => c.id === form.id ? normalizeContact(data.data.contact) : c))
        showToast('Contact updated.')
      } else {
        const { data } = await api.post('/api/v1/contacts', payload)
        setContacts((cs) => [normalizeContact(data.data.contact), ...cs])
        showToast('Contact added.')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save contact.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/v1/contacts/${id}`)
      setContacts((cs) => cs.filter((c) => c.id !== id))
      showToast('Contact deleted.')
    } catch {
      showToast('Failed to delete contact.')
    }
  }

  const handleToggleBlock = async (id) => {
    const c = contacts.find((c) => c.id === id)
    if (!c) return
    const newStatus = c.blocked ? 'active' : 'blocked'
    try {
      await api.put(`/api/v1/contacts/${id}`, { status: newStatus })
      setContacts((cs) => cs.map((c) => c.id === id ? { ...c, blocked: newStatus === 'blocked' } : c))
      showToast(c.blocked ? 'Contact unblocked.' : 'Contact blocklisted.')
    } catch {
      showToast('Failed to update contact.')
    }
  }

  const handleSaveNotes = async (id, text) => {
    try {
      await api.put(`/api/v1/contacts/${id}`, { notes: text })
      setContacts((cs) => cs.map((c) => c.id === id ? { ...c, notes: text } : c))
      showToast('Notes saved.')
    } catch {
      showToast('Failed to save notes.')
    }
  }

  const toggleSelect = (id) => setSelected((s) => s.includes(id) ? s.filter((i) => i !== id) : [...s, id])
  const toggleAll    = () => setSelected(selected.length === filtered.length ? [] : filtered.map((c) => c.id))

  const handleExport = async () => {
    try {
      const res = await api.get('/api/v1/contacts/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'contacts.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast('Export failed.')
    }
  }

  const handleBulkDelete = async () => {
    try {
      const { data } = await api.delete('/api/v1/contacts/bulk', { data: { ids: selected } })
      setContacts((cs) => cs.filter((c) => !selected.includes(c.id)))
      showToast(`Deleted ${data.data?.deleted ?? selected.length} contacts.`)
      setSelected([])
    } catch {
      showToast('Failed to delete contacts.')
    }
  }

  const handleImport = async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/api/v1/contacts/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      showToast(`${data.data?.imported ?? 0} contacts imported.`)
      fetchContacts()
    } catch (err) {
      showToast(err.response?.data?.message || 'Import failed.')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <PageHeader title="Contacts" description="Manage your contact lists and segments" />
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 bg-white transition-colors"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Download size={14} /> Export
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowImport(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 bg-white transition-colors"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Upload size={14} /> Import
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setEditTarget(false)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-sm font-medium rounded-lg"
            style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
          >
            <Plus size={14} /> Add Contact
          </motion.button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl"
          >
            <CheckCircle2 size={15} className="text-green-600" />
            <p className="text-sm font-medium text-green-800 flex-1">{toast}</p>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-gray-100 space-y-2.5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or phone…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>

            {/* Filter toggle */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowFilters((f) => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-green-50 border-green-400 text-green-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1)' }}
            >
              <Sliders size={13} /> Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-green-100 text-gray-800 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>

            {/* Reset filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Reset
              </button>
            )}

            {/* Count */}
            <p className="text-xs text-gray-400 ml-auto">{filtered.length} contacts</p>
          </div>

          {/* Tag quick filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => updateFilter('tags', tag)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors duration-100 ${
                  filters.tags.includes(tag) ? TAG_COLOR[tag] : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Advanced filter panel */}
          <AnimatePresence>
            {showFilters && <FilterPanel filters={filters} onChange={updateFilter} />}
          </AnimatePresence>
        </div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="px-5 py-2.5 bg-green-50 border-b border-green-100 flex items-center gap-3"
            >
              <p className="text-xs font-medium text-green-800">{selected.length} selected</p>
              <button onClick={handleBulkDelete} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium">
                <Trash2 size={12} /> Delete
              </button>
              <button onClick={handleExport} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium">
                <FileDown size={12} /> Export selected
              </button>
              <button onClick={() => setSelected([])} className="ml-auto text-xs text-gray-400 hover:text-gray-600"><X size={13} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="accent-green-600"
                  />
                </th>
                <th className="text-left px-3 py-3">Name</th>
                <th className="text-left px-3 py-3">Mobile</th>
                <th className="text-left px-3 py-3">Tags</th>
                <th className="text-left px-3 py-3">Last Interaction</th>
                <th className="text-left px-3 py-3">Opt-in</th>
                <th className="text-left px-3 py-3">City</th>
                <th className="text-left px-3 py-3">Source</th>
                <th className="px-3 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: EASE_OUT, delay: i * 0.025 }}
                    className={`border-b border-gray-50 transition-colors duration-100 ${
                      c.blocked ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'
                    } ${selected.includes(c.id) ? 'bg-green-50/60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="accent-green-600"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <span className="text-green-700 text-xs font-bold">{c.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            {c.name}
                            {c.blocked && <Ban size={11} className="text-red-400" />}
                            {c.notes && <StickyNote size={11} className="text-amber-400" />}
                          </p>
                          {c.product && <p className="text-xs text-gray-400">{c.product}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs font-mono whitespace-nowrap">
                      <span className="flex items-center gap-1"><Phone size={10} className="text-gray-300" />{c.phone}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {c.tags.map((tag) => <TagChip key={tag} label={tag} />)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
                      <span className="flex items-center gap-1"><Clock size={10} />{c.lastInteraction}</span>
                    </td>
                    <td className="px-3 py-3">
                      {c.optIn
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 size={11} />Opted in</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle size={11} />Opted out</span>
                      }
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{c.city || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-400">{c.source || '—'}</td>
                    <td className="px-3 py-3">
                      <RowMenu
                        contact={c}
                        onEdit={() => setEditTarget(c)}
                        onDelete={() => handleDelete(c.id)}
                        onToggleBlock={() => handleToggleBlock(c.id)}
                        onNotes={() => setNotesTarget(c)}
                      />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <p className="text-sm text-gray-400">Loading contacts…</p>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <Users size={28} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">No contacts found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{contacts.length} total contacts · {contacts.filter((c) => c.blocked).length} blocklisted</p>
          <p className="text-xs text-gray-400">{contacts.filter((c) => c.optIn).length} opted in</p>
        </div>
      </div>

      {/* Drawers / modals */}
      <AnimatePresence>
        {editTarget !== null && (
          <ContactDrawer
            contact={editTarget || null}
            onSave={handleSave}
            onClose={() => setEditTarget(null)}
          />
        )}
        {notesTarget && (
          <NotesPanel
            contact={notesTarget}
            onClose={() => setNotesTarget(null)}
            onSave={(text) => handleSaveNotes(notesTarget.id, text)}
          />
        )}
        {showImport && (
          <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />
        )}
      </AnimatePresence>
    </div>
  )
}
