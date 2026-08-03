import { useState, useEffect, useMemo } from 'react'
import { X, Loader2, AlertTriangle, Check, Wallet, Hash, CreditCard } from 'lucide-react'

const PAYMENT_METHODS = ['Cash', 'GCash', 'Bank Transfer']

export default function StudentPaymentModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  title = 'Record Payment',
  studentName = '',
  feeLabel = 'Total Cost',
  totalCost = 0,
  amountPaid = 0,
  contextNote = '',
}) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [error, setError] = useState(null)

  const totalCostNum = useMemo(() => parseFloat(totalCost) || 0, [totalCost])
  const amountPaidNum = useMemo(() => parseFloat(amountPaid) || 0, [amountPaid])
  const remaining = useMemo(
    () => Math.max(0, totalCostNum - amountPaidNum),
    [totalCostNum, amountPaidNum]
  )

  useEffect(() => {
    if (open) {
      setAmount(remaining > 0 ? String(remaining) : '')
      setPaymentMethod('Cash')
      setReferenceNumber('')
      setError(null)
    }
  }, [open, remaining])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be greater than 0')
      return
    }
    if (amountNum > remaining) {
      setError(`Amount cannot exceed remaining balance (₱${remaining.toLocaleString()})`)
      return
    }

    setError(null)
    try {
      await onSubmit({
        amount: amountNum,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || '',
      })
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to record payment')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wallet size={18} className="text-blue-600" />
            {title}
         </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X size={18} />
         </button>
       </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
           </div>
          )}

          <div className="p-4 bg-gray-50 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Student</span>
              <span className="font-semibold text-gray-800">{studentName || 'N/A'}</span>
           </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{feeLabel}</span>
              <span className="font-semibold text-gray-800">
                ₱{totalCostNum.toLocaleString()}
             </span>
           </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Already Paid</span>
              <span className="font-medium text-gray-700">
                ₱{amountPaidNum.toLocaleString()}
             </span>
           </div>
            <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2">
              <span className="text-gray-700 font-medium">Remaining Balance</span>
              <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₱{remaining.toLocaleString()}
             </span>
           </div>
            {contextNote && (
              <p className="text-xs text-gray-400 pt-1 border-t border-gray-200">{contextNote}</p>
            )}
         </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Amount to Pay (₱) <span className="text-red-500">*</span>
           </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
           </div>
            <p className="text-xs text-gray-400 mt-1">
              Maximum: ₱{remaining.toLocaleString()}
           </p>
         </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Payment Method <span className="text-red-500">*</span>
           </label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
             </select>
           </div>
         </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Reference Number <span className="text-gray-400 font-normal">(optional)</span>
           </label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. GCash ref # or receipt #"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
           </div>
         </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
           </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {loading ? 'Processing...' : 'Confirm Payment'}
           </button>
         </div>
       </form>
     </div>
   </div>
  )
}
