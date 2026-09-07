import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'sonner'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import axiosInstance from '../../api/axios'

const EASE_OUT = [0.23, 1, 0.32, 1]

// Admin's own settings — deliberately distinct from the client-facing Settings.jsx. No WhatsApp
// Business tab (an admin has no WABA of their own), no Danger Zone/self-delete (not appropriate
// for a shared platform-owner account), no Notifications tab (there's no real admin-notification
// backend to back it — better to have one honest section than several fake ones).
export default function AdminSettings() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pw, setPw]         = useState({ current: '', newPw: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const strength = [
    pw.newPw.length >= 8,
    /[A-Z]/.test(pw.newPw),
    /[0-9]/.test(pw.newPw),
    /[^A-Za-z0-9]/.test(pw.newPw),
  ].filter(Boolean).length

  const handleSave = async () => {
    if (!pw.current)             { toast.error('Enter your current password'); return }
    if (pw.newPw.length < 8)     { toast.error('New password must be at least 8 characters'); return }
    if (pw.newPw !== pw.confirm) { toast.error('Passwords do not match'); return }
    setSaving(true)
    try {
      await axiosInstance.put('/api/v1/profile/password', { currentPassword: pw.current, newPassword: pw.newPw })
      setPw({ current: '', newPw: '', confirm: '' })
      toast.success('Password changed successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Settings" description="Manage your admin account" breadcrumbs={['Admin', 'Settings']} />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5"
      >
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-sm font-semibold text-gray-800">Change Password</h3>
          <p className="text-xs text-gray-400 mt-0.5">Use a strong password you don't use elsewhere</p>
        </div>

        <div className="flex flex-col gap-3 max-w-sm">
          {[
            { label: 'Current Password', key: 'current', show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
            { label: 'New Password',     key: 'newPw',   show: showNew,     toggle: () => setShowNew((v) => !v) },
            { label: 'Confirm Password', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm((v) => !v) },
          ].map(({ label, key, show, toggle }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw[key]}
                  onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}

          {pw.newPw && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Password strength</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={clsx(
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= strength
                        ? strength <= 1 ? 'bg-red-400'
                          : strength <= 2 ? 'bg-amber-400'
                          : strength <= 3 ? 'bg-blue-400'
                          : 'bg-green-500'
                        : 'bg-gray-100'
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSave} loading={saving} size="sm" className="w-fit">
            Update Password
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
