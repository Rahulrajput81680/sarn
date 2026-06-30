import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, AlertTriangle, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import axiosInstance from '../../api/axios'

const TERMS = [
  {
    title: 'Recipients must have consented',
    body: 'You may only send messages to contacts who have explicitly opted in to receive WhatsApp communications from your business. Sending to people who did not consent is a violation of Meta\'s policies and applicable laws.',
  },
  {
    title: 'No spam or misleading content',
    body: 'Messages must be relevant, accurate, and expected by the recipient. Sending promotional content disguised as transactional messages, or sending unsolicited marketing, is prohibited.',
  },
  {
    title: 'Honour opt-outs immediately',
    body: 'When a contact replies with STOP, UNSUBSCRIBE, or similar, they must never receive another message. SarnConnect handles this automatically — do not attempt to bypass it.',
  },
  {
    title: 'Comply with Meta WhatsApp Business Policy',
    body: 'All messages sent through this platform must comply with Meta\'s WhatsApp Business Policy and Commerce Policy. Prohibited industries and content types (adult content, weapons, regulated substances, etc.) are not allowed.',
  },
  {
    title: 'Platform enforcement',
    body: 'SarnConnect monitors for high failure rates and spam complaints. Accounts with abuse patterns will be suspended without notice. Repeated violations will result in permanent termination and may be reported to Meta.',
  },
]

export default function TOSModal({ onAccepted }) {
  const [checked,  setChecked]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleAccept = async () => {
    if (!checked) { toast.error('Please read and check the box to confirm you agree'); return }
    setLoading(true)
    try {
      await axiosInstance.post('/api/v1/profile/accept-tos')
      toast.success('Terms accepted — you can now send campaigns')
      onAccepted()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bulk Messaging Terms of Service</h2>
              <p className="text-xs text-amber-100 mt-0.5">Required before sending campaigns</p>
            </div>
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-2.5 px-6 py-3 bg-amber-50 border-b border-amber-100">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Misuse of bulk messaging can get your WhatsApp Business Account permanently banned by Meta.
            Read these terms carefully before proceeding.
          </p>
        </div>

        {/* Terms list */}
        <div className="px-6 py-4 space-y-4 max-h-72 overflow-y-auto">
          {TERMS.map((term, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-green-700">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{term.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{term.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Checkbox + actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setChecked(v => !v)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                checked ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'
              }`}
            >
              {checked && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm text-gray-700 leading-relaxed">
              I have read and agree to these terms. I confirm that all contacts in my campaigns
              have consented to receive WhatsApp messages from my business.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <ShieldCheck size={15} />
            )}
            I Accept — Enable Bulk Messaging
          </button>
        </div>
      </motion.div>
    </div>
  )
}
