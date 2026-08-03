import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'
import { authAPI } from '../services/api'
import { useNotification } from '../context/NotificationContext'
import { LogIn, Eye, EyeOff, AlertCircle, GraduationCap } from 'lucide-react'

const getErrorMessage = (errorMsg) => {
  const normalized = errorMsg.toLowerCase()
  if (normalized.includes('invalid') || normalized.includes('incorrect')) {
    return 'The username or password you entered is incorrect. Please try again.'
  }
  if (normalized.includes('disabled') || normalized.includes('inactive')) {
    return 'Your account has been disabled. Please contact your administrator.'
  }
  if (normalized.includes('not found') || normalized.includes('does not exist')) {
    return 'No account found with this username. Please check your credentials.'
  }
  return errorMsg || 'Login failed. Please check your credentials and try again.'
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { notifyLogin, notifyLoginError } = useNotification()
  const { schoolName, schoolShortName, schoolLogo } = useSchoolConfig()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!username.trim()) {
      setError('Please enter your username')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Please enter your password')
      setLoading(false)
      return
    }

    const result = await login(username, password)

    if (result.success) {
      const userName = result.user?.first_name || result.user?.username || username

      try {
        const profileData = await authAPI.getProfile()
        const enriched = {
          ...result.user,
          firstName: profileData.first_name || result.user.firstName || '',
          lastName: profileData.last_name || result.user.lastName || '',
          email: profileData.email || result.user.email,
          isSuperuser: profileData.is_superuser || result.user.isSuperuser,
          avatar: profileData.avatar || result.user.avatar,
          hasSeenOnboarding: profileData.has_seen_onboarding ?? result.user.hasSeenOnboarding,
        }
        localStorage.setItem('user', JSON.stringify(enriched))
      } catch (e) {
        // Profile fetch is optional
      }

      notifyLogin(userName)
      navigate('/')
    } else {
      const errorMsg = getErrorMessage(result.error)
      setError(errorMsg)
      notifyLoginError(errorMsg)
      setPassword('')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30 overflow-hidden">
              {schoolLogo ? (
                <img src={schoolLogo} alt={schoolShortName} className="w-full h-full object-contain p-2" />
              ) : (
                <GraduationCap size={36} className="text-white" />
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {schoolName}
            </h1>
            <p className="text-sm text-gray-500">
              {schoolShortName} Management System
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          © 2026 {schoolName}. All rights reserved.
        </p>
      </div>
    </div>
  )
}
