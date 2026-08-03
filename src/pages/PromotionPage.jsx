import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { studentsAPI } from '../services/api'
import { GraduationCap, ArrowRight, ChevronRight, Users, Loader2, Check, AlertTriangle, BookOpen } from 'lucide-react'

export default function PromotionPage() {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(false)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchPreview = async () => {
    setLoading(true)
    try {
      const data = await studentsAPI.promotionPreview('all')
      setPreview(data)
    } catch (err) {
      showToast('Failed to load promotion preview', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPreview() }, [])

  const handlePromote = async (type) => {
    if (promoting) return
    const label = type === 'shs' ? 'SHS' : type === 'bundled' ? 'Bundled' : 'all eligible'
    if (!window.confirm(`Promote all ${label} students to the next year level?`)) return
    setPromoting(true)
    setResult(null)
    try {
      const data = await studentsAPI.promoteStudents(type)
      const normalized = { ...(data || {}), success: data?.success !== false, message: data?.message || `Promotion completed` }
      setResult(normalized)
      showToast(normalized.message)
      fetchPreview()
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Promotion failed', promoted_count: 0, graduated_count: 0 })
      showToast(err.response?.data?.error || 'Promotion failed', 'error')
    } finally {
      setPromoting(false)
    }
  }

  const counts = preview?.counts || {}
  const groups = preview?.preview || {}
  const total = counts.shs_grade_11_to_12 + counts.shs_grade_12_to_graduate + counts.bundled_year_1_to_2 + counts.bundled_year_2_to_graduate

  const statCards = [
    { label: 'Grade 11 → Grade 12', value: counts.shs_grade_11_to_12 || 0, icon: Users, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Grade 12 → Graduate', value: counts.shs_grade_12_to_graduate || 0, icon: GraduationCap, statBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: '1st Year → 2nd Year', value: counts.bundled_year_1_to_2 || 0, icon: Users, statBg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { label: '2nd Year → Graduate', value: counts.bundled_year_2_to_graduate || 0, icon: GraduationCap, statBg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  ]

  const renderGroup = (title, students, Icon) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Icon size={16} className="text-blue-600" /> {title}
        </h3>
        <span className="text-xs font-medium text-gray-400">{students.length} student{students.length !== 1 ? 's' : ''}</span>
      </div>
      {students.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No students to promote</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {students.map(s => (
            <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">{s.first_name} {s.last_name}</p>
                <p className="text-xs text-gray-400">{s.lrn} · {s.section || 'No section'}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Promotion Management"
        subtitle="Advance students to the next year level with auto tuition update"
        actions={
          <div className="flex gap-2">
            <ActionButton variant="secondary" onClick={fetchPreview} loading={loading} icon={Loader2} size="sm">Refresh</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card, i) => (
          <div key={i} className={`${card.statBg} rounded-2xl p-4 border border-transparent`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <card.icon size={20} className={card.iconColor} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className={`rounded-2xl p-4 mb-6 flex items-start gap-3 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          {result.success ? <Check size={20} className="text-green-600 mt-0.5" /> : <AlertTriangle size={20} className="text-red-600 mt-0.5" />}
          <div>
            <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>{result.message}</p>
            <p className="text-xs text-gray-500 mt-1">Promoted: {result.promoted_count || 0} · Graduated: {result.graduated_count || 0}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : total === 0 ? (
        <div className="text-center py-20">
          <GraduationCap size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No students eligible for promotion</p>
          <p className="text-xs text-gray-400 mt-1">All students are at their current year level</p>
        </div>
      ) : (
        <div className="space-y-6 mb-6">
          <div className="flex gap-3">
            <ActionButton onClick={() => handlePromote('shs')} loading={promoting} icon={ArrowRight} size="sm">
              Promote All SHS ({counts.shs_grade_11_to_12 + counts.shs_grade_12_to_graduate})
            </ActionButton>
            <ActionButton onClick={() => handlePromote('bundled')} loading={promoting} icon={ArrowRight} size="sm">
              Promote All Bundled ({counts.bundled_year_1_to_2 + counts.bundled_year_2_to_graduate})
            </ActionButton>
            <ActionButton onClick={() => handlePromote('all')} loading={promoting} icon={ArrowRight}>
              Promote All ({total})
            </ActionButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderGroup('Grade 11 → Grade 12', groups.shs_grade_11 || [], Users)}
            {renderGroup('Grade 12 → Graduate', groups.shs_grade_12 || [], GraduationCap)}
            {renderGroup('Bundled 1st Year → 2nd Year', groups.bundled_year_1 || [], Users)}
            {renderGroup('Bundled 2nd Year → Graduate', groups.bundled_year_2 || [], GraduationCap)}
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
