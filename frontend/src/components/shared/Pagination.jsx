import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

export default function Pagination({ page, total, perPage = 25, onChange }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1
    if (page <= 4) return i + 1
    if (page >= totalPages - 3) return totalPages - 6 + i
    return page - 3 + i
  })

  return (
    <div className="flex items-center gap-1">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={clsx(
            'w-8 h-8 rounded text-sm font-medium',
            p === page ? 'bg-green-600 text-white' : 'hover:bg-gray-100 text-gray-600'
          )}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
      <span className="text-xs text-gray-400 ml-2">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
      </span>
    </div>
  )
}
