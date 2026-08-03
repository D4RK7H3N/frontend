import { ChevronRight } from 'lucide-react'
export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="border-b border-gray-200 pb-3 mb-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight size={11} />}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-gray-800">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={index === breadcrumbs.length - 1 ? 'text-gray-700' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}