import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { configAPI } from '../services/api'

const SchoolConfigContext = createContext(null)

const DEFAULT_CONFIG = {
  school_name: 'School Management System',
  school_short_name: 'SMS',
  tagline: 'School Management System',
  logo_url: null,
  logo: null,
}

export function SchoolConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('schoolConfig')
      return cached ? JSON.parse(cached) : DEFAULT_CONFIG
    } catch {
      return DEFAULT_CONFIG
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchConfig = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setLoading(false)
      return
    }

    if (hasFetched) return

    try {
      setLoading(true)
      setError(null)
      const data = await configAPI.getConfig()
      setConfig(data)
      setHasFetched(true)
      localStorage.setItem('schoolConfig', JSON.stringify(data))
    } catch (err) {
      setError(err)
      console.warn('School config fetch failed, using cached values')
    } finally {
      setLoading(false)
    }
  }, [hasFetched])

  const refetch = useCallback(() => {
    setHasFetched(false)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token && !hasFetched) {
      fetchConfig()
    }
  }, [fetchConfig, hasFetched])

  const updateConfig = useCallback((newConfig) => {
    setConfig(newConfig)
    localStorage.setItem('schoolConfig', JSON.stringify(newConfig))
  }, [])

  const schoolName = config?.school_name || DEFAULT_CONFIG.school_name
  const schoolShortName = config?.school_short_name || DEFAULT_CONFIG.school_short_name
  const schoolLogo = config?.logo_url || config?.logo || null
  const schoolTagline = config?.tagline || DEFAULT_CONFIG.tagline

  return (
    <SchoolConfigContext.Provider value={{
      config,
      loading,
      error,
      updateConfig,
      refetch,
      schoolName,
      schoolShortName,
      schoolLogo,
      schoolTagline,
    }}>
      {children}
    </SchoolConfigContext.Provider>
  )
}

export function useSchoolConfig() {
  const context = useContext(SchoolConfigContext)
  if (!context) {
    throw new Error('useSchoolConfig must be used within a SchoolConfigProvider')
  }
  return context
}