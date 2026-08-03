import { createContext, useContext, useEffect, useState } from 'react'

const LoadingContext = createContext({ isLoading: false })

let activeRequests = 0
let manualTriggers = 0
const listeners = new Set()

function emit() {
  const isLoading = activeRequests > 0 || manualTriggers > 0
  listeners.forEach((listener) => listener(isLoading))
}

// Called from axios interceptors (module-level, no React needed)
export const startRequestLoading = () => {
  activeRequests += 1
  emit()
}

export const endRequestLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1)
  emit()
}

// Manual triggers for non-API loading (lazy routes, auth checks, etc.)
export const startGlobalLoading = () => {
  manualTriggers += 1
  emit()
}

export const stopGlobalLoading = () => {
  manualTriggers = Math.max(0, manualTriggers - 1)
  emit()
}

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    listeners.add(setIsLoading)
    return () => listeners.delete(setIsLoading)
  }, [])

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  return useContext(LoadingContext)
}
