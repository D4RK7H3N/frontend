import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { Search, Plus, Loader2, X, Users, BookOpen, Layers, LayoutGrid, Printer, Edit, Trash2, AlertCircle, Check } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { academicAPI, studentsAPI } from '../services/api'
import StudentSectionReport from '../components/StudentSectionReport'

export default function SectionsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const reportRef = useRef()

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', grade_level: '', track: '' })
  const [saving, setSaving] = useState(false)

  const [sectionViewDialog, setSectionViewDialog] = useState(false)
  const [selectedSectionData, setSelectedSectionData] = useState(null)

  const [sectionEditDialog, setSectionEditDialog] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [editForm, setEditForm] = useState({ section: '', track_strand: '', shs_grade: '', college_year: '' })
  const [editSaving, setEditSaving] = useState(false)

  const [printDialog, setPrintDialog] = useState(false)
  const [printStudents, setPrintStudents] = useState([])
  const [printFilters, setPrintFilters] = useState({})

  const reactToPrintFn = useReactToPrint({
    contentRef: reportRef,
    documentTitle: 'Student Section Report',
  })

  const handlePrint = useCallback(() => {
    reactToPrintFn()
  }, [reactToPrintFn])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await studentsAPI.getAll()
      const list = data.results || data || []
      setStudents(list)
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }

  const groupedSections = useMemo(() => {
    if (!students.length) return []

    const groups = {}
    const unassignedStudents = []

    students.forEach(s => {
      if (!s.section && !s.current_grade_level && !s.grade) {
        unassignedStudents.push(s)
        return
      }
      if (!s.section) {
        unassignedStudents.push(s)
        return
      }

      const trackStrandInfo = s.strand_name || s.track_strand || s.strand || ''
      const key = `${s.section}-${trackStrandInfo || 'No Strand'}`

      if (!groups[key]) {
        groups[key] = {
          section: s.section,
          track_strand: trackStrandInfo,
          level_type: s.level_type || '',
          grade: s.current_grade_level || s.grade || '',
          students: [],
        }
      }
      groups[key].students.push(s)
    })

    const sorted = Object.values(groups).sort((a, b) =>
      (a.section || '').toLowerCase().localeCompare((b.section || '').toLowerCase())
    )

    if (unassignedStudents.length > 0) {
      sorted.push({
        section: 'Unassigned',
        track_strand: '',
        level_type: '',
        grade: '',
        students: unassignedStudents,
        isUnassigned: true,
      })
    }

    return sorted
  }, [students])

  const filteredSections = useMemo(() => {
    if (!search) return groupedSections
    const q = search.toLowerCase()
    return groupedSections.filter(s =>
      s.section?.toLowerCase().includes(q) ||
      s.track_strand?.toLowerCase().includes(q) ||
      s.grade?.toLowerCase().includes(q)
    )
  }, [search, groupedSections])

  const totalStudents = students.length
  const totalSections = groupedSections.filter(s => !s.isUnassigned).length
  const shsCount = students.filter(s => s.level_type === 'SHS').length
  const bunCount = students.filter(s => s.level_type === 'BUN' || s.level_type === 'COL').length

  const statCards = [
    { label: 'Total Students', value: totalStudents, icon: Users, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Total Sections', value: totalSections, icon: LayoutGrid, statBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'SHS Students', value: shsCount, icon: BookOpen, statBg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Bundled/College', value: bunCount, icon: Layers, statBg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  const handleCloseModal = () => {
    setShowAdd(false)
    setAddForm({ name: '', grade_level: '', track: '' })
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await academicAPI.createSection(addForm)
      handleCloseModal()
      showToast('Section created successfully')
    } catch (err) {
      showToast('Failed to add section', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenSectionView = (sectionData) => {
    setSelectedSectionData(sectionData)
    setSectionViewDialog(true)
  }

  const handleOpenEditSection = (student) => {
    setEditStudent(student)
    setEditForm({
      section: student.section || '',
      track_strand: student.track_strand || student.strand || '',
      shs_grade: student.shs_grade || '',
      college_year: student.college_year || '',
    })
    setSectionEditDialog(true)
  }

  const handleSaveSectionEdit = async () => {
    if (!editStudent || editSaving) return
    setEditSaving(true)
    try {
      await studentsAPI.update(editStudent.id, editForm)
      const updated = students.map(s => s.id === editStudent.id ? { ...s, ...editForm } : s)
      setStudents(updated)
      if (selectedSectionData) {
        selectedSectionData.students = selectedSectionData.students.map(s =>
          s.id === editStudent.id ? { ...s, ...editForm } : s
        )
      }
      setSectionEditDialog(false)
      setEditStudent(null)
      showToast('Section updated')
    } catch (err) {
      showToast('Failed to update section', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  const handlePrintSection = (sectionData) => {
    const sorted = [...sectionData.students].sort((a, b) =>
      (a.last_name || '').localeCompare(b.last_name || '')
    )
    setPrintStudents(sorted)
    setPrintFilters({
      section: sectionData.isUnassigned ? 'Unassigned' : sectionData.section,
      gradeLevel: sectionData.grade,
      strand: sectionData.track_strand,
    })
    setPrintDialog(true)
  }

  const levelTypeColor = (type) => {
    if (type === 'SHS') return { bg: 'bg-green-100', text: 'text-green-700' }
    if (type === 'BUN') return { bg: 'bg-amber-100', text: 'text-amber-700' }
    if (type === 'COL') return { bg: 'bg-red-100', text: 'text-red-700' }
    return { bg: 'bg-gray-100', text: 'text-gray-600' }
  }

  return (
    <div>
      <PageHeader
        title="Student Sections"
        subtitle="View and print student lists by section"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Academic' }, { label: 'Sections' }]}
        actions={
          <>
            <ActionButton icon={Plus} size="sm" onClick={() => setShowAdd(true)}>Add Section</ActionButton>
          </>
        }
      />

      <div className="flex flex-row justify-between gap-4 mb-5">
        {statCards.map((stat, i) => (
          <div key={i} className={`${stat.statBg} rounded-2xl p-4 flex-1 border border-transparent`}>
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
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search sections by name, track, or grade..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <LayoutGrid size={18} className="text-blue-600" /> Add Section
              </h2>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Section Name <span className="text-red-500">*</span></label>
                <input placeholder="e.g. STEM-A" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level <span className="text-red-500">*</span></label>
                <select value={addForm.grade_level} onChange={e => setAddForm({ ...addForm, grade_level: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                  <option value="">Select grade level</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="1st Year Bundled">1st Year Bundled</option>
                  <option value="2nd Year Bundled">2nd Year Bundled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Track</label>
                <input placeholder="e.g. STEM" value={addForm.track} onChange={e => setAddForm({ ...addForm, track: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseModal}>Cancel</ActionButton>
              <ActionButton onClick={handleSave}>Save</ActionButton>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Loading students...</span>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No sections found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((section, idx) => (
            <div key={idx}
              onClick={() => handleOpenSectionView(section)}
              className={`rounded-2xl p-5 cursor-pointer transition-all border-2 hover:shadow-md hover:-translate-y-0.5 ${section.isUnassigned ? 'border-amber-300 bg-amber-50/30' : 'border-gray-100 bg-white hover:border-blue-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className={`text-lg font-bold ${section.isUnassigned ? 'text-amber-700' : 'text-gray-900'}`}>
                  {section.section}
                </h3>
                {section.isUnassigned ? (
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">No Section</span>
                ) : (
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${levelTypeColor(section.level_type).bg} ${levelTypeColor(section.level_type).text}`}>
                    {section.level_type || 'N/A'}
                  </span>
                )}
              </div>
              {section.track_strand && !section.isUnassigned && (
                <p className="text-sm text-gray-500 mb-2">{section.track_strand}</p>
              )}
              {section.isUnassigned && (
                <p className="text-sm text-amber-600 mb-2">Students without assigned section</p>
              )}
              <div className={`flex items-center gap-2 p-3 rounded-xl ${section.isUnassigned ? 'bg-amber-100/50' : 'bg-gray-100'}`}>
                <Users size={18} className={section.isUnassigned ? 'text-amber-500' : 'text-gray-500'} />
                <span className="text-sm font-medium text-gray-700">{section.students.length} student{section.students.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section View Dialog */}
      {sectionViewDialog && selectedSectionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSectionViewDialog(false); setSelectedSectionData(null) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Section: {selectedSectionData.section}</h2>
                {selectedSectionData.track_strand && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{selectedSectionData.track_strand}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${levelTypeColor(selectedSectionData.level_type).bg} ${levelTypeColor(selectedSectionData.level_type).text}`}>
                  {selectedSectionData.level_type || 'N/A'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{selectedSectionData.students.length} students</span>
              </div>
              <button onClick={() => { setSectionViewDialog(false); setSelectedSectionData(null) }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 w-10">#</th>
                    <th className="px-3 py-2.5">Student Name</th>
                    <th className="px-3 py-2.5">LRN</th>
                    <th className="px-3 py-2.5">Grade Level</th>
                    <th className="px-3 py-2.5">Track/Strand</th>
                    <th className="px-3 py-2.5 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...selectedSectionData.students]
                    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
                    .map((student, idx) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800">
                          {student.last_name}, {student.first_name} {student.middle_name ? `${student.middle_name.charAt(0)}.` : ''}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{student.lrn || '---'}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{student.current_grade_level || student.grade || '---'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{student.track_strand || student.strand || '---'}</td>
                        <td className="px-3 py-2.5">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenEditSection(student) }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit section">
                            <Edit size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <div className="flex gap-2">
                <button onClick={() => { setSectionViewDialog(false); handlePrintSection(selectedSectionData) }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2">
                  <Printer size={16} /> Print Section List
                </button>
              </div>
              <button onClick={() => { setSectionViewDialog(false); setSelectedSectionData(null) }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Assignment Dialog */}
      {sectionEditDialog && editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSectionEditDialog(false); setEditStudent(null) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Edit size={18} className="text-blue-600" /> Edit Section
              </h2>
              <button onClick={() => { setSectionEditDialog(false); setEditStudent(null) }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                {editStudent.last_name}, {editStudent.first_name}
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                <input value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Track/Strand</label>
                <input value={editForm.track_strand} onChange={e => setEditForm({ ...editForm, track_strand: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">SHS Grade</label>
                <select value={editForm.shs_grade} onChange={e => setEditForm({ ...editForm, shs_grade: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                  <option value="">None</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">College Year</label>
                <select value={editForm.college_year} onChange={e => setEditForm({ ...editForm, college_year: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
                  <option value="">None</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setSectionEditDialog(false); setEditStudent(null) }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveSectionEdit} disabled={editSaving}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                {editSaving ? <Loader2 size={16} className="animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Dialog */}
      {printDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setPrintDialog(false); setPrintStudents([]) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Print Section: {printFilters.section}</h2>
                <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">{printStudents.length} students</span>
              </div>
              <button onClick={() => { setPrintDialog(false); setPrintStudents([]) }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="mb-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
                This report will include {printStudents.length} students.
                {printFilters.section && <> | Section: {printFilters.section}</>}
                {printFilters.gradeLevel && <> | Grade: {printFilters.gradeLevel}</>}
                {printFilters.strand && <> | Track: {printFilters.strand}</>}
              </div>
              <div className="border border-gray-200 rounded-xl overflow-auto">
                <StudentSectionReport
                  ref={reportRef}
                  students={printStudents}
                  filters={printFilters}
                />
              </div>
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setPrintDialog(false); setPrintStudents([]) }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Close</button>
              <button onClick={handlePrint} disabled={printStudents.length === 0}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                <Printer size={16} /> Print
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
