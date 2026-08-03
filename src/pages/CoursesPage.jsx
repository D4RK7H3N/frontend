import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { Search, Plus, BookOpen, Edit, Trash2, Loader2, Download, X, Book, GraduationCap, Clock, Filter } from 'lucide-react'
import { academicAPI } from '../services/api'

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filteredCourses, setFilteredCourses] = useState([])
  const [selectedGrade, setSelectedGrade] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ code: '', name: '', grade_level: '', units: '' })
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = [...courses]

    if (search) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.code?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (selectedGrade) {
      filtered = filtered.filter(c => c.grade_level === selectedGrade)
    }

    setFilteredCourses(filtered)
  }, [search, selectedGrade, courses])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const data = await academicAPI.getCourses()
      setCourses(data || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalUnits = filteredCourses.reduce((sum, c) => sum + (parseInt(c.units) || 0), 0)
  const gradeCount = new Set(filteredCourses.map(c => c.grade_level)).size

  const statCards = [
    { label: 'Total Courses', value: filteredCourses.length, icon: BookOpen, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Total Units', value: totalUnits, icon: Book, statBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Grade Levels', value: gradeCount, icon: GraduationCap, statBg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Active Courses', value: filteredCourses.length, icon: Clock, statBg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  const handleCloseModal = () => {
    setShowAdd(false)
    setAddForm({ code: '', name: '', grade_level: '', units: '' })
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await academicAPI.createCourse(addForm)
      handleCloseModal()
      fetchCourses()
      showToast('Course created successfully')
    } catch (err) {
      console.error('Failed to add course', err)
      showToast('Failed to add course', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Manage curriculum and subjects"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Academic' }, { label: 'Courses' }]}
        actions={
          <>
            <ActionButton icon={Download} variant="outline" size="sm">Export</ActionButton>
            <ActionButton icon={Plus} size="sm" onClick={() => setShowAdd(true)}>Add Course</ActionButton>
          </>
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
          {(search || selectedGrade) && (
            <button onClick={() => { setSearch(''); setSelectedGrade('') }} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X size={12} /> Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or code..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
          </div>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900">
            <option value="">All Grades</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
            <option value="1st Year Bundled">1st Year Bundled</option>
            <option value="2nd Year Bundled">2nd Year Bundled</option>
          </select>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" /> Add Course
              </h2>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Course Code <span className="text-red-500">*</span></label>
                <input placeholder="e.g. ENG101" value={addForm.code} onChange={e => setAddForm({ ...addForm, code: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Course Name <span className="text-red-500">*</span></label>
                <input placeholder="e.g. English 101" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Units</label>
                <input type="number" min="0" placeholder="e.g. 3" value={addForm.units} onChange={e => setAddForm({ ...addForm, units: e.target.value })}
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading courses...</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No courses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Course Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Grade Level</th>
                  <th className="px-4 py-3 hidden md:table-cell">Type</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs sm:text-sm">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{course.code || 'N/A'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{course.name || 'N/A'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{course.grade_level || 'N/A'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.course_type === 'Core' ? 'bg-blue-100 text-blue-600' :
                        course.course_type === 'Specialized' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {course.course_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{course.units || course.credit_units || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded touch-manipulation">
                          <Edit size={16} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded touch-manipulation">
                          <Trash2 size={16} className="text-red-400" />
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
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-slide-up flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
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