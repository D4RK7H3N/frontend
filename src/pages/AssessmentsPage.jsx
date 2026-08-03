import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { Search, Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, X, AlertTriangle, FileText, Check, Eye } from 'lucide-react'
import { academicAPI, studentsAPI, financeAPI, activitiesAPI } from '../services/api'
import StudentPaymentModal from '../components/StudentPaymentModal'
import PesoSign from '../components/PesoSign'

export default function AssessmentsPage() {
  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState([])
  const [assessmentTypes, setAssessmentTypes] = useState([])
  const [students, setStudents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showSubmitGrades, setShowSubmitGrades] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [form, setForm] = useState({
    section_id: '',
    assessment_type_id: '',
    total_fee: '',
    notes: '',
    assessed_by: ''
  })

  const [submitGradesForm, setSubmitGradesForm] = useState({
    student_id: '',
    assessment_type_id: '',
    total_fee: '',
    notes: ''
  })

  const [errors, setErrors] = useState({})

  const [showDetail, setShowDetail] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [assessmentStudents, setAssessmentStudents] = useState([])
  const [sections, setSections] = useState([])
  const [selectedSectionForEnrollment, setSelectedSectionForEnrollment] = useState('')
  const [showEnrollSection, setShowEnrollSection] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [typesData, assessmentsData, studentsData] = await Promise.all([
        academicAPI.getAssessmentTypes(),
        academicAPI.getStudentAssessments(),
        studentsAPI.getAll()
      ])
      setAssessmentTypes(typesData.results || typesData || [])
      setAssessments(assessmentsData.results || assessmentsData || [])
      setStudents(studentsData.results || studentsData || [])
    } catch (error) {
      console.error('Error fetching assessments:', error)
      setAssessments([])
      setAssessmentTypes([])
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      section_id: '',
      assessment_type_id: '',
      total_fee: '',
      notes: '',
      assessed_by: ''
    })
    setErrors({})
  }

  const resetSubmitGradesForm = () => {
    setSubmitGradesForm({
      student_id: '',
      assessment_type_id: '',
      total_fee: '',
      notes: ''
    })
    setErrors({})
  }

  const openModal = () => {
    resetForm()
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const openSubmitGrades = () => {
    resetSubmitGradesForm()
    setShowSubmitGrades(true)
  }

  const closeSubmitGrades = () => {
    setShowSubmitGrades(false)
    resetSubmitGradesForm()
  }

  const validateForm = (formData) => {
    const errs = {}
    if (!formData.section_id) errs.section_id = 'Section is required'
    if (!formData.assessment_type_id) errs.assessment_type_id = 'Assessment type is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleOpenAssessmentDetail = async (assessment) => {
    setSelectedAssessment(assessment)
    setShowDetail(true)
    setShowEnrollSection(false)
    try {
      const allStudents = await studentsAPI.getAll()
      const assessmentStudentsList = Array.isArray(allStudents)
        ? allStudents
        : (allStudents.results || [])
      setAssessmentStudents(assessmentStudentsList)
      const sectionsData = await academicAPI.getSections()
      setSections(sectionsData.results || sectionsData || [])
    } catch (error) {
      console.error('Error fetching assessment details:', error)
    }
  }

  const handleEnrollSectionToAssessment = async () => {
    if (!selectedSectionForEnrollment) return
    setEnrolling(true)
    try {
      const sectionStudents = assessmentStudents.filter(s =>
        s.section_id === parseInt(selectedSectionForEnrollment) ||
        s.section === parseInt(selectedSectionForEnrollment)
      )
      for (const student of sectionStudents) {
        await academicAPI.createAssessment({
          student_id: student.id,
          assessment_type_id: selectedAssessment.assessment_type_id || selectedAssessment.id,
          total_fee: selectedAssessment.total_fee || selectedAssessment.amount || 0,
          notes: '',
          assessed_by: ''
        })
      }
      showToast(`${sectionStudents.length} students enrolled!`, 'success')
      setShowEnrollSection(false)
      setSelectedSectionForEnrollment('')
      fetchData()
    } catch (error) {
      console.error('Error enrolling section:', error)
      showToast('Failed to enroll section', 'error')
    } finally {
      setEnrolling(false)
    }
  }

  const handleRecordPayment = async ({ amount, payment_method, reference_number }) => {
    if (!paymentTarget?.assessmentId) return
    setSubmittingPayment(true)
    try {
      await activitiesAPI.createTourPayment({
        assessment: paymentTarget.assessmentId,
        amount,
        payment_method,
        reference_number,
      })
      setShowPaymentModal(false)
      setPaymentTarget(null)
      showToast('Payment recorded successfully!', 'success')
      await fetchData()
    } catch (error) {
      console.error('Error recording payment:', error)
      throw error
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleOpenPayment = (assessment) => {
    setPaymentTarget({
      assessmentId: assessment.id,
      studentName: assessment.student_name || 'N/A',
      totalCost: parseFloat(assessment.total_fee || 0),
      balance: parseFloat(assessment.balance || 0),
    })
    setShowPaymentModal(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmitGradesChange = (e) => {
    const { name, value } = e.target
    setSubmitGradesForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleAssessmentTypeChange = (formKey, value) => {
    if (formKey === 'modal') {
      setForm(prev => ({ ...prev, assessment_type_id: value }))
      const selectedType = assessmentTypes.find(t => t.id === parseInt(value))
      if (selectedType && selectedType.amount) {
        setForm(prev => ({ ...prev, total_fee: String(selectedType.amount) }))
      }
    } else {
      setSubmitGradesForm(prev => ({ ...prev, assessment_type_id: value }))
      const selectedType = assessmentTypes.find(t => t.id === parseInt(value))
      if (selectedType && selectedType.amount) {
        setSubmitGradesForm(prev => ({ ...prev, total_fee: String(selectedType.amount) }))
      }
    }
    if (errors.assessment_type_id) {
      setErrors(prev => ({ ...prev, assessment_type_id: undefined }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!validateForm(form)) return

    setSubmitting(true)
    try {
      const [studentsData, sectionsData] = await Promise.all([
        studentsAPI.getAll(),
        academicAPI.getSections()
      ])
      const allStudents = Array.isArray(studentsData) ? studentsData : (studentsData.results || [])
      const allSections = sectionsData.results || sectionsData || []
      const selectedSection = allSections.find(s => String(s.id) === String(form.section_id))
      const sectionStudents = allStudents.filter(s =>
        String(s.section_id) === String(form.section_id) ||
        String(s.section) === String(form.section_id) ||
        (selectedSection && (s.grade_level === selectedSection.grade_level || s.section_name === selectedSection.name))
      )

      if (sectionStudents.length === 0) {
        setErrors({ submit: 'No students found in this section' })
        setSubmitting(false)
        return
      }

      let successCount = 0
      for (const student of sectionStudents) {
        try {
          const payload = {
            student_id: parseInt(student.id),
            assessment_type_id: parseInt(form.assessment_type_id)
          }
          if (form.total_fee) payload.total_fee = parseFloat(form.total_fee)
          if (form.notes.trim()) payload.notes = form.notes.trim()
          if (form.assessed_by.trim()) payload.assessed_by = form.assessed_by.trim()
          await academicAPI.createAssessment(payload)
          successCount++
        } catch (err) {
          console.error(`Failed to create assessment for student ${student.id}:`, err)
        }
      }

      closeModal()
      showToast(`${successCount} assessments created for ${selectedSection?.name || 'section'}`, 'success')
      fetchData()
    } catch (error) {
      console.error('Failed to create assessments:', error)
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to create assessments'
      setErrors({ submit: errorMsg })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitGrades = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!validateForm(submitGradesForm)) return

    setSubmitting(true)
    try {
      const payload = {
        student_id: parseInt(submitGradesForm.student_id),
        assessment_type_id: parseInt(submitGradesForm.assessment_type_id)
      }
      if (submitGradesForm.total_fee) {
        payload.total_fee = parseFloat(submitGradesForm.total_fee)
      }
      if (submitGradesForm.notes.trim()) {
        payload.notes = submitGradesForm.notes.trim()
      }
      await academicAPI.createAssessment(payload)
      closeSubmitGrades()
      fetchData()
    } catch (error) {
      console.error('Failed to submit grades:', error)
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Failed to submit grades'
      setErrors({ submit: errorMsg })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (deleting) return
    if (!window.confirm('Are you sure you want to delete this assessment?')) return
    setDeleting(true)
    try {
      await academicAPI.deleteAssessment(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete assessment:', error)
    } finally {
      setDeleting(false)
    }
  }

  const filteredAssessments = assessments.filter(a => {
    const q = searchQuery.toLowerCase()
    return (
      (a.student_name || '').toLowerCase().includes(q) ||
      (a.assessment_name || a.assessment_type || '').toLowerCase().includes(q) ||
      (a.status || '').toLowerCase().includes(q)
    )
  })

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
        title="Assessments"
        subtitle="Student assessments and grades"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Academic' }, { label: 'Assessments' }]}
        actions={
          <>
            <ActionButton icon={CheckCircle} variant="secondary" size="sm" onClick={openSubmitGrades}>Submit Grades</ActionButton>
            <ActionButton icon={Plus} size="sm" onClick={openModal}>New Assessment</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-blue-50 rounded-2xl p-4 border border-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{assessments.length}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Total Assessments</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <PesoSign size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            ₱{assessments.reduce((sum, a) => sum + parseFloat(a.amount_paid || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Total Collected</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 border border-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            ₱{assessments.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0).toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Total Balance</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredAssessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <FileText size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg mb-1">No assessments found</p>
            <p className="text-gray-400 text-sm mb-5">
              {searchQuery ? 'Try adjusting your search' : 'Add your first assessment'}
            </p>
            {!searchQuery && <ActionButton icon={Plus} onClick={openModal}>New Assessment</ActionButton>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Assessment Type</th>
                  <th className="px-4 py-3.5 text-right">Total Fee</th>
                  <th className="px-4 py-3.5 text-right hidden sm:table-cell">Amount Paid</th>
                  <th className="px-4 py-3.5 text-right hidden sm:table-cell">Balance</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} onClick={() => handleOpenAssessmentDetail(assessment)} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                    <td className="px-4 py-3.5 font-medium text-gray-800">{assessment.student_name || 'N/A'}</td>
                    <td className="px-4 py-3.5 text-gray-600">
                      <div className="flex items-center gap-1">
                        <FileText size={12} className="text-gray-400" />
                        {assessment.assessment_name || assessment.assessment_type || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                      ₱{parseFloat(assessment.total_fee || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-600 hidden sm:table-cell">
                      ₱{parseFloat(assessment.amount_paid || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                      <span className={`font-semibold ${parseFloat(assessment.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₱{parseFloat(assessment.balance || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{assessment.status ? <StatusBadge status={assessment.status} /> : <StatusBadge status="pending" />}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenAssessmentDetail(assessment) }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(assessment.id) }}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">New Assessment</h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.submit}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Student *</label>
                <select
                  name="student_id"
                  value={form.student_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.student_id ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <option value="">Select student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.lrn || s.username})</option>
                  ))}
                </select>
                {errors.student_id && <p className="text-xs text-red-500 mt-1">{errors.student_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assessment Type *</label>
                <select
                  name="assessment_type_id"
                  value={form.assessment_type_id}
                  onChange={(e) => handleAssessmentTypeChange('modal', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.assessment_type_id ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <option value="">Select assessment type</option>
                  {assessmentTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.type_name} {t.amount ? `(₱${parseFloat(t.amount).toLocaleString()})` : ''}
                    </option>
                  ))}
                </select>
                {errors.assessment_type_id && <p className="text-xs text-red-500 mt-1">{errors.assessment_type_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Fee (₱)</label>
                <input
                  type="number"
                  name="total_fee"
                  value={form.total_fee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Auto-filled from assessment type"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to use assessment type's default amount</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assessed By</label>
                <input
                  type="text"
                  name="assessed_by"
                  value={form.assessed_by}
                  onChange={handleChange}
                  placeholder="Leave empty to use your username"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubmitGrades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Submit Grades</h2>
              <button onClick={closeSubmitGrades} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrades} className="p-6 space-y-4">
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.submit}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Student *</label>
                <select
                  name="student_id"
                  value={submitGradesForm.student_id}
                  onChange={handleSubmitGradesChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.student_id ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <option value="">Select student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.lrn || s.username})</option>
                  ))}
                </select>
                {errors.student_id && <p className="text-xs text-red-500 mt-1">{errors.student_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assessment Type *</label>
                <select
                  name="assessment_type_id"
                  value={submitGradesForm.assessment_type_id}
                  onChange={(e) => handleAssessmentTypeChange('submit', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.assessment_type_id ? 'border-red-400' : 'border-gray-200'}`}
                >
                  <option value="">Select assessment type</option>
                  {assessmentTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.type_name} {t.amount ? `(₱${parseFloat(t.amount).toLocaleString()})` : ''}
                    </option>
                  ))}
                </select>
                {errors.assessment_type_id && <p className="text-xs text-red-500 mt-1">{errors.assessment_type_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Fee (₱)</label>
                <input
                  type="number"
                  name="total_fee"
                  value={submitGradesForm.total_fee}
                  onChange={handleSubmitGradesChange}
                  min="0"
                  step="0.01"
                  placeholder="Auto-filled from assessment type"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to use assessment type's default amount</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={submitGradesForm.notes}
                  onChange={handleSubmitGradesChange}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSubmitGrades}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Assessment Details
              </h2>
              <button onClick={() => setShowDetail(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Assessment Type</p>
                  <p className="font-medium text-gray-800">
                    {selectedAssessment.assessment_name || selectedAssessment.assessment_type || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Student</p>
                  <p className="font-medium text-gray-800">
                    {selectedAssessment.student_name || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Fee</p>
                  <p className="font-semibold text-gray-800">
                    ₱{parseFloat(selectedAssessment.total_fee || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                  <p className="font-medium text-green-600">
                    ₱{parseFloat(selectedAssessment.amount_paid || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Balance</p>
                  <p className={`font-semibold ${parseFloat(selectedAssessment.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₱{parseFloat(selectedAssessment.balance || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusBadge status={selectedAssessment.status} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Payment Status</h3>
                  <button
                    onClick={() => handleOpenPayment(selectedAssessment)}
                    disabled={parseFloat(selectedAssessment.balance || 0) <= 0}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                      parseFloat(selectedAssessment.balance || 0) > 0
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <PesoSign size={12} className="text-white" />
                    {parseFloat(selectedAssessment.balance || 0) > 0 ? 'Record Payment' : 'Fully Paid'}
                  </button>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{selectedAssessment.student_name || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Paid: <span className="font-medium text-green-600">₱{parseFloat(selectedAssessment.amount_paid || 0).toLocaleString()}</span> / ₱{parseFloat(selectedAssessment.total_fee || 0).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      parseFloat(selectedAssessment.balance || 0) > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {parseFloat(selectedAssessment.balance || 0) > 0
                        ? `₱${parseFloat(selectedAssessment.balance || 0).toLocaleString()} balance`
                        : 'Paid'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Enroll More Students</h3>
                  <button
                    onClick={() => setShowEnrollSection(!showEnrollSection)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} /> Enroll Section
                  </button>
                </div>

                {showEnrollSection && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex gap-2">
                      <select
                        value={selectedSectionForEnrollment}
                        onChange={(e) => setSelectedSectionForEnrollment(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                      >
                        <option value="">Select a section</option>
                        {sections.map(s => (
                          <option key={s.id} value={s.id}>{s.name || s.section_name || `Section ${s.id}`}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleEnrollSectionToAssessment}
                        disabled={!selectedSectionForEnrollment || enrolling}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {enrolling ? <Loader2 size={14} className="animate-spin" /> : null}
                        Enroll
                      </button>
                      <button
                        onClick={() => { setShowEnrollSection(false); setSelectedSectionForEnrollment(''); }}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {assessmentStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No students found</p>
                ) : (
                  <div className="space-y-2">
                    {assessmentStudents.slice(0, 10).map(student => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold">
                            {(student.first_name || student.user?.first_name || '?')[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {student.first_name} {student.last_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {student.lrn || student.username || 'N/A'}
                        </span>
                      </div>
                    ))}
                    {assessmentStudents.length > 10 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        And {assessmentStudents.length - 10} more students...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-slide-up flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
          {toast.message}
        </div>
      )}

      <StudentPaymentModal
        open={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentTarget(null); }}
        onSubmit={handleRecordPayment}
        loading={submittingPayment}
        title="Record Assessment Payment"
        studentName={paymentTarget?.studentName || ''}
        feeLabel="Assessment Fee"
        totalCost={paymentTarget?.totalCost || 0}
        balance={paymentTarget?.balance || 0}
        contextNote={selectedAssessment ? `Assessment: ${selectedAssessment.assessment_name || selectedAssessment.assessment_type || 'N/A'}` : ''}
      />

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  )
}