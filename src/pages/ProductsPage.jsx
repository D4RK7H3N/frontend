import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ActionButton from '../components/ActionButton'
import StatusBadge from '../components/StatusBadge'
import { Search, Plus, Package, Edit, Trash2, Loader2, Download } from 'lucide-react'
import { financeAPI } from '../services/api'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ code: '', name: '', price: '', stock_quantity: '', category: '' })

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [search, products])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await financeAPI.getProducts()
      setProducts(data.results || data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || p.quantity || 0), 0)
  const lowStock = products.filter(p => (p.stock_quantity || p.quantity || 0) < 20).length

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage inventory and school supplies"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Inventory' }, { label: 'Products' }]}
        actions={
          <>
            <ActionButton icon={Download} variant="outline" size="sm">Export</ActionButton>
            <ActionButton icon={Plus} size="sm" onClick={() => setShowAdd(true)}>Add Product</ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
        <div className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Package size={16} sm:size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">{products.length}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total Products</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Package size={16} sm:size={20} className="text-green-600" /></div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">{totalStock}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Package size={16} sm:size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">{lowStock}</p>
              <p className="text-xs sm:text-sm text-gray-500">Low Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Package size={16} sm:size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">{totalStock > 0 ? 'In Stock' : 'Out'}</p>
              <p className="text-xs sm:text-sm text-gray-500">Status</p>
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-black/40 absolute inset-0" onClick={() => setShowAdd(false)} />
          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Product</h3>
            <div className="space-y-3">
              <input placeholder="Code" value={addForm.code} onChange={e => setAddForm({ ...addForm, code: e.target.value })} className="w-full px-3 py-2 border rounded" />
              <input placeholder="Product name" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="w-full px-3 py-2 border rounded" />
              <input placeholder="Category" value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })} className="w-full px-3 py-2 border rounded" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Price" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} className="w-full px-3 py-2 border rounded" />
                <input placeholder="Stock" value={addForm.stock_quantity} onChange={e => setAddForm({ ...addForm, stock_quantity: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <ActionButton variant="secondary" onClick={() => setShowAdd(false)}>Cancel</ActionButton>
              <ActionButton onClick={async () => {
                try {
                  const payload = { ...addForm, price: parseFloat(addForm.price || 0), stock_quantity: parseInt(addForm.stock_quantity || 0, 10) }
                  await financeAPI.createProduct(payload)
                  setShowAdd(false)
                  setAddForm({ code: '', name: '', price: '', stock_quantity: '', category: '' })
                  fetchProducts()
                } catch (err) {
                  console.error('Failed to add product', err)
                }
              }}>Save</ActionButton>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading products...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredProducts.map((product) => {
                  const stock = product.stock_quantity || product.quantity || 0
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{product.code || 'N/A'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name || 'N/A'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{product.category || 'N/A'}</td>
                      <td className="px-4 py-3 font-semibold">₱{parseFloat(product.price || 0).toLocaleString()}</td>
                      <td className={`px-4 py-3 font-semibold ${stock < 20 ? 'text-red-600' : 'text-gray-800'}`}>
                        {stock}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={stock === 0 ? 'low' : stock < 20 ? 'low' : 'active'} />
                      </td>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}