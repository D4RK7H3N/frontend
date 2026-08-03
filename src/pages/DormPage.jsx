import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { facilitiesAPI, studentsAPI } from '../services/api'
import {
  Search, Plus, Bed, Users, Edit, Trash2, Loader2, X,
  ChevronLeft, ChevronRight, Eye, AlertTriangle, Check,
  Building2, CheckCircle, XCircle, User, Home
} from 'lucide-react'

const ITEMS_PER_PAGE = 10
const roomTypes = ['Single', 'Double', 'Quad', 'Suite']
const genderRestrictions = ['Male', 'Female', 'Mixed']
const assignmentStatuses = ['Active', 'Completed', 'Terminated', 'Suspended']

export default function DormPage() {
  const [loading, setLoading] = useState(true)
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [occupants, setOccupants] = useState([])
  const [students, setStudents] = useState([])
  const [toast, setToast] = useState(null)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('rooms')

  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState(null)
  const [buildingForm, setBuildingForm] = useState({
    name: '', gender_restriction: 'Mixed', total_rooms: '', description: ''
  })
  const [buildingError, setBuildingError] = useState(null)
  const [savingBuilding, setSavingBuilding] = useState(false)

  const [showAddRoom, setShowAddRoom] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [roomForm, setRoomForm] = useState({
    building: '', room_number: '', room_type: 'Double', capacity: '4',
    monthly_rate: '', is_available: true
  })
  const [savingRoom, setSavingRoom] = useState(false)
  const [roomError, setRoomError] = useState(null)

  const [showAssignRoom, setShowAssignRoom] = useState(false)
  const [assignForm, setAssignForm] = useState({
    student: '', room: '', date_started: new Date().toISOString().split('T')[0], notes: ''
  })
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [assignError, setAssignError] = useState(null)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteType, setDeleteType] = useState(null)

  const [showOccupants, setShowOccupants] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [buildingsData, roomsData, occupantsData, studentsData] = await Promise.all([
        facilitiesAPI.getBuildings().catch(() => []),
        facilitiesAPI.getRooms().catch(() => []),
        facilitiesAPI.getAssignments().catch(() => []),
        studentsAPI.getAll().catch(() => [])
      ])
      setBuildings(Array.isArray(buildingsData) ? buildingsData : buildingsData.results || [])
      setRooms(Array.isArray(roomsData) ? roomsData : roomsData.results || [])
      setOccupants(Array.isArray(occupantsData) ? occupantsData : occupantsData.results || [])
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData.results || [])
    } catch (error) {
      console.error('Error fetching dorm data:', error)
      showToast('Failed to load dormitory data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredRooms = useMemo(() => {
    if (!search) return rooms
    const q = search.toLowerCase()
    return rooms.filter(r =>
      (r.room_number || '').toLowerCase().includes(q) ||
      (r.room_type || '').toLowerCase().includes(q) ||
      (r.building_name || '').toLowerCase().includes(q)
    )
  }, [rooms, search])

  const filteredBuildings = useMemo(() => {
    if (!search) return buildings
    const q = search.toLowerCase()
    return buildings.filter(b =>
      (b.name || '').toLowerCase().includes(q) ||
      (b.gender_restriction || '').toLowerCase().includes(q)
    )
  }, [buildings, search])

  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRooms.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredRooms, currentPage])

  const paginatedBuildings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredBuildings.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredBuildings, currentPage])

  const totalPagesRooms = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE)
  const totalPagesBuildings = Math.ceil(filteredBuildings.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const totalRooms = rooms.length
    const totalOccupants = rooms.reduce((sum, r) => {
      const occ = r.current_occupancy ? parseInt(r.current_occupancy.split('/')[0]) : 0
      return sum + occ
    }, 0)
    const availableBeds = rooms.reduce((sum, r) => {
      const parts = (r.current_occupancy || '0/4').split('/')
      const occ = parseInt(parts[0])
      const cap = parseInt(parts[1]) || r.capacity || 4
      return sum + Math.max(0, cap - occ)
    }, 0)
    const fullRooms = rooms.filter(r => {
      const parts = (r.current_occupancy || '0/4').split('/')
      const occ = parseInt(parts[0])
      const cap = parseInt(parts[1]) || r.capacity || 4
      return occ >= cap
    }).length
    return { totalRooms, totalOccupants, availableBeds, fullRooms }
  }, [rooms])

  const statCards = [
    { label: 'Total Rooms', value: stats.totalRooms, icon: Building2, statBg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Total Occupants', value: stats.totalOccupants, icon: Users, statBg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Available Beds', value: stats.availableBeds, icon: Bed, statBg: 'bg-yellow-50', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { label: 'Full Rooms', value: stats.fullRooms, icon: XCircle, statBg: 'bg-red-50', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ]

  const resetBuildingForm = () => {
    setBuildingForm({ name: '', gender_restriction: 'Mixed', total_rooms: '', description: '' })
    setBuildingError(null)
    setEditingBuilding(null)
  }

  const handleOpenAddBuilding = () => {
    resetBuildingForm()
    setShowAddBuilding(true)
  }

  const handleOpenEditBuilding = (building) => {
    setEditingBuilding(building)
    setBuildingForm({
      name: building.name || '',
      gender_restriction: building.gender_restriction || 'Mixed',
      total_rooms: String(building.total_rooms || ''),
      description: building.description || ''
    })
    setBuildingError(null)
    setShowAddBuilding(true)
  }

  const handleCloseBuilding = () => {
    setShowAddBuilding(false)
    resetBuildingForm()
  }

  const handleSaveBuilding = async () => {
    if (savingBuilding) return
    if (!buildingForm.name.trim()) {
      setBuildingError('Building name is required')
      return
    }
    const totalRooms = parseInt(buildingForm.total_rooms)
    if (!totalRooms || totalRooms <= 0) {
      setBuildingError('Total rooms must be a positive number')
      return
    }

    setSavingBuilding(true)
    setBuildingError(null)
    try {
      const payload = {
        name: buildingForm.name.trim(),
        gender_restriction: buildingForm.gender_restriction,
        total_rooms: totalRooms,
        description: buildingForm.description.trim()
      }
      if (editingBuilding) {
        await facilitiesAPI.updateBuilding(editingBuilding.id, payload)
        showToast('Building updated successfully')
      } else {
        await facilitiesAPI.createBuilding(payload)
        showToast('Building added successfully')
      }
      handleCloseBuilding()
      fetchData()
    } catch (err) {
      console.error('Save building error:', err)
      setBuildingError(err?.response?.data?.error || err?.response?.data?.name?.[0] || 'Failed to save building')
    } finally {
      setSavingBuilding(false)
    }
  }

  const resetRoomForm = () => {
    setRoomForm({ building: '', room_number: '', room_type: 'Double', capacity: '4', monthly_rate: '', is_available: true })
    setRoomError(null)
    setEditingRoom(null)
  }

  const handleOpenAddRoom = () => {
    resetRoomForm()
    setShowAddRoom(true)
  }

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room)
    setRoomForm({
      building: room.building ? (typeof room.building === 'object' ? room.building.id : room.building) : '',
      room_number: room.room_number || '',
      room_type: room.room_type || 'Double',
      capacity: String(room.capacity || 4),
      monthly_rate: room.monthly_rate ? String(room.monthly_rate) : '',
      is_available: room.is_available !== undefined ? room.is_available : true
    })
    setRoomError(null)
    setShowAddRoom(true)
  }

  const handleCloseRoom = () => {
    setShowAddRoom(false)
    resetRoomForm()
  }

  const handleSaveRoom = async () => {
    if (savingRoom) return
    if (!roomForm.building) {
      setRoomError('Building is required')
      return
    }
    if (!roomForm.room_number.trim()) {
      setRoomError('Room number is required')
      return
    }
    const capacity = parseInt(roomForm.capacity)
    if (!capacity || capacity <= 0) {
      setRoomError('Capacity must be a positive number')
      return
    }
    const monthlyRate = parseFloat(roomForm.monthly_rate)
    if (isNaN(monthlyRate) || monthlyRate < 0) {
      setRoomError('Monthly rate must be a valid number')
      return
    }

    setSavingRoom(true)
    setRoomError(null)
    try {
      const payload = {
        building: parseInt(roomForm.building),
        room_number: roomForm.room_number.trim(),
        room_type: roomForm.room_type,
        capacity,
        monthly_rate: monthlyRate,
        is_available: roomForm.is_available
      }
      if (editingRoom) {
        await facilitiesAPI.updateRoom(editingRoom.id, payload)
        showToast('Room updated successfully')
      } else {
        await facilitiesAPI.createRoom(payload)
        showToast('Room added successfully')
      }
      handleCloseRoom()
      fetchData()
    } catch (err) {
      console.error('Save room error:', err)
      setRoomError(err?.response?.data?.error || err?.response?.data?.room_number?.[0] || 'Failed to save room')
    } finally {
      setSavingRoom(false)
    }
  }

  const handleOpenAssignRoom = () => {
    setAssignForm({ student: '', room: '', date_started: new Date().toISOString().split('T')[0], notes: '' })
    setAssignError(null)
    setShowAssignRoom(true)
  }

  const handleCloseAssignRoom = () => {
    setShowAssignRoom(false)
    setAssignForm({ student: '', room: '', date_started: new Date().toISOString().split('T')[0], notes: '' })
    setAssignError(null)
  }

  const handleSaveAssignment = async () => {
    if (savingAssignment) return
    if (!assignForm.student) {
      setAssignError('Student is required')
      return
    }
    if (!assignForm.room) {
      setAssignError('Room is required')
      return
    }
    if (!assignForm.date_started) {
      setAssignError('Check-in date is required')
      return
    }

    setSavingAssignment(true)
    setAssignError(null)
    try {
      const payload = {
        student: parseInt(assignForm.student),
        room: parseInt(assignForm.room),
        date_started: assignForm.date_started,
        status: 'Active',
        notes: assignForm.notes.trim()
      }
      await facilitiesAPI.assignRoom(payload)
      showToast('Student assigned to room successfully')
      handleCloseAssignRoom()
      fetchData()
    } catch (err) {
      console.error('Save assignment error:', err)
      setAssignError(err?.response?.data?.error || err?.response?.data?.student?.[0] || 'Failed to assign room')
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleDeleteConfirm = (item, type) => {
    setDeleteConfirm(item)
    setDeleteType(type)
  }

  const handleDelete = async () => {
    if (deleting || !deleteConfirm) return
    setDeleting(true)
    try {
      if (deleteType === 'building') {
        await facilitiesAPI.deleteBuilding(deleteConfirm.id)
        showToast('Building deleted successfully')
      } else if (deleteType === 'room') {
        await facilitiesAPI.deleteRoom(deleteConfirm.id)
        showToast('Room deleted successfully')
      } else if (deleteType === 'assignment') {
        await facilitiesAPI.unassignRoom(deleteConfirm.id)
        showToast('Assignment removed successfully')
      }
      setDeleteConfirm(null)
      setDeleteType(null)
      fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Failed to delete', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleViewOccupants = (room) => {
    setSelectedRoom(room)
    setShowOccupants(true)
  }

  const roomOccupants = useMemo(() => {
    if (!selectedRoom) return []
    return occupants.filter(o => o.room === selectedRoom.id)
  }, [occupants, selectedRoom])

  const handleExportCSV = () => {
    const headers = ['Room', 'Building', 'Type', 'Capacity', 'Occupied', 'Monthly Rate', 'Status']
    const rows = rooms.map(r => {
      const occ = r.current_occupancy ? r.current_occupancy.split('/')[0] : '0'
      return [
        r.room_number || 'N/A',
        r.building_name || 'N/A',
        r.room_type || 'N/A',
        r.capacity || 4,
        occ,
        r.monthly_rate || 0,
        r.is_available ? 'Available' : 'Unavailable'
      ]
    })
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dorm_rooms_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Dorm rooms exported successfully')
  }

  const getStatusBadge = (isAvailable) => {
    if (isAvailable) return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Available</span>
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Unavailable</span>
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
        title="Dormitory"
        subtitle="Student dormitory management"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Facilities' }, { label: 'Dorm' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Users} variant="secondary" size="sm" onClick={handleOpenAssignRoom}>Assign Room</ActionButton>
            <ActionButton icon={Plus} size="sm" onClick={handleOpenAddRoom}>Add Room</ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
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

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setActiveTab('rooms'); setCurrentPage(1) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'rooms' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
        >
          <Bed size={14} className="inline mr-1.5" /> Rooms
        </button>
        <button
          onClick={() => { setActiveTab('buildings'); setCurrentPage(1) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'buildings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
        >
          <Building2 size={14} className="inline mr-1.5" /> Buildings
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'rooms' ? "Search by room number, type, or building..." : "Search by building name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {activeTab === 'rooms' && (
            <ActionButton icon={Plus} size="sm" onClick={handleOpenAddRoom}>Add Room</ActionButton>
          )}
          {activeTab === 'buildings' && (
            <ActionButton icon={Plus} size="sm" onClick={handleOpenAddBuilding}>Add Building</ActionButton>
          )}
        </div>
      </div>

      {activeTab === 'rooms' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Bed size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg mb-1">No rooms found</p>
              <p className="text-gray-400 text-sm">
                {search ? 'Try adjusting your search' : 'Add your first dorm room'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3.5">Room</th>
                      <th className="px-4 py-3.5 hidden sm:table-cell">Building</th>
                      <th className="px-4 py-3.5 hidden md:table-cell">Type</th>
                      <th className="px-4 py-3.5 text-center">Capacity</th>
                      <th className="px-4 py-3.5 text-center hidden lg:table-cell">Occupied</th>
                      <th className="px-4 py-3.5 text-right hidden lg:table-cell">Monthly Rate</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {paginatedRooms.map((room) => {
                      const occParts = (room.current_occupancy || '0/4').split('/')
                      const occupied = parseInt(occParts[0])
                      const capacity = parseInt(occParts[1]) || room.capacity || 4
                      const isFull = occupied >= capacity
                      return (
                        <tr key={room.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                {(room.room_number || '?')[0]?.toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-800">{room.room_number}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">{room.building_name || 'N/A'}</td>
                          <td className="px-4 py-3.5 hidden md:table-cell text-gray-600">{room.room_type || 'N/A'}</td>
                          <td className="px-4 py-3.5 text-center text-gray-600">{capacity}</td>
                          <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                            <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                              {occupied}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right hidden lg:table-cell font-semibold text-gray-800">
                            ₱{parseFloat(room.monthly_rate || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5">
                            {room.is_available ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Available</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Unavailable</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleViewOccupants(room)}
                                className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                title="View Occupants"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => handleOpenEditRoom(room)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                title="Edit"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm(room, 'room')}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {totalPagesRooms > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredRooms.length)} of {filteredRooms.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPagesRooms }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPagesRooms, p + 1))}
                      disabled={currentPage === totalPagesRooms}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'buildings' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filteredBuildings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Building2 size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg mb-1">No buildings found</p>
              <p className="text-gray-400 text-sm">
                {search ? 'Try adjusting your search' : 'Add your first dormitory building'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3.5">Building Name</th>
                      <th className="px-4 py-3.5 hidden sm:table-cell">Gender Restriction</th>
                      <th className="px-4 py-3.5 text-center">Total Rooms</th>
                      <th className="px-4 py-3.5 text-center hidden md:table-cell">Available Rooms</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {paginatedBuildings.map((building) => (
                      <tr key={building.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {(building.name || '?')[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">{building.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">
                          {building.gender_restriction === 'Male' ? 'Boys Dormitory' :
                           building.gender_restriction === 'Female' ? 'Girls Dormitory' : 'Mixed'}
                        </td>
                        <td className="px-4 py-3.5 text-center text-gray-600">{building.total_rooms || 0}</td>
                        <td className="px-4 py-3.5 text-center hidden md:table-cell text-gray-600">
                          <span className="font-semibold text-green-600">{building.available_rooms_count || 0}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          {building.is_active ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditBuilding(building)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm(building, 'building')}
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
              {totalPagesBuildings > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredBuildings.length)} of {filteredBuildings.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPagesBuildings }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPagesBuildings, p + 1))}
                      disabled={currentPage === totalPagesBuildings}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showAddBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseBuilding} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 size={18} className="text-emerald-600" />
                {editingBuilding ? 'Edit Building' : 'Add Building'}
              </h2>
              <button
                onClick={handleCloseBuilding}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {buildingError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={16} /> {buildingError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Building Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Santos Hall, Building A"
                    value={buildingForm.name}
                    onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gender Restriction</label>
                    <select
                      value={buildingForm.gender_restriction}
                      onChange={(e) => setBuildingForm({ ...buildingForm, gender_restriction: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    >
                      {genderRestrictions.map(g => (
                        <option key={g} value={g}>
                          {g === 'Male' ? 'Boys Dormitory' : g === 'Female' ? 'Girls Dormitory' : 'Mixed'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Total Rooms <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                      value={buildingForm.total_rooms}
                      onChange={(e) => setBuildingForm({ ...buildingForm, total_rooms: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Building description, location details..."
                    value={buildingForm.description}
                    onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseBuilding}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveBuilding} loading={savingBuilding}>
                {editingBuilding ? 'Update Building' : 'Add Building'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {showAddRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseRoom} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bed size={18} className="text-indigo-600" />
                {editingRoom ? 'Edit Room' : 'Add Room'}
              </h2>
              <button
                onClick={handleCloseRoom}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {roomError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={16} /> {roomError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Building <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={roomForm.building}
                    onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  >
                    <option value="">Select building</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Room Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101, A-201"
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Room Type</label>
                    <select
                      value={roomForm.room_type}
                      onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    >
                      {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Capacity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={roomForm.capacity}
                      onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Monthly Rate (₱) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={roomForm.monthly_rate}
                      onChange={(e) => setRoomForm({ ...roomForm, monthly_rate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Available</label>
                    <select
                      value={roomForm.is_available ? 'true' : 'false'}
                      onChange={(e) => setRoomForm({ ...roomForm, is_available: e.target.value === 'true' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseRoom}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveRoom} loading={savingRoom}>
                {editingRoom ? 'Update Room' : 'Add Room'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {showAssignRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseAssignRoom} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                Assign Room
              </h2>
              <button
                onClick={handleCloseAssignRoom}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {assignError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle size={16} /> {assignError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignForm.student}
                    onChange={(e) => setAssignForm({ ...assignForm, student: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  >
                    <option value="">Select student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.lrn || s.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Room <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignForm.room}
                    onChange={(e) => setAssignForm({ ...assignForm, room: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  >
                    <option value="">Select room</option>
                    {rooms.filter(r => r.is_available).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.building_name} - Room {r.room_number} ({r.current_occupancy || '0/' + r.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Check-in Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={assignForm.date_started}
                    onChange={(e) => setAssignForm({ ...assignForm, date_started: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any special notes..."
                    value={assignForm.notes}
                    onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <ActionButton variant="secondary" onClick={handleCloseAssignRoom}>Cancel</ActionButton>
              <ActionButton onClick={handleSaveAssignment} loading={savingAssignment}>
                Assign
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
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete {deleteType === 'building' ? 'Building' : deleteType === 'room' ? 'Room' : 'Assignment'}?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Are you sure you want to delete <strong>{deleteConfirm.name || deleteConfirm.room_number}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showOccupants && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowOccupants(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                {selectedRoom.building_name} - Room {selectedRoom.room_number} Occupants
              </h2>
              <button
                onClick={() => setShowOccupants(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {roomOccupants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <User size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No occupants in this room</p>
                  <p className="text-gray-400 text-sm mt-1">This room is currently empty</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Student</th>
                      <th className="px-4 py-3">Check-in Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {roomOccupants.map((occupant) => (
                      <tr key={occupant.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {(occupant.student_name || '?')[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">
                              {occupant.student_name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {occupant.date_started ? new Date(occupant.date_started).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            occupant.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : occupant.status === 'Completed'
                              ? 'bg-blue-100 text-blue-700'
                              : occupant.status === 'Terminated'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {occupant.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              handleDeleteConfirm(occupant, 'assignment')
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                            title="Remove Assignment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-white rounded-b-2xl">
              <ActionButton variant="secondary" onClick={() => setShowOccupants(false)}>Close</ActionButton>
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