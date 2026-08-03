import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { Search, Plus, Award, Download, Users, CheckCircle, Loader2, X, AlertTriangle, Edit, Trash2, Calendar, MapPin } from 'lucide-react'
import { activitiesAPI } from '../services/api'

const graduationStatuses = ['Planning', 'Registration', 'Closed', 'Completed', 'Cancelled']

export default function GraduationPage() {
  const [loading, setLoading] = useState(true)
  const [graduates, setGraduates] = useState([])
  const [graduationEvents, setGraduationEvents] = useState([])
  const [toast, setToast] = useState(null)

  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventForm, setEventForm] = useState({
    name: '', event_date: '', registration_deadline: '', description: '',
    graduation_package_fee: '', max_participants: '', venue: '', time: '', status: 'Planning',
    year_level: 'Grade 12'
  })
  const [eventError, setEventError] = useState(null)
  const [savingEvent, setSavingEvent] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [eventsData, enrollmentsData] = await Promise.all([
        activitiesAPI.getGraduationEvents(),
        activitiesAPI.getGraduationEnrollments()
      ])
      setGraduationEvents(eventsData.results || eventsData || [])
      setGraduates(enrollmentsData.results || enrollmentsData || [])
    } catch (error) {
      console.error('Error fetching graduation data:', error)
      setGraduates([])
      setGraduationEvents([])
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const resetEventForm = () => {
    setEventForm({
      name: '', event_date: '', registration_deadline: '', description: '',
      graduation_package_fee: '', max_participants: '', venue: '', time: '', status: 'Planning',
      year_level: 'Grade 12'
    })
    setEventError(null)
    setEditingEvent(null)
  }

  const handleOpenAddEvent = () => {
    resetEventForm()
    setShowAddEvent(true)
  }

  const handleOpenEditEvent = (event) => {
    setEditingEvent(event)
    setEventForm({
      name: event.name || '',
      year_level: event.year_level || 'Grade 12',
      event_date: event.event_date || '',
      registration_deadline: event.registration_deadline || '',
      description: event.description || '',
      graduation_package_fee: event.graduation_package_fee ? String(event.graduation_package_fee) : '',
      max_participants: event.max_participants ? String(event.max_participants) : '',
      venue: event.venue || '',
      time: event.time || '',
      status: event.status || 'Planning'
    })
    setEventError(null)
    setShowAddEvent(true)
  }

  const handleCloseEvent = () => {
    setShowAddEvent(false)
    resetEventForm()
  }

  const handleSaveEvent = async () => {
    if (!eventForm.name.trim()) {
      setEventError('Event name is required')
      return
    }
    if (!eventForm.event_date) {
      setEventError('Event date is required')
      return
    }
    if (!eventForm.registration_deadline) {
      setEventError('Registration deadline is required')
      return
    }

    setSavingEvent(true)
    setEventError(null)
    try {
      const payload = {
        name: eventForm.name.trim(),
        year_level: eventForm.year_level || 'Grade 12',
        event_date: eventForm.event_date,
        registration_deadline: eventForm.registration_deadline,
        description: eventForm.description.trim(),
        status: eventForm.status,
        graduation_package_fee: parseFloat(eventForm.graduation_package_fee) || 0,
        max_participants: parseInt(eventForm.max_participants) || 0,
        venue: eventForm.venue.trim(),
        time: eventForm.time || ''
      }
      if (editingEvent) {
        await activitiesAPI.updateGraduation(editingEvent.id, payload)
        showToast('Graduation event updated successfully')
      } else {
        await activitiesAPI.createGraduation(payload)
        showToast('Graduation event created successfully')
      }
      handleCloseEvent()
      fetchData()
    } catch (err) {
      console.error('Save event error:', err)
      setEventError(err?.response?.data?.error || err?.response?.data?.name?.[0] || 'Failed to save graduation event')
    } finally {
      setSavingEvent(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await activitiesAPI.deleteGraduation(deleteConfirm.id)
      setDeleteConfirm(null)
      showToast('Graduation event deleted successfully')
      fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Failed to delete graduation event', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const filteredEvents = graduationEvents.filter(e =>
    !search || (e.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const clearedCount = graduates.filter(g => g.status === 'cleared').length
  const pendingCount = graduates.filter(g => g.status === 'pending').length
  const withAwardsCount = graduates.filter(g => g.awards).length

  const getStatusBadge = (status) => {
    if (status === 'Planning') return <StatusBadge status="pending" />
    if (status === 'Registration') return <StatusBadge status="active" />
    if (status === 'Closed') return <StatusBadge status="dropped" />
    if (status === 'Completed') return <StatusBadge status="paid" />
    if (status === 'Cancelled') return <StatusBadge status="dropped" />
    return <StatusBadge status="pending" />
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
        title="Graduation"
        subtitle="Graduation events and candidates"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Academic' }, { label: 'Graduation' }]}
        actions={
          <>
            <ActionButton icon={Download} variant="outline" size="sm">Export List</ActionButton>
            <ActionButton icon={Plus} size="sm" onClick={handleOpenAddEvent}>Create Event</ActionButton>
          </>
        }
      />

      <div className="bg-white p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{graduates.length}</p>
            <p className="text-sm text-gray-600">Candidates</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{clearedCount}</p>
            <p className="text-sm text-gray-600">Cleared</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{withAwardsCount}</p>
            <p className="text-sm text-gray-600">With Awards</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
            />
          </div>
          <ActionButton icon={Plus} size="sm" onClick={handleOpenAddEvent}>Create Event</ActionButton>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">Graduation Events</h3>
        </div>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-10">
            <Award size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No graduation events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Event Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Event Date</th>
                  <th className="px-4 py-3 hidden md:table-cell">Registration Deadline</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">Package Fee</th>
                  <th className="px-4 py-3 text-center hidden lg:table-cell">Participants</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          <Award size={14} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{event.name}</p>
                          {event.venue && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{event.venue}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {event.registration_deadline ? new Date(event.registration_deadline).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell font-semibold text-gray-800">
                      ₱{parseFloat(event.graduation_package_fee || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell text-gray-600">
                      {event.total_participants || 0} / {event.max_participants || '∞'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(event.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditEvent(event)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(event)}
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">Graduation Candidates</h3>
        </div>
        {graduates.length === 0 ? (
          <div className="text-center py-12">
            <Award size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No graduation data available. Please configure in backend.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Average Grade</th>
                <th className="px-4 py-3">Conduct</th>
                <th className="px-4 py-3">Awards</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {graduates.map((grad) => (
                <tr key={grad.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{grad.student_name || grad.name}</td>
                  <td className="px-4 py-3 text-gray-600">{grad.section || 'N/A'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{grad.average_grade || grad.avgGrade || 0}%</td>
                  <td className="px-4 py-3">{grad.conduct || 'Good'}</td>
                  <td className="px-4 py-3">
                    {grad.awards ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">{grad.awards}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={grad.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseEvent} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award size={18} className="text-purple-600" />
                {editingEvent ? 'Edit Graduation Event' : 'Create Graduation Event'}
              </h2>
              <button
                onClick={handleCloseEvent}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {eventError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={16} /> {eventError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 6 Graduation 2025"
                    value={eventForm.name}
                    onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Year Level</label>
                  <select
                    value={eventForm.year_level}
                    onChange={(e) => setEventForm({ ...eventForm, year_level: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  >
                    <option value="Grade 12">Grade 12</option>
                    <option value="2nd Year Bundled Student">2nd Year Bundled Student</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Registration Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventForm.registration_deadline}
                      onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Package Fee (₱)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={eventForm.graduation_package_fee}
                      onChange={(e) => setEventForm({ ...eventForm, graduation_package_fee: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 = unlimited"
                      value={eventForm.max_participants}
                      onChange={(e) => setEventForm({ ...eventForm, max_participants: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Venue</label>
                    <input
                      type="text"
                      placeholder="e.g. School Gymnasium"
                      value={eventForm.venue}
                      onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  >
                    {graduationStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Event description..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseEvent}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveEvent} loading={savingEvent}>
                {editingEvent ? 'Update Event' : 'Create Event'}
              </ActionButton>
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
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Event?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
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