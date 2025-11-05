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

export default function Pets(){
  const [loading, setLoading] = useState(true)
  const [pets, setPets] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPet, setEditingPet] = useState(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // Số items per page
  
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    image_url: ''
  })

  // helper: derive age (years) from date_of_birth and provide weight from weight_kg
  const normalizePet = (p) => {
    if (!p) return p
    const out = { ...p }
    // weight: prefer weight_kg field
    if (p.weight_kg !== undefined && p.weight_kg !== null) {
      out.weight = p.weight_kg
    } else if (p.weight !== undefined) {
      out.weight = p.weight
    }

    // age: derive from date_of_birth if present
    if (p.date_of_birth) {
      try {
        const dob = new Date(p.date_of_birth)
        const diff = Date.now() - dob.getTime()
        const age = Math.floor(new Date(diff).getUTCFullYear() - 1970)
        out.age = age
      } catch (e) {
        out.age = p.age || ''
      }
    } else {
      out.age = p.age || ''
    }

    // ensure id exists
    out.id = out.id || out._id || (out._id && (out._id.$oid || out._id['$oid']))
    return out
  }

  useEffect(() => {
    loadPets()
  }, [currentPage, search])

  // listen for global navigateToSearch events from Topbar
  useEffect(()=>{
    const handler = (e)=>{
      const d = e.detail || {}
      if (d.category === 'pets' && typeof d.search === 'string'){
        setSearch(d.search)
        setCurrentPage(1)
      }
    }
    window.addEventListener('navigateToSearch', handler)
    return ()=> window.removeEventListener('navigateToSearch', handler)
  }, [])

  const loadPets = async () => {
    setLoading(true)
    try {
      const skip = (currentPage - 1) * pageSize
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: pageSize.toString()
      })
      if (search) params.append('search', search)
      
  const response = await fetchWithAuth(`${API_BASE_URL}/pets/?${params}`)
  const raw = response.data || []
  setPets(raw.map(normalizePet))
      setTotal(response.total || 0)
    } catch (e) {
      setError('Không thể tải danh sách thú cưng')
      console.error('load pets', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const url = editingPet
        ? `${API_BASE_URL}/pets/${editingPet.id}`
        : `${API_BASE_URL}/pets/`
      const method = editingPet ? 'PUT' : 'POST'

      // prepare payload matching backend schema (date_of_birth, weight_kg)
      const payload = { ...formData }
      // convert weight -> weight_kg
      if (payload.weight !== undefined && payload.weight !== '') {
        const w = parseFloat(payload.weight)
        if (!Number.isNaN(w)) payload.weight_kg = w
      }
      delete payload.weight

      // convert age -> date_of_birth (approximate: subtract years)
      if (payload.age !== undefined && payload.age !== '') {
        const years = parseInt(payload.age)
        if (!Number.isNaN(years) && years > 0) {
          const now = new Date()
          const dob = new Date(now.getFullYear() - years, now.getMonth(), now.getDate())
          payload.date_of_birth = dob.toISOString().split('T')[0]
        }
      }
      delete payload.age

      const data = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      await loadPets()
      setShowAddModal(false)
      setEditingPet(null)
      resetForm()
  try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Thú cưng đã được lưu', type: 'update' } })) }catch(e){}
    } catch (e) {
      setError('Không thể lưu thú cưng')
      console.error('save pet', e)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Lưu thú cưng thất bại', type: 'error' } })) }catch(e){}
    }
  }

  const handleEdit = (pet) => {
    const norm = normalizePet(pet)
    setEditingPet(norm)
    setFormData({
      name: norm.name || '',
      species: norm.species || '',
      breed: norm.breed || '',
      age: norm.age?.toString() || '',
      weight: norm.weight?.toString() || '',
      owner_name: norm.owner_name || '',
      owner_email: norm.owner_email || '',
      owner_phone: norm.owner_phone || '',
      image_url: norm.image_url || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = async (petId) => {
    if (!confirm('Bạn có chắc muốn xóa thú cưng này?')) return

    try {
      await fetchWithAuth(`${API_BASE_URL}/pets/${petId}`, {
        method: 'DELETE'
      })
      await loadPets()
  try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã xóa thú cưng', type: 'delete' } })) }catch(e){}
    } catch (e) {
      setError('Không thể xóa thú cưng')
      console.error('delete pet', e)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Xóa thú cưng thất bại', type: 'error' } })) }catch(e){}
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      species: '',
      breed: '',
      age: '',
      weight: '',
      owner_name: '',
      owner_email: '',
      owner_phone: '',
      image_url: ''
    })
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingPet(null)
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">Quản lý thú cưng</h1>
            <p className="text-gray-600 text-sm sm:text-base">Quản lý hồ sơ thú cưng và thông tin chủ nuôi</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <i className="fas fa-plus"/>
            Thêm thú cưng
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
            <h2 className="text-xl font-semibold text-gray-800">Danh sách thú cưng</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên thú cưng hoặc chủ nuôi..."
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
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thú cưng</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Thông tin</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Chủ nuôi</th>
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
                    <td className="px-3 sm:px-6 py-4"><Skeleton className="h-8 w-16"/></td>
                  </tr>
                ))
              ) : pets.length === 0 ? (
                <tr key="no-pets">
                  <td colSpan="4" className="px-3 sm:px-6 py-12 text-center text-gray-500">
                    Chưa có thú cưng nào
                  </td>
                </tr>
              ) : (
                pets.map(pet => (
                  <tr key={pet.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        {pet.image_url ? (
                          <img
                            src={pet.image_url.startsWith('http') ? pet.image_url : `${BASE_URL}${pet.image_url}`}
                            alt={pet.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover mr-2 sm:mr-3 border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold mr-2 sm:mr-3 text-xs sm:text-sm">
                            {pet.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{pet.name}</div>
                          <div className="text-sm text-gray-500 truncate">{pet.species}</div>
                          {/* Mobile: Show additional info */}
                          <div className="sm:hidden text-xs text-gray-400 mt-1">
                            {pet.breed} • {pet.age} tuổi • {pet.weight}kg
                          </div>
                          <div className="sm:hidden text-xs text-gray-400">
                            {pet.owner_name} • {pet.owner_phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                      <div className="text-sm text-gray-900">{pet.breed}</div>
                      <div className="text-sm text-gray-500">{pet.age} tuổi • {pet.weight}kg</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-gray-900">{pet.owner_name}</div>
                      <div className="text-sm text-gray-500">{pet.owner_email}</div>
                      <div className="text-sm text-gray-500">{pet.owner_phone}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(pet)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Sửa"
                        >
                          <i className="fas fa-edit"/>
                        </button>
                        <button
                          onClick={() => handleDelete(pet.id)}
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
            Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, total)} của {total} thú cưng
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
        title={editingPet ? "Sửa thú cưng" : "Thêm thú cưng mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên thú cưng</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loài</label>
              <select
                value={formData.species}
                onChange={(e) => setFormData({...formData, species: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Chọn loài</option>
                <option value="Chó">Chó</option>
                <option value="Mèo">Mèo</option>
                <option value="Chim">Chim</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giống</label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({...formData, breed: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cân nặng (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ nuôi</label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email chủ nuôi</label>
            <input
              type="email"
              value={formData.owner_email}
              onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="tel"
              value={formData.owner_phone}
              onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              {editingPet ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}