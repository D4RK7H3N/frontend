import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { Save, Loader2, User, Mail, Shield, Camera } from 'lucide-react'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const { updateProfile: updateAuth } = useAuth()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
  })
  const [avatarDataUrl, setAvatarDataUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authAPI.getProfile()
        setProfile(data)
        setAvatarDataUrl(data.avatar || null)
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
        setStatus({ type: 'error', message: 'Failed to load profile.' })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarDataUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      setStatus({ type: '', message: '' })
      const payload = { ...form }
      if (avatarFile) {
        payload.avatar = avatarDataUrl
      }
      const updated = await authAPI.updateProfile(payload)
      setProfile(updated)
      await updateAuth({ ...form, avatar: payload.avatar })
      setEditMode(false)
      setAvatarFile(null)
      setStatus({ type: 'success', message: 'Profile updated successfully.' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error?.response?.data?.detail || error.message || 'Unable to update profile.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
      })
      setAvatarDataUrl(profile.avatar || null)
      setAvatarFile(null)
    }
    setEditMode(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  const initials = `${form.first_name?.[0] || ''}${form.last_name?.[0] || ''}`.toUpperCase()

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your account information"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'System' }, { label: 'Profile' }]}
        actions={
          editMode ? (
            <div className="flex items-center gap-2">
              <ActionButton variant="secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </ActionButton>
              <ActionButton icon={Save} onClick={handleSave} loading={saving}>
                Save
              </ActionButton>
            </div>
          ) : (
            <ActionButton icon={User} onClick={() => setEditMode(true)}>
              Edit Profile
            </ActionButton>
          )
        }
      />

      {status.message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {avatarDataUrl ? (
                    <img src={avatarDataUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials || <User size={32} />
                  )}
                </div>
                {editMode && (
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Camera size={14} className="text-gray-500" />
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-gray-500">@{profile?.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield size={14} className="text-purple-600" />
                  <span className="text-sm text-purple-600">
                    {profile?.is_superuser ? 'Administrator' : profile?.is_staff ? 'Staff' : 'User'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">First Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{profile?.first_name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Last Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{profile?.last_name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
                {editMode ? (
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <p className="text-gray-800 font-medium">{profile?.email || 'Not set'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Username</span>
                <span className="font-medium text-gray-800">{profile?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">User ID</span>
                <span className="font-medium text-gray-800">#{profile?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Joined</span>
                <span className="font-medium text-gray-800">
                  {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Account Type</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${profile?.is_superuser ? 'bg-purple-500' : profile?.is_staff ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <span className="text-gray-700">
                  {profile?.is_superuser ? 'Super Administrator' : profile?.is_staff ? 'Staff Member' : 'Regular User'}
                </span>
              </div>
              {profile?.is_superuser && (
                <p className="text-sm text-gray-500">Full access to all system features</p>
              )}
              {profile?.is_staff && !profile?.is_superuser && (
                <p className="text-sm text-gray-500">Access to admin panel and staff features</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
