import { useState, useEffect } from 'react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSchoolConfig } from '../contexts/SchoolConfigContext'
import { useNotification } from '../context/NotificationContext'
import {
  Settings,
  Menu,
  X,
  Users,
  LayoutGrid,
  Clock,
  GitBranch,
  BookOpen,
  UserPlus,
  UserMinus,
  Receipt,
  GraduationCap,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  ClipboardCheck,
  Award,
  Bus,
  Bed,
  Package,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap as SchoolIcon,
  Home,
  ArrowRight,
  Bell,
  Check,
} from 'lucide-react'

const navigationGroups = [
  {
    label: 'MAIN',
    items: [
      { path: '/', label: 'Dashboard', icon: Home },
    ]
  },
  {
    label: 'STUDENT',
    items: [
      { path: '/students', label: 'Students', icon: Users },
      { path: '/sections', label: 'Sections', icon: LayoutGrid },
      { path: '/tracks', label: 'Tracks', icon: GitBranch },
      { path: '/courses', label: 'Courses', icon: BookOpen },
      { path: '/enroll', label: 'Enroll', icon: UserPlus },
      { path: '/promotion', label: 'Promotion', icon: ArrowRight },
      { path: '/dropouts', label: 'Dropouts', icon: UserMinus },
    ]
  },
  {
    label: 'FINANCE',
    items: [
      { path: '/cashier', label: 'Cashier', icon: Receipt },
      { path: '/tuition', label: 'Tuition', icon: GraduationCap },
      { path: '/revenue', label: 'Revenue', icon: TrendingUp },
      { path: '/pending-payments', label: 'Pending', icon: Clock },
      { path: '/sales', label: 'Sales', icon: ShoppingCart },
    ]
  },
  {
    label: 'ACADEMICS',
    items: [
      { path: '/assessments', label: 'Assessments', icon: ClipboardCheck },
      { path: '/graduation', label: 'Graduation', icon: Award },
      { path: '/tours', label: 'Tours', icon: Bus },
    ]
  },
  {
    label: 'FACILITIES',
    items: [
      { path: '/dorm', label: 'Dorm', icon: Bed },
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/school-config', label: 'School Config', icon: Building, adminOnly: true },
      { path: '/profile', label: 'Profile', icon: User },
    ]
  }
]

const isAdmin = (user) => !!user?.is_superuser || !!user?.isAdmin

const filterGroups = (groups, user) => {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdmin(user)),
    }))
    .filter((group) => group.items.length > 0)
}

export default function MainLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { schoolName, schoolShortName, schoolLogo } = useSchoolConfig()
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification, clearAll } = useNotification()

  const visibleGroups = filterGroups(navigationGroups, user)
  const role = user?.role || (user?.is_superuser ? 'admin' : user?.is_staff ? 'staff' : 'user')
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'staff' ? 'Staff Member' : 'User'
  const roleColor = role === 'admin' ? 'text-purple-600 bg-purple-50' : role === 'staff' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50'

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await logout()
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 transition-colors">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 lg:hidden"
            >
              {mobileMenuOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
                {schoolLogo ? (
                  <img src={schoolLogo} alt={schoolShortName} className="w-full h-full object-contain p-1" />
                ) : (
                  <SchoolIcon size={20} className="text-white" />
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-gray-900">{schoolName}</h1>
                <p className="text-xs text-gray-500">{schoolShortName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">{user?.username || 'Admin'}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-md bg-gradient-to-br from-blue-500 to-blue-600">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (user?.firstName?.[0] || user?.username?.[0] || 'A').toUpperCase()
                )}
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-96 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <div className="flex gap-1">
                        {notifications.length > 0 && (
                          <>
                            <button onClick={markAllAsRead} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600" title="Mark all read">
                              <Check size={14} />
                            </button>
                            <button onClick={clearAll} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 text-xs font-medium">Clear</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-400">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                            onClick={() => { markAsRead(n.id); setShowNotifications(false) }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'error' || n.type === 'warning' ? 'bg-red-500' : n.type === 'info' ? 'bg-blue-500' : 'bg-green-500'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-900 truncate">{n.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); dismissNotification(n.id) }} className="p-0.5 hover:bg-gray-200 rounded text-gray-300 hover:text-gray-500 shrink-0">
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-white border-r border-gray-200 shadow-xl z-40 transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="h-full overflow-y-auto p-4">
          {visibleGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                    }`
                  }
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <aside
        className={`hidden lg:flex fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-all duration-300 ease-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full w-full">
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              {sidebarCollapsed ? (
                <ChevronRight size={18} className="text-gray-400" />
              ) : (
                <div className="flex items-center gap-2">
                  <ChevronLeft size={18} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Collapse</span>
                </div>
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {visibleGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                {!sidebarCollapsed && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
                    {group.label}
                  </p>
                )}
                {sidebarCollapsed && groupIndex > 0 && (
                  <div className="border-t border-gray-100 my-3" />
                )}
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`
                    }
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <main
        className={`pt-16 h-full overflow-y-auto transition-all duration-300 ease-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <LogOut size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Sign Out?
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to sign out? You will need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}