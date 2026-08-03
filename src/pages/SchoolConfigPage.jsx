import { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { Building, Save, Loader2, Upload, Image, X, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { configAPI } from '../services/api'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'
import { useAuth } from '../context/AuthContext'

export default function SchoolConfigPage() {
  const { user } = useAuth()
  const { config, loading: configLoading, updateConfig } = useSchoolConfig()

  if (!user?.is_superuser && !user?.isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-sm text-gray-500">Only administrators can view and edit school configuration. Please contact your system administrator if you need access.</p>
        </div>
      </div>
    )
  }
  const [localForm, setLocalForm] = useState({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (config) {
      setLocalForm({
        school_name: config.school_name || '',
        school_short_name: config.school_short_name || '',
        tagline: config.tagline || '',
        address_line1: config.address_line1 || '',
        address_line2: config.address_line2 || '',
        city: config.city || '',
        province: config.province || '',
        zip_code: config.zip_code || '',
        country: config.country || '',
        phone_number: config.phone_number || '',
        mobile_number: config.mobile_number || '',
        email: config.email || '',
        website: config.website || '',
        current_academic_year: config.current_academic_year || '',
        student_id_prefix: config.student_id_prefix || '',
        receipt_header_text: config.receipt_header_text || '',
        receipt_footer_text: config.receipt_footer_text || '',
        facebook_url: config.facebook_url || '',
        twitter_url: config.twitter_url || '',
        instagram_url: config.instagram_url || '',
      })
      setLogoPreview(config.logo_url || config.logo || '')
    }
  }, [config])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleLogoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB.', 'error')
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(config?.logo_url || config?.logo || '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      setEditing(false)

      let data
      if (logoFile) {
        data = new FormData()
        Object.keys(localForm).forEach((key) => {
          data.append(key, localForm[key])
        })
        data.append('logo', logoFile)
      } else {
        data = localForm
      }

      const updated = await configAPI.updateConfig(data)
      await updateConfig(updated)
      setLogoFile(null)
      showToast('School configuration updated successfully.')
    } catch (error) {
      setEditing(true)
      showToast(
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        'Unable to save configuration.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setLogoFile(null)
    if (config) {
      setLocalForm({
        school_name: config.school_name || '',
        school_short_name: config.school_short_name || '',
        tagline: config.tagline || '',
        address_line1: config.address_line1 || '',
        address_line2: config.address_line2 || '',
        city: config.city || '',
        province: config.province || '',
        zip_code: config.zip_code || '',
        country: config.country || '',
        phone_number: config.phone_number || '',
        mobile_number: config.mobile_number || '',
        email: config.email || '',
        website: config.website || '',
        current_academic_year: config.current_academic_year || '',
        student_id_prefix: config.student_id_prefix || '',
        receipt_header_text: config.receipt_header_text || '',
        receipt_footer_text: config.receipt_footer_text || '',
        facebook_url: config.facebook_url || '',
        twitter_url: config.twitter_url || '',
        instagram_url: config.instagram_url || '',
      })
      setLogoPreview(config.logo_url || config.logo || '')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    )
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-colors'

  const labelClass = 'text-sm font-medium text-gray-600'

  const rowClass = 'flex flex-col gap-2 py-3 border-b border-gray-100'

  return (
    <div>
      <PageHeader
        title="School Configuration"
        subtitle="Manage school-wide settings"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'System' }, { label: 'School Config' }]}
        actions={
          editing ? (
            <div className="flex items-center gap-2">
              <ActionButton variant="secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </ActionButton>
              <ActionButton icon={Save} onClick={handleSave} loading={saving}>
                Save
              </ActionButton>
            </div>
          ) : (
            <ActionButton icon={Building} onClick={() => setEditing(true)}>
              Edit Configuration
            </ActionButton>
          )
        }
      />

      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-slide-up flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">School Identity</h3>
              <div className="space-y-4">

                <div className={rowClass}>
                  <label className={labelClass}>School Name *</label>
                  {editing ? (
                    <input
                      type="text"
                      value={localForm.school_name || ''}
                      onChange={(e) => setLocalForm({ ...localForm, school_name: e.target.value })}
                      className={inputClass}
                      placeholder="Enter school name"
                    />
                  ) : (
                    <span className="font-semibold text-gray-800 text-base">
                      {config?.school_name || 'Management System'}
                    </span>
                  )}
                </div>

                <div className={rowClass}>
                  <label className={labelClass}>Short Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={localForm.school_short_name || ''}
                      onChange={(e) => setLocalForm({ ...localForm, school_short_name: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.school_short_name || 'SCC'}</span>
                  )}
                </div>

                <div className={rowClass}>
                  <label className={labelClass}>Tagline</label>
                  {editing ? (
                    <input
                      type="text"
                      value={localForm.tagline || ''}
                      onChange={(e) => setLocalForm({ ...localForm, tagline: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.tagline || 'Education Excellence'}</span>
                  )}
                </div>

                <div className={rowClass}>
                  <label className={labelClass}>Academic Year</label>
                  {editing ? (
                    <input
                      type="text"
                      value={localForm.current_academic_year || ''}
                      onChange={(e) => setLocalForm({ ...localForm, current_academic_year: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. 2025-2026"
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.current_academic_year || '2025-2026'}</span>
                  )}
                </div>

                <div className={rowClass}>
                  <label className={labelClass}>Student ID Prefix</label>
                  {editing ? (
                    <input
                      type="text"
                      value={localForm.student_id_prefix || ''}
                      onChange={(e) => setLocalForm({ ...localForm, student_id_prefix: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.student_id_prefix || 'STU'}</span>
                  )}
                </div>

              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Contact Information</h3>
              <div className="space-y-4">

                <div className={rowClass}>
                  <label className={labelClass}>Address</label>
                  {editing ? (
                    <input
                      type="text"
                      value={localForm.address_line1 || ''}
                      onChange={(e) => setLocalForm({ ...localForm, address_line1: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.address_line1 || 'Manila, Philippines'}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={rowClass}>
                    <label className={labelClass}>City</label>
                    {editing ? (
                      <input
                        type="text"
                        value={localForm.city || ''}
                        onChange={(e) => setLocalForm({ ...localForm, city: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{config?.city || 'Manila'}</span>
                    )}
                  </div>
                  <div className={rowClass}>
                    <label className={labelClass}>Province</label>
                    {editing ? (
                      <input
                        type="text"
                        value={localForm.province || ''}
                        onChange={(e) => setLocalForm({ ...localForm, province: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{config?.province || 'Negros Occidental'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={rowClass}>
                    <label className={labelClass}>Phone</label>
                    {editing ? (
                      <input
                        type="text"
                        value={localForm.phone_number || ''}
                        onChange={(e) => setLocalForm({ ...localForm, phone_number: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{config?.phone_number || '(034) 123-4567'}</span>
                    )}
                  </div>
                  <div className={rowClass}>
                    <label className={labelClass}>Mobile</label>
                    {editing ? (
                      <input
                        type="text"
                        value={localForm.mobile_number || ''}
                        onChange={(e) => setLocalForm({ ...localForm, mobile_number: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{config?.mobile_number || 'N/A'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={rowClass}>
                    <label className={labelClass}>Email</label>
                    {editing ? (
                      <input
                        type="email"
                        value={localForm.email || ''}
                        onChange={(e) => setLocalForm({ ...localForm, email: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{config?.email || 'info@schoolms.local'}</span>
                    )}
                  </div>
                  <div className={rowClass}>
                    <label className={labelClass}>Website</label>
                    {editing ? (
                      <input
                        type="url"
                        value={localForm.website || ''}
                        onChange={(e) => setLocalForm({ ...localForm, website: e.target.value })}
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{config?.website || 'N/A'}</span>
                    )}
                  </div>
                </div>

              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Social Media</h3>
              <div className="space-y-4">
                <div className={rowClass}>
                  <label className={labelClass}>Facebook</label>
                  {editing ? (
                    <input
                      type="url"
                      value={localForm.facebook_url || ''}
                      onChange={(e) => setLocalForm({ ...localForm, facebook_url: e.target.value })}
                      className={inputClass}
                      placeholder="https://facebook.com/..."
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.facebook_url || 'N/A'}</span>
                  )}
                </div>
                <div className={rowClass}>
                  <label className={labelClass}>Twitter / X</label>
                  {editing ? (
                    <input
                      type="url"
                      value={localForm.twitter_url || ''}
                      onChange={(e) => setLocalForm({ ...localForm, twitter_url: e.target.value })}
                      className={inputClass}
                      placeholder="https://twitter.com/..."
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.twitter_url || 'N/A'}</span>
                  )}
                </div>
                <div className={rowClass}>
                  <label className={labelClass}>Instagram</label>
                  {editing ? (
                    <input
                      type="url"
                      value={localForm.instagram_url || ''}
                      onChange={(e) => setLocalForm({ ...localForm, instagram_url: e.target.value })}
                      className={inputClass}
                      placeholder="https://instagram.com/..."
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.instagram_url || 'N/A'}</span>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Receipt Configuration</h3>
              <div className="space-y-4">
                <div className={rowClass}>
                  <label className={labelClass}>Receipt Header Text</label>
                  {editing ? (
                    <input
                      type="text"
                      value={localForm.receipt_header_text || ''}
                      onChange={(e) => setLocalForm({ ...localForm, receipt_header_text: e.target.value })}
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.receipt_header_text || 'N/A'}</span>
                  )}
                </div>
                <div className={rowClass}>
                  <label className={labelClass}>Receipt Footer Text</label>
                  {editing ? (
                    <textarea
                      value={localForm.receipt_footer_text || ''}
                      onChange={(e) => setLocalForm({ ...localForm, receipt_footer_text: e.target.value })}
                      className={inputClass}
                      rows={2}
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{config?.receipt_footer_text || 'Thank you for your payment!'}</span>
                  )}
                </div>
              </div>
            </section>

          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">School Logo</h3>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="relative mb-4">
                  {logoPreview ? (
                    <div className="relative group">
                      <img
                        src={logoPreview}
                        alt="School logo preview"
                        className="w-full h-48 object-contain rounded-lg bg-white border border-gray-200"
                      />
                      {editing && (
                        <button
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                          title="Remove logo"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white">
                      <Image size={40} className="mb-2 opacity-50" />
                      <span className="text-xs text-center px-4">No logo uploaded</span>
                    </div>
                  )}
                </div>

                {editing && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer text-sm font-medium transition-colors border border-blue-200"
                    >
                      <Upload size={15} />
                      {logoFile ? 'Change Logo' : 'Upload Logo'}
                    </label>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      JPG, PNG, GIF, WebP (max 5MB)
                    </p>
                    {logoFile && (
                      <p className="text-xs text-blue-600 text-center mt-1 font-medium truncate">
                        {logoFile.name}
                      </p>
                    )}
                  </div>
                )}

                {!editing && !logoPreview && (
                  <p className="text-xs text-gray-400 text-center">
                    No logo set
                  </p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">System Information</h3>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">System Version</span>
                  <span className="font-medium text-gray-800 text-sm">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Database</span>
                  <span className="font-medium text-green-600 text-sm">Operational</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Last Updated</span>
                  <span className="font-medium text-gray-800 text-sm">
                    {config?.updated_at ? new Date(config.updated_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  )
}