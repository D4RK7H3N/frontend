import { useState, useEffect, useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { Search, Download, CreditCard, Printer, Loader2, Check, X, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import ReceiptComponent from '../components/Receipt'
import { financeAPI } from '../services/api'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [toast, setToast] = useState(null)
  const [triggerPrint, setTriggerPrint] = useState(false)
  const receiptRef = useRef(null)

  const reactToPrintFn = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Official Receipt',
    onBeforePrint: () => Promise.resolve(),
    onAfterPrint: () => setShowReceipt(false),
  })

  useEffect(() => {
    if (triggerPrint && showReceipt && selectedPayment && receiptRef.current) {
      setTriggerPrint(false)
      reactToPrintFn()
    }
  }, [triggerPrint, showReceipt, selectedPayment, receiptRef, reactToPrintFn])

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [search, statusFilter, payments])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const data = await financeAPI.getPayments()
      setPayments(data.results || data || [])
    } catch (err) {
      showToast('Failed to load payments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]
    if (search) {
      filtered = filtered.filter(p =>
        p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.or_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.id?.toString().includes(search)
      )
    }
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }
    setFilteredPayments(filtered)
  }

  const handlePrintReceipt = useCallback((payment) => {
    setSelectedPayment(payment)
    setShowReceipt(true)
    setTriggerPrint(true)
  }, [])

  const handleExportCSV = () => {
    const headers = ['OR Number', 'Student', 'Type', 'Amount', 'Method', 'Status', 'Date']
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(p => [
        p.or_number || '',
        p.student_name || '',
        p.payment_type || 'Payment',
        p.amount || 0,
        p.payment_method || 'Cash',
        p.status || '',
        p.payment_date || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    showToast('Payments exported successfully')
  }

  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  const statCards = [
    { label: 'Total Collected', value: `₱${totalCollected.toLocaleString()}`, icon: CheckCircle, color: 'green', bg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Completed', value: payments.filter(p => p.status === 'completed').length, icon: CreditCard, color: 'blue', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Pending', value: payments.filter(p => p.status === 'pending').length, icon: Clock, color: 'amber', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Cancelled', value: payments.filter(p => p.status === 'cancelled').length, icon: X, color: 'red', bg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="View all payment transactions"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Finance' }, { label: 'Payments' }]}
        actions={
          <div className="flex gap-2">
            <ActionButton icon={Download} variant="outline" size="sm" onClick={handleExportCSV}>
              Export
            </ActionButton>
            <ActionButton icon={CreditCard} size="sm">
              Record Payment
            </ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-2xl p-4 sm:p-5 border border-transparent hover:border-${stat.color}-200 transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                <stat.icon size={20} className={stat.iconColor} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, OR number, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 focus:bg-white"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-gray-500 text-sm">Loading payments...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <CreditCard size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No payments found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || statusFilter ? 'Try adjusting your search or filters' : 'No payment records available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">OR Number</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Method</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                        {payment.or_number || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {(payment.student_name || '?')[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[140px]">{payment.student_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">{payment.payment_type || 'Payment'}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800">₱{(parseFloat(payment.amount) || 0).toLocaleString()}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-gray-500">{payment.payment_method || 'Cash'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={payment.status || 'pending'} /></td>
                    <td className="px-4 py-3.5 text-gray-500 hidden lg:table-cell">{payment.payment_date || 'N/A'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handlePrintReceipt(payment)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        title="Print Receipt"
                      >
                        <Printer size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showReceipt && selectedPayment && (
        <ReceiptComponent ref={receiptRef} data={selectedPayment} type="official" />
      )}

      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-slide-up flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  )
}