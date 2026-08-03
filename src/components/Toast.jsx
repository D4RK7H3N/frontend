import { useEffect } from 'react'
import { AlertCircle, Check, AlertTriangle, Info, X } from 'lucide-react'

const icons = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}
const colors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
  info: 'bg-blue-600',
}

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  const Icon = icons[type] || Check

  useEffect(() => {
    if (!message || !duration) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className="fixed bottom-6 left-6 z-[9999] animate-slide-up">
      <div className={`${colors[type] || colors.success} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-md`}>
        <Icon size={18} className="shrink-0" />
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white shrink-0">
          <X size={16} />
        </button>
      </div>
      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  )
}
