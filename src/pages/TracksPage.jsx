import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { Search, Plus, GitBranch, Edit, Trash2, Loader2, X, Users, CheckCircle } from 'lucide-react'
import { academicAPI } from '../services/api'

export default function TracksPage() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filteredTracks, setFilteredTracks] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ code: '', name: '' })
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editTrack, setEditTrack] = useState(null)
  const [editForm, setEditForm] = useState({ code: '', name: '' })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchTracks()
  }, [])

  useEffect(() => {
    const filtered = tracks.filter(t =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.code?.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredTracks(filtered)
  }, [search, tracks])

  const fetchTracks = async () => {
    try {
      setLoading(true)
      const data = await academicAPI.getTracks()
      setTracks(data.results || data || [])
    } catch (err) {
      console.error('Error fetching tracks:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalStudents = tracks.reduce((sum, t) => sum + (t.student_count || 0), 0)
  const activeTracks = tracks.filter(t => t.is_active !== false).length

  const statCards = [
    { label: 'Total Tracks', value: tracks.length, icon: GitBranch, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Total Students', value: totalStudents, icon: Users, statBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Active Tracks', value: activeTracks, icon: CheckCircle, statBg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  const handleEdit = (track) => {
    setEditTrack(track)
    setEditForm({ code: track.code || '', name: track.name || '' })
  }

  const handleSaveEdit = async () => {
    if (!editTrack || saving) return
    if (!editForm.code.trim()) { showToast('Track code is required', 'error'); return }
    if (!editForm.name.trim()) { showToast('Track name is required', 'error'); return }
    setSaving(true)
    try {
      await academicAPI.updateTrack(editTrack.id, editForm)
      setEditTrack(null)
      setEditForm({ code: '', name: '' })
      fetchTracks()
      showToast('Track updated successfully')
    } catch (err) {
      showToast('Failed to update track', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (track) => {
    try {
      await academicAPI.deleteTrack(track.id)
      setDeleteConfirm(null)
      fetchTracks()
      showToast('Track deleted successfully')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to delete track'
      showToast(msg, 'error')
      setDeleteConfirm(null)
    }
  }

  const handleCloseModal = () => {
    setShowAdd(false)
    setAddForm({ code: '', name: '' })
  }

  const handleSave = async () => {
    if (saving) return
    if (!addForm.code.trim()) { showToast('Track code is required', 'error'); return }
    if (!addForm.name.trim()) { showToast('Track name is required', 'error'); return }
    setSaving(true)
    try {
      await academicAPI.createTrack(addForm)
      handleCloseModal()
      fetchTracks()
      showToast('Track created successfully')
    } catch (err) {
      console.error('Failed to add track', err)
      const msg = err?.response?.data?.code?.[0] || err?.response?.data?.name?.[0] || 'Failed to add track'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Tracks"
        subtitle="Academic tracks and strands"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Academic' }, { label: 'Tracks' }]}
        actions={
          <ActionButton icon={Plus} size="sm" onClick={() => setShowAdd(true)}>Add Track</ActionButton>
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

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GitBranch size={18} className="text-blue-600" /> Add Track
              </h2>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Track Code <span className="text-red-500">*</span></label>
                <input placeholder="e.g. STEM" value={addForm.code} onChange={e => setAddForm({ ...addForm, code: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Track Name <span className="text-red-500">*</span></label>
                <input placeholder="e.g. Science, Technology, Engineering, and Mathematics" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
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

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tracks by name or code..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading tracks...</span>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No tracks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Track Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Students</th>
                  <th className="px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs sm:text-sm">
                {filteredTracks.map((track) => (
                  <tr key={track.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold text-xs">
                        {track.code || track.name?.substring(0, 4).toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{track.name || 'N/A'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{track.student_count || 0}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <StatusBadge status={track.is_active !== false ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(track)} className="p-1.5 hover:bg-gray-100 rounded touch-manipulation">
                          <Edit size={16} className="text-gray-400" />
                        </button>
                        <button onClick={() => setDeleteConfirm(track)} className="p-1.5 hover:bg-red-50 rounded touch-manipulation">
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
      {/* Edit Track Dialog */}
      {editTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setEditTrack(null); setEditForm({ code: '', name: '' }) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Edit size={18} className="text-blue-600" /> Edit Track
              </h2>
              <button onClick={() => { setEditTrack(null); setEditForm({ code: '', name: '' }) }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Track Code <span className="text-red-500">*</span></label>
                <input value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Track Name <span className="text-red-500">*</span></label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => { setEditTrack(null); setEditForm({ code: '', name: '' }) }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 z-10 w-full max-w-sm">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Track?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong> ({deleteConfirm.code})?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

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