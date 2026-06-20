import { Link } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ForgotPassword() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 48%, #f0fdf4 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/icon.png" alt="Wixabotic" className="h-12 mx-auto object-contain" />
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Reset password</h2>
          <p className="text-sm text-gray-500 mb-6">We'll send a reset link to your email</p>
          <form className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" />
            <Button className="w-full justify-center">Send reset link</Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            <Link to="/login" className="text-green-600 hover:underline">← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
