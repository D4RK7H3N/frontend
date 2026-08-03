import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLoading } from '../context/LoadingContext'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'

export default function GlobalLoadingScreen() {
  const { isLoading } = useLoading()
  const { schoolName, schoolShortName, schoolLogo } = useSchoolConfig()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setVisible(false)
      return
    }
    const timer = setTimeout(() => setVisible(true), 10000)
    return () => clearTimeout(timer)
  }, [isLoading])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 overflow-hidden">
          {schoolLogo ? (
            <img src={schoolLogo} alt={schoolShortName} className="w-full h-full object-contain p-1.5" />
          ) : (
            <Loader2 size={28} className="text-white animate-spin" />
          )}
        </div>
        {schoolLogo && (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <p className="text-gray-600 text-sm font-medium">{schoolName || 'Loading...'}</p>
        <p className="text-gray-400 text-xs -mt-2">Please wait</p>
      </div>
    </div>
  )
}
