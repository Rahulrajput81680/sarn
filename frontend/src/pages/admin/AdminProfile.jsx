import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Shield, Calendar, Save } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import useAuthStore from '../../store/authStore'
import axiosInstance from '../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

// Admin's own account page — deliberately distinct from the client-facing Profile.jsx. A
// platform admin has no business/WhatsApp of their own to configure, so this only covers what's
// actually real for this account: identity (avatar/name) and login email.
export default function AdminProfile() {
  const { user, token, setAuth } = useAuthStore()
  const fileRef = useRef(null)
  const [avatar, setAvatar]     = useState(null)
  const [name, setName]         = useState(user?.name || '')
  const [joinedAt, setJoinedAt] = useState(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    axiosInstance.get('/api/v1/profile').then(({ data }) => {
      const u = data.data.user
      setJoinedAt(u.createdAt)
      setName(u.name || '')
    }).catch(() => {})
  }, [])

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
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const { data } = await axiosInstance.put('/api/v1/profile', { name })
      setAuth({ ...user, ...data.data.user }, token)
      toast.success('Profile saved')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'A'
  const joinedFormatted = joinedAt
    ? new Date(joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader
        title="My Profile"
        description="Your platform administrator account"
        breadcrumbs={['Admin', 'My Profile']}
        action={<Button onClick={handleSave} loading={saving} icon={<Save size={14} />}>Save Changes</Button>}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center overflow-hidden">
              {(avatar || user?.avatar)
                ? <img src={avatar || user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white text-2xl font-bold">{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border-2 border-red-300 flex items-center justify-center shadow hover:bg-red-50 transition-colors"
            >
              <Camera size={10} className="text-red-600" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">{name || 'Admin'}</h2>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                <Shield size={10} /> Super Admin
              </span>
              {joinedFormatted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                  <Calendar size={10} /> Joined {joinedFormatted}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: EASE_OUT, delay: 0.05 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <div className="border-b border-gray-100 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Personal Information</h3>
          <p className="text-xs text-gray-400 mt-0.5">Your login identity</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
