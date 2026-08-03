import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Search, Download, Users, MoreHorizontal, Loader2, Printer, X, Filter, ChevronDown, Pencil, Trash2, Eye, AlertCircle, Check, ChevronLeft, ChevronRight, Calendar, CreditCard, BookOpen, User, Phone, Mail, MapPin, Shield, Upload, UserMinus } from 'lucide-react'
import PesoSign from '../components/PesoSign'
import { studentsAPI, academicAPI, financeAPI, dropoutAPI } from '../services/api'

const ITEMS_PER_PAGE = 20

const gradeLevels = ['Grade 11', 'Grade 12', '1st Year Bundled', '2nd Year Bundled']
const formatGradeLevel = (grade) => {
  if (!grade) return 'N/A'
  if (grade === 'Grade 11') return '11'
  if (grade === 'Grade 12') return '12'
  if (grade === '1st Year Tesda Accredited' || grade === '1st Year Bundled') return 'BUN-1st'
  if (grade === '2nd Year Tesda Accredited' || grade === '2nd Year Bundled') return 'BUN-2nd'
  return grade
}
const genderOptions = ['Male', 'Female']
const paymentMethods = ['Cash', 'GCash', 'Bank Transfer']

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null)

  const [sections, setSections] = useState([])
  const [tracks, setTracks] = useState([])
  const [courses, setCourses] = useState([])

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [addEditForm, setAddEditForm] = useState({
    lrn: '', first_name: '', middle_name: '', last_name: '',
    gender: '', date_of_birth: '', address: '',
    current_grade_level: '', section: '', track_strand: '', course: '',
    contact_number: '', guardian_name: '', guardian_contact: '',
  })
  const [saving, setSaving] = useState(false)
  const [addEditError, setAddEditError] = useState(null)

  const [viewStudent, setViewStudent] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [studentTuition, setStudentTuition] = useState(null)

  const [showEditTuition, setShowEditTuition] = useState(false)
  const [editTuitionForm, setEditTuitionForm] = useState({
    total_tuition: '', amount_paid: '', payment_date: '', payment_method: 'Cash', notes: ''
  })
  const [savingTuition, setSavingTuition] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [dropoutConfirm, setDropoutConfirm] = useState(null)
  const [dropoutReason, setDropoutReason] = useState('Financial')
  const [droppingOut, setDroppingOut] = useState(false)

  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    filterStudents()
  }, [search, selectedGrade, selectedSection, selectedTrack, students, currentPage])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [studentsData, sectionsData, tracksData, coursesData] = await Promise.all([
        studentsAPI.getAll(),
        academicAPI.getSections().catch(() => []),
        academicAPI.getTracks().catch(() => []),
        academicAPI.getCourses().catch(() => [])
      ])
      const list = Array.isArray(studentsData) ? studentsData : studentsData.results || []
      setStudents(list)
      setSections(Array.isArray(sectionsData) ? sectionsData : sectionsData.results || [])
      setTracks(Array.isArray(tracksData) ? tracksData : tracksData.results || [])
      setCourses(Array.isArray(coursesData) ? coursesData : coursesData.results || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load students. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filterStudents = () => {
    let filtered = [...students]
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(s =>
        `${s.first_name || ''} ${s.last_name || ''} ${s.middle_name || ''}`.toLowerCase().includes(searchLower) ||
        (s.lrn || '').toLowerCase().includes(searchLower)
      )
    }
    if (selectedGrade) {
      const aliases = [selectedGrade]
      if (selectedGrade === '1st Year Bundled') aliases.push('1st Year Tesda Accredited')
      if (selectedGrade === '2nd Year Bundled') aliases.push('2nd Year Tesda Accredited')
      filtered = filtered.filter(s => aliases.includes(s.current_grade_level) || aliases.includes(s.grade))
    }
    if (selectedSection) filtered = filtered.filter(s => s.section === selectedSection)
    if (selectedTrack) filtered = filtered.filter(s => s.track_strand === selectedTrack || s.strand_name === selectedTrack)
    setFilteredStudents(filtered)
    setCurrentPage(1)
  }

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredStudents, currentPage])

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)

  const uniqueSections = [...new Set(students.map(s => s.section).filter(Boolean))].sort()
  const uniqueTracks = [...new Set(students.map(s => s.track_strand || s.strand_name).filter(Boolean))].sort()

  const inferLevelType = (gradeLevel) => {
    if (!gradeLevel) return 'ALL'
    const g = gradeLevel.toLowerCase()
    if (g.includes('grade')) return 'SHS'
    if (g.includes('bundled') || g.includes('year')) return 'BUN'
    if (g.includes('college')) return 'COL'
    return 'ALL'
  }

  const ensureSectionExists = async (sectionName, gradeLevel) => {
    const trimmed = (sectionName || '').trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    const exists = sections.some(s => (s.name || '').toLowerCase() === lower)
    if (exists) return
    try {
      const payload = {
        name: trimmed,
        level_type: inferLevelType(gradeLevel),
        grade_year: gradeLevel || '',
      }
      const created = await academicAPI.createSection(payload)
      setSections(prev => [...prev, created])
    } catch (err) {
      console.error('Auto-create section failed:', err?.response?.data)
    }
  }

  const generateCode = (name) => {
    if (!name) return 'GEN'
    return name.split(/\s+/).slice(0, 4).map(w => w[0]).join('').toUpperCase() || 'GEN'
  }

  const ensureTrackStrandExists = async (trackStrand) => {
    const trimmed = (trackStrand || '').trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    const trackExists = tracks.some(t => (t.name || '').toLowerCase() === lower)
    if (trackExists) return
    const strandExists = tracks.some(t =>
      (t.strands || []).some(s => (s.name || '').toLowerCase() === lower)
    )
    if (strandExists) return
    try {
      let trackName, strandName
      if (trimmed.includes(' - ')) {
        [trackName, strandName] = trimmed.split(' - ', 2).map(s => s.trim())
      } else {
        trackName = 'General Track'
        strandName = trimmed
      }
      const trackCode = generateCode(trackName)
      const trackCreated = await academicAPI.createTrack({ name: trackName, code: trackCode, level_type: 'SHS' })
      setTracks(prev => [...prev, trackCreated])
      const strandCode = generateCode(strandName)
      await academicAPI.createStrand({ track: trackCreated.id, name: strandName, code: strandCode })
    } catch (err) {
      console.error('Auto-create track/strand failed:', err?.response?.data)
    }
  }

  const handleOpenAdd = () => {
    setEditingStudent(null)
    setAddEditForm({
      lrn: '', first_name: '', middle_name: '', last_name: '',
      gender: '', date_of_birth: '', address: '',
      current_grade_level: '', section: '', track_strand: '', course: '',
      contact_number: '', guardian_name: '', guardian_contact: '',
    })
    setAddEditError(null)
    setShowAddEdit(true)
  }

  const handleOpenEdit = (student) => {
    setEditingStudent(student)
    setAddEditForm({
      lrn: student.lrn || '',
      first_name: student.first_name || '',
      middle_name: student.middle_name || '',
      last_name: student.last_name || '',
      gender: student.gender || '',
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      current_grade_level: student.current_grade_level || student.grade || '',
      section: student.section || '',
      track_strand: student.track_strand || student.strand_name || '',
      course: student.course || '',
      contact_number: student.contact_number || student.phone || '',
      guardian_name: student.guardian_name || '',
      guardian_contact: student.guardian_contact || '',
    })
    setAddEditError(null)
    setShowAddEdit(true)
  }

  const validateAddEdit = () => {
    if (!addEditForm.lrn.trim()) return 'LRN is required'
    if (addEditForm.lrn.replace(/\D/g, '').length !== 12) return 'LRN must be exactly 12 digits'
    if (!addEditForm.first_name.trim()) return 'First name is required'
    if (!addEditForm.last_name.trim()) return 'Last name is required'
    return null
  }

  const handleSaveAddEdit = async () => {
    if (saving) return
    const validationError = validateAddEdit()
    if (validationError) { setAddEditError(validationError); return }
    setSaving(true)
    setAddEditError(null)
    try {
      const payload = { ...addEditForm }
      if (!payload.date_of_birth) payload.date_of_birth = null
      if (editingStudent) {
        await studentsAPI.update(editingStudent.id, payload)
        showToast(`${payload.first_name} ${payload.last_name} updated successfully`)
      } else {
        await studentsAPI.create(payload)
        showToast(`${payload.first_name} ${payload.last_name} enrolled successfully`)
      }
      setShowAddEdit(false)
      fetchData()
    } catch (err) {
      console.error('Save error:', err)
      const msg = err?.response?.data?.lrn?.[0] || err?.response?.data?.error || 'Failed to save student'
      setAddEditError(Array.isArray(msg) ? msg[0] : msg)
    } finally {
      setSaving(false)
    }
  }

  const handleViewStudent = async (student) => {
    setViewStudent(student)
    setViewLoading(true)
    setStudentTuition(null)
    try {
      const tuitionTotal = parseFloat(student.tuition_fee || 0)
      const paid = parseFloat(student.total_paid || student.amount_paid || 0)
      const balance = tuitionTotal - paid
      let status = 'unpaid'
      if (tuitionTotal > 0 && paid >= tuitionTotal) status = 'paid'
      else if (paid > 0) status = 'partial'
      setStudentTuition({ total: tuitionTotal, paid, balance, status })
    } catch (e) {
      console.error('Error loading tuition:', e)
    } finally {
      setViewLoading(false)
    }
  }

  const handleOpenEditTuition = () => {
    if (!studentTuition) return
    setEditTuitionForm({
      total_tuition: studentTuition.total.toString(),
      amount_paid: studentTuition.paid.toString(),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      notes: ''
    })
    setShowEditTuition(true)
  }

  const calculatedBalance = (parseFloat(editTuitionForm.total_tuition) || 0) - (parseFloat(editTuitionForm.amount_paid) || 0)

  const handleSaveTuition = async () => {
    if (savingTuition) return
    const totalTuit = parseFloat(editTuitionForm.total_tuition)
    const amountPaid = parseFloat(editTuitionForm.amount_paid)
    if (!totalTuit || totalTuit <= 0) { showToast('Total tuition must be greater than 0', 'error'); return }
    if (amountPaid > totalTuit) { showToast('Amount paid cannot exceed total tuition', 'error'); return }
    if (amountPaid < 0) { showToast('Amount paid cannot be negative', 'error'); return }
    setSavingTuition(true)
    try {
      const schoolYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
      const payload = {
        student_id: viewStudent.id,
        total_tuition: totalTuit,
        amount_paid: amountPaid,
        payment_date: editTuitionForm.payment_date,
        payment_method: editTuitionForm.payment_method.toLowerCase().replace(' ', '_'),
        school_year: schoolYear,
        notes: editTuitionForm.notes
      }
      let savedRecord = null
      try {
        const existing = await financeAPI.getTuitionByStudent(viewStudent.id)
        const list = Array.isArray(existing) ? existing : (existing.results || [])
        const sameYear = list.find(r => r.school_year === schoolYear)
        if (sameYear && sameYear.id) {
          savedRecord = await financeAPI.updateTuition(sameYear.id, payload)
        } else {
          savedRecord = await financeAPI.createTuition(payload)
        }
      } catch (lookupErr) {
        savedRecord = await financeAPI.createTuition(payload)
      }
      showToast(savedRecord ? 'Tuition updated successfully' : 'Tuition saved')
      setShowEditTuition(false)
      fetchData()
      const updated = students.find(s => s.id === viewStudent.id) || viewStudent
      handleViewStudent({ ...updated, tuition_fee: totalTuit, total_paid: amountPaid })
    } catch (err) {
      console.error('Tuition save error:', err)
      showToast(err?.response?.data?.error || 'Failed to update tuition', 'error')
    } finally {
      setSavingTuition(false)
    }
  }

  const handleDeleteStudent = async (student) => {
    if (deleting) return
    setDeleting(true)
    try {
      await studentsAPI.delete(student.id)
      setDeleteConfirm(null)
      showToast(`${student.first_name} ${student.last_name} removed successfully`)
      fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Failed to delete student. Please try again.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleDropout = async (student) => {
    if (droppingOut) return
    setDroppingOut(true)
    try {
      await Promise.all([
        studentsAPI.patch(student.id, { status: 'Drop-out' }),
        dropoutAPI.create({ student: student.id, dropout_date: new Date().toISOString().split('T')[0], reason: dropoutReason })
      ])
      setDropoutConfirm(null)
      setDropoutReason('Financial')
      showToast(`${student.first_name} ${student.last_name} marked as dropout`)
      fetchData()
    } catch (err) {
      console.error('Dropout error:', err)
      showToast('Failed to mark student as dropout', 'error')
    } finally {
      setDroppingOut(false)
    }
  }

  const handleExport = () => {
    const headers = ['LRN', 'Last Name', 'First Name', 'Middle Name', 'Grade', 'Section', 'Strand', 'Status']
    const csvContent = [headers.join(','),
      ...filteredStudents.map(s => [
        s.lrn || '', s.last_name || '', s.first_name || '', s.middle_name || '',
        formatGradeLevel(s.current_grade_level || s.grade), s.section || '',
        s.track_strand || s.strand_name || '', s.status || ''
      ].map(v => `"${v}"`).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    showToast('Student records exported successfully')
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) { setUploadFile(file); setUploadResult(null) }
  }

  const handleUploadStudents = async () => {
    if (!uploadFile) return
    const maxSize = 10 * 1024 * 1024
    if (uploadFile.size > maxSize) {
      setUploadResult({ success: false, message: 'File size exceeds 10MB limit.', errors: [] })
      return
    }
    setUploadLoading(true)
    setUploadResult(null)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      const response = await studentsAPI.bulkUpload(formData)
      if (response.success) {
        setUploadResult({ success: true, message: response.message || 'Upload complete', created: response.created_count, updated: response.updated_count, errors: response.errors || [] })
        fetchData()
      } else {
        setUploadResult({ success: false, message: response.error || 'Upload failed', errors: [] })
      }
    } catch (err) {
      setUploadResult({ success: false, message: err?.response?.data?.error || 'Error uploading file.', errors: [] })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleCloseUploadDialog = () => {
    setUploadDialog(false)
    setUploadFile(null)
    setUploadResult(null)
  }

  const getStatusBadge = (student) => {
    if (student.status === 'Active') return <StatusBadge status="active" />
    if (student.status === 'Inactive') return <StatusBadge status="inactive" />
    if (student.status === 'Drop-out' || student.status === 'Dropout') return <StatusBadge status="dropped" />
    if (student.status === 'Graduated') return <StatusBadge status="graduated" />
    return <StatusBadge status="pending" />
  }

  const tuitionProgress = studentTuition?.total > 0 ? Math.min(100, (studentTuition.paid / studentTuition.total) * 100) : 0
  const tuitionColor = studentTuition?.status === 'paid' ? 'bg-green-500' : studentTuition?.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={loading ? 'Loading...' : `${filteredStudents.length} of ${students.length} records`}
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Student Management' }, { label: 'Students' }]}
        actions={
          <><ActionButton icon={Upload} variant="outline" size="sm" onClick={() => setUploadDialog(true)}>Upload</ActionButton>
          <ActionButton icon={Download} variant="outline" size="sm" onClick={handleExport}>Export</ActionButton></>
        }
      />

      <div className="bg-white p-4 mb-5 rounded-2xl border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or LRN..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 text-gray-900" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${showFilters || selectedGrade || selectedSection || selectedTrack ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={16} /> Filters
            {(selectedGrade ? 1 : 0) + (selectedSection ? 1 : 0) + (selectedTrack ? 1 : 0) > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {(selectedGrade ? 1 : 0) + (selectedSection ? 1 : 0) + (selectedTrack ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 ${showFilters ? 'block' : 'hidden lg:grid'}`}>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="">All Grades</option>
            {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="">All Sections</option>
            {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="">All Tracks</option>
            {uniqueTracks.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(selectedGrade || selectedSection || selectedTrack) && (
            <button onClick={() => { setSelectedGrade(''); setSelectedSection(''); setSelectedTrack('') }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading students..." fullPage={true} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchData} suggestion="Please try again or contact the administrator." />
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
              <Users size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg mb-1">No students found</p>
            <p className="text-gray-400 text-sm">
              {search || selectedGrade || selectedSection || selectedTrack ? 'Try adjusting your search or filters' : 'Get started by enrolling your first student'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-4 py-3.5">LRN</th>
                    <th className="px-4 py-3.5">Grade / Section</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">Track / Strand</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">Gender</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-xs shrink-0">
                            {(student.first_name?.[0] || '?')}{(student.last_name?.[0] || '')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{student.last_name}, {student.first_name}</p>
                            {student.middle_name && <p className="text-xs text-gray-400 truncate">{student.middle_name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">{student.lrn || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-800">{formatGradeLevel(student.current_grade_level || student.grade)}</span>
                        {student.section && <span className="text-gray-400 text-xs ml-1">- {student.section}</span>}
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">{student.track_strand || student.strand_name || 'N/A'}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">{student.gender || 'N/A'}</td>
                      <td className="px-4 py-3.5">{getStatusBadge(student)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleViewStudent(student)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="View">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => handleOpenEdit(student)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => { setDropoutConfirm(student); setDropoutReason('Financial') }} className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors" title="Mark as Dropout">
                            <UserMinus size={15} />
                          </button>
                          <button onClick={() => setDeleteConfirm(student)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Delete">
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
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
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

      {showAddEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddEdit(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={() => setShowAddEdit(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {addEditError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} /> {addEditError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">LRN <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="12-digit LRN" maxLength={12} value={addEditForm.lrn}
                    onChange={(e) => setAddEditForm({ ...addEditForm, lrn: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Last name" value={addEditForm.last_name}
                      onChange={(e) => setAddEditForm({ ...addEditForm, last_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="First name" value={addEditForm.first_name}
                      onChange={(e) => setAddEditForm({ ...addEditForm, first_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Middle Name</label>
                    <input type="text" placeholder="Middle name" value={addEditForm.middle_name}
                      onChange={(e) => setAddEditForm({ ...addEditForm, middle_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                    <select value={addEditForm.gender} onChange={(e) => setAddEditForm({ ...addEditForm, gender: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                      <option value="">Select gender</option>
                      {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Birthday</label>
                    <input type="date" value={addEditForm.date_of_birth}
                      onChange={(e) => setAddEditForm({ ...addEditForm, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Contact Number</label>
                    <input type="text" placeholder="09123456789" value={addEditForm.contact_number}
                      onChange={(e) => setAddEditForm({ ...addEditForm, contact_number: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                  <input type="text" placeholder="Complete address" value={addEditForm.address}
                    onChange={(e) => setAddEditForm({ ...addEditForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level</label>
                    <select value={addEditForm.current_grade_level} onChange={(e) => setAddEditForm({ ...addEditForm, current_grade_level: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                      <option value="">Select grade</option>
                      {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                    <input type="text" placeholder="Section" value={addEditForm.section}
                      onChange={(e) => setAddEditForm({ ...addEditForm, section: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Track / Strand</label>
                    <input type="text" placeholder="Track or Strand" value={addEditForm.track_strand}
                      onChange={(e) => setAddEditForm({ ...addEditForm, track_strand: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
                  <input type="text" placeholder="Course" value={addEditForm.course}
                    onChange={(e) => setAddEditForm({ ...addEditForm, course: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Guardian Name</label>
                    <input type="text" placeholder="Guardian / Parent name" value={addEditForm.guardian_name}
                      onChange={(e) => setAddEditForm({ ...addEditForm, guardian_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Guardian Contact</label>
                    <input type="text" placeholder="Guardian contact number" value={addEditForm.guardian_contact}
                      onChange={(e) => setAddEditForm({ ...addEditForm, guardian_contact: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <ActionButton variant="secondary" onClick={() => setShowAddEdit(false)}>Cancel</ActionButton>
                <ActionButton onClick={handleSaveAddEdit} loading={saving}>{editingStudent ? 'Update Student' : 'Add Student'}</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewStudent(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">Student Profile</h2>
              <button onClick={() => setViewStudent(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {viewLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                      {(viewStudent.first_name?.[0] || '?')}{(viewStudent.last_name?.[0] || '')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{viewStudent.first_name} {viewStudent.middle_name ? viewStudent.middle_name + ' ' : ''}{viewStudent.last_name}</h3>
                      <p className="text-sm text-gray-500">LRN: {viewStudent.lrn || 'N/A'}</p>
                      <div className="mt-1">{getStatusBadge(viewStudent)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-gray-400" />
                      <span className="text-gray-500">Gender:</span>
                      <span className="font-medium text-gray-800">{viewStudent.gender || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-500">Birthday:</span>
                      <span className="font-medium text-gray-800">{viewStudent.date_of_birth || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-gray-500">Contact:</span>
                      <span className="font-medium text-gray-800">{viewStudent.contact_number || viewStudent.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen size={14} className="text-gray-400" />
                      <span className="text-gray-500">Grade:</span>
                      <span className="font-medium text-gray-800">{formatGradeLevel(viewStudent.current_grade_level || viewStudent.grade)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield size={14} className="text-gray-400" />
                      <span className="text-gray-500">Section:</span>
                      <span className="font-medium text-gray-800">{viewStudent.section || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen size={14} className="text-gray-400" />
                      <span className="text-gray-500">Track:</span>
                      <span className="font-medium text-gray-800">{viewStudent.track_strand || viewStudent.strand_name || 'N/A'}</span>
                    </div>
                  </div>

                  {viewStudent.address && (
                    <div className="flex items-start gap-2 text-sm mb-6">
                      <MapPin size={14} className="text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-500">Address:</span>
                        <span className="font-medium text-gray-800 ml-1">{viewStudent.address}</span>
                      </div>
                    </div>
                  )}

                  {(viewStudent.guardian_name || viewStudent.guardian_contact) && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Guardian Information</p>
                      <div className="grid grid-cols-2 gap-3">
                        {viewStudent.guardian_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User size={13} className="text-gray-400" />
                            <span className="text-gray-600">{viewStudent.guardian_name}</span>
                          </div>
                        )}
                        {viewStudent.guardian_contact && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={13} className="text-gray-400" />
                            <span className="text-gray-600">{viewStudent.guardian_contact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <PesoSign size={14} /> Tuition Summary
                      </h4>
                      <button onClick={handleOpenEditTuition}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                    {studentTuition ? (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Total Tuition</p>
                            <p className="text-lg font-bold text-gray-800">₱{studentTuition.total.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                            <p className="text-lg font-bold text-green-600">₱{studentTuition.paid.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Balance</p>
                            <p className={`text-lg font-bold ${studentTuition.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₱{studentTuition.balance.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                          <span>Payment Progress</span>
                          <span>{Math.round(tuitionProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full transition-all ${tuitionColor}`} style={{ width: `${tuitionProgress}%` }} />
                        </div>
                        <div className="mt-3 flex justify-center">
                          <StatusBadge status={studentTuition.status} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <PesoSign size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tuition record found</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditTuition && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditTuition(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Edit Tuition</h2>
              <button onClick={() => setShowEditTuition(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Total Tuition Amount (₱)</label>
                <input type="number" min="0" step="0.01" value={editTuitionForm.total_tuition}
                  onChange={(e) => setEditTuitionForm({ ...editTuitionForm, total_tuition: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount Paid (₱)</label>
                <input type="number" min="0" step="0.01" value={editTuitionForm.amount_paid}
                  onChange={(e) => setEditTuitionForm({ ...editTuitionForm, amount_paid: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
              {calculatedBalance >= 0 && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-600">Remaining Balance</p>
                  <p className="text-lg font-bold text-blue-700">₱{calculatedBalance.toLocaleString()}</p>
                </div>
              )}
              {calculatedBalance < 0 && (
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-600">Amount paid exceeds total tuition!</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Date</label>
                  <input type="date" value={editTuitionForm.payment_date}
                    onChange={(e) => setEditTuitionForm({ ...editTuitionForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                  <select value={editTuitionForm.payment_method}
                    onChange={(e) => setEditTuitionForm({ ...editTuitionForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea value={editTuitionForm.notes} rows={2}
                  onChange={(e) => setEditTuitionForm({ ...editTuitionForm, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={() => setShowEditTuition(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveTuition} loading={savingTuition}>Save Changes</ActionButton>
            </div>
          </div>
        </div>
      )}

      {uploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseUploadDialog} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Upload size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Upload Students from Excel</h2>
              </div>
              <button onClick={handleCloseUploadDialog} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="p-3 bg-blue-50 rounded-xl mb-4 text-sm text-blue-800">
                <p className="mb-1"><strong>Required:</strong> LRN, FirstName, LastName</p>
                <p className="mb-1"><strong>Optional:</strong> Middle, GradeLevel, LevelType (SHS/BUN), Status, Track_Strand, Section, Tuition</p>
                <p className="text-xs text-blue-600 mt-2">
                  <strong>Tuition Rules:</strong><br/>
                  • New = ₱0 (Non-Payee)<br/>
                  • Continuing/ALS Graduate = Full tuition (SHS: ₱11,000 | BUN: ₱16,000)<br/>
                  • Transferee = 70% of tuition<br/>
                  • Custom Tuition column overrides auto-calculation
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors mb-4"
                onClick={() => document.getElementById('upload-file-input').click()}>
                <input id="upload-file-input" type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                <Upload size={40} className={`mx-auto mb-2 ${uploadFile ? 'text-blue-600' : 'text-gray-400'}`} />
                {uploadFile ? (
                  <p className="text-sm font-medium text-blue-600">{uploadFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Click to select an Excel file</p>
                    <p className="text-xs text-gray-400 mt-1">Supports .xlsx files only</p>
                  </>
                )}
              </div>

              {uploadResult && (
                <div className={`p-3 rounded-xl text-sm mb-4 ${uploadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <p className="font-medium">{uploadResult.success ? 'Upload complete!' : uploadResult.message}</p>
                  {uploadResult.success && (
                    <p className="text-xs mt-1">Created: {uploadResult.created} | Updated: {uploadResult.updated}</p>
                  )}
                  {uploadResult.errors?.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <p className="text-xs font-medium mb-1">Errors ({uploadResult.errors.length}):</p>
                      {uploadResult.errors.map((err, i) => (
                        <p key={i} className="text-xs">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3 text-xs">
                <p className="font-medium text-gray-700 mb-2">Sample Excel Format:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pr-3 py-1 font-semibold text-gray-600">LRN*</th>
                        <th className="pr-3 py-1 font-semibold text-gray-600">FirstName*</th>
                        <th className="pr-3 py-1 font-semibold text-gray-600">Middle</th>
                        <th className="pr-3 py-1 font-semibold text-gray-600">LastName*</th>
                        <th className="pr-3 py-1 font-semibold text-gray-600">LevelType</th>
                        <th className="pr-3 py-1 font-semibold text-gray-600">Status</th>
                        <th className="pr-3 py-1 font-semibold text-gray-600">Tuition</th>
                        <th className="py-1 font-semibold text-gray-600">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="pr-3 py-1">123456789012</td>
                        <td className="pr-3 py-1">Juan</td>
                        <td className="pr-3 py-1">Santos</td>
                        <td className="pr-3 py-1">Dela Cruz</td>
                        <td className="pr-3 py-1">SHS</td>
                        <td className="pr-3 py-1">New</td>
                        <td className="pr-3 py-1"></td>
                        <td className="py-1 text-blue-600">₱0</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="pr-3 py-1">123456789013</td>
                        <td className="pr-3 py-1">Maria</td>
                        <td className="pr-3 py-1"></td>
                        <td className="pr-3 py-1">Garcia</td>
                        <td className="pr-3 py-1">SHS</td>
                        <td className="pr-3 py-1">Continuing</td>
                        <td className="pr-3 py-1"></td>
                        <td className="py-1 text-green-600">₱11,000</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="pr-3 py-1">123456789014</td>
                        <td className="pr-3 py-1">Pedro</td>
                        <td className="pr-3 py-1">Reyes</td>
                        <td className="pr-3 py-1">Santos</td>
                        <td className="pr-3 py-1">BUN</td>
                        <td className="pr-3 py-1">Transferee</td>
                        <td className="pr-3 py-1"></td>
                        <td className="py-1 text-yellow-600">₱11,200</td>
                      </tr>
                      <tr>
                        <td className="pr-3 py-1">123456789015</td>
                        <td className="pr-3 py-1">Ana</td>
                        <td className="pr-3 py-1"></td>
                        <td className="pr-3 py-1">Cruz</td>
                        <td className="pr-3 py-1">BUN</td>
                        <td className="pr-3 py-1">Continuing</td>
                        <td className="pr-3 py-1">5000</td>
                        <td className="py-1 text-purple-600">₱5,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">* Required columns. Leave Tuition blank for auto-calculation.</p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={handleCloseUploadDialog} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                {uploadResult?.success ? 'Close' : 'Cancel'}
              </button>
              {!uploadResult?.success && (
                <button onClick={handleUploadStudents} disabled={!uploadFile || uploadLoading}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                  {uploadLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploadLoading ? 'Uploading...' : 'Upload Students'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {dropoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDropoutConfirm(null); setDropoutReason('Financial') }} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 z-10 w-full max-w-sm">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <UserMinus size={24} className="text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Mark as Dropout?</h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              Mark <strong>{dropoutConfirm.first_name} {dropoutConfirm.last_name}</strong> as a dropout student.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
              <select value={dropoutReason} onChange={(e) => setDropoutReason(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                <option value="Financial">Financial</option>
                <option value="Personal">Personal</option>
                <option value="Academic">Academic</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDropoutConfirm(null); setDropoutReason('Financial') }} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleDropout(dropoutConfirm)} disabled={droppingOut}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {droppingOut ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />} Mark as Dropout
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
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Remove Student?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to remove <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleDeleteStudent(deleteConfirm)} disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-slide-up flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
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
