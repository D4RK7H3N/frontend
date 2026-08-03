import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { financeAPI } from '../services/api'
import { Search, Plus, ShoppingCart, Edit, Trash2, Loader2, Download } from 'lucide-react'

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filteredSales, setFilteredSales] = useState([])

  useEffect(() => {
    fetchSales()
  }, [])

  useEffect(() => {
    const filtered = sales.filter(s =>
      s.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.id?.toString().includes(search)
    )
    setFilteredSales(filtered)
  }, [search, sales])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const data = await financeAPI.getSales()
      setSales(data.results || data || [])
    } catch (err) {
      console.error('Error fetching sales:', err)
    } finally {
      setLoading(false)
    }
  }

  const todayTotal = sales
    .filter(s => s.sale_date === new Date().toISOString().split('T')[0])
    .reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)

  const weekTotal = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Point-of-sale transactions"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Finance' }, { label: 'Sales' }]}
        actions={
          <ActionButton icon={ShoppingCart} size="sm">New Sale</ActionButton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
        <div className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart size={16} sm:size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">₱{todayTotal.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500">Today's Sales</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><ShoppingCart size={16} sm:size={20} className="text-green-600" /></div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">₱{weekTotal.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total Sales</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><ShoppingCart size={16} sm:size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">{sales.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Transactions</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><ShoppingCart size={16} sm:size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">{sales.filter(s => s.status === 'refunded').length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Refunded</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <ActionButton icon={Download} variant="secondary" size="md">Export</ActionButton>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading sales...</span>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No sales found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Buyer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">SALE-{sale.id}</td>
                    <td className="px-4 py-3 text-gray-500">{sale.sale_date || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{sale.items_summary || sale.items?.map(i => i.product_name).join(', ') || 'N/A'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 hidden sm:table-cell">{sale.buyer_name || 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">₱{parseFloat(sale.total_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={sale.status || 'completed'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded touch-manipulation">
                          <Edit size={16} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded touch-manipulation">
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}