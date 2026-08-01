import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, ShieldCheck, AlertTriangle } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import axiosInstance from '../../api/axios'
import { ROLES } from '../../constants/roles'

const EASE_OUT = [0.23, 1, 0.32, 1]

export default function AdminLogin() {
  const navigate    = useNavigate()
  const { setAuth } = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await axiosInstance.post('/api/v1/auth/login', { email, password })
      const { user, token, refreshToken } = res.data.data

      if (user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.ADMIN) {
        setError('Access denied. This panel is for platform administrators only.')
        setLoading(false)
        return
      }

      setAuth(user, token, refreshToken)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Access denied.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4">
      {/* Red top stripe */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-red-500 z-50" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="w-full max-w-sm"
      >
        {/* Logo + header */}
        <div className="flex flex-col items-center mt-7 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-900/40">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Master Admin</h1>
          <p className="text-sm text-slate-400 mt-1">SarnConnect Control Panel</p>
        </div>

        {/* Warning */}
        <div className="flex items-center gap-2 px-4 py-3 bg-red-900/30 border border-red-700/40 rounded-xl mb-6">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-300">Authorized personnel only. All access is logged and monitored.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Admin Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@SarnConnect.io"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2.5 bg-red-900/40 border border-red-600/40 rounded-lg"
            >
              <AlertTriangle size={13} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Authenticating…
              </>
            ) : (
              <><ShieldCheck size={15} /> Sign In to Admin Panel</>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mb-7 mt-6">
          Not an admin?{' '}
          <a href="/login" className="text-slate-400 hover:text-white transition-colors">Client login →</a>
        </p>
      </motion.div>
    </div>
  )
}
