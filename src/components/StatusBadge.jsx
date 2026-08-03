import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

const statusConfig = {
  active: { label: 'Active', bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
  enrolled: { label: 'Enrolled', bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
  approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
  operational: { label: 'Operational', bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },
  cleared: { label: 'Cleared', bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle },

  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Clock },
  processing: { label: 'Processing', bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Clock },
  partial: { label: 'Partial', bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Clock },
  graded: { label: 'Graded', bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Clock },

  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
  dropped: { label: 'Dropped', bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
  overdue: { label: 'Overdue', bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },
  refunded: { label: 'Refunded', bg: 'bg-red-100', text: 'text-red-600', icon: XCircle },

  recorded: { label: 'Recorded', bg: 'bg-blue-100', text: 'text-blue-600', icon: AlertCircle },

  low: { label: 'Low Stock', bg: 'bg-orange-100', text: 'text-orange-600', icon: AlertCircle },
  unavailable: { label: 'Unavailable', bg: 'bg-gray-100', text: 'text-gray-600', icon: XCircle },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: AlertCircle,
  }

  const IconComponent = config.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <IconComponent size={12} />
      {config.label}
    </span>
  )
}