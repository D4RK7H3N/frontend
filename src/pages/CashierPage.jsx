import { useState, useEffect, useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { Search, Receipt, CreditCard, Banknote, CheckCircle, Clock, Loader2, Printer, X, AlertCircle, Check, Plus, User, Users } from 'lucide-react'
import PesoSign from '../components/PesoSign'
import StatusBadge from '../components/StatusBadge'
import apiClient, { financeAPI, studentsAPI } from '../services/api'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'

const methodMap = {
  'cash': 'Cash',
  'gcash': 'GCash',
  'bank_transfer': 'Bank Transfer',
  'card': 'Card',
  'check': 'Check',
}

const cashQuickAmounts = [50, 100, 200, 500, 1000, 5000]

export default function CashierPage() {
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showQuickPay, setShowQuickPay] = useState(true)
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState(null)
  const [receiptCounter, setReceiptCounter] = useState(() => {
    try {
      const saved = localStorage.getItem('cashierReceiptCounter')
      const n = parseInt(saved, 10)
      return !isNaN(n) && n > 0 ? n : 1
    } catch {
      return 1
    }
  })

  const generateReceiptNo = () => {
    const year = new Date().getFullYear()
    const num = String(receiptCounter).padStart(5, '0')
    return `OR-${year}-${num}`
  }
  const receiptRef = useRef(null)
  const [receiptNumber, setReceiptNumber] = useState(1)
  const { config } = useSchoolConfig()
  const [triggerPrint, setTriggerPrint] = useState(false)

  const reactToPrintFn = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Official Receipt',
    onBeforePrint: () => Promise.resolve(),
    onAfterPrint: () => setShowReceipt(false),
  })

  useEffect(() => {
    if (triggerPrint && showReceipt && selectedTransaction && receiptRef.current) {
      setTriggerPrint(false)
      reactToPrintFn()
    }
  }, [triggerPrint, showReceipt, selectedTransaction, receiptRef, reactToPrintFn])

  const [paymentType, setPaymentType] = useState('student')

  const [paymentData, setPaymentData] = useState({
    studentSearch: '',
    payerName: '',
    payerContact: '',
    paymentTypeSelect: 'Tuition',
    itemName: '',
    amount: '',
    paymentMethod: 'cash',
    referenceNo: '',
  })
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmCashTendered, setConfirmCashTendered] = useState('')
  const [confirmPaymentAmount, setConfirmPaymentAmount] = useState('')
  const [studentResults, setStudentResults] = useState([])
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [searchingStudent, setSearchingStudent] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const studentDropdownRef = useRef(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [search, transactions])

  useEffect(() => {
    if (!paymentData.studentSearch.trim() || paymentType !== 'student') {
      setStudentResults([]);
      setShowStudentDropdown(false);
      return
    }
    const timer = setTimeout(async () => {
      setSearchingStudent(true)
      try {
        const res = await apiClient.get('/api/students/', { params: { search: paymentData.studentSearch.trim(), include_inactive: 'true' } })
        const data = res.data.results || res.data
        setStudentResults(data)
        setShowStudentDropdown(data.length > 0)
      } catch {
        setStudentResults([])
        setShowStudentDropdown(false)
      } finally {
        setSearchingStudent(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [paymentData.studentSearch, paymentType])

  useEffect(() => {
    const handleClick = (e) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target)) {
        setShowStudentDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    setPaymentData(prev => ({ ...prev, studentSearch: `${student.first_name} ${student.last_name} (${student.lrn})` }))
    setShowStudentDropdown(false)
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const [tuitionData, paymentsData] = await Promise.all([
        financeAPI.getTuition().catch(() => []),
        financeAPI.getPayments().catch(() => []),
      ])

      const tuitionList = Array.isArray(tuitionData) ? tuitionData : tuitionData.results || []
      const paymentsList = Array.isArray(paymentsData) ? paymentsData : paymentsData.results || []

      const allTransactions = [
        ...paymentsList.map(p => ({
          id: p.id,
          type: p.payment_type || p.type || 'General',
          payment_type: p.payment_type || p.type || 'General',
          student_name: p.payer_display_name || p.payer_name || 'Walk-in',
          payer_name: p.payer_display_name || p.payer_name || 'Walk-in',
          first_name: null,
          last_name: null,
          amount: p.amount,
          amount_paid: p.amount,
          payment_method: p.payment_method,
          method: p.payment_method,
          reference_no: p.reference_number || p.reference_no || `-`,
          reference_number: p.reference_number || p.reference_no || `-`,
          status: p.status || 'completed',
          created_at: p.created_at || p.date,
          student_id: p.student,
          is_walk_in: p.is_walk_in,
          remarks: p.remarks,
          lrn: p.lrn || p.student_lrn || '',
          first_name: p.first_name || p.student_first_name || '',
          last_name: p.last_name || p.student_last_name || '',
        })),
        ...tuitionList,
      ]

      allTransactions.sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB - dateA
      })

      setTransactions(allTransactions)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      showToast('Failed to load transactions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    const query = search.trim().toLowerCase()
    const filtered = query
      ? transactions.filter((t) =>
          `${t.student_name || ''} ${t.payer_name || ''} ${t.first_name || ''} ${t.last_name || ''} ${t.lrn || ''}`.toLowerCase().includes(query) ||
          `${t.reference_number || t.reference_no || t.id || ''}`.toLowerCase().includes(query)
        )
      : transactions
    setFilteredTransactions(filtered)
  }

  const todayTotal = transactions.reduce((sum, txn) => {
    const date = txn.created_at?.split?.('T')?.[0]
    return date === new Date().toISOString().split('T')[0]
      ? sum + (parseFloat(txn.amount) || 0)
      : sum
  }, 0)

  const findStudent = async (query) => {
    if (selectedStudent) return selectedStudent
    const trimmed = query.trim()
    if (!trimmed) return null
    const response = await apiClient.get('/api/students/', { params: { search: trimmed, include_inactive: 'true' } })
    const results = response.data.results || response.data
    const normalized = trimmed.toLowerCase()
    return results.find((student) => {
      const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase()
      return (
        student.lrn?.toLowerCase().includes(normalized) ||
        fullName.includes(normalized) ||
        `${student.last_name || ''} ${student.first_name || ''}`.toLowerCase().includes(normalized)
      )
    }) || (results.length > 0 ? results[0] : null)
  }

  const amountDue = parseFloat(paymentData.amount) || 0
  const isCashPayment = paymentData.paymentMethod === 'cash'
  const actualPaymentAmount = confirmPaymentAmount ? parseFloat(confirmPaymentAmount) : amountDue
  const dialogCashTendered = parseFloat(confirmCashTendered) || 0
  const changeAmount = dialogCashTendered - actualPaymentAmount
  const cashInsufficient = isCashPayment && dialogCashTendered > 0 && dialogCashTendered < actualPaymentAmount
  const cashExact = isCashPayment && dialogCashTendered > 0 && dialogCashTendered === actualPaymentAmount

  const handleProcessPayment = async () => {
    if (paymentType === 'student') {
      if (!paymentData.studentSearch.trim()) {
        showToast('Enter a student name or LRN to continue.', 'error')
        return
      }
      const student = selectedStudent || await findStudent(paymentData.studentSearch)
      if (!student) {
        showToast('Student not found. Please check the name or LRN.', 'error')
        return
      }
    } else {
      if (!paymentData.payerName.trim()) {
        showToast('Enter the payer name to continue.', 'error')
        return
      }
    }

    if (!paymentData.itemName.trim()) {
      showToast('Enter the item name to be printed on the receipt.', 'error')
      return
    }
    const amount = parseFloat(paymentData.amount)
    if (!amount || amount <= 0) {
      showToast('Enter a valid payment amount.', 'error')
      return
    }

    setConfirmPaymentAmount(paymentData.amount)
    setConfirmCashTendered('')
    setShowConfirm(true)
  }

  const handleSubmitPayment = async () => {
    if (processing) return
    if (isCashPayment && dialogCashTendered > 0 && dialogCashTendered < actualPaymentAmount) {
      showToast('Cash tendered cannot be less than the amount due.', 'error')
      return
    }
    setShowConfirm(false)
    setProcessing(true)
    try {
      const itemName = paymentData.itemName.trim()
      const amount = actualPaymentAmount
      const mappedMethod = methodMap[paymentData.paymentMethod] || 'Cash'

      let paymentPayload = {
        amount,
        payment_method: mappedMethod,
        remarks: `${paymentData.paymentTypeSelect} - ${itemName}`,
        item_name: itemName,
        reference_number: paymentData.referenceNo?.trim() || '',
      }
      if (!paymentPayload.reference_number) {
        const now = new Date()
        const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`
        paymentPayload.reference_number = `PAY-${ts}`
      }

      let payerDisplayName = ''
      let updatedBalance = null
      let newTotalPaid = null
      let tuitionAlreadyRecorded = false

      if (paymentType === 'student') {
        const student = selectedStudent || await findStudent(paymentData.studentSearch)
        if (!student) {
          showToast('Student not found. Please check the name or LRN.', 'error')
          return
        }
        if (paymentData.paymentTypeSelect === 'Tuition') {
          paymentPayload.student_id = student.id
        } else {
          paymentPayload.student = student.id
        }
        payerDisplayName = `${student.first_name} ${student.last_name}`

        if (paymentData.paymentTypeSelect === 'Tuition') {
          try {
            const tuitionRecords = await financeAPI.getTuitionByStudent(student.id)
            const studentTuition = Array.isArray(tuitionRecords) ? tuitionRecords[0] : null
            if (studentTuition && studentTuition.id) {
              const currentTotal = parseFloat(studentTuition.total_tuition || student.tuition_fee || 0)
              const currentPaid = parseFloat(studentTuition.amount_paid || 0)
              newTotalPaid = currentPaid + amount
              updatedBalance = currentTotal - newTotalPaid
              if (updatedBalance < 0) updatedBalance = 0

              await financeAPI.updateTuition(studentTuition.id, {
                amount_paid: newTotalPaid,
                total_tuition: currentTotal,
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: mappedMethod,
                notes: `Payment updated via cashier. Previous balance adjusted.`
              })
              tuitionAlreadyRecorded = true
            } else {
              const totalTuit = parseFloat(student.tuition_fee || 0)
              newTotalPaid = amount
              updatedBalance = totalTuit - amount
              if (updatedBalance < 0) updatedBalance = 0

              await financeAPI.createTuition({
                student_id: student.id,
                total_tuition: totalTuit,
                amount_paid: amount,
                school_year: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: mappedMethod,
                status: updatedBalance <= 0 ? 'paid' : 'partial'
              })
              tuitionAlreadyRecorded = true
            }
          } catch (tuitionError) {
            console.error('Tuition auto-deduction error:', tuitionError)
          }
        }
      } else {
        payerDisplayName = paymentData.payerName.trim()
        paymentPayload.payer_name = paymentData.payerName.trim()
        paymentPayload.payer_contact = paymentData.payerContact.trim()
        paymentPayload.is_walk_in = true
      }

      let payment

      if (tuitionAlreadyRecorded) {
        payment = { ...paymentPayload, id: Date.now(), created_at: new Date().toISOString(), status: 'completed' }
      } else if (paymentType === 'student' && paymentData.paymentTypeSelect === 'Tuition') {
        payment = await financeAPI.createTuition(paymentPayload)
      } else {
        payment = await financeAPI.createPayment(paymentPayload)
      }

      const receiptPayload = {
        ...payment,
        studentName: payment.student_name || payerDisplayName,
        payerName: payment.payer_name || payerDisplayName,
        lrn: payment.lrn || (paymentType === 'student' ? undefined : 'WALK-IN'),
        receiptNo: payment.reference_number || payment.reference_no || `#${payment.id}`,
        paymentMethod: paymentData.paymentMethod,
        paymentMethodDisplay: mappedMethod,
        items: [{ description: itemName, amount }],
        total: amount,
        created_at: payment.created_at || new Date().toISOString(),
        isWalkIn: paymentType === 'walkin',
        cashTendered: isCashPayment && dialogCashTendered > 0 ? dialogCashTendered : undefined,
        changeAmount: isCashPayment && dialogCashTendered > 0 && dialogCashTendered > amount ? changeAmount : undefined,
        ...(updatedBalance !== null && { remainingBalance: updatedBalance }),
        ...(newTotalPaid !== null && { newTotalPaid }),
      }

      setTransactions((prev) => [receiptPayload, ...prev])
      setSelectedTransaction(receiptPayload)
      setShowReceipt(true)
      setPaymentData({ studentSearch: '', payerName: '', payerContact: '', paymentTypeSelect: 'Tuition', itemName: '', amount: '', paymentMethod: 'cash', referenceNo: '' })
      showToast('Payment saved successfully')
    } catch (err) {
      showToast(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Unable to process payment. Please try again.',
        'error'
      )
    } finally {
      setProcessing(false)
    }
  }

  const handlePrintReceipt = useCallback((transaction) => {
    const receiptNo = generateReceiptNo()
    setSelectedTransaction({ ...transaction, receiptNo })
    setShowReceipt(true)
    const next = receiptCounter + 1
    setReceiptCounter(next)
    localStorage.setItem('cashierReceiptCounter', String(next))
    setTriggerPrint(true)
  }, [receiptCounter])

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'gcash', label: 'GCash', icon: CreditCard },
    { id: 'bank_transfer', label: 'Bank', icon: Banknote },
  ]

  const statCards = [
    { label: "Today's Collection", value: `₱${todayTotal.toLocaleString()}`, icon: Receipt, color: 'green', bg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Completed', value: transactions.filter(t => t.status === 'completed' || t.status === 'paid' || t.status === 'cleared').length, icon: CheckCircle, color: 'blue', bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Pending', value: transactions.filter(t => t.status === 'pending' || t.status === 'unpaid').length, icon: Clock, color: 'amber', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Payment Methods', value: '3', icon: CreditCard, color: 'purple', bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  return (
    <div>
      <PageHeader
        title="Cashier"
        subtitle="Process payments and transactions"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Finance' }, { label: 'Cashier' }]}
        actions={
          <ActionButton
            icon={showQuickPay ? X : Plus}
            size="sm"
            variant={showQuickPay ? 'secondary' : 'primary'}
            onClick={() => setShowQuickPay((value) => !value)}
          >
            {showQuickPay ? 'Hide Payment Form' : 'New Transaction'}
          </ActionButton>
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

      {showQuickPay && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Receipt size={18} className="text-blue-600" />
              Quick Payment
            </h3>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setPaymentType('student')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  paymentType === 'student'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users size={16} />
                Student
              </button>
              <button
                onClick={() => setPaymentType('walkin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  paymentType === 'walkin'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User size={16} />
                Walk-in
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {paymentType === 'student' ? (
                <div ref={studentDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Student / LRN</label>
                  <input
                    type="text"
                    placeholder="Enter student name or LRN"
                    value={paymentData.studentSearch}
                    onChange={(e) => {
                      setSelectedStudent(null)
                      setPaymentData({...paymentData, studentSearch: e.target.value})
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  />
                  {searchingStudent && (
                    <Loader2 size={14} className="absolute right-3 top-[38px] animate-spin text-gray-400" />
                  )}
                  {showStudentDropdown && studentResults.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                      {studentResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStudent(s)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-50 last:border-0 transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="font-medium truncate">{s.first_name} {s.last_name}</span>
                          <span className="text-xs text-gray-400 shrink-0">{s.lrn}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Search by student name or LRN number</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Payer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maria Santos (Parent/Guardian)"
                      value={paymentData.payerName}
                      onChange={(e) => setPaymentData({...paymentData, payerName: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-400 mt-1">Parent, guardian, or authorized payer</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Contact Number <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 09123456789"
                      value={paymentData.payerContact}
                      onChange={(e) => setPaymentData({...paymentData, payerContact: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Type</label>
                <select
                  value={paymentData.paymentTypeSelect}
                  onChange={(e) => setPaymentData({...paymentData, paymentTypeSelect: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                >
                  <option value="Tuition">Tuition</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Item Name <span className="text-xs text-gray-400">(printed on receipt)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tuition Fee - 1st Quarter"
                  value={paymentData.itemName}
                  onChange={(e) => setPaymentData({ ...paymentData, itemName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reference Number <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. GCASH-123456"
                  value={paymentData.referenceNo}
                  onChange={(e) => setPaymentData({ ...paymentData, referenceNo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₱)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentData({...paymentData, paymentMethod: method.id})}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        paymentData.paymentMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                      }`}
                    >
                      <method.icon size={20} className={paymentData.paymentMethod === method.id ? 'text-blue-600' : 'text-gray-400'} />
                      <span className="text-xs font-medium text-gray-700">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <ActionButton className="w-full" icon={Receipt} onClick={handleProcessPayment} loading={processing}>
                Process Payment
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Recent Transactions</h3>
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-gray-500 text-sm">Loading transactions...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Receipt size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Process your first payment above'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">Payer</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Method</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Notes</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                        {txn.reference_number || txn.reference_no || `#${txn.id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0 ${
                          txn.is_walk_in || txn.isWalkIn ? 'bg-amber-500' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                        }`}>
                          {(txn.student_name || txn.payer_name || txn.payerName || '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 truncate max-w-[140px] block">
                            {txn.student_name || txn.payer_name || txn.payerName || 'N/A'}
                          </span>
                          {(txn.is_walk_in || txn.isWalkIn) && (
                            <span className="text-[10px] text-amber-600 font-medium">Walk-in</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800">₱{(parseFloat(txn.amount) || 0).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">{txn.payment_method || txn.method || 'Cash'}</td>
                    <td className="px-4 py-3.5 text-gray-500 hidden md:table-cell truncate max-w-[160px]">{txn.remarks || txn.description || '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={txn.status} /></td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handlePrintReceipt(txn)}
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

      {showReceipt && selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl no-print">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                Payment Receipt
              </h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 bg-gray-50/50">
              <div ref={receiptRef} className="print-receipt receipt-paper bg-white mx-auto p-4 shadow-sm" style={{ width: '80mm', fontFamily: 'monospace' }}>
                <div className="text-center pb-2 mb-2" style={{ borderBottom: '1px dashed #000' }}>
                  <strong style={{ fontSize: '12px' }}>{config?.school_name?.toUpperCase() || 'MANAGEMENT SYSTEM'}</strong>
                  <p style={{ fontSize: '9px', margin: '1px 0' }}>{config ? [config.address_line1, config.city, config.province].filter(Boolean).join(', ') : 'Manila, Philippines'}</p>
                  <p style={{ fontSize: '9px', margin: '1px 0' }}>{config?.phone_number || '(02) 123-4567'}</p>
                </div>
                <div className="text-center py-1 mb-2" style={{ borderBottom: '1px dashed #000' }}>
                  <strong style={{ fontSize: '11px' }}>OFFICIAL RECEIPT</strong>
                </div>
                <div style={{ fontSize: '10px', padding: '2px 0', borderBottom: '1px dashed #000', marginBottom: '4px' }}>
                  <div className="flex justify-between"><span>Receipt No.:</span><span>{selectedTransaction.receiptNo || selectedTransaction.reference_number || selectedTransaction.reference_no || `#${selectedTransaction.id}`}</span></div>
                  <div className="flex justify-between"><span>Date:</span><span>{new Date(selectedTransaction.created_at || Date.now()).toLocaleDateString('en-PH')}</span></div>
                  <div className="flex justify-between"><span>Time:</span><span>{new Date(selectedTransaction.created_at || Date.now()).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span></div>
                </div>
                <div style={{ borderBottom: '1px dashed #000', padding: '3px 0', margin: '3px 0', fontSize: '10px' }}>
                  <div className="flex justify-between"><span>Payer:</span><span>{selectedTransaction.payerName || selectedTransaction.studentName || selectedTransaction.student_name || 'N/A'}</span></div>
                  {selectedTransaction.lrn && selectedTransaction.lrn !== 'WALK-IN' && (
                    <div className="flex justify-between"><span>LRN:</span><span>{selectedTransaction.lrn}</span></div>
                  )}
                  {selectedTransaction.isWalkIn && (
                    <div className="flex justify-between"><span>Type:</span><span>Walk-in Payment</span></div>
                  )}
                </div>
                <div style={{ fontSize: '10px', padding: '3px 0', borderBottom: '1px dashed #000' }}>
                  {(selectedTransaction.items || [{ description: selectedTransaction.remarks || 'Payment', amount: parseFloat(selectedTransaction.amount) || 0 }]).map((item, idx) => (
                    <div key={idx} className="flex justify-between" style={{ padding: '1px 0' }}>
                      <span style={{ flex: 1 }}>{item.description}</span>
                      <span style={{ marginLeft: '8px' }}>₱{(item.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderBottom: '1px dashed #000', padding: '3px 0' }}>
                  <div className="flex justify-between font-bold" style={{ fontSize: '11px' }}>
                    <span>TOTAL:</span>
                    <span>₱{((selectedTransaction.total || parseFloat(selectedTransaction.amount) || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {selectedTransaction.cashTendered ? (
                    <>
                      <div className="flex justify-between" style={{ fontSize: '10px' }}>
                        <span>Cash Tendered:</span>
                        <span>₱{selectedTransaction.cashTendered.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {selectedTransaction.changeAmount !== undefined && selectedTransaction.changeAmount > 0 && (
                        <div className="flex justify-between font-bold" style={{ fontSize: '10px' }}>
                          <span>Change:</span>
                          <span>₱{selectedTransaction.changeAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </>
                  ) : null}
                  {selectedTransaction.remainingBalance !== undefined && (
                    <div className="flex justify-between mt-1" style={{ fontSize: '10px' }}>
                      <span>Remaining Balance:</span>
                      <span className="font-bold">₱{selectedTransaction.remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedTransaction.newTotalPaid !== undefined && (
                    <div className="flex justify-between" style={{ fontSize: '10px' }}>
                      <span>Total Paid:</span>
                      <span>₱{selectedTransaction.newTotalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '10px', padding: '2px 0' }}>
                  <div className="flex justify-between"><span>Method:</span><span>{selectedTransaction.paymentMethodDisplay || selectedTransaction.payment_method || selectedTransaction.method || 'Cash'}</span></div>
                </div>
                <div className="text-center pt-2 mt-2" style={{ borderTop: '1px dashed #000' }}>
                  <p style={{ fontSize: '9px' }}>Thank you!</p>
                  <p style={{ fontSize: '8px' }}>Please keep this receipt.</p>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-2xl no-print">
              <button
                onClick={() => setShowReceipt(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => reactToPrintFn()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
              >
                <Printer size={15} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Receipt size={24} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Payment Details</h2>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="text-center">
                <p className="text-xs text-gray-500">Item</p>
                <p className="text-sm font-medium text-gray-900">{paymentData.itemName}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Method</p>
                <p className="text-sm font-medium text-gray-900">{methodMap[paymentData.paymentMethod] || 'Cash'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 text-center">Amount to Pay</label>
                <div className="relative">
                  <PesoSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={confirmPaymentAmount}
                    onChange={(e) => setConfirmPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-lg font-bold text-center"
                  />
                </div>
                <div className="flex gap-2 mt-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentAmount(paymentData.amount)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Full: ₱{parseFloat(paymentData.amount || 0).toLocaleString()}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPaymentAmount(String(Math.ceil(parseFloat(paymentData.amount || 0) / 2)))}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Half
                  </button>
                </div>
              </div>

              {isCashPayment && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-center">Cash Tendered <span className="text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <PesoSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={confirmCashTendered}
                      onChange={(e) => setConfirmCashTendered(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-base font-semibold text-center"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                    {cashQuickAmounts.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setConfirmCashTendered(String(val))}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        ₱{val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  {dialogCashTendered > 0 && (
                    <div className="mt-2 text-center">
                      {cashExact ? (
                        <p className="text-sm font-medium text-gray-500 flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                          Exact amount
                        </p>
                      ) : cashInsufficient ? (
                        <p className="text-sm font-medium text-red-600 flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                          Short by ₱{(actualPaymentAmount - dialogCashTendered).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-green-600 flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                          Change: ₱{changeAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {actualPaymentAmount <= 0 && (
              <p className="text-sm text-red-600 text-center mb-3">Enter a valid amount to pay.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <ActionButton
                variant="primary"
                onClick={handleSubmitPayment}
                loading={processing}
                disabled={actualPaymentAmount <= 0}
              >
                Confirm Payment
              </ActionButton>
            </div>
          </div>
        </div>
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
        @media print {
          @page { size: 80mm auto; margin: 4mm; }
          .print-receipt {
            margin: 0 auto; padding: 4mm;
            box-shadow: none; background: white;
            font-size: 11px; line-height: 1.3;
            color: #000;
          }
          .print-receipt > * { font-size: 11px; }
        }
      `}</style>
    </div>
  )
}