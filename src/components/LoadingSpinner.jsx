import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ message = 'Loading...', fullPage = true }) {
  if (fullPage) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-blue-600" />
          <p className="text-gray-500 text-sm">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-4">
      <Loader2 size={24} className="animate-spin text-blue-600" />
      {message && <span className="ml-2 text-gray-500 text-sm">{message}</span>}
    </div>
  )
}