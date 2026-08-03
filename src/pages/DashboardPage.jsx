import { useState, useEffect, useRef } from 'react'
import PageHeader from '../components/PageHeader'
import { studentsAPI, financeAPI } from '../services/api'
import { cachedFetch } from '../utils/cache'
import { Link } from 'react-router-dom'
import { Users, Receipt, TrendingUp, CheckCircle, Clock, ArrowRight, UserPlus, BookOpen, CreditCard } from 'lucide-react'
import PesoSign from '../components/PesoSign'

const statCards = [
  { label: 'Total Students', key: 'totalStudents', icon: Users, color: 'blue', prefix: '', suffix: '' },
  { label: 'Pending Payments', key: 'pendingPayments', icon: Clock, color: 'red', prefix: '', suffix: '' },
  { label: 'Total Income Today', key: 'todayIncome', icon: PesoSign, color: 'green', prefix: '₱', suffix: '' },
  { label: 'Total Income This Month', key: 'monthlyIncome', icon: TrendingUp, color: 'purple', prefix: '₱', suffix: '' },
]

const colorMap = {
  blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', icon: 'text-blue-600', border: 'border-blue-200' },
  red: { bg: 'bg-red-50', iconBg: 'bg-red-100', icon: 'text-red-600', border: 'border-red-200' },
  green: { bg: 'bg-green-50', iconBg: 'bg-green-100', icon: 'text-green-600', border: 'border-green-200' },
  purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', icon: 'text-purple-600', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', icon: 'text-orange-600', border: 'border-orange-200' },
  cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', icon: 'text-cyan-600', border: 'border-cyan-200' },
}

const quickActions = [
  { label: 'Enroll Student', icon: UserPlus, color: 'blue', link: '/enroll' },
  { label: 'Record Payment', icon: CreditCard, color: 'green', link: '/cashier' },
  { label: 'View Students', icon: BookOpen, color: 'purple', link: '/students' },
]

const StatCard = ({ stat, value, loading, isCurrency }) => {
  const colors = colorMap[stat.color] || colorMap.blue
  const display = loading
    ? null
    : `${stat.prefix || ''}${typeof value === 'number' ? value.toLocaleString() : value}${stat.suffix || ''}`

  return (
    <div className="relative overflow-hidden bg-white p-4 sm:p-5 group hover:shadow-md transition-shadow duration-300 border border-gray-100">
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
        <stat.icon size={80} className={colors.icon} />
      </div>
      <div className="relative">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.iconBg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
          <stat.icon size={20} className={colors.icon} />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-0.5 min-h-[2.25rem] flex items-center">
          {loading ? (
            <span className="inline-block w-16 h-7 bg-gray-100 rounded animate-pulse" />
          ) : (
            display
          )}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">{stat.label}</p>
      </div>
    </div>
  )
}

