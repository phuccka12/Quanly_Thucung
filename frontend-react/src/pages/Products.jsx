import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL, BASE_URL } from '../api'
import ImageUpload from '../components/ImageUpload'

const Skeleton = ({className=''}) => (
  <div className={`animate-pulse rounded bg-gray-100 ${className}`} />
)

const Badge = ({tone='gray', children}) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${tone}-100 text-${tone}-700`}>{children}</span>
)

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"/>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Products(){
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // items per page

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: '',
    image_url: ''
  })

  useEffect(() => {
    loadProducts()
  }, [currentPage, search])

  // listen for global navigateToSearch events from Topbar
  useEffect(()=>{
    const handler = (e)=>{
      const d = e.detail || {}
      if (d.category === 'products' && typeof d.search === 'string'){
        setSearch(d.search)
        setCurrentPage(1)
      }
    }
    window.addEventListener('navigateToSearch', handler)
    return ()=> window.removeEventListener('navigateToSearch', handler)
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const skip = (currentPage - 1) * pageSize
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: pageSize.toString()
      })
      if (search) params.append('search', search)

      const response = await fetchWithAuth(`${API_BASE_URL}/products/paginated?${params}`)
      setProducts(response.data || [])
      setTotal(response.total || 0)
    } catch (e) {
      setError('Không thể tải danh sách sản phẩm')
      console.error('load products', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingProduct && !editingProduct.id) {
        throw new Error('Product ID is missing')
      }

      const productIdStr = editingProduct ? String(editingProduct.id) : null
      const url = editingProduct
        ? `${API_BASE_URL}/products/${productIdStr}`
        : `${API_BASE_URL}/products`
      const method = editingProduct ? 'PUT' : 'POST'

      await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          stock_quantity: parseInt(formData.stock_quantity) || 0
        })
      })

      await loadProducts()
      setShowAddModal(false)
      setEditingProduct(null)
      resetForm()
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Sản phẩm đã được lưu', type: 'update' } })) }catch(e){}
    } catch (e) {
      setError('Không thể lưu sản phẩm')
      console.error('save product', e)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Lưu sản phẩm thất bại', type: 'error' } })) }catch(e){}
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      category: product.category || '',
      image_url: product.image_url || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = async (productId) => {
    const idStr = String(productId)
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return

    try {
      await fetchWithAuth(`${API_BASE_URL}/products/${idStr}`, { method: 'DELETE' })
      await loadProducts()
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã xóa sản phẩm', type: 'delete' } })) }catch(e){}
    } catch (e) {
      setError('Không thể xóa sản phẩm')
      console.error('delete product', e)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Xóa sản phẩm thất bại', type: 'error' } })) }catch(e){}
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      category: '',
      image_url: ''
    })
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingProduct(null)
    resetForm()
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">Quản lý sản phẩm</h1>
            <p className="text-gray-600 text-sm sm:text-base">Quản lý kho hàng và thông tin sản phẩm</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <i className="fas fa-plus"/>
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Danh sách sản phẩm</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm..."
                value={search}
                onChange={handleSearch}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Danh mục</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Giá</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Tồn kho</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24"/></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32"/></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28"/></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16"/></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16"/></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr key="no-products">
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Chưa có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={String(product.id)} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url.startsWith('http') ? product.image_url : `${BASE_URL}${product.image_url}`}
                            alt={product.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mr-2 sm:mr-3 border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-semibold mr-2 sm:mr-3">
                            <i className="fas fa-box"/>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate">{product.description}</div>
                          {/* Mobile: Show additional info */}
                          <div className="sm:hidden text-xs text-gray-400 mt-1">
                            <Badge tone="blue" className="mr-2">{product.category}</Badge>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                          </div>
                          <div className="sm:hidden text-xs text-gray-400">
                            Tồn kho: {product.stock_quantity}
                            {product.stock_quantity <= 10 && <span className="ml-1 text-red-600">⚠️ Thấp</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <Badge tone="blue">{product.category}</Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {product.stock_quantity}
                        {product.stock_quantity <= 10 && (
                          <span className="ml-2 text-red-600 text-xs">⚠️ Thấp</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Sửa"
                        >
                          <i className="fas fa-edit"/>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Xóa"
                        >
                          <i className="fas fa-trash"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, total)} của {total} sản phẩm
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <i className="fas fa-chevron-left"/>
            </button>

            {/* Page numbers with smart display */}
            {(() => {
              const pages = []
              const showPages = 5
              let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
              let endPage = Math.min(totalPages, startPage + showPages - 1)

              // Adjust start if we're near the end
              if (endPage - startPage + 1 < showPages) {
                startPage = Math.max(1, endPage - showPages + 1)
              }

              // Add first page and ellipsis if needed
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    1
                  </button>
                )
                if (startPage > 2) {
                  pages.push(
                    <span key="start-ellipsis" className="px-2 py-1 text-gray-500">...</span>
                  )
                }
              }

              // Add page numbers
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 border rounded text-sm ${
                      i === currentPage
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i}
                  </button>
                )
              }

              // Add last page and ellipsis if needed
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="end-ellipsis" className="px-2 py-1 text-gray-500">...</span>
                  )
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                )
              }

              return pages
            })()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <i className="fas fa-chevron-right"/>
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={closeModal}
        title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                step="1000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn kho</label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Chọn danh mục</option>
              <option value="Thức ăn">Thức ăn</option>
              <option value="Phụ kiện">Phụ kiện</option>
              <option value="Đồ chơi">Đồ chơi</option>
              <option value="Chăm sóc">Chăm sóc</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({...formData, image_url: url})}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              {editingProduct ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}