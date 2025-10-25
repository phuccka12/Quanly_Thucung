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

export default function Services(){
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // Số items per page

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    category: '',
    image_url: ''
  })

  useEffect(() => {
    loadServices()
  }, [currentPage, search])

  const loadServices = async () => {
    setLoading(true)
    try {
      const skip = (currentPage - 1) * pageSize
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: pageSize.toString()
      })
      if (search) params.append('search', search)

      const response = await fetchWithAuth(`${API_BASE_URL}/services/paginated?${params}`)
      console.log('loadServices response:', response)
      console.log('services data:', response.data)
      if (response.data && response.data.length > 0) {
        console.log('first service:', response.data[0], 'id:', response.data[0].id, 'type:', typeof response.data[0].id)
      }
      setServices(response.data || [])
      setTotal(response.total || 0)
    } catch (e) {
      setError('Không thể tải danh sách dịch vụ')
      console.error('load services', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingService && !editingService.id) {
        throw new Error('Service ID is missing')
      }

      const serviceIdStr = editingService ? String(editingService.id) : null
      const url = editingService
        ? `${API_BASE_URL}/services/${serviceIdStr}`
        : `${API_BASE_URL}/services`
      const method = editingService ? 'PUT' : 'POST'

      const data = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          duration_minutes: parseInt(formData.duration_minutes) || 0
        })
      })

      await loadServices()
      setShowAddModal(false)
      setEditingService(null)
      resetForm()
    } catch (e) {
      setError('Không thể lưu dịch vụ')
      console.error('save service', e)
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price?.toString() || '',
      duration_minutes: service.duration_minutes?.toString() || '',
      category: service.category || '',
      image_url: service.image_url || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = async (serviceId) => {
    const idStr = String(serviceId)
    console.log('handleDelete called with serviceId:', serviceId, 'type:', typeof serviceId, 'stringified:', idStr)
    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return

    try {
      await fetchWithAuth(`${API_BASE_URL}/services/${idStr}`, {
        method: 'DELETE'
      })
      await loadServices()
    } catch (e) {
      setError('Không thể xóa dịch vụ')
      console.error('delete service', e)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
      category: '',
      image_url: ''
    })
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingService(null)
    resetForm()
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1) // Reset về trang 1 khi search
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Quản lý dịch vụ</h1>
            <p className="text-gray-600">Quản lý các dịch vụ chăm sóc thú cưng</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <i className="fas fa-plus"/>
            Thêm dịch vụ
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
            <h2 className="text-xl font-semibold text-gray-800">Danh sách dịch vụ</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên dịch vụ..."
                value={search}
                onChange={handleSearch}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
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
              ) : services.length === 0 ? (
                <tr key="no-services">
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Chưa có dịch vụ nào
                  </td>
                </tr>
              ) : (
                services.map(service => (
                  <tr key={String(service.id)} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {service.image_url ? (
                          <img
                            src={service.image_url.startsWith('http') ? service.image_url : `${BASE_URL}${service.image_url}`}
                            alt={service.name}
                            className="w-12 h-12 rounded-lg object-cover mr-3 border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-semibold mr-3">
                            <i className="fas fa-concierge-bell"/>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500">{service.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone="blue">{service.category}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {service.duration_minutes} phút
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Sửa"
                        >
                          <i className="fas fa-edit"/>
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
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
            Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, total)} của {total} dịch vụ
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
        title={editingService ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên dịch vụ</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                required
              />
            </div>
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
              <option value="Chăm sóc">Chăm sóc</option>
              <option value="Spa">Spa</option>
              <option value="Khám chữa bệnh">Khám chữa bệnh</option>
              <option value="Tiêm phòng">Tiêm phòng</option>
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
              {editingService ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}