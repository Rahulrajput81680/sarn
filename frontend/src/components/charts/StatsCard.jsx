import clsx from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatsCard({ title, value, delta, deltaType, icon, loading, suffix }) {
  const deltaIcon = {
    positive: <TrendingUp size={12} />,
    negative: <TrendingDown size={12} />,
    neutral: <Minus size={12} />,
  }
  const deltaColor = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-500 bg-red-50',
    neutral: 'text-gray-500 bg-gray-50',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <span className="p-2 rounded-lg bg-green-50 text-green-600">{icon}</span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {suffix && <span className="text-base font-normal text-gray-400 ml-1">{suffix}</span>}
          </p>
          {delta != null && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit',
                deltaColor[deltaType || 'neutral']
              )}
            >
              {deltaIcon[deltaType || 'neutral']}
              {delta}
            </span>
          )}
        </>
      )}
    </div>
  )
}
