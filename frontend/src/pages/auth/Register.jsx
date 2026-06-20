import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  name: z.string().min(2, 'Min 2 chars'),
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 chars'),
  company: z.string().min(2, 'Required'),
})

const LEFT_FEATURES = [
  'Start free — no credit card needed',
  'Official WhatsApp Cloud API access',
  'Build chatbots & automated flows',
  '24/7 Priority Support',
]

const RIGHT_FEATURES = [
  'No setup fee',
  'Official WhatsApp Cloud API',
  '24-hour session automation',
  'AI chatbot + human handoff',
]

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #E5FADC 0%, #ffffff 48%, #f5e1e7 100%)' }}
    >
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 min-w-0 px-14 py-12">
        <img src="/images/icon.png" alt="Wixabotic" className="h-10 w-auto object-contain object-left" />

        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-snug mb-8">
            Start Growing with<br />Wixabotic
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

      {/* ── Center: register card ── */}
      <div className="flex items-center justify-center flex-1 lg:flex-none lg:w-[460px] xl:w-[480px] px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src="/images/icon.png" alt="Wixabotic" className="h-12 w-auto object-contain" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
            <p className="text-sm text-gray-500 mb-6">Start your 14-day free trial</p>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Full name"
                  placeholder="John Doe"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Company"
                  placeholder="Acme Inc."
                  error={errors.company?.message}
                  {...register('company')}
                />
              </div>
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min 8 characters"
                error={errors.password?.message}
                {...register('password')}
              />

              <p className="text-xs text-gray-400 leading-relaxed">
                By proceeding, you agree to our{' '}
                <a href="#" className="text-green-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
              </p>

              <Button type="submit" loading={isSubmitting} className="w-full justify-center">
                Create account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="hidden lg:flex flex-col flex-1 min-w-0 px-12 py-12 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Why Choose <span className="text-green-600">Wixabotic</span>?
          </h2>
          <ul className="space-y-4 mt-6">
            {RIGHT_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-gray-700 text-[15px]">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-green-600" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <img
              src="/images/Login/metaIcon.webp"
              alt="Meta Business Partner"
              className="w-28 h-auto object-contain"
            />
            <p className="text-xs text-gray-400 mt-2 font-medium">Meta Business Partner</p>
          </div>
        </div>

        {/* City graphic — edges fade into bg */}
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
