import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { financeAPI, studentsAPI } from '../services/api'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'
import {
  Search, Plus, Download, GraduationCap, Receipt, AlertCircle,
  Loader2, Check, X, FileText, Edit, Trash2, AlertTriangle,
  ChevronLeft, ChevronRight, Filter, CreditCard,
  Banknote, Calendar, User, BookOpen, Clock, Printer, ArrowRight
} from 'lucide-react'
import PesoSign from '../components/PesoSign'

const ITEMS_PER_PAGE = 20
const MAX_TUITION_LIMIT = 100000
const gradeLevels = ['Grade 11', 'Grade 12', '1st Year Tesda Accredited', '2nd Year Tesda Accredited']
const paymentMethods = ['Cash', 'GCash', 'Bank Transfer']
const statusFilters = [
  { value: 'all', label: 'All Status' },
  { value: 'paid', label: 'Fully Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'unpaid', label: 'Unpaid' }
]
const schoolYears = () => {
  const current = new Date().getFullYear()
  return [`${current}-${current + 1}`, `${current - 1}-${current}`, `${current - 2}-${current - 1}`]
}

export default function TuitionPage() {
  const { config: schoolConfig } = useSchoolConfig()
  const [loading, setLoading] = useState(true)
  const [tuitionRecords, setTuitionRecords] = useState([])
  const [filteredTuition, setFilteredTuition] = useState([])
  const [students, setStudents] = useState([])
  const [payments, setPayments] = useState([])
  const [toast, setToast] = useState(null)

  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSOAModal, setShowSOAModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [soaRecord, setSoaRecord] = useState(null)
  const [soaPayments, setSoaPayments] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false)

  const [tuitionForm, setTuitionForm] = useState({
    student_id: '', school_year: schoolYears()[0], total_tuition: '',
    amount_paid: '', payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash', notes: ''
  })
  const [formError, setFormError] = useState(null)
  const [formWarning, setFormWarning] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [showOfficialReceipt, setShowOfficialReceipt] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [settleForm, setSettleForm] = useState({
    amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_no: '',
    notes: ''
  })
  const [settling, setSettling] = useState(false)

  const soaRef = useRef(null)
  const receiptRef = useRef(null)

  const reactToPrintSOA = useReactToPrint({
    contentRef: soaRef,
    documentTitle: 'Statement of Account',
    onBeforePrint: () => Promise.resolve(),
    onAfterPrint: () => {},
  })

  const reactToPrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: 'Official Receipt',
    onBeforePrint: () => Promise.resolve(),
    onAfterPrint: () => {},
  })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tuitionData, studentsData, paymentsData] = await Promise.all([
        financeAPI.getTuitionRecords().catch(() => []),
        studentsAPI.getAll().catch(() => []),
        financeAPI.getPayments().catch(() => [])
      ])

      const allTuition = Array.isArray(tuitionData) ? tuitionData : (tuitionData.results || [])
      const allStudents = Array.isArray(studentsData) ? studentsData : (studentsData.results || [])
      const allPayments = Array.isArray(paymentsData) ? paymentsData : (paymentsData.results || [])

      const records = allTuition.map(t => ({
        id: t.student_id,
        student_id: t.student_id,
        studentName: t.student_name || 'N/A',
        lrn: t.lrn || 'N/A',
        grade: t.grade || 'N/A',
        section: t.section || 'N/A',
        total_tuition: parseFloat(t.total_tuition || 0),
        amount_paid: parseFloat(t.amount_paid || 0),
        balance: parseFloat(t.balance || 0),
        status: t.status || 'unpaid',
        school_year: t.school_year || new Date().getFullYear().toString(),
        payment_date: t.latest_payment_date || null,
        payment_method: t.latest_payment_method || 'Cash',
        payment_count: t.payment_count || 0,
        notes: '',
      }))

      setTuitionRecords(records)
      setStudents(allStudents)
      setPayments(allPayments)
    } catch (error) {
      console.error('Error fetching tuition data:', error)
      showToast('Failed to load tuition records', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => { applyFilters() }, [search, selectedStatus, selectedGrade, selectedYear, tuitionRecords])

  const applyFilters = () => {
    let filtered = [...tuitionRecords]

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(t =>
        (t.studentName || '').toLowerCase().includes(q) ||
        (t.lrn || '').toLowerCase().includes(q)
      )
    }
    if (selectedStatus !== 'all') filtered = filtered.filter(t => t.status === selectedStatus)
    if (selectedGrade) filtered = filtered.filter(t => t.grade === selectedGrade)
    if (selectedYear !== 'all') filtered = filtered.filter(t => t.school_year === selectedYear)

    filtered.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''))
    setFilteredTuition(filtered)
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedStatus('all')
    setSelectedGrade('')
    setSelectedYear('all')
  }

  const paginatedTuition = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredTuition.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTuition, currentPage])

  const totalPages = Math.ceil(filteredTuition.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const totalCollected = filteredTuition.reduce((sum, t) => sum + t.amount_paid, 0)
    const totalOutstanding = filteredTuition.reduce((sum, t) => sum + t.balance, 0)
    const fullyPaid = filteredTuition.filter(t => t.status === 'paid').length
    const partiallyPaid = filteredTuition.filter(t => t.status === 'partial').length
    return { totalCollected, totalOutstanding, fullyPaid, partiallyPaid }
  }, [filteredTuition])

  const statCards = [
    { label: 'Total Tuition Collected', value: `₱${stats.totalCollected.toLocaleString()}`, icon: Receipt, statBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Total Outstanding Balance', value: `₱${stats.totalOutstanding.toLocaleString()}`, icon: AlertCircle, statBg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    { label: 'Fully Paid Students', value: stats.fullyPaid, icon: GraduationCap, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Partially Paid Students', value: stats.partiallyPaid, icon: Clock, statBg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  ]

  const computedBalance = (parseFloat(tuitionForm.total_tuition) || 0) - (parseFloat(tuitionForm.amount_paid) || 0)

  const filteredStudentOptions = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 20)
    const q = studentSearch.toLowerCase()
    return students.filter(s => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase()
      return name.includes(q) || (s.lrn || '').toLowerCase().includes(q)
    }).slice(0, 20)
  }, [studentSearch, students])

  const resetForm = () => {
    setTuitionForm({
      student_id: '', school_year: schoolYears()[0], total_tuition: '',
      amount_paid: '', payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash', notes: ''
    })
    setStudentSearch('')
    setSelectedStudent(null)
    setStudentDropdownOpen(false)
    setFormError(null)
    setEditingRecord(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setShowAddModal(true)
  }

  const handleOpenEdit = (record) => {
    setEditingRecord(record)
    const student = record.student || {}
    setSelectedStudent({ id: record.student_id, name: record.studentName, lrn: record.lrn })
    setStudentSearch(record.studentName)
    setTuitionForm({
      student_id: record.student_id,
      school_year: record.school_year || schoolYears()[0],
      total_tuition: record.total_tuition.toString(),
      amount_paid: record.amount_paid.toString(),
      payment_date: record.payment_date || new Date().toISOString().split('T')[0],
      payment_method: record.payment_method || 'Cash',
      notes: record.notes || ''
    })
    setFormError(null)
    setShowEditModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    resetForm()
  }

  const handleSelectStudent = (student) => {
    setSelectedStudent({ id: student.id, name: `${student.first_name || ''} ${student.last_name || ''}`.trim(), lrn: student.lrn })
    setStudentSearch(`${student.first_name || ''} ${student.last_name || ''}`.trim())
    setTuitionForm(prev => ({ ...prev, student_id: student.id }))
    setStudentDropdownOpen(false)
  }

  const checkForDuplicate = async () => {
    if (!tuitionForm.student_id || !tuitionForm.total_tuition) return null
    const amountPaid = parseFloat(tuitionForm.amount_paid) || 0
    try {
      const existing = await financeAPI.getTuitionByStudent(parseInt(tuitionForm.student_id))
      const list = Array.isArray(existing) ? existing : (existing.results || [])
      return list.find(r =>
        r.school_year === tuitionForm.school_year &&
        parseFloat(r.amount_paid || 0) === amountPaid &&
        r.payment_date === tuitionForm.payment_date &&
        !(editingRecord && r.id === editingRecord.id)
      ) || null
    } catch {
      return null
    }
  }

  const validateForm = () => {
    if (!tuitionForm.student_id) { setFormError('Please select a student'); return false }
    if (!tuitionForm.total_tuition || parseFloat(tuitionForm.total_tuition) <= 0) { setFormError('Total tuition must be greater than 0'); return false }
    if (!tuitionForm.school_year) { setFormError('School year is required'); return false }
    const totalVal = parseFloat(tuitionForm.total_tuition)
    if (totalVal > MAX_TUITION_LIMIT) { setFormError(`Total tuition cannot exceed ₱${MAX_TUITION_LIMIT.toLocaleString()}. For higher amounts, contact admin.`); return false }
    return true
  }

  const handleSaveTuition = async () => {
    if (saving) return
    if (!validateForm()) return

    const amountPaid = parseFloat(tuitionForm.amount_paid) || 0
    if (amountPaid < 0) { setFormError('Amount paid cannot be negative'); return }
    if (amountPaid > parseFloat(tuitionForm.total_tuition)) { setFormError('Amount paid cannot exceed total tuition'); return }

    const duplicate = await checkForDuplicate()
    if (duplicate) {
      const proceed = window.confirm(
        `A tuition record already exists for this student with the same amount (₱${amountPaid.toLocaleString()}) on the same date. Adding another will create a duplicate record. Continue anyway?`
      )
      if (!proceed) return
    }

    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        student_id: parseInt(tuitionForm.student_id),
        school_year: tuitionForm.school_year,
        total_tuition: parseFloat(tuitionForm.total_tuition),
        amount_paid: parseFloat(tuitionForm.amount_paid) || 0,
        payment_date: tuitionForm.payment_date,
        payment_method: tuitionForm.payment_method.toLowerCase().replace(' ', '_'),
        notes: tuitionForm.notes
      }
      let result
      try {
        const existing = await financeAPI.getTuitionByStudent(parseInt(tuitionForm.student_id))
        const same = Array.isArray(existing)
          ? existing.find(r => r.school_year === tuitionForm.school_year)
          : (existing.results || []).find(r => r.school_year === tuitionForm.school_year)
        if (editingRecord && editingRecord.id) {
          result = await financeAPI.updateTuition(editingRecord.id, payload)
        } else if (same && same.id) {
          result = await financeAPI.updateTuition(same.id, payload)
        } else {
          result = await financeAPI.createTuition(payload)
        }
      } catch (lookupErr) {
        if (editingRecord && editingRecord.id) {
          result = await financeAPI.updateTuition(editingRecord.id, payload)
        } else {
          result = await financeAPI.createTuition(payload)
        }
      }
      if (result?.reference_number) {
        setReceiptData({
          reference_number: result.reference_number,
          student_name: result.student_name,
          lrn: result.lrn,
          grade: result.grade,
          amount: parseFloat(result.amount_paid || result.amount || 0),
          total_tuition: parseFloat(result.total_tuition || 0),
          balance: parseFloat(result.remaining_balance || 0),
          payment_date: result.payment_date || tuitionForm.payment_date,
          payment_method: result.payment_method || tuitionForm.payment_method,
          school_year: tuitionForm.school_year,
          notes: tuitionForm.notes
        })
        setShowOfficialReceipt(true)
      }
      showToast(editingRecord ? 'Tuition record updated successfully' : 'Tuition record created successfully')
      handleCloseModal()
      fetchData()
    } catch (err) {
      console.error('Save tuition error:', err)
      setFormError(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to save tuition record')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRecord = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await financeAPI.deleteTuition(deleteConfirm.id)
      setDeleteConfirm(null)
      showToast('Tuition record deleted successfully')
      fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Failed to delete tuition record', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const [deletingPaymentRow, setDeletingPaymentRow] = useState(false)
  const handleDeletePaymentRow = async (payment) => {
    if (deletingPaymentRow) return
    if (!payment?.id) return
    const proceed = window.confirm(
      `Remove this payment (₱${(parseFloat(payment.amount) || 0).toLocaleString()} on ${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'})? This corrects the SOA total. Choose OK only if this entry was a mistake.`
    )
    if (!proceed) return
    setDeletingPaymentRow(true)
    try {
      await financeAPI.deleteTuition(payment.id)
      setSoaPayments(prev => prev.filter(p => p.id !== payment.id))
      showToast('Payment record removed')
      fetchData()
    } catch (err) {
      console.error('Delete payment error:', err)
      showToast(err?.response?.data?.error || 'Failed to remove payment', 'error')
    } finally {
      setDeletingPaymentRow(false)
    }
  }

  const handleOpenSOA = async (record) => {
    try {
      const paymentsData = await financeAPI.getTuitionByStudent(record.student_id)
      const studentPayments = Array.isArray(paymentsData) ? paymentsData : (paymentsData.results || [])
      studentPayments.sort((a, b) => new Date(a.payment_date || a.created_at || 0) - new Date(b.payment_date || b.created_at || 0))
      setSoaPayments(studentPayments)
    } catch (err) {
      console.error('Error fetching student payments:', err)
      setSoaPayments([])
    }
    setSoaRecord(record)
    setShowSOAModal(true)
  }

  const handlePrintSOA = useCallback(() => {
    reactToPrintSOA()
  }, [reactToPrintSOA])

  const openSettleModal = () => {
    if (!soaRecord) return
    const remaining = parseFloat(soaRecord.balance) || 0
    setSettleForm({
      amount: remaining.toString(),
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_no: '',
      notes: 'Balance payment toward tuition'
    })
    setShowSettleModal(true)
  }

  const closeSettleModal = () => {
    setShowSettleModal(false)
  }

  const handleSettleBalance = async () => {
    if (!soaRecord || saving) return
    const amount = parseFloat(settleForm.amount)
    if (!amount || amount <= 0) {
      showToast('Enter a valid payment amount', 'error')
      return
    }
    if (amount > MAX_TUITION_LIMIT) {
      showToast(`Payment cannot exceed ₱${MAX_TUITION_LIMIT.toLocaleString()}`, 'error')
      return
    }
    const remaining = parseFloat(soaRecord.balance) || 0
    if (amount > remaining) {
      showToast(`Payment cannot exceed remaining balance (₱${remaining.toLocaleString()})`, 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        student_id: parseInt(soaRecord.student_id),
        school_year: soaRecord.school_year,
        total_tuition: soaRecord.total_tuition,
        amount_paid: (parseFloat(soaRecord.amount_paid) || 0) + amount,
        payment_date: settleForm.payment_date,
        payment_method: settleForm.payment_method.toLowerCase().replace(' ', '_'),
        reference_no: settleForm.reference_no || '',
        notes: settleForm.notes || `Partial/full settle ₱${amount.toLocaleString()}`,
      }
      let result
      try {
        result = soaRecord.id
          ? await financeAPI.updateTuition(soaRecord.id, payload)
          : await financeAPI.createTuition(payload)
      } catch (settleErr) {
        result = await financeAPI.createTuition(payload)
      }
      if (result?.reference_number) {
        setReceiptData({
          reference_number: result.reference_number,
          student_name: result.student_name,
          lrn: result.lrn,
          grade: result.grade,
          amount: amount,
          total_tuition: parseFloat(result.total_tuition || 0),
          balance: parseFloat(result.remaining_balance || 0),
          payment_date: payload.payment_date,
          payment_method: settleForm.payment_method,
          school_year: soaRecord.school_year,
          notes: settleForm.notes || `Payment of ₱${amount.toLocaleString()}`
        })
        setShowOfficialReceipt(true)
      }
      setShowSettleModal(false)
      setShowSOAModal(false)
      setSoaRecord(null)
      showToast(`Payment of ₱${amount.toLocaleString()} recorded successfully`)
      fetchData()
    } catch (err) {
      console.error('Settle balance error:', err)
      showToast(err?.response?.data?.error || err?.response?.data?.detail || 'Failed to settle balance', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePromoteStudent = async () => {
    if (!soaRecord) return
    const grade = soaRecord.grade
    let updateData = {}
    let targetLabel = ''
    if (grade === 'Grade 11') { updateData = { shs_grade: '12' }; targetLabel = 'Grade 12' }
    else if (grade === '1st Year Tesda Accredited') { updateData = { college_year: '2' }; targetLabel = '2nd Year Tesda Accredited' }
    else if (grade === 'Grade 12' || grade === '2nd Year Tesda Accredited') {
      if (!window.confirm(`This will mark ${soaRecord.studentName} as Graduated. Continue?`)) return
      updateData = { enrollment_status: 'Graduated' }; targetLabel = 'Graduated'
    } else {
      showToast('This student cannot be promoted from their current grade level', 'error')
      return
    }
    if (!window.confirm(`Promote ${soaRecord.studentName} to ${targetLabel}? Tuition will be updated automatically for payee students.`)) return
    if (promoting) return
    setPromoting(true)
    try {
      await studentsAPI.patch(soaRecord.student_id, updateData)
      setShowSOAModal(false)
      setSoaRecord(null)
      showToast(`${soaRecord.studentName} promoted to ${targetLabel}`)
      fetchData()
    } catch (err) {
      console.error('Promotion error:', err)
      showToast(err.response?.data?.detail || 'Failed to promote student', 'error')
    } finally {
      setPromoting(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ['LRN', 'Student Name', 'Grade Level', 'School Year', 'Total Tuition', 'Amount Paid', 'Remaining Balance', 'Status', 'Last Payment Date']
    const rows = filteredTuition.map(t => [
      t.lrn,
      t.studentName,
      t.grade,
      t.school_year || 'N/A',
      t.total_tuition.toLocaleString(),
      t.amount_paid.toLocaleString(),
      t.balance.toLocaleString(),
      t.status,
      t.payment_date || 'N/A'
    ])
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tuition_records_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Tuition records exported successfully')
  }

  const getStatusBadge = (status) => {
    if (status === 'paid') return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Fully Paid</span>
    if (status === 'partial') return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Partial</span>
    if (status === 'unpaid') return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Unpaid</span>
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">{status}</span>
  }

  const getProgressColor = (record) => {
    if (record.status === 'paid') return 'bg-green-500'
    if (record.status === 'partial') return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getBalanceColor = (balance) => {
    if (balance <= 0) return 'text-green-600'
    return 'text-red-600'
  }

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
        title="Tuition"
        subtitle="Student tuition management"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Finance' }, { label: 'Tuition' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Download} variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</ActionButton>
            <ActionButton icon={Plus} size="sm" onClick={handleOpenAdd}>Add Tuition</ActionButton>
          </div>
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
          {(search || selectedStatus !== 'all' || selectedGrade || selectedYear !== 'all') && (
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
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            {statusFilters.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="">All Grades</option>
            {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="all">All Years</option>
            {schoolYears().map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredTuition.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg mb-1">No tuition records found</p>
            <p className="text-gray-400 text-sm mb-5">
              {search || selectedStatus !== 'all' || selectedGrade ? 'Try adjusting your search or filters' : 'Add your first tuition record'}
            </p>
            {!search && selectedStatus === 'all' && !selectedGrade && (
              <ActionButton icon={Plus} onClick={handleOpenAdd}>Add Tuition Record</ActionButton>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3.5">LRN</th>
                    <th className="px-4 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">Grade</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">School Year</th>
                    <th className="px-4 py-3.5 text-right">Total Tuition</th>
                    <th className="px-4 py-3.5 text-right hidden sm:table-cell">Amount Paid</th>
                    <th className="px-4 py-3.5 text-right">Balance</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center hidden lg:table-cell">Progress</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {paginatedTuition.map((record) => {
                    const progress = record.total_tuition > 0 ? Math.min(100, (record.amount_paid / record.total_tuition) * 100) : 0
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">{record.lrn}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {(record.studentName || '?')[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">{record.studentName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">{record.grade}</td>
                        <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">{record.school_year || 'N/A'}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-800">₱{record.total_tuition.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right text-green-600 hidden sm:table-cell">₱{record.amount_paid.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`font-semibold ${getBalanceColor(record.balance)}`}>₱{record.balance.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">{getStatusBadge(record.status)}</td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                              <div className={`h-1.5 rounded-full ${getProgressColor(record)}`} style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{Math.round(progress)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenSOA(record)}
                              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Statement of Account">
                              <FileText size={15} />
                            </button>
                            <button onClick={() => handleOpenEdit(record)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                              <Edit size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTuition.length)} of {filteredTuition.length}
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

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PesoSign size={18} className="text-blue-600" />
                {editingRecord ? 'Edit Tuition Record' : 'Add Tuition Record'}
              </h2>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={16} /> {formError}
                </div>
              )}
              {formWarning && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
                  <AlertCircle size={16} /> {formWarning}
                </div>
              )}

              {!editingRecord && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Student <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" placeholder="Search student by name or LRN..."
                      value={studentSearch}
                      onChange={(e) => { setStudentSearch(e.target.value); setStudentDropdownOpen(true); setTuitionForm(prev => ({ ...prev, student_id: '' })) }}
                      onFocus={() => setStudentDropdownOpen(true)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                    {studentDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredStudentOptions.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500 text-center">No students found</div>
                        ) : (
                          filteredStudentOptions.map(s => (
                            <button key={s.id} onClick={() => handleSelectStudent(s)}
                              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                              <p className="font-medium text-gray-800 text-sm">{s.first_name} {s.last_name}</p>
                              <p className="text-xs text-gray-400">LRN: {s.lrn || 'N/A'} · {s.current_grade_level || s.grade || 'No grade'}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {selectedStudent && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                      <Check size={14} className="text-blue-600" />
                      <span className="text-sm text-blue-700">Selected: <strong>{selectedStudent.name}</strong> (LRN: {selectedStudent.lrn || 'N/A'})</span>
                    </div>
                  )}
                </div>
              )}

              {editingRecord && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl flex items-center gap-2">
                  <User size={14} className="text-blue-600" />
                  <span className="text-sm text-blue-700">
                    <strong>{soaRecord?.studentName || editingRecord.studentName}</strong> (LRN: {editingRecord.lrn})
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">School Year</label>
                  <select value={tuitionForm.school_year}
                    onChange={(e) => setTuitionForm({ ...tuitionForm, school_year: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                    {schoolYears().map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Tuition (₱) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" max={MAX_TUITION_LIMIT} step="0.01" placeholder="0.00 (max ₱100,000)"
                      value={tuitionForm.total_tuition}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val && parseFloat(val) > MAX_TUITION_LIMIT) {
                          setFormWarning(`Tuition capped at ₱${MAX_TUITION_LIMIT.toLocaleString()}. For higher amounts, contact admin.`)
                          setTuitionForm({ ...tuitionForm, total_tuition: String(MAX_TUITION_LIMIT) })
                        } else {
                          setFormWarning(null)
                          setTuitionForm({ ...tuitionForm, total_tuition: val })
                        }
                      }}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Amount Paid (₱)</label>
                    <input type="number" min="0" max={MAX_TUITION_LIMIT} step="0.01" placeholder="0.00"
                      value={tuitionForm.amount_paid}
                      onChange={(e) => setTuitionForm({ ...tuitionForm, amount_paid: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>

                {(parseFloat(tuitionForm.total_tuition) > 0 || parseFloat(tuitionForm.amount_paid) > 0) && (
                  <div className={`p-3 rounded-xl ${computedBalance <= 0 ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${computedBalance <= 0 ? 'text-green-700' : 'text-blue-700'}`}>
                        Remaining Balance
                      </span>
                      <span className={`font-bold text-lg ${computedBalance <= 0 ? 'text-green-700' : 'text-blue-700'}`}>
                        ₱{computedBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Payment Date</label>
                    <input type="date"
                      value={tuitionForm.payment_date}
                      onChange={(e) => setTuitionForm({ ...tuitionForm, payment_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                    <select value={tuitionForm.payment_method}
                      onChange={(e) => setTuitionForm({ ...tuitionForm, payment_method: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                      {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea rows={2} placeholder="Any additional notes..."
                    value={tuitionForm.notes}
                    onChange={(e) => setTuitionForm({ ...tuitionForm, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 resize-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseModal}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveTuition} loading={saving}>{editingRecord ? 'Update Record' : 'Add Record'}</ActionButton>
            </div>
          </div>
        </div>
      )}

      {showSOAModal && soaRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSOAModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10 no-print">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> Statement of Account
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintSOA} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Print">
                  <Printer size={18} />
                </button>
                <button onClick={() => setShowSOAModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div ref={soaRef} className="p-6 sm:p-8 soa-content">
              <div className="text-center mb-6 border-b-2 border-gray-200 pb-4">
                <h1 className="text-xl font-bold text-gray-900">{schoolConfig?.school_name || 'My School'}</h1>
                <p className="text-sm text-gray-500">{schoolConfig?.address_line1 || ''}{schoolConfig?.address_line2 ? ', ' + schoolConfig?.address_line2 : ''}</p>
                <p className="text-sm text-gray-500">Contact: {schoolConfig?.contact_number || 'N/A'} | Email: {schoolConfig?.email || 'N/A'}</p>
                <h2 className="text-lg font-bold text-gray-800 mt-3">STATEMENT OF ACCOUNT</h2>
                <p className="text-xs text-gray-400">As of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Student Name</p>
                  <p className="font-semibold text-gray-900">{soaRecord.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">LRN</p>
                  <p className="font-semibold text-gray-900">{soaRecord.lrn}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Grade Level</p>
                  <p className="text-gray-700">{soaRecord.grade}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">School Year</p>
                  <p className="text-gray-700">{soaRecord.school_year || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <PesoSign size={14} className="text-blue-600" /> Tuition Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center mb-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Total Tuition</p>
                    <p className="text-lg font-bold text-gray-800">₱{soaRecord.total_tuition?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                    <p className="text-lg font-bold text-green-600">₱{soaRecord.amount_paid?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Outstanding Balance</p>
                    <p className={`text-lg font-bold ${soaRecord.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₱{soaRecord.balance?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                {soaRecord.balance > 0 && (
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                      <AlertCircle size={14} /> Remaining Balance: ₱{soaRecord.balance.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Receipt size={14} className="text-blue-600" /> Payment History
                </h3>
                {soaPayments.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <Receipt size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">No individual payment records found</p>
                    <p className="text-xs text-gray-300 mt-1">Total amount paid: ₱{soaRecord.amount_paid?.toLocaleString() || 0}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider">
                          <th className="pb-2 font-semibold">Date</th>
                          <th className="pb-2 font-semibold">Reference</th>
                          <th className="pb-2 font-semibold">Method</th>
                          <th className="pb-2 font-semibold text-right">Amount</th>
                          <th className="pb-2 font-semibold text-right">Running Balance</th>
                          <th className="pb-2 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {soaPayments.map((p, i) => {
                          const runningBal = soaRecord.total_tuition - soaPayments.slice(0, i + 1).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0)
                          return (
                            <tr key={p.id || i} className="hover:bg-gray-50">
                              <td className="py-2.5 text-gray-700">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : (p.date ? new Date(p.date).toLocaleDateString() : 'N/A')}</td>
                              <td className="py-2.5 text-gray-700 font-mono">{p.reference_number || p.reference_no || `#${p.id}`}</td>
                              <td className="py-2.5 text-gray-700">{p.payment_method || p.method || 'Cash'}</td>
                              <td className="py-2.5 text-right text-green-600 font-medium">₱{(parseFloat(p.amount) || 0).toLocaleString()}</td>
                              <td className={`py-2.5 text-right font-medium ${runningBal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₱{Math.max(0, runningBal).toLocaleString()}
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePaymentRow(p)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete this payment record (use only to fix a mistaken entry)"
                                >
                                  <Trash2 size={12} /> Remove
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 font-semibold">
                          <td colSpan={3} className="pt-3 text-sm text-gray-700">Total Payments</td>
                          <td className="pt-3 text-right text-sm text-green-600">₱{soaRecord.amount_paid?.toLocaleString() || 0}</td>
                          <td className="pt-3 text-right text-sm text-gray-800">
                            {soaRecord.balance > 0 ? (
                              <span className="text-red-600">₱{soaRecord.balance.toLocaleString()}</span>
                            ) : (
                              <span className="text-green-600">PAID</span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {soaRecord.notes && (
                <div className="bg-blue-50 rounded-xl p-3 mb-6">
                  <p className="text-xs text-blue-600 font-medium mb-1">Notes</p>
                  <p className="text-sm text-blue-700">{soaRecord.notes}</p>
                </div>
              )}

              <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
                <p>This is a computer-generated statement. For inquiries, please contact the finance office.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between gap-3 no-print">
              <div className="flex gap-2 flex-wrap">
                {soaRecord.balance > 0 && (
                  <ActionButton onClick={openSettleModal} icon={Check} size="sm">
                    Settle Balance
                  </ActionButton>
                )}
                {['Grade 11', 'Grade 12', '1st Year Tesda Accredited', '2nd Year Tesda Accredited'].includes(soaRecord.grade) && (
                  <ActionButton onClick={handlePromoteStudent} loading={promoting} variant="secondary" icon={ArrowRight} size="sm">
                    {soaRecord.grade === 'Grade 12' || soaRecord.grade === '2nd Year Tesda Accredited' ? 'Mark Graduated' : 'Promote & Update Tuition'}
                  </ActionButton>
                )}
              </div>
              <div className="flex gap-2">
                <ActionButton variant="secondary" onClick={() => { setShowSOAModal(false); handleOpenEdit(soaRecord) }} icon={Edit} size="sm">
                  Edit
                </ActionButton>
                <ActionButton variant="secondary" onClick={() => setShowSOAModal(false)}>Close</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSettleModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md p-6 border border-gray-100">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Check size={24} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Record Payment</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              {soaRecord?.studentName
                ? <>How much did <strong>{soaRecord.studentName}</strong> pay?</>
                : 'Enter the payment amount'}
            </p>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Total Tuition:</span>
                <span className="font-medium">₱{parseFloat(soaRecord?.total_tuition || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Already Paid:</span>
                <span className="font-medium">₱{parseFloat(soaRecord?.amount_paid || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Remaining Balance:</span>
                <span>₱{parseFloat(soaRecord?.balance || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Amount Paid (₱) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <PesoSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" min="0" max={MAX_TUITION_LIMIT} step="0.01" placeholder="0.00"
                    value={settleForm.amount}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val && parseFloat(val) > MAX_TUITION_LIMIT) {
                        setSettleForm(prev => ({ ...prev, amount: String(MAX_TUITION_LIMIT) }))
                      } else {
                        setSettleForm(prev => ({ ...prev, amount: val }))
                      }
                    }}
                    onFocus={(e) => {
                      if (settleForm.amount && parseFloat(settleForm.amount) === parseFloat(soaRecord?.balance || 0)) {
                        e.target.select()
                      }
                    }}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-lg font-semibold" />
                </div>
                <div className="flex gap-2 mt-2 justify-end">
                  <button type="button"
                    onClick={() => setSettleForm(prev => ({ ...prev, amount: prev.amount }))}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                    Full: ₱{parseFloat(soaRecord?.balance || 0).toLocaleString()}
                  </button>
                  <button type="button"
                    onClick={() => setSettleForm(prev => ({ ...prev, amount: String(Math.ceil(parseFloat(soaRecord?.balance || 0) / 2)) }))}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                    Half
                  </button>
                  <button type="button"
                    onClick={() => setSettleForm(prev => ({ ...prev, amount: '1000' }))}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                    ₱1,000
                  </button>
                  <button type="button"
                    onClick={() => setSettleForm(prev => ({ ...prev, amount: '500' }))}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
                    ₱500
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                  <select value={settleForm.payment_method}
                    onChange={(e) => setSettleForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50">
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Date</label>
                  <input type="date" value={settleForm.payment_date}
                    onChange={(e) => setSettleForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Reference Number <span className="text-gray-400">(optional)</span></label>
                <input type="text" placeholder="e.g. GCASH-123456"
                  value={settleForm.reference_no}
                  onChange={(e) => setSettleForm(prev => ({ ...prev, reference_no: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
                <input type="text" placeholder="Brief note about payment"
                  value={settleForm.notes}
                  onChange={(e) => setSettleForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={closeSettleModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSettleBalance} disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Record
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 z-10 w-full max-w-sm">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Tuition Record?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to delete this tuition record for <strong>{deleteConfirm.studentName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteRecord} disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showOfficialReceipt && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowOfficialReceipt(false); setReceiptData(null) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10 no-print">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt size={18} className="text-blue-600" /> Official Receipt
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => reactToPrintReceipt()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Print">
                  <Printer size={18} />
                </button>
                <button onClick={() => { setShowOfficialReceipt(false); setReceiptData(null) }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div ref={receiptRef} className="p-6 sm:p-8 receipt-content">
              <div className="text-center mb-6 border-b-2 border-gray-200 pb-4">
                <h1 className="text-xl font-bold text-gray-900">{schoolConfig?.school_name || 'My School'}</h1>
                <p className="text-sm text-gray-500">{schoolConfig?.address_line1 || ''}{schoolConfig?.address_line2 ? ', ' + schoolConfig?.address_line2 : ''}</p>
                <p className="text-sm text-gray-500">Contact: {schoolConfig?.contact_number || 'N/A'}</p>
                <h2 className="text-lg font-bold text-gray-800 mt-3">OFFICIAL RECEIPT</h2>
                <p className="text-xs text-gray-400">Date: {new Date(receiptData.payment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center bg-blue-50 rounded-lg p-3 mb-4">
                  <span className="text-sm text-blue-700 font-medium">Receipt No.</span>
                  <span className="text-sm font-bold text-blue-800 font-mono">{receiptData.reference_number}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Student Name</span>
                    <span className="font-medium text-gray-900">{receiptData.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">LRN</span>
                    <span className="font-medium text-gray-900">{receiptData.lrn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Grade Level</span>
                    <span className="font-medium text-gray-900">{receiptData.grade || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">School Year</span>
                    <span className="font-medium text-gray-900">{receiptData.school_year}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="font-medium text-gray-900">{receiptData.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="font-bold text-green-600">₱{receiptData.amount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-gray-500">Total Tuition</span>
                    <span className="font-medium text-gray-900">₱{receiptData.total_tuition.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Remaining Balance</span>
                    <span className={`font-bold ${receiptData.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₱{receiptData.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {receiptData.notes && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-blue-600 font-medium mb-1">Notes</p>
                  <p className="text-sm text-blue-700">{receiptData.notes}</p>
                </div>
              )}

              <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
                <p>Thank you for your payment!</p>
                <p className="mt-1">This is a computer-generated receipt.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 no-print">
              <ActionButton variant="secondary" onClick={() => { setShowOfficialReceipt(false); setReceiptData(null) }}>Close</ActionButton>
              <ActionButton onClick={() => reactToPrintReceipt()} icon={Printer}>Print Receipt</ActionButton>
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

        @media print {
          .soa-content table { page-break-inside: auto; }
          .soa-content tr { page-break-inside: avoid; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </div>
  )
}