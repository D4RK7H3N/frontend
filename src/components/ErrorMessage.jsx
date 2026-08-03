import { AlertCircle, RefreshCw } from 'lucide-react'
import ActionButton from './ActionButton'

export default function ErrorMessage({ message = 'Something went wrong', onRetry, suggestion = 'Please try again or contact the administrator.' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle size={32} className="text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-600 mb-2">{message}</p>
        <p className="text-sm text-red-400 mb-4">{suggestion}</p>
        {onRetry && (
          <ActionButton 
            icon={RefreshCw} 
            variant="danger" 
            size="sm"
            onClick={onRetry}
          >
            Try Again
          </ActionButton>
        )}
      </div>
    </div>
  )
}