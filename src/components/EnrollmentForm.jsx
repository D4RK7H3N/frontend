import { useState, useEffect } from 'react'
import ActionButton from './ActionButton'
import { studentsAPI, academicAPI } from '../services/api'

const inferLevelType = (gradeLevel) => {
  if (!gradeLevel) return 'ALL'
  const g = gradeLevel.toLowerCase()
  if (g.includes('grade')) return 'SHS'
  if (g.includes('bundled') || g.includes('year')) return 'BUN'
  if (g.includes('college')) return 'COL'
  return 'ALL'
}

const generateCode = (name) => {
  if (!name) return 'GEN'
  return name.split(/\s+/).slice(0, 4).map(w => w[0]).join('').toUpperCase() || 'GEN'
}

export default function EnrollmentForm({ initial = {}, onSaved, onCancel, title = 'Student Enrollment' }) {
  const [form, setForm] = useState({
    first_name: initial.first_name || '',
    middle_name: initial.middle_name || '',
    last_name: initial.last_name || '',
    lrn: initial.lrn || '',
    date_of_birth: initial.date_of_birth || '',
    gender: initial.gender || '',
    address: initial.address || '',
    contact_number: initial.contact_number || '',
    email: initial.email || '',
    guardian_name: initial.guardian_name || '',
    guardian_contact: initial.guardian_contact || '',
    current_grade_level: initial.current_grade_level || '',
    track_strand: initial.track_strand || '',
    section: initial.section || '',
    student_type: initial.student_type || 'Payee',
    enrollment_status: initial.enrollment_status || 'New',
    previous_school: initial.previous_school || '',
    custom_tuition_fee: initial.custom_tuition_fee || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [sections, setSections] = useState([])
  const [tracks, setTracks] = useState([])

  useEffect(() => {
    academicAPI.getSections().then(d => setSections(Array.isArray(d) ? d : d.results || [])).catch(() => {})
    academicAPI.getTracks().then(d => setTracks(Array.isArray(d) ? d : d.results || [])).catch(() => {})
  }, [])

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

  const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const isTransferee = form.enrollment_status === 'Transferee'

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      if (isTransferee && !form.previous_school.trim()) {
        setError('Previous school is required for transferees.')
        setSaving(false)
        return
      }
      const payload = { ...form }
      const created = await studentsAPI.create(payload)
      if (onSaved) onSaved(created)
    } catch (err) {
      console.error('Enrollment save failed', err)
      const data = err?.response?.data
      const msg = typeof data === 'string' ? data : data?.error || data?.detail || Object.values(data || {}).flat().join(', ') || 'Save failed'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Last name" value={form.last_name} onChange={handleChange('last_name')} className="px-3 py-2 border rounded col-span-1" />
          <input placeholder="First name" value={form.first_name} onChange={handleChange('first_name')} className="px-3 py-2 border rounded col-span-1" />
          <input placeholder="Middle name" value={form.middle_name} onChange={handleChange('middle_name')} className="px-3 py-2 border rounded col-span-1" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input placeholder="LRN" value={form.lrn} onChange={handleChange('lrn')} className="px-3 py-2 border rounded" />
          <input type="date" placeholder="Date of birth" value={form.date_of_birth} onChange={handleChange('date_of_birth')} className="px-3 py-2 border rounded" />
          <select value={form.gender} onChange={handleChange('gender')} className="px-3 py-2 border rounded">
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <input placeholder="Complete address" value={form.address} onChange={handleChange('address')} className="w-full px-3 py-2 border rounded" />

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              placeholder="Contact number *"
              value={form.contact_number}
              onChange={handleChange('contact_number')}
              required
              className="w-full px-3 py-2 border rounded border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <input placeholder="Email" value={form.email} onChange={handleChange('email')} className="px-3 py-2 border rounded" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Guardian name" value={form.guardian_name} onChange={handleChange('guardian_name')} className="px-3 py-2 border rounded" />
          <input placeholder="Guardian contact" value={form.guardian_contact} onChange={handleChange('guardian_contact')} className="px-3 py-2 border rounded" />
        </div>

        {isTransferee && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-sm">⚠️</span>
              <div className="text-xs text-amber-800">
                <p className="font-semibold">Transferee Requirements</p>
                <p className="text-amber-700">Previous school information is required for record verification (Form 137 / Form 138) and DepEd reporting.</p>
              </div>
            </div>
            <input
              placeholder="Previous school name *"
              value={form.previous_school}
              onChange={handleChange('previous_school')}
              required
              className="w-full px-3 py-2 border rounded border-amber-400 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Grade / Year level" value={form.current_grade_level} onChange={handleChange('current_grade_level')} className="px-3 py-2 border rounded" />
          <input placeholder="Track / Strand" value={form.track_strand} onChange={handleChange('track_strand')} className="px-3 py-2 border rounded" />
          <input placeholder="Section" value={form.section} onChange={handleChange('section')} className="px-3 py-2 border rounded" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={form.student_type} onChange={handleChange('student_type')} className="px-3 py-2 border rounded">
            <option value="Payee">Payee</option>
            <option value="Regular">Regular</option>
          </select>
          <select value={form.enrollment_status} onChange={handleChange('enrollment_status')} className="px-3 py-2 border rounded">
            <option value="New">New</option>
            <option value="Continuing">Continuing</option>
            <option value="Transferee">Transferee</option>
            <option value="ALS Graduate">ALS Graduate</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 items-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Custom Tuition Fee (₱) <span className="text-blue-500">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 5000.00"
              value={form.custom_tuition_fee}
              onChange={handleChange('custom_tuition_fee')}
              className="w-full px-3 py-2 border rounded border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <p className="text-xs text-gray-400 mt-4">Leave blank to use the default tuition fee for the grade/course.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{typeof error === 'string' ? error : JSON.stringify(error)}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <ActionButton variant="secondary" onClick={onCancel}>Cancel</ActionButton>
        <ActionButton onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Enrollment'}</ActionButton>
      </div>
    </div>
  )
}
