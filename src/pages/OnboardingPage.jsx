import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'
import AvatarUpload from '../components/AvatarUpload'
import { GraduationCap, Check, User } from 'lucide-react'

export default function OnboardingPage() {
  const [avatarDataUrl, setAvatarDataUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const { user, updateProfile } = useAuth()
  const { schoolName, schoolShortName, schoolLogo } = useSchoolConfig()
  const navigate = useNavigate()

  const handleComplete = async () => {
    setSaving(true)
    try {
      const payload = { has_seen_onboarding: true }
      if (avatarDataUrl) payload.avatar = avatarDataUrl
      const result = await updateProfile(payload)
      if (result.success) {
        navigate('/')
      }
    } catch (err) {
      console.error('Failed to save avatar:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    await updateProfile({ has_seen_onboarding: true })
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30 overflow-hidden">
              {schoolLogo ? (
                <img src={schoolLogo} alt={schoolShortName} className="w-full h-full object-contain p-2" />
              ) : (
                <GraduationCap size={36} className="text-white" />
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Welcome, {user?.firstName || user?.username}!
            </h1>
            <p className="text-sm text-gray-500">
              Upload a profile photo to personalize your account
            </p>
          </div>

          <div className="mb-8">
            <AvatarUpload
              currentAvatar={null}
              onFileSelect={setAvatarDataUrl}
            />
          </div>

          {!avatarDataUrl && (
            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-start gap-3">
                <User size={18} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">
                  Don't worry, you can always add or change your photo later in your Profile settings.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  {avatarDataUrl ? 'Save & Continue' : 'Continue'}
                </>
              )}
            </button>
          </div>

        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          {schoolName} &mdash; School Management System
        </p>
      </div>
    </div>
  )
}
