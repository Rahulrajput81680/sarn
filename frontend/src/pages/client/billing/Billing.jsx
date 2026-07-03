import { useNavigate } from 'react-router-dom'
import { CreditCard, ArrowLeft } from 'lucide-react'

export default function Billing() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-5">
        <CreditCard size={28} className="text-green-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Billing Coming Soon</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        Subscription management will be available shortly. Contact us if you need to discuss your plan.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </button>
    </div>
  )
}
