import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL } from '../api'

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

export default function ScheduledEvents(){
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [pets, setPets] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  const [formData, setFormData] = useState({
    pet_id: '',
    title: '',
    event_datetime: '',
    event_type: 'appointment',
    description: '',
    is_completed: false
  })

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadEvents()
  }, [currentPage, searchQuery])

  useEffect(() => {
    loadPets()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const skip = (currentPage - 1) * pageSize
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: pageSize.toString()
      })
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const url = `${API_BASE_URL}/scheduled-events/upcoming?${params}`
      console.log('Loading events from:', url)
      console.log('Search query:', searchQuery)
      console.log('Token present:', !!localStorage.getItem('hiday_pet_token'))

      const response = await fetchWithAuth(url)
      console.log('Response status:', response.status)
      console.log('Response data:', response)
      setEvents(response.data || [])
      setTotal(response.total || 0)
    } catch (e) {
      console.error('Load events error:', e)
      setError('Không thể tải danh sách lịch hẹn: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadPets = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/pets/?skip=0&limit=1000`)
      setPets(response.data || [])
    } catch (e) {
      console.error('load pets', e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const url = editingEvent
        ? `${API_BASE_URL}/scheduled-events/${editingEvent.id}`
        : `${API_BASE_URL}/scheduled-events/for-pet/${formData.pet_id}`
      const method = editingEvent ? 'PUT' : 'POST'

      const data = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          event_datetime: formData.event_datetime // Gửi trực tiếp string từ input datetime-local
        })
      })

      await loadEvents()
      setShowAddModal(false)
      setEditingEvent(null)
      resetForm()
    } catch (e) {
      setError('Không thể lưu lịch hẹn')
      console.error('save event', e)
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      pet_id: event.pet_id || '',
      title: event.title || '',
      event_datetime: event.event_datetime ? new Date(event.event_datetime).toISOString().slice(0, 16) : '',
      event_type: event.event_type || 'appointment',
      description: event.description || '',
      is_completed: event.is_completed || false
    })
    setShowAddModal(true)
  }

  const handleDelete = async (eventOrId) => {
    // Accept either an event object or an id string. Resolve the id robustly.
    const resolvedId = typeof eventOrId === 'string'
      ? eventOrId
      : eventOrId?.id || eventOrId?._id || (eventOrId?._id && eventOrId._id.$oid) || null

    if (!resolvedId) {
      console.error('handleDelete: missing event id', eventOrId)
      setError('Không thể xóa: ID lịch hẹn không xác định')
      return
    }

    if (!confirm('Bạn có chắc muốn xóa lịch hẹn này?')) return

    try {
      await fetchWithAuth(`${API_BASE_URL}/scheduled-events/${resolvedId}`, {
        method: 'DELETE'
      })
      await loadEvents()
    } catch (e) {
      setError('Không thể xóa lịch hẹn')
      console.error('delete event', e)
    }
  }

  const resetForm = () => {
    setFormData({
      pet_id: '',
      title: '',
      event_datetime: '',
      event_type: 'appointment',
      description: '',
      is_completed: false
    })
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingEvent(null)
    resetForm()
  }

  const handleSearch = () => {
    console.log('Handle search clicked, search input:', search)
    setSearchQuery(search)
    setCurrentPage(1)
    console.log('Set searchQuery to:', search)
  }

  const handleClearSearch = () => {
    setSearch('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(total / pageSize)

  const getEventTypeLabel = (type) => {
    const labels = {
      appointment: 'Lịch hẹn',
      medication: 'Uống thuốc',
      feeding: 'Cho ăn',
      activity: 'Hoạt động'
    }
    return labels[type] || type
  }

  const getEventTypeColor = (type) => {
    const colors = {
      appointment: 'blue',
      medication: 'red',
      feeding: 'green',
      activity: 'purple'
    }
    return colors[type] || 'gray'
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">Quản lý lịch hẹn</h1>
            <p className="text-gray-600 text-sm sm:text-base">Quản lý lịch hẹn và sự kiện cho thú cưng</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <i className="fas fa-plus"/>
            Thêm lịch hẹn
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
            <h2 className="text-xl font-semibold text-gray-800">Danh sách lịch hẹn</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sự kiện..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"/>
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-search"/>
                    <span>Tìm kiếm</span>
                  </>
                )}
              </button>
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <i className="fas fa-times"/>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sự kiện</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Thú cưng</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Thời gian</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Trạng thái</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 sm:px-6 py-4"><Skeleton className="h-4 w-24"/></td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-32"/></td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell"><Skeleton className="h-4 w-28"/></td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell"><Skeleton className="h-8 w-16"/></td>
                    <td className="px-3 sm:px-6 py-4"><Skeleton className="h-8 w-16"/></td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr key="no-events">
                  <td colSpan="5" className="px-3 sm:px-6 py-12 text-center text-gray-500">
                    {searchQuery ? `Không tìm thấy lịch hẹn nào với từ khóa "${searchQuery}"` : 'Chưa có lịch hẹn nào'}
                  </td>
                </tr>
              ) : (
                events.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold mr-2 sm:mr-3">
                          <i className="fas fa-calendar text-xs sm:text-sm"/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{event.title}</div>
                          <div className="text-sm text-gray-500 truncate">{event.description}</div>
                          <div className="sm:hidden text-xs text-gray-400 mt-1">
                            <Badge tone={getEventTypeColor(event.event_type)} className="mr-2">
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                            {new Date(event.event_datetime).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm text-gray-900">{event.pet_name || 'N/A'}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {new Date(event.event_datetime).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                      <Badge tone={event.is_completed ? 'green' : 'yellow'}>
                        {event.is_completed ? 'Hoàn thành' : 'Chưa hoàn thành'}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Sửa"
                        >
                          <i className="fas fa-edit"/>
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
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
            Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, total)} của {total} lịch hẹn
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <i className="fas fa-chevron-left"/>
            </button>

            {(() => {
              const pages = []
              const showPages = 5
              let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
              let endPage = Math.min(totalPages, startPage + showPages - 1)

              if (endPage - startPage + 1 < showPages) {
                startPage = Math.max(1, endPage - showPages + 1)
              }

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
        title={editingEvent ? "Sửa lịch hẹn" : "Thêm lịch hẹn mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn thú cưng</label>
            <select
              value={formData.pet_id}
              onChange={(e) => setFormData({...formData, pet_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Chọn thú cưng</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} - {pet.species} ({pet.owner_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề sự kiện</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
              <input
                type="datetime-local"
                value={formData.event_datetime}
                onChange={(e) => setFormData({...formData, event_datetime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại sự kiện</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="appointment">Lịch hẹn</option>
                <option value="medication">Uống thuốc</option>
                <option value="feeding">Cho ăn</option>
                <option value="activity">Hoạt động</option>
              </select>
            </div>
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_completed"
              checked={formData.is_completed}
              onChange={(e) => setFormData({...formData, is_completed: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_completed" className="ml-2 block text-sm text-gray-900">
              Đã hoàn thành
            </label>
          </div>

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
              {editingEvent ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}