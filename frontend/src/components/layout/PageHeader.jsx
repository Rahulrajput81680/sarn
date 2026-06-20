import { ChevronRight } from 'lucide-react'

export default function PageHeader({ title, breadcrumbs, action, description }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} />}
                <span className={i === breadcrumbs.length - 1 ? 'text-gray-600' : ''}>{b}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="mt-3 sm:mt-0">{action}</div>}
    </div>
  )
}
