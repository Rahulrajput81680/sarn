import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, Building2, Globe, MapPin,
  Camera, Shield, Calendar, Smartphone, Save,
  CheckCircle, Briefcase, Hash, BadgeCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import useAuthStore from '../../../store/authStore'
import axiosInstance from '../../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

const BUSINESS_CATEGORIES = [
  'E-commerce', 'Education', 'Healthcare', 'Finance', 'Real Estate',
  'Travel & Hospitality', 'Food & Beverage', 'Retail', 'Technology',
  'Marketing & Advertising', 'Consulting', 'Logistics', 'Other',
]

const WA_CATEGORIES = [
  'Auto', 'Beauty, Spa and Salon', 'Clothing and Apparel', 'Education',
  'Entertainment', 'Event Planning and Service', 'Finance and Banking',
  'Food and Grocery', 'Government', 'Hotel and Lodging', 'Medical and Health',
  'Non-profit', 'Professional Services', 'Shopping and Retail',
  'Travel and Transportation', 'Restaurant', 'Other',
]

function Section({ title, description, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT, delay }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5"
    >
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </motion.div>
  )
}

export default function Profile() {
  const { user, setAuth, token } = useAuthStore()
  const fileRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [avatar, setAvatar] = useState(null)

  const [personal, setPersonal] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    designation: user?.designation || '',
  })

  const [business, setBusiness] = useState({
    businessName: user?.businessName || '',
    category: user?.category || '',
    description: user?.description || '',
    website: user?.website || '',
    address: user?.address || '',
  })

  const [waProfile, setWaProfile] = useState({
    displayName: user?.waDisplayName || '',
    waCategory: user?.waCategory || '',
    waDescription: user?.waDescription || '',
  })

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return }
    setAvatar(URL.createObjectURL(file))
    try {
      const form = new FormData()
      form.append('avatar', file)
      const { data } = await axiosInstance.post('/api/v1/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAuth({ ...user, avatar: data.data.avatarUrl }, token)
      toast.success('Photo updated')
    } catch {
      toast.error('Failed to upload photo')
    }
  }

  const handleSave = async () => {
    if (!personal.name.trim()) { toast.error('Full name is required'); return }
    if (!personal.email.trim()) { toast.error('Email is required'); return }
    setSaving(true)
    try {
      const { data } = await axiosInstance.put('/api/v1/profile', {
        ...personal, ...business, ...waProfile,
      })
      setAuth({ ...user, ...data.data.user }, token)
      toast.success('Profile saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = personal.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="My Profile"
        description="Manage your personal and business information"
        action={
          <Button onClick={handleSave} loading={saving} icon={<Save size={14} />}>
            Save Changes
          </Button>
        }
      />

      {/* Identity card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <div className="flex items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden">
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white text-xl sm:text-2xl font-bold">{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-green-300 flex items-center justify-center shadow hover:bg-green-50 transition-colors"
            >
              <Camera size={10} className="text-green-600" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {personal.name || 'Your Name'}
            </h2>
            <p className="text-sm text-gray-400 truncate">{personal.email || 'your@email.com'}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                <Shield size={10} />
                {user?.role || 'Agent'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                <BadgeCheck size={10} />
                Verified
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                <Calendar size={10} />
                Joined Jan 2024
              </span>
            </div>
          </div>

          {/* Account ID */}
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-gray-400">Account ID</span>
            <span className="text-xs font-mono font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
              {user?.id || 'USR-00042'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Personal Information */}
      <Section
        title="Personal Information"
        description="Your login identity and contact details"
        delay={0.05}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={personal.name}
            onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Rahul Sharma"
            icon={<User size={14} />}
          />
          <Input
            label="Email Address"
            type="email"
            value={personal.email}
            onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))}
            placeholder="you@company.com"
            icon={<Mail size={14} />}
          />
          <Input
            label="Phone Number"
            type="tel"
            value={personal.phone}
            onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            icon={<Phone size={14} />}
          />
          <Input
            label="Designation"
            value={personal.designation}
            onChange={e => setPersonal(p => ({ ...p, designation: e.target.value }))}
            placeholder="e.g. Marketing Manager"
            icon={<Briefcase size={14} />}
          />
        </div>
      </Section>

      {/* Business Profile */}
      <Section
        title="Business Profile"
        description="Information about your organisation shown to contacts and on reports"
        delay={0.08}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Business Name"
            value={business.businessName}
            onChange={e => setBusiness(b => ({ ...b, businessName: e.target.value }))}
            placeholder="e.g. Acme Corp"
            icon={<Building2 size={14} />}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Business Category</label>
            <select
              value={business.category}
              onChange={e => setBusiness(b => ({ ...b, category: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
            >
              <option value="">Select category…</option>
              {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input
            label="Website URL"
            type="url"
            value={business.website}
            onChange={e => setBusiness(b => ({ ...b, website: e.target.value }))}
            placeholder="https://yourcompany.com"
            icon={<Globe size={14} />}
          />
          <Input
            label="Business Address"
            value={business.address}
            onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))}
            placeholder="City, State, Country"
            icon={<MapPin size={14} />}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Business Description</label>
          <textarea
            rows={3}
            value={business.description}
            onChange={e => setBusiness(b => ({ ...b, description: e.target.value.slice(0, 256) }))}
            placeholder="Briefly describe what your business does…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-shadow"
          />
          <p className="text-xs text-gray-400 text-right">{business.description.length} / 256</p>
        </div>
      </Section>

      {/* WhatsApp Business Profile */}
      <Section
        title="WhatsApp Business Profile"
        description="How your business appears on WhatsApp to customers"
        delay={0.11}
      >
        {/* Connected number pill */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-green-50 border border-green-100 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <Smartphone size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-green-800 uppercase tracking-wide">Connected Number</p>
            <p className="text-sm font-mono font-semibold text-green-700">+91 98765 43210</p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            value={waProfile.displayName}
            onChange={e => setWaProfile(w => ({ ...w, displayName: e.target.value }))}
            placeholder="Name shown in customer chats"
            hint="Visible to every customer you message"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">WhatsApp Business Category</label>
            <select
              value={waProfile.waCategory}
              onChange={e => setWaProfile(w => ({ ...w, waCategory: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
            >
              <option value="">Select WhatsApp category…</option>
              {WA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-xs text-gray-400">As per Meta's business category list</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">WhatsApp Business Description</label>
          <textarea
            rows={2}
            value={waProfile.waDescription}
            onChange={e => setWaProfile(w => ({ ...w, waDescription: e.target.value.slice(0, 139) }))}
            placeholder="Short description shown on your WhatsApp business profile…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 text-right">{waProfile.waDescription.length} / 139 (WhatsApp limit)</p>
        </div>
      </Section>

      {/* Footer actions */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="secondary" onClick={() => window.location.reload()} disabled={saving}>
          Discard
        </Button>
        <Button onClick={handleSave} loading={saving} icon={<Save size={14} />}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
