import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { financeAPI, studentsAPI } from '../services/api'
import {
  TrendingUp, TrendingDown, Calendar, Loader2, Printer,
  Download, Search, X, Filter, ChevronLeft, ChevronRight,
  ArrowUpDown, Banknote, CreditCard, Receipt, AlertCircle, Check,
  Wallet, Coins
} from 'lucide-react'
import PesoSign from '../components/PesoSign'

const ITEMS_PER_PAGE = 15

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'pending', label: 'Pending' },
  { value: 'unpaid', label: 'Unpaid' },
]

export default function RevenuePage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [toast, setToast] = useState(null)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedType, setSelectedType] = useState('All')
  const [selectedMethod, setSelectedMethod] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [revenueTotals, setRevenueTotals] = useState({
    total_revenue: 0,
    total_pos: 0,
    total_tuition: 0,
    total_assessment: 0,
    total_dorm: 0,
    total_tour: 0,
    total_graduation: 0,
    total_general: 0,
    total_transactions: 0,
    pos_count: 0,
    tuition_count: 0,
    assessment_count: 0,
    dorm_count: 0,
    tour_count: 0,
    graduation_count: 0,
    general_count: 0,
  })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const revenueData = await financeAPI.getRevenue().catch(() => ({ revenue: [], totals: {} }))

      const revenueList = Array.isArray(revenueData) ? revenueData : (revenueData.results || revenueData.revenue || [])

      if (revenueData.totals) {
        setRevenueTotals(prev => ({ ...prev, ...revenueData.totals }))
      }

      const mergedTransactions = revenueList.map(r => {
        let source = r.type || 'Revenue'
        let paymentType = r.type || r.payment_type || 'Revenue'

        if (r.type === 'Tuition' || (r.products && r.products[0] && (r.products[0].name?.toLowerCase().includes('tuition') || r.products[0].name === 'Tuition Fee'))) {
          source = 'Tuition'
          paymentType = 'Tuition'
        } else if (['Miscellaneous', 'Laboratory', 'Assessment', 'Other'].includes(r.type)) {
          source = r.type
          paymentType = r.type
        } else if (r.type === 'Assessment') {
          source = 'Assessment'
          paymentType = 'Assessment'
        } else if (r.type === 'Dorm') {
          source = 'Dorm'
          paymentType = 'Dorm'
        } else if (r.type === 'Tour') {
          source = 'Tour'
          paymentType = 'Tour'
        } else if (r.type === 'Graduation') {
          source = 'Graduation'
          paymentType = 'Graduation'
        } else if (r.type === 'POS') {
          source = 'POS'
          paymentType = 'POS'
        }

        return {
          ...r,
          type: paymentType,
          source: source,
          payerName: r.customer || r.student_name || r.name || 'N/A',
          method: r.payment_method || r.method || 'Cash',
          status: r.status || 'paid',
          date: r.date || r.created_at || r.payment_date || r.transaction_date,
          amount: parseFloat(r.amount) || parseFloat(r.total) || 0,
          reference_no: r.reference || r.reference_number || r.reference_no || `-`,
        }
      })

      const sortedTransactions = mergedTransactions.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0)
        const dateB = new Date(b.date || b.created_at || 0)
        return dateB - dateA
      })

      setTransactions(sortedTransactions)
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      showToast('Failed to load revenue data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [startDate, endDate, selectedType, selectedMethod, searchQuery, transactions, currentPage])

  const applyFilters = () => {
    let filtered = [...transactions]

    if (startDate) filtered = filtered.filter(t => {
      const d = new Date(t.date || t.created_at || t.payment_date)
      return d >= new Date(startDate)
    })
    if (endDate) filtered = filtered.filter(t => {
      const d = new Date(t.date || t.created_at || t.payment_date)
      return d <= new Date(endDate + 'T23:59:59')
    })
    if (selectedType !== 'All') {
      if (selectedType === 'General') {
        filtered = filtered.filter(t => ['Miscellaneous', 'Laboratory', 'Assessment', 'Other'].includes(t.type))
      } else {
        filtered = filtered.filter(t => t.type?.toLowerCase() === selectedType.toLowerCase())
      }
    }
    if (selectedMethod !== 'All') {
      filtered = filtered.filter(t => {
        const method = (t.method || 'Cash').toLowerCase().replace('_', '')
        const selected = selectedMethod.toLowerCase().replace('_', '')
        return method === selected || (selected === 'cash' && !method.includes('gcash') && !method.includes('card') && !method.includes('bank')) || (selected === 'gcash' && method.includes('gcash'))
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        (t.payerName || '').toLowerCase().includes(q) ||
        (t.reference_no || t.id?.toString() || '').toLowerCase().includes(q) ||
        (t.type || '').toLowerCase().includes(q) ||
        (t.source || '').toLowerCase().includes(q)
      )
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedType('All')
    setSelectedMethod('All')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTransactions, currentPage])

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)

  const totals = useMemo(() => {
    const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = 0
    const netIncome = totalIncome - totalExpenses
    const paidCount = filteredTransactions.filter(t => t.status === 'paid' || t.status === 'completed').length
    const totalRecords = filteredTransactions.length
    const collectionRate = totalRecords > 0 ? Math.round((paidCount / totalRecords) * 100) : 0
    return { totalIncome, totalExpenses, netIncome, collectionRate, totalRecords }
  }, [filteredTransactions])

  const revenueBreakdown = useMemo(() => {
    const breakdown = {}

    const typeLabels = {
      'Tuition': 'Tuition',
      'Miscellaneous': 'Miscellaneous',
      'Laboratory': 'Laboratory',
      'Assessment': 'Assessment',
      'Other': 'Other',
      'Dorm': 'Dorm',
      'Tour': 'Tour',
      'Graduation': 'Graduation',
      'POS': 'POS',
    }

    filteredTransactions.forEach(t => {
      const type = t.type || 'Other'
      const displayType = typeLabels[type] || type
      if (!breakdown[displayType]) breakdown[displayType] = { type: displayType, count: 0, total: 0 }
      breakdown[displayType].count += 1
      breakdown[displayType].total += t.amount
    })

    return Object.values(breakdown).map(b => ({
      ...b,
      percent: totals.totalIncome > 0 ? ((b.total / totals.totalIncome) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.total - a.total)
  }, [filteredTransactions, totals.totalIncome])

  const topPayingStudents = useMemo(() => {
    const studentTotals = {}
    filteredTransactions.forEach(t => {
      if (!t.student_id && !t.student) return
      const studentId = t.student_id || t.student?.id
      if (!studentId) return
      if (!studentTotals[studentId]) {
        studentTotals[studentId] = {
          student_id: studentId,
          name: t.payerName || 'N/A',
          lrn: t.lrn || 'N/A',
          total_paid: 0,
          payment_count: 0
        }
      }
      studentTotals[studentId].total_paid += t.amount
      studentTotals[studentId].payment_count += 1
    })
    return Object.values(studentTotals).sort((a, b) => b.total_paid - a.total_paid).slice(0, 5)
  }, [filteredTransactions])

  const handleExportCSV = () => {
    const headers = ['Date', 'Receipt No.', 'Payer Name', 'Type', 'Source', 'Amount', 'Method', 'Status']
    const rows = filteredTransactions.map(t => [
      new Date(t.date || t.created_at || t.payment_date).toLocaleDateString(),
      t.reference_no || `#${t.id}` || '-',
      t.payerName || 'N/A',
      t.type || 'N/A',
      t.source || t.type || 'N/A',
      t.amount.toLocaleString(),
      t.method || 'Cash',
      t.status || 'N/A',
    ])
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Revenue report exported successfully')
  }

  const generalPaymentsTotal = revenueTotals.total_general || 0

  const statCards = [
    { label: 'Total Income', value: `₱${totals.totalIncome.toLocaleString()}`, icon: TrendingUp, statBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', printBorder: 'border-green-200' },
    { label: 'General Payments', value: `₱${generalPaymentsTotal.toLocaleString()}`, icon: Coins, statBg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', printBorder: 'border-amber-200' },
    { label: 'Total Expenses', value: `₱${totals.totalExpenses.toLocaleString()}`, icon: TrendingDown, statBg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600', printBorder: 'border-red-200' },
    { label: 'Collection Rate', value: `${totals.collectionRate}%`, icon: Calendar, statBg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', printBorder: 'border-purple-200' },
  ]

  const getStatusBadge = (status) => {
    if (status === 'paid' || status === 'completed') return <StatusBadge status="paid" />
    if (status === 'partial') return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Partial</span>
    if (status === 'pending') return <StatusBadge status="pending" />
    if (status === 'unpaid') return <StatusBadge status="unpaid" />
    return <StatusBadge status="pending" />
  }

  const getSourceBadge = (source) => {
    const colors = {
      'Tuition': 'bg-blue-100 text-blue-700',
      'Miscellaneous': 'bg-green-100 text-green-700',
      'Laboratory': 'bg-purple-100 text-purple-700',
      'Assessment': 'bg-orange-100 text-orange-700',
      'Other': 'bg-gray-100 text-gray-700',
      'Dorm': 'bg-cyan-100 text-cyan-700',
      'Tour': 'bg-pink-100 text-pink-700',
      'Graduation': 'bg-indigo-100 text-indigo-700',
      'POS': 'bg-teal-100 text-teal-700',
    }
    const colorClass = colors[source] || 'bg-gray-100 text-gray-700'
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>{source}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  return (
    <div className="print-report min-h-0">
      <PageHeader
        title="Revenue Reports"
        subtitle="Financial reports and analytics"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Finance' }, { label: 'Revenue' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Download} variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</ActionButton>
            <ActionButton icon={Printer} size="sm" onClick={() => window.print()} className="no-print">Print Report</ActionButton>
          </div>
        }
      />

      <div className="flex flex-row justify-between gap-4 mb-5 print-stat-row">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.statBg} rounded-2xl p-4 flex-1 border border-transparent print-stat-item`}>
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

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 no-print">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <Filter size={14} className="text-blue-600" /> Filters
          </h3>
          <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <X size={12} /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Payment Type</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
              <option value="All">All Types</option>
              <option value="Tuition">Tuition</option>
              <option value="Miscellaneous">Miscellaneous</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Assessment">Assessment</option>
              <option value="Other">Other</option>
              <option value="Dorm">Dorm</option>
              <option value="Tour">Tour</option>
              <option value="Graduation">Graduation</option>
              <option value="POS">POS</option>
              <option value="General">All General</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
            <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input type="text" placeholder="Search payer, reference..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Revenue Breakdown</h3>
          </div>
          {revenueBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Receipt size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No revenue data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Payment Type</th>
                    <th className="px-4 py-3 text-right">No. of Transactions</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {revenueBreakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{item.type}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">₱{item.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${item.percent}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{item.percent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-gray-800">Total</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{revenueBreakdown.reduce((s, i) => s + i.count, 0)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">₱{totals.totalIncome.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Top Paying Students</h3>
          </div>
          {topPayingStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <PesoSign size={28} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No payment data</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topPayingStudents.map((student, idx) => {
                const medals = ['bg-amber-100 text-amber-700', 'bg-gray-200 text-gray-600', 'bg-orange-100 text-orange-700']
                return (
                  <div key={student.student_id || idx} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${medals[idx] || 'bg-gray-100 text-gray-600'}`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 text-sm truncate">{student.name}</p>
                        <p className="text-xs text-gray-400">LRN: {student.lrn || 'N/A'} · {student.payment_count} payment(s)</p>
                      </div>
                      <span className="font-semibold text-green-600 text-sm shrink-0">₱{student.total_paid.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-semibold text-gray-800 text-sm">Transaction History</h3>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by payer or receipt..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Receipt size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery || startDate || endDate || selectedType !== 'All' || selectedMethod !== 'All' ? 'Try adjusting your filters' : 'No payment records available'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Receipt No.</th>
                    <th className="px-4 py-3 text-left">Payer Name</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Type</th>
                    <th className="px-4 py-3 text-left">Source</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Item</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Method</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedTransactions.map((txn) => (
                    <tr key={txn.id || `${txn.reference_no}-${txn.date}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(txn.date || txn.created_at || txn.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                          {txn.reference_no || `#${txn.id}` || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(txn.payerName || '?')[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 text-sm truncate max-w-[140px]">{txn.payerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600 whitespace-nowrap">{txn.type || 'N/A'}</td>
                      <td className="px-4 py-3">{getSourceBadge(txn.source || txn.type)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-gray-600 text-xs truncate max-w-[160px] block">
                          {txn.products && txn.products[0] ? txn.products[0].name : txn.remarks || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                        ₱{txn.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          {txn.method?.toLowerCase().includes('gcash') ? <CreditCard size={13} /> : txn.method?.toLowerCase().includes('bank') || txn.method?.toLowerCase().includes('card') ? <Banknote size={13} /> : <Wallet size={13} />}
                          <span className="capitalize text-xs">{txn.method || 'Cash'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(txn.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
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

      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-slide-up flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @media print {
          @page { size: A4 landscape; margin: 0.5in; }
          body * { visibility: hidden !important; }
          .print-report, .print-report * { visibility: visible !important; }
          .print-report { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print, .no-print * { display: none !important; }
          .print-report .rounded-2xl { border-radius: 0 !important; }
          .print-report .border { border-width: 1px !important; }
          .print-report .shadow-sm { box-shadow: none !important; }
          .print-report table { width: 100% !important; border-collapse: collapse !important; }
          .print-report th, .print-report td { border: 1px solid #ddd !important; padding: 4px 8px !important; font-size: 11px !important; }
          .print-report .bg-white { background: white !important; }
          .print-stat-row { display: flex !important; flex-direction: row !important; justify-content: space-between !important; gap: 24px !important; }
          .print-stat-item { flex: 1 !important; padding: 12px !important; }
          .print-stat-item .text-xl { font-size: 16px !important; }
          .print-stat-item .text-xs { font-size: 9px !important; }
          .print-report .bg-gray-50 { background: #f9fafb !important; }
        }
      `}</style>
    </div>
  )
}