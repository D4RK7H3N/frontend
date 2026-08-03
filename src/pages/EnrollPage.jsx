import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { studentsAPI, academicAPI, financeAPI } from '../services/api'
import { UserPlus, Search, CheckCircle, Clock, XCircle, Loader2, AlertCircle, Check, User, X, ChevronDown, Trash2, AlertTriangle } from 'lucide-react'

const PENDING_KEY = 'pendingEnrollments'

const gradeLevels = ['Grade 11', 'Grade 12', '1st Year Bundled', '2nd Year Bundled']
const schoolYears = () => {
  const current = new Date().getFullYear()
  return [`${current}-${current + 1}`, `${current + 1}-${current + 2}`, `${current + 2}-${current + 3}`]
}

function readPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writePending(list) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list)) } catch {}
}

export default function EnrollPage() {
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [sections, setSections] = useState([])
  const [tracks, setTracks] = useState([])
  const [courses, setCourses] = useState([])

  const [enrollForm, setEnrollForm] = useState({
    school_year: schoolYears()[0],
    grade_level: '',
    section: '',
    track_strand: '',
    course: '',
    initial_tuition: ''
  })
  const [newStudentForm, setNewStudentForm] = useState({
    lrn: '', first_name: '', middle_name: '', last_name: '',
    gender: '', date_of_birth: '', address: '',
    contact_number: '', guardian_name: '', guardian_contact: ''
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const [pendingEnrollments, setPendingEnrollments] = useState(() => readPending())
  const [confirmingPending, setConfirmingPending] = useState(false)
  const [deletingPending, setDeletingPending] = useState(false)

  useEffect(() => { fetchReferenceData() }, [])

  useEffect(() => {
    writePending(pendingEnrollments)
  }, [pendingEnrollments])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const stageEnrollment = (entry) => {
    const id = `staged-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setPendingEnrollments(prev => [{ id, createdAt: new Date().toISOString(), ...entry }, ...prev])
  }

  const removePending = (id) => {
    setPendingEnrollments(prev => prev.filter(p => p.id !== id))
  }

  const gradeFields = (gradeLevel) => {
    if (gradeLevel === 'Grade 11') return { level_type: 'SHS', shs_grade: '11' }
    if (gradeLevel === 'Grade 12') return { level_type: 'SHS', shs_grade: '12' }
    if (gradeLevel === '1st Year Bundled') return { level_type: 'BUN', college_year: '1' }
    if (gradeLevel === '2nd Year Bundled') return { level_type: 'BUN', college_year: '2' }
    return {}
  }

  const handleConfirmPending = async (entry) => {
    if (confirmingPending) return
    setConfirmingPending(true)
    try {
      if (entry.kind === 'new') {
        const studentPayload = {
          ...entry.student,
          ...gradeFields(entry.enrollment.grade_level),
          date_of_birth: entry.student.date_of_birth || null,
          current_grade_level: entry.enrollment.grade_level,
          section: entry.enrollment.section,
          track_strand: entry.enrollment.track_strand,
          course: entry.enrollment.course,
          enrollment_status: 'New',
          status: 'Active'
        }
        const newStudent = await studentsAPI.create(studentPayload)
        if (entry.enrollment.initial_tuition && newStudent.id) {
          await financeAPI.createTuition({
            student_id: newStudent.id,
            total_tuition: parseFloat(entry.enrollment.initial_tuition),
            amount_paid: 0,
            school_year: entry.enrollment.school_year,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash'
          })
        }
        showToast(`${entry.student.first_name} ${entry.student.last_name} confirmed and enrolled`)
      } else if (entry.kind === 'existing' && entry.studentId) {
        await studentsAPI.patch(entry.studentId, {
          ...gradeFields(entry.enrollment.grade_level),
          current_grade_level: entry.enrollment.grade_level,
          section: entry.enrollment.section,
          track_strand: entry.enrollment.track_strand,
          course: entry.enrollment.course,
          enrollment_status: 'Active',
          status: 'Active'
        })
        if (entry.enrollment.initial_tuition) {
          await financeAPI.createTuition({
            student_id: entry.studentId,
            total_tuition: parseFloat(entry.enrollment.initial_tuition),
            amount_paid: 0,
            school_year: entry.enrollment.school_year,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash'
          })
        }
        const name = entry.student?.first_name ? `${entry.student.first_name} ${entry.student.last_name || ''}` : 'Student'
        showToast(`${name.trim()} confirmed and enrolled`)
      }
      removePending(entry.id)
    } catch (err) {
      console.error('Confirm pending error:', err)
      const msg = err?.response?.data?.error || err?.response?.data?.detail || err?.response?.data?.lrn?.[0] || 'Failed to confirm enrollment'
      showToast(Array.isArray(msg) ? msg[0] : msg, 'error')
    } finally {
      setConfirmingPending(false)
    }
  }

  const handleDeletePending = (entry) => {
    if (deletingPending) return
    if (!window.confirm(`Discard staged enrollment for ${entry.student?.first_name || 'this student'}? This will NOT submit to the server.`)) return
    setDeletingPending(true)
    try {
      removePending(entry.id)
      showToast('Staged enrollment discarded')
    } finally {
      setDeletingPending(false)
    }
  }

  const fetchReferenceData = async () => {
    try {
      setLoading(true)
      const [sectionsData, tracksData, coursesData] = await Promise.all([
        academicAPI.getSections().catch(() => []),
        academicAPI.getTracks().catch(() => []),
        academicAPI.getCourses().catch(() => [])
      ])
      setSections(Array.isArray(sectionsData) ? sectionsData : sectionsData.results || [])
      setTracks(Array.isArray(tracksData) ? tracksData : tracksData.results || [])
      setCourses(Array.isArray(coursesData) ? coursesData : coursesData.results || [])
    } catch (err) {
      console.error('Error fetching reference data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    setSelectedStudent(null)
    setShowNewModal(false)
    setFormError(null)
    try {
      const allStudents = await studentsAPI.getAll()
      const query = searchQuery.trim().toLowerCase()
      const found = allStudents.filter(s => {
        const fullName = `${s.first_name || ''} ${s.last_name || ''} ${s.middle_name || ''}`.toLowerCase()
        return (s.lrn || '').toLowerCase().includes(query) || fullName.includes(query)
      })
      setSearchResults(found)
    } catch (err) {
      console.error('Search error:', err)
      showToast('Failed to search students', 'error')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    setSearchResults([])
    setSearchQuery('')
    setShowNewModal(false)
    setFormError(null)
    setEnrollForm({
      school_year: schoolYears()[0],
      grade_level: student.current_grade_level || student.grade || '',
      section: student.section || '',
      track_strand: student.track_strand || student.strand_name || '',
      course: student.course || '',
      initial_tuition: ''
    })
  }

  const handleStartNewStudent = () => {
    setSelectedStudent(null)
    setShowNewModal(true)
    setSearchResults([])
    setFormError(null)
    setNewStudentForm({
      lrn: '', first_name: '', middle_name: '', last_name: '',
      gender: '', date_of_birth: '', address: '',
      contact_number: '', guardian_name: '', guardian_contact: ''
    })
  }

  const handleEnrollExisting = () => {
    if (saving) return
    if (!enrollForm.grade_level) { setFormError('Grade level is required'); return }

    stageEnrollment({
      kind: 'existing',
      studentId: selectedStudent.id,
      student: {
        first_name: selectedStudent.first_name,
        last_name: selectedStudent.last_name,
        lrn: selectedStudent.lrn,
        current_grade_level: selectedStudent.current_grade_level || selectedStudent.grade || ''
      },
      enrollment: { ...enrollForm }
    })
    setSaving(true)
    setTimeout(() => setSaving(false), 0)
    showToast(`${selectedStudent.first_name} ${selectedStudent.last_name} staged for review. Confirm below to finalize.`)
    setSelectedStudent(null)
    setEnrollForm({ school_year: schoolYears()[0], grade_level: '', section: '', track_strand: '', course: '', initial_tuition: '' })
  }

  const handleEnrollNew = () => {
    if (saving) return
    if (!newStudentForm.lrn.trim()) { setFormError('LRN is required'); return }
    if (newStudentForm.lrn.replace(/\D/g, '').length !== 12) { setFormError('LRN must be exactly 12 digits'); return }
    if (!newStudentForm.first_name.trim()) { setFormError('First name is required'); return }
    if (!newStudentForm.last_name.trim()) { setFormError('Last name is required'); return }
    if (!enrollForm.grade_level) { setFormError('Grade level is required'); return }

    stageEnrollment({
      kind: 'new',
      student: { ...newStudentForm, date_of_birth: newStudentForm.date_of_birth || null },
      enrollment: { ...enrollForm }
    })
    setSaving(true)
    setTimeout(() => setSaving(false), 0)
    showToast(`${newStudentForm.first_name} ${newStudentForm.last_name} staged for review. Confirm below to finalize.`)
    setShowNewModal(false)
    setNewStudentForm({ lrn: '', first_name: '', middle_name: '', last_name: '', gender: '', date_of_birth: '', address: '', contact_number: '', guardian_name: '', guardian_contact: '' })
    setEnrollForm({ school_year: schoolYears()[0], grade_level: '', section: '', track_strand: '', course: '', initial_tuition: '' })
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
        title="Student Enrollment"
        subtitle="Enroll new and existing students"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Student Management' }, { label: 'Enroll' }]}
        actions={
          <ActionButton icon={UserPlus} size="sm" onClick={handleStartNewStudent}>New Student</ActionButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Search size={16} className="text-blue-600" /> Find Student
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter LRN or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <ActionButton className="w-full" onClick={handleSearch} loading={searching}>Search</ActionButton>
            </div>

            {searching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                <p className="text-xs text-gray-500 font-medium">{searchResults.length} result(s) found</p>
                {searchResults.map(student => (
                  <button key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-xs">
                        {(student.first_name?.[0] || '?')}{(student.last_name?.[0] || '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate text-sm">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-gray-400">LRN: {student.lrn || 'N/A'} · {student.current_grade_level || student.grade || 'No grade'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchResults.length === 0 && !searching && searchQuery && (
              <div className="mt-4 text-center py-6">
                <User size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 mb-3">No students found</p>
                <button onClick={handleStartNewStudent} className="text-sm text-blue-600 font-medium hover:underline">
                  Enroll as new student instead
                </button>
              </div>
            )}

            {!selectedStudent && !searchResults.length && (
              <div className="mt-4 text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <UserPlus size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Search for an existing student or create a new enrollment</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedStudent && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                      {(selectedStudent.first_name?.[0] || '?')}{(selectedStudent.last_name?.[0] || '')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                      <p className="text-xs text-gray-500">LRN: {selectedStudent.lrn}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="p-5">
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle size={16} /> {formError}
                  </div>
                )}
                <h4 className="font-semibold text-gray-800 mb-4">Enrollment Details</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">School Year</label>
                      <select value={enrollForm.school_year}
                        onChange={(e) => setEnrollForm({ ...enrollForm, school_year: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                        {schoolYears().map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level <span className="text-red-500">*</span></label>
                      <select value={enrollForm.grade_level}
                        onChange={(e) => setEnrollForm({ ...enrollForm, grade_level: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                        <option value="">Select grade</option>
                        {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                      <input type="text" placeholder="e.g. Gold" value={enrollForm.section}
                        onChange={(e) => setEnrollForm({ ...enrollForm, section: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Track / Strand</label>
                      <select value={enrollForm.track_strand}
                        onChange={(e) => setEnrollForm({ ...enrollForm, track_strand: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                        <option value="">Select track</option>
                        {tracks.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
                    <input type="text" placeholder="Course (optional)" value={enrollForm.course}
                      onChange={(e) => setEnrollForm({ ...enrollForm, course: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Initial Tuition Amount (₱)</label>
                    <input type="number" min="0" step="0.01" placeholder="Leave blank if not setting tuition now"
                      value={enrollForm.initial_tuition}
                      onChange={(e) => setEnrollForm({ ...enrollForm, initial_tuition: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <ActionButton variant="secondary" onClick={() => setSelectedStudent(null)}>Cancel</ActionButton>
                  <ActionButton icon={CheckCircle} onClick={handleEnrollExisting} loading={saving}>Enroll Student</ActionButton>
                </div>
              </div>
            </div>
          )}

          {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" />
                Enroll New Student
              </h2>
              <button onClick={() => setShowNewModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              <h4 className="font-semibold text-gray-800 mb-4">Student Information</h4>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">LRN <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="12-digit LRN" maxLength={12} value={newStudentForm.lrn}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, lrn: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Last name" value={newStudentForm.last_name}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, last_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="First name" value={newStudentForm.first_name}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, first_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Middle Name</label>
                    <input type="text" placeholder="Middle name" value={newStudentForm.middle_name}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, middle_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                    <select value={newStudentForm.gender}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Birthday</label>
                    <input type="date" value={newStudentForm.date_of_birth}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Contact</label>
                    <input type="text" placeholder="Contact number" value={newStudentForm.contact_number}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, contact_number: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                  <input type="text" placeholder="Complete address" value={newStudentForm.address}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Guardian Name</label>
                    <input type="text" placeholder="Guardian / Parent" value={newStudentForm.guardian_name}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, guardian_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Guardian Contact</label>
                    <input type="text" placeholder="Guardian contact" value={newStudentForm.guardian_contact}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, guardian_contact: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                </div>
              </div>

              <h4 className="font-semibold text-gray-800 mb-4">Enrollment Details</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">School Year</label>
                    <select value={enrollForm.school_year}
                      onChange={(e) => setEnrollForm({ ...enrollForm, school_year: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                      {schoolYears().map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level <span className="text-red-500">*</span></label>
                    <select value={enrollForm.grade_level}
                      onChange={(e) => setEnrollForm({ ...enrollForm, grade_level: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                      <option value="">Select grade</option>
                      {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                    <input type="text" placeholder="e.g. Gold" value={enrollForm.section}
                      onChange={(e) => setEnrollForm({ ...enrollForm, section: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Track / Strand</label>
                    <select value={enrollForm.track_strand}
                      onChange={(e) => setEnrollForm({ ...enrollForm, track_strand: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                      <option value="">Select track</option>
                      {tracks.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Initial Tuition Amount (₱)</label>
                  <input type="number" min="0" step="0.01" placeholder="Leave blank if not setting tuition now"
                    value={enrollForm.initial_tuition}
                    onChange={(e) => setEnrollForm({ ...enrollForm, initial_tuition: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <ActionButton variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</ActionButton>
                <ActionButton icon={CheckCircle} onClick={handleEnrollNew} loading={saving}>Enroll Student</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

          {pendingEnrollments.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} className="text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Pending Enrollments</h3>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">{pendingEnrollments.length}</span>
                </div>
                <p className="text-sm text-amber-700">Review each staged enrollment below. Click <strong>Confirm</strong> to commit it to the server, or <strong>Delete</strong> to discard it.</p>
              </div>
              {pendingEnrollments.map((entry) => {
                const name = entry.student?.first_name
                  ? `${entry.student.first_name} ${entry.student.middle_name ? entry.student.middle_name + ' ' : ''}${entry.student.last_name || ''}`.trim()
                  : 'New student'
                return (
                  <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(entry.student?.first_name?.[0] || '?')}{(entry.student?.last_name?.[0] || '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800">{name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                              {entry.kind === 'new' ? 'New student' : 'Existing update'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            LRN: {entry.student?.lrn || 'N/A'}
                            {entry.student?.current_grade_level ? ` · ${entry.student.current_grade_level}` : ''}
                            {entry.student?.gender ? ` · ${entry.student.gender}` : ''}
                          </p>
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500">School Year</p>
                              <p className="font-semibold text-gray-800">{entry.enrollment.school_year}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500">Grade Level</p>
                              <p className="font-semibold text-gray-800">{entry.enrollment.grade_level || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500">Section</p>
                              <p className="font-semibold text-gray-800">{entry.enrollment.section || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500">Track / Strand</p>
                              <p className="font-semibold text-gray-800">{entry.enrollment.track_strand || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500">Course</p>
                              <p className="font-semibold text-gray-800">{entry.enrollment.course || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500">Initial Tuition</p>
                              <p className="font-semibold text-gray-800">
                                {entry.enrollment.initial_tuition ? `₱${parseFloat(entry.enrollment.initial_tuition).toLocaleString()}` : '—'}
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-2">Staged {new Date(entry.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2 md:min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => handleConfirmPending(entry)}
                          disabled={confirmingPending}
                          className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <Check size={14} /> Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePending(entry)}
                          disabled={deletingPending}
                          className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <UserPlus size={40} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Student Enrollment List</h3>
              <p className="text-sm text-gray-500 mb-6">Search for an existing student on the left, or stage a new enrollment. Staged entries appear here for review before saving.</p>
              <ActionButton icon={UserPlus} onClick={handleStartNewStudent}>Enroll New Student</ActionButton>
            </div>
          )}
        </div>
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
      `}</style>
    </div>
  )
}