import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { financeAPI, studentsAPI } from '../services/api'
import {
  Search, Clock, AlertCircle, Loader2, Check, X,
  Download, Eye, CreditCard, Banknote,
  ChevronLeft, ChevronRight, Filter, XCircle, AlertTriangle, CheckCircle
} from 'lucide-react'
import PesoSign from '../components/PesoSign'

const ITEMS_PER_PAGE = 10
const gradeLevels = ['Grade 11', 'Grade 12', '1st Year Bundled', '2nd Year Bundled']
const balanceRanges = [
  { value: 'all', label: 'All Balances' },
  { value: 'below_1000', label: 'Below ₱1,000' },
  { value: '1000_5000', label: '₱1,000 - ₱5,000' },
  { value: 'above_5000', label: 'Above ₱5,000' },
]
const paymentMethodsOpt = ['Cash', 'GCash', 'Bank Transfer']

export default function PendingPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState({})
  const [toast, setToast] = useState(null)

  const [search, setSearch] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedRange, setSelectedRange] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [showRecordPayment, setShowRecordPayment] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Cash',
    reference_no: '',
    notes: ''
  })
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  const [showViewStudent, setShowViewStudent] = useState(false)
  const [viewingStudent, setViewingStudent] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsData, studentsData] = await Promise.all([
        financeAPI.getTuition().catch(() => []),
        studentsAPI.getAll().catch(() => [])
      ])

      const allPayments = Array.isArray(paymentsData) ? paymentsData : (paymentsData.results || [])
      const allStudents = Array.isArray(studentsData) ? studentsData : (studentsData.results || [])

      const studentsMap = {}
      allStudents.forEach(s => {
        studentsMap[s.id] = {
          id: s.id,
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
          lrn: s.lrn,
          grade: s.current_grade_level || s.grade || '',
          section: s.section || '',
          gender: s.gender || '',
          birthday: s.date_of_birth || '',
          address: s.address || '',
          contact: s.contact_number || s.phone || '',
          guardian: s.guardian_name || '',
          guardian_contact: s.guardian_contact || '',
        }
      })

      const pendingRecords = allPayments
        .map(p => {
          const student = studentsMap[p.student_id] || {}
          const total = parseFloat(p.total_tuition || p.tuition_fee || 0)
          const paid = parseFloat(p.amount_paid || 0)
          const balance = total - paid
          const status = total > 0 && paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid'
          if (status === 'paid' || balance <= 0) return null
          return {
            ...p,
            id: p.id,
            student_id: p.student_id,
            studentName: student.name || p.student_name || 'N/A',
            lrn: student.lrn || p.lrn || 'N/A',
            grade: student.grade || 'N/A',
            section: student.section || 'N/A',
            total_tuition: total,
            amount_paid: paid,
            balance,
            last_payment_date: p.payment_date || p.updated_at || null,
            status,
          }
        })
        .filter(Boolean)

      setPayments(pendingRecords)
      setStudents(studentsMap)
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Failed to load pending payments', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedGrade, selectedSection, selectedRange])

  const filteredPayments = useMemo(() => {
    let filtered = [...payments]

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(p =>
        (p.studentName || '').toLowerCase().includes(q) ||
        (p.lrn || '').toLowerCase().includes(q)
      )
    }

    if (selectedGrade) {
      filtered = filtered.filter(p => p.grade === selectedGrade)
    }

    if (selectedSection) {
      filtered = filtered.filter(p => p.section === selectedSection)
    }

    if (selectedRange !== 'all') {
      filtered = filtered.filter(p => {
        if (selectedRange === 'below_1000') return p.balance < 1000
        if (selectedRange === '1000_5000') return p.balance >= 1000 && p.balance <= 5000
        if (selectedRange === 'above_5000') return p.balance > 5000
        return true
      })
    }

    return filtered.sort((a, b) => b.balance - a.balance)
  }, [payments, search, selectedGrade, selectedSection, selectedRange])

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPayments, currentPage])

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const totalPending = filteredPayments.reduce((sum, p) => sum + p.balance, 0)
    const studentCount = new Set(filteredPayments.map(p => p.student_id)).size
    const avgBalance = studentCount > 0 ? totalPending / studentCount : 0
    return { totalPending, studentCount, avgBalance }
  }, [filteredPayments])

  const uniqueSections = [...new Set(payments.map(p => p.section).filter(Boolean))].sort()

  const resetFilters = () => {
    setSearch('')
    setSelectedGrade('')
    setSelectedSection('')
    setSelectedRange('all')
  }

  const handleOpenRecordPayment = (payment) => {
    setSelectedPayment(payment)
    setPaymentForm({
      amount: '',
      payment_method: 'Cash',
      reference_no: '',
      notes: ''
    })
    setPaymentError(null)
    setShowRecordPayment(true)
  }

  const handleCloseRecordPayment = () => {
    setShowRecordPayment(false)
    setSelectedPayment(null)
    setPaymentForm({ amount: '', payment_method: 'Cash', reference_no: '', notes: '' })
    setPaymentError(null)
  }

  const computedRemaining = useMemo(() => {
    if (!selectedPayment) return 0
    const amount = parseFloat(paymentForm.amount) || 0
    return Math.max(0, selectedPayment.balance - amount)
  }, [selectedPayment, paymentForm.amount])

  const handleSubmitPayment = async () => {
    if (savingPayment) return
    const amount = parseFloat(paymentForm.amount)
    if (!amount || amount <= 0) {
      setPaymentError('Please enter a valid amount')
      return
    }
    if (amount > selectedPayment.balance) {
      setPaymentError('Amount cannot exceed remaining balance')
      return
    }

    setSavingPayment(true)
    setPaymentError(null)
    try {
      const newPaid = selectedPayment.amount_paid + amount
      const newTotal = selectedPayment.total_tuition
      await financeAPI.updateTuition(selectedPayment.id, {
        amount_paid: newPaid,
        total_tuition: newTotal,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentForm.payment_method.toLowerCase().replace(' ', '_'),
        notes: paymentForm.notes,
        reference_no: paymentForm.reference_no,
      })
      showToast(`Payment of ₱${amount.toLocaleString()} recorded successfully`)
      handleCloseRecordPayment()
      fetchData()
    } catch (err) {
      console.error('Payment error:', err)
      setPaymentError(err?.response?.data?.error || 'Failed to record payment')
    } finally {
      setSavingPayment(false)
    }
  }

  const handleViewStudent = (payment) => {
    const studentData = students[payment.student_id]
    setViewingStudent({ ...payment, ...studentData })
    setShowViewStudent(true)
  }

  const handleExportCSV = () => {
    const headers = ['LRN', 'Student Name', 'Grade', 'Section', 'Total Tuition', 'Amount Paid', 'Remaining Balance', 'Last Payment Date']
    const rows = filteredPayments.map(p => [
      p.lrn,
      p.studentName,
      p.grade,
      p.section,
      p.total_tuition.toLocaleString(),
      p.amount_paid.toLocaleString(),
      p.balance.toLocaleString(),
      p.last_payment_date ? new Date(p.last_payment_date).toLocaleDateString() : 'N/A',
    ])
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pending_payments_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Pending payments exported successfully')
  }

  const getBalanceColor = (balance, total) => {
    if (balance <= 0) return 'text-green-600 bg-green-50'
    const ratio = balance / total
    if (ratio > 0.7) return 'text-red-600 bg-red-50'
    if (ratio > 0.3) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const statCards = [
    { label: 'Total Pending Amount', value: `₱${stats.totalPending.toLocaleString()}`, icon: Clock, statBg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Students with Balance', value: stats.studentCount, icon: AlertCircle, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Avg Balance per Student', value: `₱${Math.round(stats.avgBalance).toLocaleString()}`, icon: PesoSign, statBg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Pending Payments"
        subtitle="Outstanding student payment balances"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Finance' }, { label: 'Pending Payments' }]}
        actions={
          <ActionButton icon={Download} variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</ActionButton>
        }
      />

      <div className="flex flex-row justify-between gap-4 mb-5">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.statBg} rounded-2xl p-4 flex-1 border border-transparent`}>
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

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Filter size={14} className="text-blue-600" /> Filters
          </h3>
          {(search || selectedGrade || selectedSection || selectedRange !== 'all') && (
            <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search student or LRN..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
          </div>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="">All Grades</option>
            {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="">All Sections</option>
            {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            {balanceRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <p className="text-gray-600 font-medium text-lg mb-1">All caught up!</p>
            <p className="text-gray-400 text-sm">
              {search || selectedGrade || selectedSection || selectedRange !== 'all' ? 'No results match your filters' : 'No pending payments found'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3.5">LRN</th>
                    <th className="px-4 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">Grade</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">Section</th>
                    <th className="px-4 py-3.5 text-right">Total Tuition</th>
                    <th className="px-4 py-3.5 text-right hidden sm:table-cell">Amount Paid</th>
                    <th className="px-4 py-3.5 text-right">Balance</th>
                    <th className="px-4 py-3.5 hidden lg:table-cell">Last Payment</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">{payment.lrn}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(payment.studentName || '?')[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{payment.studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">{payment.grade}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">{payment.section}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800">₱{payment.total_tuition.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right text-green-600 hidden sm:table-cell">₱{payment.amount_paid.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${getBalanceColor(payment.balance, payment.total_tuition)}`}>
                          ₱{payment.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-gray-500 text-xs">
                        {payment.last_payment_date ? new Date(payment.last_payment_date).toLocaleDateString() : 'No payments yet'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenRecordPayment(payment)}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                            title="Record Payment">
                            <PesoSign size={15} />
                          </button>
                          <button onClick={() => handleViewStudent(payment)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="View Student">
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showRecordPayment && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseRecordPayment} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PesoSign size={18} className="text-green-600" />
                Record Payment
              </h2>
              <button onClick={handleCloseRecordPayment} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {(selectedPayment.studentName || '?')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedPayment.studentName}</p>
                    <p className="text-xs text-gray-500">LRN: {selectedPayment.lrn}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-blue-200">
                  <span className="text-gray-500">Current Balance</span>
                  <span className="font-bold text-red-600 text-lg">₱{selectedPayment.balance.toLocaleString()}</span>
                </div>
              </div>

              {paymentError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={16} /> {paymentError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount to Pay (₱) <span className="text-red-500">*</span></label>
                  <input type="number" min="0" max={selectedPayment.balance} step="0.01"
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>

                {parseFloat(paymentForm.amount) > 0 && (
                  <div className={`p-3 rounded-xl ${computedRemaining <= 0 ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${computedRemaining <= 0 ? 'text-green-700' : 'text-blue-700'}`}>
                        Remaining Balance After Payment
                      </span>
                      <span className={`font-bold text-lg ${computedRemaining <= 0 ? 'text-green-700' : 'text-blue-700'}`}>
                        ₱{computedRemaining.toLocaleString()}
                      </span>
                    </div>
                    {computedRemaining <= 0 && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle size={12} /> Student will be fully paid!
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethodsOpt.map(method => (
                      <button key={method} onClick={() => setPaymentForm({ ...paymentForm, payment_method: method })}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${paymentForm.payment_method === method ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                        {method === 'Cash' ? <Banknote size={18} className={paymentForm.payment_method === method ? 'text-green-600' : 'text-gray-400'} /> : <CreditCard size={18} className={paymentForm.payment_method === method ? 'text-green-600' : 'text-gray-400'} />}
                        <span className={`text-xs font-medium ${paymentForm.payment_method === method ? 'text-green-700' : 'text-gray-500'}`}>{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reference Number <span className="text-gray-400">(optional)</span></label>
                  <input type="text" placeholder="e.g. GCash ref # or check #"
                    value={paymentForm.reference_no}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
                  <textarea rows={2} placeholder="Add any notes..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 resize-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseRecordPayment}>Cancel</ActionButton>
              <ActionButton onClick={handleSubmitPayment} loading={savingPayment}>Record Payment</ActionButton>
            </div>
          </div>
        </div>
      )}

      {showViewStudent && viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowViewStudent(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">Student Profile</h2>
              <button onClick={() => setShowViewStudent(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                  {(viewingStudent.studentName || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{viewingStudent.studentName}</p>
                  <p className="text-sm text-gray-500">LRN: {viewingStudent.lrn}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Grade / Section</span>
                  <span className="text-sm font-medium text-gray-800">{viewingStudent.grade} - {viewingStudent.section}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Gender</span>
                  <span className="text-sm font-medium text-gray-800">{viewingStudent.gender || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Birthday</span>
                  <span className="text-sm font-medium text-gray-800">{viewingStudent.birthday || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Contact</span>
                  <span className="text-sm font-medium text-gray-800">{viewingStudent.contact || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Address</span>
                  <span className="text-sm font-medium text-gray-800 text-right max-w-[180px]">{viewingStudent.address || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Guardian</span>
                  <span className="text-sm font-medium text-gray-800">{viewingStudent.guardian || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Guardian Contact</span>
                  <span className="text-sm font-medium text-gray-800">{viewingStudent.guardian_contact || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Tuition Summary</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="text-base font-bold text-gray-800">₱{viewingStudent.total_tuition?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Paid</p>
                    <p className="text-base font-bold text-green-600">₱{viewingStudent.amount_paid?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Balance</p>
                    <p className="text-base font-bold text-red-600">₱{viewingStudent.balance?.toLocaleString() || 0}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Payment Progress</span>
                    <span>{viewingStudent.total_tuition > 0 ? Math.round((viewingStudent.amount_paid / viewingStudent.total_tuition) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${getBalanceColor(viewingStudent.balance, viewingStudent.total_tuition).split(' ')[0].replace('text-', 'bg-')}`}
                      style={{ width: `${viewingStudent.total_tuition > 0 ? (viewingStudent.amount_paid / viewingStudent.total_tuition) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <ActionButton variant="secondary" onClick={() => setShowViewStudent(false)}>Close</ActionButton>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-slide-up flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  )
}