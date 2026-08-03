import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { studentsAPI } from '../services/api'
import {
  Search, Plus, Download, UserMinus, RotateCcw, Loader2, X,
  ChevronLeft, ChevronRight, AlertTriangle, Check, Filter,
  Eye, Edit, Trash2, User, BookOpen, Calendar, FileText
} from 'lucide-react'

const ITEMS_PER_PAGE = 10
const gradeLevels = ['Grade 11', 'Grade 12', '1st Year Bundled', '2nd Year Bundled']
const dropoutReasons = ['Financial', 'Personal', 'Academic', 'Health', 'Other']
const dropoutStatuses = ['confirmed', 'pending_reinstatement', 'reinstated']
const formatGradeLevel = (grade) => {
  if (!grade) return 'N/A'
  if (grade === 'Grade 11') return '11'
  if (grade === 'Grade 12') return '12'
  if (grade === '1st Year Tesda Accredited' || grade === '1st Year Bundled') return 'BUN-1st'
  if (grade === '2nd Year Tesda Accredited' || grade === '2nd Year Bundled') return 'BUN-2nd'
  return grade
}
const schoolYears = () => {
  const current = new Date().getFullYear()
  return [`${current}-${current + 1}`, `${current - 1}-${current}`, `${current - 2}-${current - 1}`]
}

