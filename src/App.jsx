import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useSchoolConfig } from './contexts/SchoolConfigContext'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const StudentsPage = lazy(() => import('./pages/StudentsPage'))
const SectionsPage = lazy(() => import('./pages/SectionsPage'))
const TracksPage = lazy(() => import('./pages/TracksPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const EnrollPage = lazy(() => import('./pages/EnrollPage'))
const DropoutsPage = lazy(() => import('./pages/DropoutsPage'))
const PromotionPage = lazy(() => import('./pages/PromotionPage'))
const CashierPage = lazy(() => import('./pages/CashierPage'))
const TuitionPage = lazy(() => import('./pages/TuitionPage'))
const RevenuePage = lazy(() => import('./pages/RevenuePage'))
const PendingPaymentsPage = lazy(() => import('./pages/PendingPaymentsPage'))
const SalesPage = lazy(() => import('./pages/SalesPage'))
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'))
const GraduationPage = lazy(() => import('./pages/GraduationPage'))
const ToursPage = lazy(() => import('./pages/ToursPage'))
const DormPage = lazy(() => import('./pages/DormPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SchoolConfigPage = lazy(() => import('./pages/SchoolConfigPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-xs">Loading page...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children
}

const routeTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/sections': 'Sections',
  '/tracks': 'Tracks',
  '/courses': 'Courses',
  '/enroll': 'Enrollment',
  '/dropouts': 'Dropouts',
  '/promotion': 'Promotion',
  '/cashier': 'Cashier',
  '/tuition': 'Tuition',
  '/revenue': 'Revenue',
  '/pending-payments': 'Pending Payments',
  '/sales': 'Sales',
  '/assessments': 'Assessments',
  '/graduation': 'Graduation',
  '/tours': 'Tours',
  '/dorm': 'Dormitory',
  '/settings': 'Settings',
  '/school-config': 'School Config',
  '/profile': 'Profile',
}

function TitleUpdater() {
  const location = useLocation()
  const { schoolName } = useSchoolConfig()

  useEffect(() => {
    const pageTitle = routeTitles[location.pathname] || 'Page'
    document.title = `${pageTitle} | ${schoolName}`
  }, [location.pathname, schoolName])

  return null
}

function App() {
  const { refetch } = useSchoolConfig()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      refetch()
    }
  }, [isAuthenticated, refetch])

  return (
    <>
      <TitleUpdater />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/students" element={<ProtectedRoute><MainLayout><StudentsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/sections" element={<ProtectedRoute><MainLayout><SectionsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/tracks" element={<ProtectedRoute><MainLayout><TracksPage /></MainLayout></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><MainLayout><CoursesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/enroll" element={<ProtectedRoute><MainLayout><EnrollPage /></MainLayout></ProtectedRoute>} />
          <Route path="/dropouts" element={<ProtectedRoute><MainLayout><DropoutsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/promotion" element={<ProtectedRoute><MainLayout><PromotionPage /></MainLayout></ProtectedRoute>} />
          <Route path="/cashier" element={<ProtectedRoute><MainLayout><CashierPage /></MainLayout></ProtectedRoute>} />
          <Route path="/tuition" element={<ProtectedRoute><MainLayout><TuitionPage /></MainLayout></ProtectedRoute>} />
          <Route path="/revenue" element={<ProtectedRoute><MainLayout><RevenuePage /></MainLayout></ProtectedRoute>} />
          <Route path="/pending-payments" element={<ProtectedRoute><MainLayout><PendingPaymentsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><MainLayout><SalesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute><MainLayout><AssessmentsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/graduation" element={<ProtectedRoute><MainLayout><GraduationPage /></MainLayout></ProtectedRoute>} />
          <Route path="/tours" element={<ProtectedRoute><MainLayout><ToursPage /></MainLayout></ProtectedRoute>} />
          <Route path="/dorm" element={<ProtectedRoute><MainLayout><DormPage /></MainLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><MainLayout><SettingsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/school-config" element={<ProtectedRoute><MainLayout><SchoolConfigPage /></MainLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App