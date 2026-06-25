import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock, Check } from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import axiosInstance from '../../api/axios'
import { ROLES } from '../../constants/roles'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  remember: z.boolean().optional(),
})

const LEFT_FEATURES = [
  'Access your campaign dashboard',
  'Manage WhatsApp flows & templates',
  'View analytics and performance',
  '24/7 Priority Support',
]

const RIGHT_FEATURES = [
  'No setup fee',
  'Official WhatsApp Cloud API',
  '24-hour session automation',
  'AI chatbot + human handoff',
]

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })
  const { setAuth, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)

  const onSubmit = async (data) => {
    try {
      const res = await axiosInstance.post('/api/v1/auth/login', data)
      setAuth(res.data.user, res.data.token)
      toast.success('Welcome back!')
      if (res.data.user.role === ROLES.SUPER_ADMIN) {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #E5FADC 0%, #ffffff 48%, #f5e1e7 100%)' }}
    >
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 min-w-0 px-14 py-12">
        <img src="/images/sarn.png" alt="SarnConnect" className="h-10 w-auto object-contain object-left" />

        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-snug mb-8">
            Welcome Back to<br />SarnConnect
          </h1>
          <ul className="space-y-4">
            {LEFT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-gray-700 text-[15px]">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-green-600" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Trusted by leading businesses worldwide
          </p>
          <div className="overflow-hidden w-full">
            <div className="flex w-max animate-marquee opacity-50 grayscale">
              <img src="/images/Login/strip.png" alt="trusted brands" className="h-8 w-auto shrink-0 object-contain pr-8" />
              <img src="/images/Login/strip.png" alt="" aria-hidden="true" className="h-8 w-auto shrink-0 object-contain pr-8" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Center: login card ── */}
      <div className="flex items-center justify-center flex-1 lg:flex-none lg:w-[460px] xl:w-[480px] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src="/images/sarn.png" alt="SarnConnect" className="h-12 w-auto object-contain" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Login</h2>
            <p className="text-sm text-gray-500 mb-6">Access your agent dashboard.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white focus:border-transparent transition-all placeholder:text-gray-400"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white focus:border-transparent transition-all placeholder:text-gray-400"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot */}
              <div className="flex justify-end -mt-1">
                <Link to="/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-medium">
                  Forgot Password
                </Link>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-400 leading-relaxed">
                By proceeding, you agree to our{' '}
                <a href="#" className="text-green-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-800 bg-green-100 border-2 border-green-400 shadow-sm shadow-green-500 hover:bg-white/45 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in…' : 'Login'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>

            {/* Dev shortcuts */}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-400 mb-2 font-medium">Quick access (dev)</p>
              <div className="flex gap-2">
                {/* <button
                  onClick={() => {
                    setAuth({ name: 'Super Admin', email: 'admin@SarnConnect.com', role: 'super_admin' }, 'dev-token')
                    navigate('/admin')
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium"
                >
                  Admin Panel
                </button> */}
                <button
                  onClick={() => {
                    logout()
                    setAuth({ name: 'Demo User', email: 'user@SarnConnect.com', role: 'admin' }, 'dev-token-user')
                    navigate('/dashboard')
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium"
                >
                  Client Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="hidden lg:flex flex-col flex-1 min-w-0 px-12 py-12 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Why Choose <span className="text-green-600">SarnConnect</span>?
          </h2>
          <ul className="space-y-3.5 mt-6">
            {RIGHT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-gray-700 text-[15px]">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-green-600" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Meta Business Partner */}
          <div className="mt-10">
            <img
              src="/images/Login/metaIcon.webp"
              alt="Meta Business Partner"
              className="w-28 h-auto object-contain"
            />
            <p className="text-xs text-gray-400 mt-2 font-medium">Meta Business Partner</p>
          </div>
        </div>

        {/* City graphic pinned to bottom — edges fade into bg */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <img
            src="/images/Login/signup_graphics.webp"
            alt=""
            className="w-full h-auto object-cover object-bottom"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,1) 55%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,1) 55%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
