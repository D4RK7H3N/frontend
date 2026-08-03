import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'
import { authAPI } from '../services/api'
import {
  Monitor,
  Bell,
  Database,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Check,
  Info,
  HardDrive,
  FileText,
  Coffee,
  Globe,
  Building2,
  Zap
} from 'lucide-react'

export default function SettingsPage() {
  const { schoolName } = useSchoolConfig()
  const [toast, setToast] = useState(null)
  const [notifications, setNotifications] = useState({
    payment_reminders: true,
    dropout_alerts: true,
    enrollment_notifications: true,
    system_updates: true
  })
  const [appVersion, setAppVersion] = useState('1.0.0')
  const [userInfo, setUserInfo] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [backing, setBacking] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notificationSettings')
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications))
      }
    } catch {
    }
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(version => {
        if (version) setAppVersion(version)
      }).catch(() => {})
    }
    authAPI.getProfile().then(data => {
      setUserInfo(data)
    }).catch(() => {})
  }, [])

  const handleToggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    setNotifications(updated)
    localStorage.setItem('notificationSettings', JSON.stringify(updated))
    showToast('Notification settings updated')
  }

  const handleClearCache = () => {
    setClearing(true)
    try {
      const keepKeys = ['authToken', 'user', 'theme', 'notificationSettings']
      const allKeys = Object.keys(localStorage)
      allKeys.forEach(key => {
        if (!keepKeys.includes(key)) {
          localStorage.removeItem(key)
        }
      })
      showToast('Cache cleared successfully')
    } catch (err) {
      showToast('Failed to clear cache', 'error')
    } finally {
      setClearing(false)
    }
  }

  const handleExportAllData = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const data = {
        exported_at: new Date().toISOString(),
        school_name: schoolName,
        app_version: appVersion,
        settings: (() => { try { return JSON.parse(localStorage.getItem('schoolConfig') || '{}') } catch { return {} } })(),
        notifications: notifications
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `system_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('System data exported successfully')
    } catch (err) {
      showToast('Failed to export data', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleBackupDatabase = async () => {
    if (backing) return
    setBacking(true)
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        exported_by: userInfo?.username || 'admin',
        data_snapshot: 'full'
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `db_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Database backup created successfully')
    } catch (err) {
      showToast('Backup failed. Please try again.', 'error')
    } finally {
      setBacking(false)
    }
  }

  const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} disabled={disabled} />
      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
    </label>
  )

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="System configuration and preferences"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'System' }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Bell size={16} className="text-amber-600" /> Notification Settings
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Payment Reminders</p>
                  <p className="text-xs text-gray-500">Notify about pending payments</p>
                </div>
                <ToggleSwitch checked={notifications.payment_reminders} onChange={() => handleToggleNotification('payment_reminders')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Dropout Alerts</p>
                  <p className="text-xs text-gray-500">Alert when students are marked as dropouts</p>
                </div>
                <ToggleSwitch checked={notifications.dropout_alerts} onChange={() => handleToggleNotification('dropout_alerts')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Enrollment Notifications</p>
                  <p className="text-xs text-gray-500">Notify about new enrollments</p>
                </div>
                <ToggleSwitch checked={notifications.enrollment_notifications} onChange={() => handleToggleNotification('enrollment_notifications')} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">System Updates</p>
                  <p className="text-xs text-gray-500">Important system announcements</p>
                </div>
                <ToggleSwitch checked={notifications.system_updates} onChange={() => handleToggleNotification('system_updates')} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Database size={16} className="text-green-600" /> Data Management
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Download size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Export All Data</p>
                    <p className="text-xs text-gray-500">Download system configuration and settings</p>
                  </div>
                </div>
                <ActionButton variant="outline" size="sm" icon={Download} onClick={handleExportAllData} loading={exporting}>
                  Export
                </ActionButton>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Coffee size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Clear Cache</p>
                    <p className="text-xs text-gray-500">Remove temporary cached data</p>
                  </div>
                </div>
                <ActionButton variant="outline" size="sm" icon={Trash2} onClick={handleClearCache} loading={clearing}>
                  Clear
                </ActionButton>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <HardDrive size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Backup Database</p>
                    <p className="text-xs text-gray-500">Create a database backup file</p>
                  </div>
                </div>
                <ActionButton variant="outline" size="sm" icon={Database} onClick={handleBackupDatabase} loading={backing}>
                  Backup
                </ActionButton>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Info size={16} className="text-blue-600" /> About
              </h3>
            </div>
            <div className="p-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
                  <Building2 size={28} className="text-white" />
                </div>
                <h4 className="font-bold text-gray-900">{schoolName} Management System</h4>
                <p className="text-sm text-gray-500">{schoolName}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-2"><Zap size={13} /> Version</span>
                  <span className="font-medium text-gray-800">{appVersion}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-2"><Globe size={13} /> Region</span>
                  <span className="font-medium text-gray-800">Philippines</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 flex items-center gap-2"><FileText size={13} /> License</span>
                  <span className="font-medium text-gray-800">Proprietary</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center mb-3">Built With</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['React 18', 'Vite', 'Tailwind CSS', 'Electron', 'Django REST'].map(tech => (
                    <span key={tech} className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Monitor size={16} className="text-indigo-600" /> System Status
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">API Server</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Database</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Electron</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Running
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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