const TransactionSkeleton = () => (
  <div className="divide-y divide-gray-50">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="px-5 py-3.5 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-gray-100 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-2 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
)

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingPayments: 0,
    todayIncome: 0,
    monthlyIncome: 0,
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState({
    students: true,
    pending: true,
    revenue: true,
    transactions: true,
  })
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    fetchAll()
    return () => { mountedRef.current = false }
  }, [])

  const setLoad = (key, val) => {
    if (!mountedRef.current) return
    setLoading(prev => ({ ...prev, [key]: val }))
  }

  const fetchAll = async () => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const today = `${yyyy}-${mm}-${dd}`
    const currentMonth = `${yyyy}-${mm}`

    cachedFetch('dashboard:students:stats', () => studentsAPI.getStats(), 60_000)
      .then(data => {
        if (!mountedRef.current) return
        setStats(prev => ({ ...prev, totalStudents: data?.total_students ?? 0 }))
        setLoad('students', false)
      })
      .catch(() => setLoad('students', false))

    cachedFetch('dashboard:revenue', () => financeAPI.getRevenue(), 30_000)
      .then(data => {
        if (!mountedRef.current) return
        const list = Array.isArray(data?.revenue) ? data.revenue : []
        const todayTotal = list
          .filter(t => (t.date || t.created_at || '').startsWith(today))
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
        const monthTotal = list
          .filter(t => (t.date || t.created_at || '').startsWith(currentMonth))
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
        setStats(prev => ({ ...prev, todayIncome: todayTotal, monthlyIncome: monthTotal }))

        const deduped = Array.from(new Map(list.map(p => [p.id, p])).values())
        const recent = deduped
          .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
          .slice(0, 6)
          .map(p => ({
            id: p.id,
            student: p.customer || p.student_name || p.name || 'N/A',
            type: p.type || p.payment_type || 'Payment',
            amount: `₱${(parseFloat(p.amount) || 0).toLocaleString()}`,
            status: p.status || 'completed',
            date: (p.date || p.created_at || p.payment_date || '').split('T')[0] || today,
            source: p.type || 'General',
          }))
        setTransactions(recent)
        setLoad('revenue', false)
        setLoad('transactions', false)
      })
      .catch(() => {
        setLoad('revenue', false)
        setLoad('transactions', false)
      })

    cachedFetch('dashboard:pending', () => financeAPI.getPending(), 30_000)
      .then(data => {
        if (!mountedRef.current) return
        const list = Array.isArray(data) ? data : (data?.results || [])
        setStats(prev => ({ ...prev, pendingPayments: list.length }))
        setLoad('pending', false)
      })
      .catch(() => setLoad('pending', false))
  }

  const sourceBadge = (source) => {
    const map = {
      'Tuition': 'bg-blue-100 text-blue-700',
      'Miscellaneous': 'bg-green-100 text-green-700',
      'Laboratory': 'bg-purple-100 text-purple-700',
      'Assessment': 'bg-orange-100 text-orange-700',
      'Dorm': 'bg-cyan-100 text-cyan-700',
      'Tour': 'bg-pink-100 text-pink-700',
      'Graduation': 'bg-indigo-100 text-indigo-700',
    }
    return map[source] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Administrator"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((stat) => {
          const isRevenue = stat.key === 'todayIncome' || stat.key === 'monthlyIncome'
          const loadKey = isRevenue ? 'revenue' : (stat.key === 'totalStudents' ? 'students' : 'pending')
          return (
            <StatCard
              key={stat.key}
              stat={stat}
              value={stats[stat.key]}
              loading={loading[loadKey]}
            />
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="lg:col-span-2 bg-white overflow-hidden border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Recent Transactions</h3>
            <Link to="/revenue" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {loading.transactions ? (
            <TransactionSkeleton />
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Receipt size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No transactions yet</p>
              <p className="text-gray-400 text-sm mt-1">Payments will appear here once recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <th className="px-5 py-3">Payer</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Source</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs sm:text-sm">
                  {transactions.map((txn, idx) => (
                    <tr key={`${txn.id ?? 'row'}-${idx}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {txn.student?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-800 truncate max-w-[120px]">{txn.student}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${sourceBadge(txn.source)}`}>{txn.source}</span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{txn.amount}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          txn.status === 'completed' || txn.status === 'paid' || txn.status === 'cleared'
                            ? 'bg-green-50 text-green-600 border-green-100'
                            : txn.status === 'pending' || txn.status === 'unpaid'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                          {txn.status === 'completed' || txn.status === 'paid' || txn.status === 'cleared'
                            ? <CheckCircle size={10} />
                            : <Clock size={10} />}
                          <span className="hidden sm:inline capitalize">{txn.status}</span>
                          <span className="sm:hidden">{txn.status === 'pending' ? 'Pend' : 'Comp'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 hidden md:table-cell">{txn.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">Quick Actions</h3>
            <div className="space-y-2.5">
              {quickActions.map((action, index) => {
                const colors = colorMap[action.color] || colorMap.blue
                return (
                  <Link
                    key={index}
                    to={action.link}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className={`w-9 h-9 ${colors.iconBg} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <action.icon size={16} className={colors.icon} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    <ArrowRight size={14} className="ml-auto text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="bg-white p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Database</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Pending Approvals</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stats.pendingPayments > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                }`}>
                  {loading.pending ? (
                    <span className="inline-block w-6 h-3 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    stats.pendingPayments
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">School Year</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">2025-2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
