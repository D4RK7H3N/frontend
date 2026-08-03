import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { activitiesAPI, academicAPI, studentsAPI } from '../services/api'
import StudentPaymentModal from '../components/StudentPaymentModal';
import {
  Search, Plus, Bus, Edit, Trash2, Download, Loader2, X,
  ChevronLeft, ChevronRight, AlertTriangle, Check,
  Calendar, Users, MapPin, Briefcase, Eye, UserPlus
} from 'lucide-react'
import PesoSign from '../components/PesoSign'

const ITEMS_PER_PAGE = 10
const tourStatuses = ['Planned', 'Ongoing', 'Completed', 'Cancelled']
const gradeLevels = ['SHS - Grade 11', 'Bundled - 1st Year Tesda Accredited']
const statusMapToBackend = {
  'upcoming': 'Planned',
  'ongoing': 'Ongoing',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
}
const statusMapFromBackend = {
  'Planned': 'upcoming',
  'Ongoing': 'ongoing',
  'Completed': 'completed',
  'Cancelled': 'cancelled'
}

export default function ToursPage() {
  const [loading, setLoading] = useState(true)
  const [tours, setTours] = useState([])
  const [toast, setToast] = useState(null)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [showAddEdit, setShowAddEdit] = useState(false)
  const [editingTour, setEditingTour] = useState(null)
  const [tourForm, setTourForm] = useState({
    name: '', destination: '', grade_level: 'Grade 11', tour_date: '', return_date: '', total_cost: '',
    tour_company: '', description: '', status: 'Planned', max_participants: '',
    transportation_fee: '', accommodation_fee: '', food_allowance: '',
    entrance_fees: '', other_fees: ''
  })
  const [tourError, setTourError] = useState(null)
  const [savingTour, setSavingTour] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [showDetail, setShowDetail] = useState(false)
  const [selectedTour, setSelectedTour] = useState(null)
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [showEnrollStudent, setShowEnrollStudent] = useState(false)
  const [selectedStudentForEnrollment, setSelectedStudentForEnrollment] = useState('')
  const [enrollingStudent, setEnrollingStudent] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentTarget, setPaymentTarget] = useState(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchTours = async () => {
    try {
      setLoading(true)
      const data = await activitiesAPI.getTours()
      setTours(Array.isArray(data) ? data : data.results || [])
    } catch (error) {
      console.error('Error fetching tours:', error)
      showToast('Failed to load tours', 'error')
      setTours([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTours() }, [])

  const fetchSections = async () => {
    try {
      const data = await academicAPI.getSections()
      setSections(data.results || data || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }

  const openAddEdit = async (tour = null) => {
    if (tour) {
      setEditingTour(tour)
      setTourForm({
        name: tour.name || '',
        destination: tour.destination || '',
        grade_level: tour.grade_level || 'Grade 11',
        tour_date: tour.tour_date || '',
        return_date: tour.return_date || '',
        total_cost: tour.total_cost || '',
        tour_company: tour.tour_company || '',
        description: tour.description || '',
        status: tour.status || 'Planned',
        max_participants: tour.max_participants || '',
        transportation_fee: tour.transportation_fee || '',
        accommodation_fee: tour.accommodation_fee || '',
        food_allowance: tour.food_allowance || '',
        entrance_fees: tour.entrance_fees || '',
        other_fees: tour.other_fees || ''
      })
    } else {
      setEditingTour(null)
      setTourForm({
        name: '', destination: '', grade_level: 'Grade 11', tour_date: '', return_date: '', total_cost: '',
        tour_company: '', description: '', status: 'Planned', max_participants: '',
        transportation_fee: '', accommodation_fee: '', food_allowance: '',
        entrance_fees: '', other_fees: ''
      })
    }
    setTourError(null)
    await fetchSections()
    setShowAddEdit(true)
  }

  const handleOpenDetail = async (tour) => {
    setSelectedTour(tour)
    setShowDetail(true)
    setShowEnrollStudent(false)
    setSelectedStudentForEnrollment('')
    setStudentSearch('')
    setEnrolledStudents([])
    try {
      const [studentsData, sectionsData, enrollmentsData] = await Promise.all([
        studentsAPI.getAll(),
        academicAPI.getSections(),
        activitiesAPI.getTourEnrollments(tour.id)
      ])
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData.results || [])
      setSections(sectionsData.results || sectionsData || [])
      const tourEnrollments = Array.isArray(enrollmentsData)
        ? enrollmentsData.filter(e => e.tour === tour.id)
        : (enrollmentsData.results || []).filter(e => e.tour === tour.id)
      setEnrolledStudents(tourEnrollments)
    } catch (error) {
      console.error('Error fetching tour details:', error)
      showToast('Failed to load tour details', 'error')
    }
  }

  const refreshEnrolledStudents = async (tourId = selectedTour?.id) => {
    if (!tourId) return
    try {
      const enrollmentsData = await activitiesAPI.getTourEnrollments(tourId)
      const tourEnrollments = Array.isArray(enrollmentsData)
        ? enrollmentsData.filter(e => e.tour === tourId)
        : (enrollmentsData.results || []).filter(e => e.tour === tourId)
      setEnrolledStudents(tourEnrollments)
    } catch (error) {
      console.error('Error refreshing enrollments:', error)
    }
  }

  const handleEnrollSection = async () => {
    if (!selectedStudentForEnrollment || !selectedTour) return
    setEnrollingStudent(true)
    try {
      const sectionId = parseInt(selectedStudentForEnrollment)
      const selectedSection = sections.find(s => String(s.id) === String(sectionId))
      const sectionStudents = students.filter(s =>
        String(s.section_id) === String(sectionId) ||
        String(s.section) === String(sectionId) ||
        (selectedSection && (s.grade_level === selectedSection.grade_level || s.section_name === selectedSection.name))
      )
      
      if (sectionStudents.length === 0) {
        showToast('No students found in this section', 'error')
        setEnrollingStudent(false)
        return
      }

      let enrolled = 0
      const enrolledIds = new Set(enrolledStudents.map(e => String(e.student)).filter(Boolean))
      for (const student of sectionStudents) {
        if (enrolledIds.has(String(student.id))) continue
        try {
          await activitiesAPI.enrollStudentInTour({
            tour: selectedTour.id,
            student: student.id
          })
          enrolled++
        } catch (err) {
          console.error(`Failed to enroll student ${student.id}:`, err)
        }
      }

      await refreshEnrolledStudents()
      setShowEnrollStudent(false)
      setSelectedStudentForEnrollment('')
      setStudentSearch('')
      showToast(`${enrolled} students enrolled from ${selectedSection?.name || 'section'}`, 'success')
    } catch (error) {
      console.error('Error enrolling section:', error)
      showToast('Failed to enroll section', 'error')
    } finally {
      setEnrollingStudent(false)
    }
  }

  const handleRemoveEnrollment = async (enrollmentId) => {
    try {
      await activitiesAPI.removeTourEnrollment(enrollmentId)
      await refreshEnrolledStudents()
      showToast('Enrollment removed', 'success')
    } catch (error) {
      console.error('Error removing enrollment:', error)
      showToast('Failed to remove enrollment', 'error')
    }
  }

  const getEnrollmentStudentName = (enrollment) => {
    if (enrollment.student_name) return enrollment.student_name
    if (enrollment.student_details?.first_name || enrollment.student_details?.last_name) {
      return `${enrollment.student_details.first_name || ''} ${enrollment.student_details.last_name || ''}`.trim()
    }
    const sid = enrollment.student
    if (sid) {
      const matched = students.find(s => String(s.id) === String(sid))
      if (matched) return `${matched.first_name || ''} ${matched.last_name || ''}`.trim() || matched.username || `Student #${sid}`
    }
    return `Student #${sid}`
  }

  const getEnrollmentPaymentStatus = (enrollment) => {
    if (enrollment.payment_status) return enrollment.payment_status
    const paid = parseFloat(enrollment.amount_paid || 0)
    const due = parseFloat(selectedTour?.total_cost || 0)
    if (paid <= 0) return 'unpaid'
    if (paid >= due && due > 0) return 'paid'
    return 'partial'
  }

  const handleOpenPayment = (enrollment) => {
    setPaymentTarget({
      enrollmentId: enrollment.id,
      studentName: getEnrollmentStudentName(enrollment),
      totalCost: selectedTour?.total_cost || 0,
      amountPaid: enrollment.amount_paid || 0,
    })
    setShowPaymentModal(true)
  }

  const handleRecordPayment = async ({ amount, payment_method, reference_number }) => {
    if (!paymentTarget?.enrollmentId) return
    setSubmittingPayment(true)
    try {
      await activitiesAPI.createTourPayment({
        tour_enrollment: paymentTarget.enrollmentId,
        amount,
        payment_method,
        reference_number,
      })
      await refreshEnrolledStudents()
      setShowPaymentModal(false)
      setPaymentTarget(null)
      showToast('Payment recorded successfully!', 'success')
    } catch (error) {
      console.error('Error recording payment:', error)
      throw error
    } finally {
      setSubmittingPayment(false)
    }
  }

  const filteredStudentsForEnrollment = useMemo(() => {
    const enrolledIds = new Set(
      enrolledStudents.map(e => String(e.student)).filter(Boolean)
    )
    const available = students.filter(s => !enrolledIds.has(String(s.id)))
    const q = studentSearch.toLowerCase().trim()
    if (!q) return available
    return available.filter(s => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase()
      return name.includes(q) || (s.lrn || '').toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q)
    })
  }, [students, enrolledStudents, studentSearch])

  const filteredTours = useMemo(() => {
    if (!search) return tours
    const q = search.toLowerCase()
    return tours.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.destination || '').toLowerCase().includes(q) ||
      (t.status || '').toLowerCase().includes(q)
    )
  }, [tours, search])

  const paginatedTours = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredTours.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTours, currentPage])

  const totalPages = Math.ceil(filteredTours.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const totalTours = tours.length
    const totalParticipants = tours.reduce((sum, t) => sum + (t.total_participants || 0), 0)
    const totalCostCollected = tours.reduce((sum, t) => sum + (t.total_paid || 0), 0)
    return { totalTours, totalParticipants, totalCostCollected }
  }, [tours])

  const statCards = [
    { label: 'Total Tours', value: stats.totalTours, icon: Bus, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Total Participants', value: stats.totalParticipants, icon: Users, statBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Total Collected', value: `₱${stats.totalCostCollected.toLocaleString()}`, icon: PesoSign, statBg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ]

  const resetTourForm = () => {
    setTourForm({
      name: '', destination: '', grade_level: 'Grade 11', tour_date: '', return_date: '', total_cost: '',
      tour_company: '', description: '', status: 'Planned', max_participants: '',
      transportation_fee: '', accommodation_fee: '', food_allowance: '',
      entrance_fees: '', other_fees: ''
    })
    setTourError(null)
    setEditingTour(null)
  }

  const handleOpenAdd = () => {
    resetTourForm()
    setShowAddEdit(true)
  }

  const handleOpenEdit = (tour) => {
    setEditingTour(tour)
    setTourForm({
      name: tour.name || '',
      destination: tour.destination || '',
      grade_level: tour.grade_level || 'Grade 11',
      tour_date: tour.tour_date || '',
      return_date: tour.return_date || '',
      total_cost: tour.total_cost ? String(tour.total_cost) : '',
      tour_company: tour.tour_company || '',
      description: tour.description || '',
      status: tour.status || 'Planned',
      max_participants: tour.max_participants ? String(tour.max_participants) : '',
      transportation_fee: tour.transportation_fee ? String(tour.transportation_fee) : '',
      accommodation_fee: tour.accommodation_fee ? String(tour.accommodation_fee) : '',
      food_allowance: tour.food_allowance ? String(tour.food_allowance) : '',
      entrance_fees: tour.entrance_fees ? String(tour.entrance_fees) : '',
      other_fees: tour.other_fees ? String(tour.other_fees) : ''
    })
    setTourError(null)
    setShowAddEdit(true)
  }

  const handleCloseTour = () => {
    setShowAddEdit(false)
    resetTourForm()
  }

  const handleSaveTour = async () => {
    if (!tourForm.name.trim()) { setTourError('Tour name is required'); return }
    if (!tourForm.destination.trim()) { setTourError('Destination is required'); return }
    if (!tourForm.tour_date) { setTourError('Tour date is required'); return }
    if (!tourForm.return_date) { setTourError('Return date is required'); return }
    const totalCost = parseFloat(tourForm.total_cost)
    if (isNaN(totalCost) || totalCost < 0) { setTourError('Total cost must be a valid positive number'); return }
    if (tourForm.return_date < tourForm.tour_date) { setTourError('Return date must be after tour date'); return }

    setSavingTour(true)
    setTourError(null)
    try {
      const payload = {
        name: tourForm.name.trim(),
        destination: tourForm.destination.trim(),
        grade_level: tourForm.grade_level || 'SHS - Grade 11',
        tour_date: tourForm.tour_date,
        return_date: tourForm.return_date,
        total_cost: totalCost,
        tour_company: tourForm.tour_company.trim() || '',
        description: tourForm.description.trim() || '',
        status: tourForm.status,
        max_participants: tourForm.max_participants ? parseInt(tourForm.max_participants) : 0,
        transportation_fee: parseFloat(tourForm.transportation_fee) || 0,
        accommodation_fee: parseFloat(tourForm.accommodation_fee) || 0,
        food_allowance: parseFloat(tourForm.food_allowance) || 0,
        entrance_fees: parseFloat(tourForm.entrance_fees) || 0,
        other_fees: parseFloat(tourForm.other_fees) || 0
      }
      if (editingTour) {
        await activitiesAPI.updateTour(editingTour.id, payload)
        showToast('Tour updated successfully')
        handleCloseTour()
      } else {
        const created = await activitiesAPI.createTour(payload)
        showToast('Tour created successfully')
        handleCloseTour()
        const refreshedList = await activitiesAPI.getTours()
        const list = Array.isArray(refreshedList) ? refreshedList : refreshedList.results || []
        setTours(list)
        const newTour = list.find(t => t.id === (created?.id ?? created)) || created
        if (newTour && newTour.id) {
          await handleOpenDetail(newTour)
        }
      }
      fetchTours()
    } catch (err) {
      console.error('Save tour error:', err)
      setTourError(err?.response?.data?.error || err?.response?.data?.name?.[0] || 'Failed to save tour')
    } finally {
      setSavingTour(false)
    }
  }

  const handleDeleteTour = async () => {
    setDeleting(true)
    try {
      await activitiesAPI.deleteTour(deleteConfirm.id)
      setDeleteConfirm(null)
      showToast('Tour deleted successfully')
      fetchTours()
    } catch (err) {
      console.error('Delete tour error:', err)
      showToast('Failed to delete tour', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Tour Name', 'Destination', 'Tour Date', 'Return Date', 'Total Cost', 'Status', 'Participants', 'Total Paid', 'Balance', 'Description']
    const rows = filteredTours.map(t => [
      t.name || 'N/A',
      t.destination || 'N/A',
      t.tour_date ? new Date(t.tour_date).toLocaleDateString() : 'N/A',
      t.return_date ? new Date(t.return_date).toLocaleDateString() : 'N/A',
      (t.total_cost || 0).toLocaleString(),
      t.status || 'N/A',
      t.total_participants || 0,
      (t.total_paid || 0).toLocaleString(),
      (t.total_balance || 0).toLocaleString(),
      t.description || ''
    ])
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tours_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Tours exported successfully')
  }

  const getStatusBadge = (status) => {
    const mapped = statusMapFromBackend[status] || status
    if (mapped === 'upcoming') return <StatusBadge status="pending" />
    if (mapped === 'ongoing') return <StatusBadge status="active" />
    if (mapped === 'completed') return <StatusBadge status="paid" />
    if (mapped === 'cancelled') return <StatusBadge status="dropped" />
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
        title="Tours"
        subtitle="Field trips and educational tours"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Activities' }, { label: 'Tours' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Download} variant="outline" size="sm" onClick={handleExportCSV}>Export</ActionButton>
            <ActionButton icon={Plus} size="sm" onClick={handleOpenAdd}>New Tour</ActionButton>
         </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.statBg} rounded-2xl p-4 border border-transparent`}>
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tour name or destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
            />
         </div>
       </div>
     </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {filteredTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Bus size={28} className="text-gray-400" />
           </div>
            <p className="text-gray-600 font-medium text-lg mb-1">No tours found</p>
            <p className="text-gray-400 text-sm mb-5">
              {search ? 'Try adjusting your search' : 'Add your first tour'}
           </p>
            {!search && <ActionButton icon={Plus} onClick={handleOpenAdd}>New Tour</ActionButton>}
         </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3.5">Tour Name</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">Destination</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">Tour Date</th>
                    <th className="px-4 py-3.5 text-right">Total Cost</th>
                    <th className="px-4 py-3.5 text-center hidden lg:table-cell">Participants</th>
                    <th className="px-4 py-3.5 text-center hidden lg:table-cell">Slots</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                 </tr>
               </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {paginatedTours.map((tour) => (
                    <tr onClick={() => handleOpenDetail(tour)} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            <Bus size={14} />
                         </div>
                          <div>
                            <p className="font-medium text-gray-800">{tour.name}</p>
                            {tour.description && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{tour.description}</p>
                            )}
                         </div>
                       </div>
                     </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" />
                          {tour.destination || 'N/A'}
                       </div>
                     </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">
                        {tour.tour_date ? new Date(tour.tour_date).toLocaleDateString() : 'N/A'}
                     </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-800">
                        ₱{(tour.total_cost || 0).toLocaleString()}
                     </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell text-gray-600">
                        {tour.total_participants || 0}
                     </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <span className={`font-semibold ${tour.slots_available ? 'text-green-600' : 'text-red-600'}`}>
                          {tour.slots_available ? 'Available' : 'Full'}
                       </span>
                     </td>
                      <td className="px-4 py-3.5">{getStatusBadge(tour.status)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(tour) }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="View"
                          >
                            <Eye size={15} />
                        </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(tour) }}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <Edit size={15} />
                         </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(tour) }}
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
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTours.length)} of {filteredTours.length}
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseTour} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bus size={18} className="text-amber-600" />
                {editingTour ? 'Edit Tour' : 'Create Tour'}
             </h2>
              <button onClick={handleCloseTour} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
             </button>
           </div>
            <div className="p-6">
              {tourError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={16} /> {tourError}
               </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Tour Name <span className="text-red-500">*</span>
                 </label>
                  <input
                    type="text"
                    placeholder="e.g. Baguio Educational Tour 2025"
                    value={tourForm.name}
                    onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  />
               </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Destination <span className="text-red-500">*</span>
                 </label>
                  <input
                    type="text"
                    placeholder="e.g. Baguio City, Manila, etc."
                    value={tourForm.destination}
                    onChange={(e) => setTourForm({ ...tourForm, destination: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  />
               </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Grade Level</label>
                  <select
                    value={tourForm.grade_level}
                    onChange={(e) => setTourForm({ ...tourForm, grade_level: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  >
                    {gradeLevels.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                 </select>
               </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tour Date <span className="text-red-500">*</span>
                   </label>
                    <input
                      type="date"
                      value={tourForm.tour_date}
                      onChange={(e) => setTourForm({ ...tourForm, tour_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                 </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Return Date <span className="text-red-500">*</span>
                   </label>
                    <input
                      type="date"
                      value={tourForm.return_date}
                      onChange={(e) => setTourForm({ ...tourForm, return_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                 </div>
               </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Total Cost per Student (₱) <span className="text-red-500">*</span>
                   </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={tourForm.total_cost}
                      onChange={(e) => setTourForm({ ...tourForm, total_cost: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                 </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Max Participants</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 = unlimited"
                      value={tourForm.max_participants}
                      onChange={(e) => setTourForm({ ...tourForm, max_participants: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                 </div>
               </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tour Company</label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Travel Agency"
                    value={tourForm.tour_company}
                    onChange={(e) => setTourForm({ ...tourForm, tour_company: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  />
               </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Tour description, itinerary details..."
                    value={tourForm.description}
                    onChange={(e) => setTourForm({ ...tourForm, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 resize-none"
                  />
               </div>

<div className="border-t border-gray-100 pt-4" />

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={tourForm.status}
                    onChange={(e) => setTourForm({ ...tourForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  >
                    {tourStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                 </select>
               </div>
             </div>
           </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseTour}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveTour} loading={savingTour}>
                {editingTour ? 'Update Tour' : 'Create Tour'}
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
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Tour</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
           </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
             </button>
              <button onClick={handleDeleteTour} disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
             </button>
           </div>
         </div>
       </div>
      )}

      {showDetail && selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bus size={18} className="text-amber-600" />
                {selectedTour.name}
             </h2>
              <button onClick={() => setShowDetail(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
             </button>
           </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-gray-500">Destination</span>
                  <span className="font-medium text-gray-800">{selectedTour.destination || 'N/A'}</span>
               </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-500">Tour Date</span>
                  <span className="font-medium text-gray-800">{selectedTour.tour_date ? new Date(selectedTour.tour_date).toLocaleDateString() : 'N/A'}</span>
               </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-500">Return Date</span>
                  <span className="font-medium text-gray-800">{selectedTour.return_date ? new Date(selectedTour.return_date).toLocaleDateString() : 'N/A'}</span>
               </div>
                <div className="flex items-center gap-2 text-sm">
                  <PesoSign size={14} className="text-gray-400" />
                  <span className="text-gray-500">Cost</span>
                  <span className="font-medium text-gray-800">₱{(selectedTour.total_cost || 0).toLocaleString()}</span>
               </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase size={14} className="text-gray-400" />
                  <span className="text-gray-500">Status</span>
                  {getStatusBadge(selectedTour.status)}
               </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-gray-500">Grade Level</span>
                  <span className="font-medium text-gray-800">{selectedTour.grade_level || 'N/A'}</span>
               </div>
             </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
<h3 className="text-sm font-semibold text-gray-800">Enrolled Students ({enrolledStudents.length})</h3>
                  <button
                    onClick={() => setShowEnrollStudent(!showEnrollStudent)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} /> Enroll Section
                  </button>
                </div>

                {showEnrollStudent && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 mb-2">Select Section to Enroll</p>
                    <div className="flex gap-2">
                      <select
                        value={selectedStudentForEnrollment}
                        onChange={(e) => setSelectedStudentForEnrollment(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900"
                      >
                        <option value="">Select a section...</option>
                        {sections.map(sec => (
                          <option key={sec.id} value={sec.id}>{sec.name} - {sec.track || sec.grade_level || ''}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleEnrollSection}
                        disabled={!selectedStudentForEnrollment || enrollingStudent}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {enrollingStudent ? <Loader2 size={14} className="animate-spin" /> : null}
                        Enroll
                      </button>
                      <button
                        onClick={() => { setShowEnrollStudent(false); setSelectedStudentForEnrollment(''); }}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {enrolledStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No students enrolled yet</p>
                ) : (
                  <div className="space-y-2">
                    {enrolledStudents.map(enrollment => {
                      const studentName = getEnrollmentStudentName(enrollment)
                      const status = getEnrollmentPaymentStatus(enrollment)
                      const paid = parseFloat(enrollment.amount_paid || 0)
                      const due = parseFloat(selectedTour?.total_cost || 0)
                      return (
                        <div key={enrollment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                {(studentName[0] || '?').toUpperCase()}
                            </div>
                              <p className="text-sm font-medium text-gray-800 truncate">{studentName}</p>
                          </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {status === 'paid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <Check size={12} /> Paid
                              </span>
                              )}
                              {status === 'partial' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                  <AlertTriangle size={12} /> Partial
                              </span>
                              )}
                              {status === 'unpaid' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <X size={12} /> Unpaid
                              </span>
                              )}
                          </div>
                        </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Paid: <span className="font-medium text-gray-700">₱{paid.toLocaleString()}</span> / ₱{due.toLocaleString()}</span>
                            <span>Balance: <span className={'font-semibold ' + (due - paid > 0 ? 'text-red-600' : 'text-green-600')}>₱{Math.max(0, due - paid).toLocaleString()}</span></span>
                        </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenPayment(enrollment)}
                              disabled={status === 'paid'}
                              className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ' + (status === 'paid' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700')}
                            >
                              <PesoSign size={12} /> {status === 'paid' ? 'Fully Paid' : 'Pay'}
                          </button>
                            <button
                              onClick={() => handleRemoveEnrollment(enrollment.id)}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                      )
                    })}
                </div>
                )}
             </div>

              {selectedTour.description && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedTour.description}</p>
               </div>
              )}
           </div>
         </div>
       </div>
      )}

      <StudentPaymentModal
        open={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentTarget(null); }}
        onSubmit={handleRecordPayment}
        loading={submittingPayment}
        title="Record Tour Payment"
        studentName={paymentTarget?.studentName || ''}
        feeLabel="Tour Cost per Student"
        totalCost={paymentTarget?.totalCost || 0}
        amountPaid={paymentTarget?.amountPaid || 0}
        contextNote={selectedTour?.name ? ('For tour: ' + selectedTour.name) : ''}
      />

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