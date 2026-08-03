import { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../components/Toast'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })

  const showToast = useCallback((message, type = 'success', options = {}) => {
    setToast({ open: true, message, type })

    if (options.skipNotificationList) return

    if (type === 'success') {
      addNotification({ type: 'success', title: options.title || 'Transaction Complete', message })
    } else if (type === 'error') {
      addNotification({ type: 'warning', title: options.title || 'Transaction Failed', message })
    }
  }, [])

  const addNotification = useCallback((typeOrObject, title, message) => {
    let notification
    if (typeof typeOrObject === 'object') {
      notification = typeOrObject
    } else {
      notification = { type: typeOrObject, title, message }
    }

    setNotifications((prev) => [{
      id: Date.now(),
      time: 'Just now',
      read: false,
      ...notification,
    }, ...prev].slice(0, 20))
  }, [])

  const notifyPayment = useCallback((studentName, amount, type = 'Tuition') => {
    const message = `${type} payment of ₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} received from ${studentName}`
    showToast(message, 'success')
  }, [showToast])

  const notifyEnrollment = useCallback((studentName) => {
    const message = `${studentName} has been successfully enrolled`
    showToast(message, 'success')
    addNotification({ type: 'info', title: 'New Enrollment', message })
  }, [showToast, addNotification])

  const notifySale = useCallback((total, itemCount) => {
    const message = `Sale completed: ${itemCount} item(s) for ₱${parseFloat(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    showToast(message, 'success')
  }, [showToast])

  const notifyLogin = useCallback((userName) => {
    const hour = new Date().getHours()
    let greeting = 'Good evening'
    if (hour < 12) greeting = 'Good morning'
    else if (hour < 18) greeting = 'Good afternoon'
    setToast({ open: true, message: `${greeting}, ${userName}! Welcome back`, type: 'success' })
    addNotification({ type: 'info', title: 'Login', message: `${userName} logged in successfully` })
  }, [addNotification])

  const notifyLoginError = useCallback((errorMessage) => {
    setToast({ open: true, message: errorMessage, type: 'error' })
  }, [])

  const notifyLogout = useCallback(() => {
    setToast({ open: true, message: 'You have been logged out successfully', type: 'info' })
  }, [])

  const notifyError = useCallback((message) => {
    showToast(message, 'error')
  }, [showToast])

  const notifyInfo = useCallback((message) => {
    setToast({ open: true, message, type: 'info' })
  }, [])

  const notifyWarning = useCallback((message) => {
    setToast({ open: true, message, type: 'warning' })
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }))
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      addNotification,
      showToast,
      notifyPayment,
      notifyEnrollment,
      notifySale,
      notifyLogin,
      notifyLoginError,
      notifyLogout,
      notifyError,
      notifyInfo,
      notifyWarning,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      clearAll,
    }}>
      {children}

      <Toast message={toast.open ? toast.message : ''} type={toast.type} onClose={closeToast} />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