export default function DropoutsPage() {
  const [loading, setLoading] = useState(true)
  const [dropouts, setDropouts] = useState([])
  const [students, setStudents] = useState([])
  const [toast, setToast] = useState(null)

  const [search, setSearch] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedReason, setSelectedReason] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [viewingRecord, setViewingRecord] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false)

  const [dropoutForm, setDropoutForm] = useState({
    student_id: '', dropout_date: new Date().toISOString().split('T')[0],
    reason: 'Financial', notes: '', last_grade_level: '', last_section: ''
  })
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [reinstateConfirm, setReinstateConfirm] = useState(null)
  const [reinstatement, setReinstatement] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const allStudentsData = await studentsAPI.getAll().catch(() => [])

      const allStudents = Array.isArray(allStudentsData) ? allStudentsData : allStudentsData.results || []
      const matchedStatuses = ['Drop-out', 'dropped', 'Dropout', 'dropout', 'Dropped', 'Withdrawn']
      const droppedStudents = allStudents.filter(s => {
        const statusField = s.status || ''
        const enrollmentField = s.enrollment_status || ''
        const dropoutField = s.dropout_status || ''
        return matchedStatuses.includes(statusField)
          || matchedStatuses.includes(enrollmentField)
          || dropoutField === 'confirmed'
          || dropoutField === 'dropped'
          || !!s.dropout_date
      }).map(s => ({
        ...s,
        dropout_status: s.dropout_status || 'confirmed',
        dropout_reason: s.dropout_reason || s.reason || 'Other',
        dropout_date: s.dropout_date || s.date || null
      }))

      setDropouts(droppedStudents)
      setStudents(allStudents)
    } catch (error) {
      console.error('Error fetching dropouts:', error)
      showToast('Failed to load dropout records', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => { setCurrentPage(1) }, [search, selectedGrade, selectedYear, selectedReason, selectedStatus])

  const filteredDropouts = useMemo(() => {
    let filtered = [...dropouts]

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(d =>
        `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase().includes(q) ||
        (d.lrn || '').toLowerCase().includes(q)
      )
    }
    if (selectedGrade) {
      const aliases = [selectedGrade]
      if (selectedGrade === '1st Year Bundled') aliases.push('1st Year Tesda Accredited')
      if (selectedGrade === '2nd Year Bundled') aliases.push('2nd Year Tesda Accredited')
      filtered = filtered.filter(d => aliases.includes(d.current_grade_level) || aliases.includes(d.grade))
    }
    if (selectedReason !== 'all') filtered = filtered.filter(d => d.dropout_reason === selectedReason)
    if (selectedStatus !== 'all') filtered = filtered.filter(d => d.dropout_status === selectedStatus)
    if (selectedYear !== 'all') filtered = filtered.filter(d => d.school_year === selectedYear)

    return filtered.sort((a, b) => new Date(b.dropout_date || 0) - new Date(a.dropout_date || 0))
  }, [dropouts, search, selectedGrade, selectedYear, selectedReason, selectedStatus])

  const paginatedDropouts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredDropouts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredDropouts, currentPage])

  const totalPages = Math.ceil(filteredDropouts.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const total = dropouts.length
    const thisYear = dropouts.filter(d => {
      if (!d.dropout_date) return false
      return new Date(d.dropout_date).getFullYear() === new Date().getFullYear()
    }).length

    const reasonCounts = {}
    dropouts.forEach(d => {
      const r = d.dropout_reason || 'Other'
      reasonCounts[r] = (reasonCounts[r] || 0) + 1
    })
    const mostCommon = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    const pending = dropouts.filter(d => d.dropout_status === 'pending_reinstatement').length

    return { total, thisYear, mostCommon, pending }
  }, [dropouts])

  const filteredStudentOptions = useMemo(() => {
    const activeStudents = students.filter(s =>
      s.status !== 'Drop-out' && s.status !== 'dropped' && s.status !== 'Dropout'
    )
    if (!studentSearch.trim()) return activeStudents.slice(0, 20)
    const q = studentSearch.toLowerCase()
    return activeStudents.filter(s => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase()
      return name.includes(q) || (s.lrn || '').toLowerCase().includes(q)
    }).slice(0, 20)
  }, [studentSearch, students])

  const resetForm = () => {
    setDropoutForm({
      student_id: '', dropout_date: new Date().toISOString().split('T')[0],
      reason: 'Financial', notes: '', last_grade_level: '', last_section: ''
    })
    setStudentSearch('')
    setSelectedStudent(null)
    setStudentDropdownOpen(false)
    setFormError(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setShowAddModal(true)
  }

  const handleOpenEdit = (record) => {
    setEditingRecord(record)
    setSelectedStudent({ id: record.id, name: `${record.first_name || ''} ${record.last_name || ''}`.trim(), lrn: record.lrn })
    setStudentSearch(`${record.first_name || ''} ${record.last_name || ''}`.trim())
    setDropoutForm({
      student_id: record.id,
      dropout_date: record.dropout_date || new Date().toISOString().split('T')[0],
      reason: record.dropout_reason || 'Financial',
      notes: record.notes || '',
      last_grade_level: record.current_grade_level || record.grade || '',
      last_section: record.section || ''
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
    setDropoutForm(prev => ({ ...prev, student_id: student.id, last_grade_level: student.current_grade_level || student.grade || '', last_section: student.section || '' }))
    setStudentDropdownOpen(false)
  }

  const validateForm = () => {
    if (!dropoutForm.student_id) { setFormError('Please select a student'); return false }
    if (!dropoutForm.dropout_date) { setFormError('Dropout date is required'); return false }
    return true
  }

  const handleSaveDropout = async () => {
    if (saving) return
    if (!validateForm()) return
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        status: 'Drop-out',
        dropout_date: dropoutForm.dropout_date,
        dropout_reason: dropoutForm.reason,
        notes: dropoutForm.notes,
        dropout_status: 'confirmed'
      }
      if (editingRecord) {
        await studentsAPI.patch(editingRecord.id, payload)
        showToast('Dropout record updated successfully')
      } else {
        await studentsAPI.patch(dropoutForm.student_id, payload)
        showToast('Student marked as dropout successfully')
      }
      handleCloseModal()
      fetchData()
    } catch (err) {
      console.error('Save dropout error:', err)
      setFormError(err?.response?.data?.error || 'Failed to save dropout record')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRecord = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await studentsAPI.patch(deleteConfirm.id, { status: 'Active', dropout_status: 'deleted' })
      setDeleteConfirm(null)
      showToast('Dropout record deleted successfully')
      fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Failed to delete dropout record', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleReinstate = async () => {
    if (reinstatement) return
    setReinstatement(true)
    try {
      await studentsAPI.patch(reinstateConfirm.id, {
        status: 'Active',
        dropout_status: 'reinstated'
      })
      setReinstateConfirm(null)
      showToast('Student successfully reinstated')
      fetchData()
    } catch (err) {
      console.error('Reinstate error:', err)
      showToast('Failed to reinstate student', 'error')
    } finally {
      setReinstatement(false)
    }
  }

  const handleViewRecord = (record) => {
    setViewingRecord(record)
    setShowViewModal(true)
  }

  const handleExportCSV = () => {
    const headers = ['LRN', 'Student Name', 'Grade Level', 'Section', 'Dropout Date', 'Reason', 'Status', 'Notes']
    const rows = filteredDropouts.map(d => [
      d.lrn || 'N/A',
      `${d.first_name || ''} ${d.last_name || ''}`.trim(),
      formatGradeLevel(d.current_grade_level || d.grade),
      d.section || 'N/A',
      d.dropout_date ? new Date(d.dropout_date).toLocaleDateString() : 'N/A',
      d.dropout_reason || 'N/A',
      d.dropout_status || 'confirmed',
      d.notes || ''
    ])
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dropouts_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Dropout records exported successfully')
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedGrade('')
    setSelectedYear('all')
    setSelectedReason('all')
    setSelectedStatus('all')
  }

  const getStatusBadge = (status) => {
    if (status === 'confirmed' || status === 'dropped') return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Confirmed Dropout</span>
    if (status === 'pending_reinstatement') return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending Reinstatement</span>
    if (status === 'reinstated') return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Reinstated</span>
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">{status}</span>
  }

  const statCards = [
    { label: 'Total Dropouts', value: stats.total, icon: UserMinus, statBg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    { label: 'This School Year', value: stats.thisYear, icon: Calendar, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Most Common Reason', value: stats.mostCommon, icon: AlertTriangle, statBg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Reinstatement Requests', value: stats.pending, icon: RotateCcw, statBg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
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
        title="Dropouts"
        subtitle="Student dropout records and reinstatement"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Student Management' }, { label: 'Dropouts' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Download} variant="outline" size="sm" onClick={handleExportCSV}>Export CSV</ActionButton>
            <ActionButton icon={Plus} size="sm" onClick={handleOpenAdd}>Mark as Dropout</ActionButton>
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
          {(search || selectedGrade || selectedYear !== 'all' || selectedReason !== 'all' || selectedStatus !== 'all') && (
            <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="all">All Years</option>
            {schoolYears().map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="all">All Reasons</option>
            {dropoutReasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_reinstatement">Pending Reinstatement</option>
            <option value="reinstated">Reinstated</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredDropouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <UserMinus size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg mb-1">No dropout records found</p>
            <p className="text-gray-400 text-sm mb-5">
              {search || selectedGrade || selectedStatus !== 'all' ? 'Try adjusting your filters' : 'Mark a student as dropout to get started'}
            </p>
            {!search && !selectedGrade && selectedStatus === 'all' && (
              <ActionButton icon={Plus} onClick={handleOpenAdd}>Mark as Dropout</ActionButton>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3.5">LRN</th>
                    <th className="px-4 py-3.5">Student Name</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">Grade / Section</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">Dropout Date</th>
                    <th className="px-4 py-3.5 hidden lg:table-cell">Reason</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {paginatedDropouts.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">{record.lrn || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {(record.first_name?.[0] || '?')}{(record.last_name?.[0] || '')}
                          </div>
                          <span className="font-medium text-gray-800">{record.first_name} {record.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">
                        {formatGradeLevel(record.current_grade_level || record.grade)} - {record.section || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-gray-500">
                        {record.dropout_date ? new Date(record.dropout_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                          {record.dropout_reason || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{getStatusBadge(record.dropout_status)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleViewRecord(record)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="View">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => handleOpenEdit(record)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                            <Edit size={15} />
                          </button>
                          {record.dropout_status !== 'reinstated' && (
                            <button onClick={() => setReinstateConfirm(record)}
                              className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors" title="Reinstate">
                              <RotateCcw size={15} />
                            </button>
                          )}
                          <button onClick={() => setDeleteConfirm(record)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Delete">
                            <Trash2 size={15} />
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
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredDropouts.length)} of {filteredDropouts.length}
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
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserMinus size={18} className="text-red-600" />
                {editingRecord ? 'Edit Dropout Record' : 'Mark as Dropout'}
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

              {!editingRecord && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Student <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="text" placeholder="Search student by name or LRN..."
                      value={studentSearch}
                      onChange={(e) => { setStudentSearch(e.target.value); setStudentDropdownOpen(true); setDropoutForm(prev => ({ ...prev, student_id: '' })) }}
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
                              <p className="text-xs text-gray-400">LRN: {s.lrn || 'N/A'} · {formatGradeLevel(s.current_grade_level || s.grade)}</p>
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
                    <strong>{editingRecord.first_name} {editingRecord.last_name}</strong> (LRN: {editingRecord.lrn})
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Dropout Date <span className="text-red-500">*</span></label>
                  <input type="date"
                    value={dropoutForm.dropout_date}
                    onChange={(e) => setDropoutForm({ ...dropoutForm, dropout_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Last Grade Level</label>
                    <select value={dropoutForm.last_grade_level}
                      onChange={(e) => setDropoutForm({ ...dropoutForm, last_grade_level: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                      <option value="">Select grade</option>
                      {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Last Section</label>
                    <input type="text" placeholder="Section"
                      value={dropoutForm.last_section}
                      onChange={(e) => setDropoutForm({ ...dropoutForm, last_section: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                  <select value={dropoutForm.reason}
                    onChange={(e) => setDropoutForm({ ...dropoutForm, reason: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                    {dropoutReasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes / Details</label>
                  <textarea rows={3} placeholder="Additional details..."
                    value={dropoutForm.notes}
                    onChange={(e) => setDropoutForm({ ...dropoutForm, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 resize-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseModal}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveDropout} loading={saving}>{editingRecord ? 'Update Record' : 'Mark as Dropout'}</ActionButton>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye size={18} className="text-blue-600" /> Dropout Details
              </h2>
              <button onClick={() => setShowViewModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                  {(viewingRecord.first_name?.[0] || '?')}{(viewingRecord.last_name?.[0] || '')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{viewingRecord.first_name} {viewingRecord.last_name}</p>
                  <p className="text-sm text-gray-500">LRN: {viewingRecord.lrn || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><BookOpen size={13} /> Grade / Section</span>
                  <span className="text-sm font-medium text-gray-800">{formatGradeLevel(viewingRecord.current_grade_level || viewingRecord.grade)} - {viewingRecord.section || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Calendar size={13} /> Dropout Date</span>
                  <span className="text-sm font-medium text-gray-800">{viewingRecord.dropout_date ? new Date(viewingRecord.dropout_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Reason</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{viewingRecord.dropout_reason || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Status</span>
                  <div>{getStatusBadge(viewingRecord.dropout_status)}</div>
                </div>
              </div>

              {viewingRecord.notes && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FileText size={12} /> Notes</p>
                  <p className="text-sm text-gray-700">{viewingRecord.notes}</p>
                </div>
              )}

              {viewingRecord.dropout_status !== 'reinstated' && (
                <div className="flex gap-3 mt-4">
                  <ActionButton icon={RotateCcw} variant="success" className="flex-1" onClick={() => { setShowViewModal(false); setReinstateConfirm(viewingRecord) }}>
                    Reinstate Student
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={() => { setShowViewModal(false); handleOpenEdit(viewingRecord) }} icon={Edit}>
                    Edit
                  </ActionButton>
                </div>
              )}
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
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Dropout Record?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to delete the dropout record for <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>? This action cannot be undone.
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

      {reinstateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReinstateConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 z-10 w-full max-w-sm">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <RotateCcw size={24} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Reinstate Student?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to reinstate <strong>{reinstateConfirm.first_name} {reinstateConfirm.last_name}</strong>? Their status will be changed back to Active.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setReinstateConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleReinstate} disabled={reinstatement}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {reinstatement ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Reinstate
              </button>
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