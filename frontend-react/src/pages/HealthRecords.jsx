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
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
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

const formatDate = (dateString) => {
  try {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('vi-VN')
  } catch (e) {
    return '-'
  }
}

const getRecordTypeLabel = (type) => {
  const labels = {
    vaccination: 'Tiêm chủng',
    vet_visit: 'Khám bệnh',
    weight_check: 'Cân nặng',
    medication: 'Dùng thuốc'
  }
  return labels[type] || type
}

const getRecordTypeColor = (type) => {
  const colors = {
    vaccination: 'green',
    vet_visit: 'blue',
    weight_check: 'purple',
    medication: 'red'
  }
  return colors[type] || 'gray'
}

export default function HealthRecords(){
  // Normalize record coming from backend (some responses use `_id`)
  const normalizeRecord = (r) => {
    if (!r) return r
    const id = r.id || r._id || (r._id && (r._id.$oid || r._id['$oid']))
    return { ...r, id }
  }
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [pets, setPets] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [selectedPet, setSelectedPet] = useState('')

  const [formData, setFormData] = useState({
    record_type: 'vet_visit',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
    next_due_date: '',
    weight_kg: '',
    used_products: [],
    used_services: []
  })

  useEffect(() => {
    const token = localStorage.getItem('hiday_pet_token')
    if (token) {
      loadPets()
      loadProducts()
      loadServices()
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('hiday_pet_token')
    if (token && selectedPet) {
      loadRecordsForPet(selectedPet)
    } else {
      setRecords([])
    }
  }, [selectedPet])

  useEffect(() => {
    const handleTokenChange = () => {
      const token = localStorage.getItem('hiday_pet_token')
      if (token) {
        loadPets()
        loadProducts()
        loadServices()
        if (selectedPet) {
          loadRecordsForPet(selectedPet)
        }
      } else {
        setPets([])
        setProducts([])
        setServices([])
        setRecords([])
      }
    }

    window.addEventListener('tokenChanged', handleTokenChange)
    return () => window.removeEventListener('tokenChanged', handleTokenChange)
  }, [selectedPet])

  const loadPets = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/pets/?skip=0&limit=1000`)
      setPets(response.data || [])
    } catch (e) {
      console.error('load pets', e)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/products/paginated?skip=0&limit=1000`)
      setProducts(response.data || [])
    } catch (e) {
      console.error('load products', e)
    }
  }

  const loadServices = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/services/paginated?skip=0&limit=1000`)
      setServices(response.data || [])
    } catch (e) {
      console.error('load services', e)
    }
  }

  const loadRecordsForPet = async (petId) => {
    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/health-records/for-pet/${petId}`)
      console.debug('loadRecordsForPet response:', response)
      // backend may return an array directly or an object with `data`.
      let raw = []
      if (Array.isArray(response)) {
        raw = response
      } else if (response && Array.isArray(response.data)) {
        raw = response.data
      } else {
        raw = response || []
      }

      // normalize each record so frontend can reliably use `record.id`
      const normalized = raw.map(normalizeRecord)
      setRecords(normalized)
    } catch (e) {
      setError('Không thể tải hồ sơ y tế')
      console.error('load records', e)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      record_type: 'vet_visit',
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
      next_due_date: '',
      weight_kg: '',
      used_products: [],
      used_services: []
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const url = editingRecord
        ? `${API_BASE_URL}/health-records/${editingRecord.id}`
        : `${API_BASE_URL}/health-records/for-pet/${selectedPet}`
      const method = editingRecord ? 'PUT' : 'POST'

      // Prepare payload: strip empty strings, convert numbers, and validate used items
      const payload = { ...formData }

      // strip empty string fields
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k]
      })

      // convert weight to number if present
      if (payload.weight_kg !== undefined) {
        const w = parseFloat(payload.weight_kg)
        if (Number.isFinite(w)) payload.weight_kg = w
        else delete payload.weight_kg
      }

      // normalize used_products: keep only valid entries
      if (Array.isArray(payload.used_products)) {
        payload.used_products = payload.used_products
          .map(up => ({
            product_id: up.product_id || '',
            quantity: parseInt(up.quantity) || 0,
            unit_price: parseFloat(up.unit_price) || 0
          }))
          .filter(up => up.product_id && up.quantity > 0 && up.unit_price > 0)
        if (payload.used_products.length === 0) delete payload.used_products
      }

      // normalize used_services: keep only valid entries
      if (Array.isArray(payload.used_services)) {
        payload.used_services = payload.used_services
          .map(us => ({ name: us.name?.trim?.() || '', price: parseFloat(us.price) || 0 }))
          .filter(us => us.name && us.price > 0)
        if (payload.used_services.length === 0) delete payload.used_services
      }

      // For update (PUT) the backend schema (HealthRecordUpdate) doesn't accept used_products/used_services
      // so remove them on PUT.
      if (method === 'PUT') {
        delete payload.used_products
        delete payload.used_services
      }

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      })

      if (selectedPet) {
        await loadRecordsForPet(selectedPet)
      }

      setShowAddModal(false)
      setEditingRecord(null)
      resetForm()
  try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Hồ sơ y tế đã được lưu', type: 'update' } })) }catch(e){}
    } catch (e) {
      setError('Không thể lưu hồ sơ y tế')
      console.error('submit record', e)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Lưu hồ sơ y tế thất bại', type: 'error' } })) }catch(e){}
    }
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setFormData({
      record_type: record.record_type,
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
      description: record.description,
      notes: record.notes || '',
      next_due_date: record.next_due_date ? new Date(record.next_due_date).toISOString().split('T')[0] : '',
      weight_kg: record.weight_kg || '',
      used_products: record.used_products || [],
      used_services: record.used_services || []
    })
    setShowAddModal(true)
  }

  const handleDelete = async (recordId) => {
    if (!confirm('Bạn có chắc muốn xóa hồ sơ y tế này?')) return

    try {
      await fetchWithAuth(`${API_BASE_URL}/health-records/${recordId}`, {
        method: 'DELETE'
      })

      if (selectedPet) {
        await loadRecordsForPet(selectedPet)
      }
  try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã xóa hồ sơ y tế', type: 'delete' } })) }catch(e){}
    } catch (e) {
      setError('Không thể xóa hồ sơ y tế')
      console.error('delete record', e)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Xóa hồ sơ y tế thất bại', type: 'error' } })) }catch(e){}
    }
  }

  const addUsedProduct = () => {
    setFormData({
      ...formData,
      used_products: [...formData.used_products, { product_id: '', quantity: 1, unit_price: 0 }]
    })
  }

  const updateUsedProduct = (index, field, value) => {
    const updated = [...formData.used_products]
    updated[index][field] = value
    setFormData({ ...formData, used_products: updated })
  }

  const removeUsedProduct = (index) => {
    setFormData({
      ...formData,
      used_products: formData.used_products.filter((_, i) => i !== index)
    })
  }

  const addUsedService = () => {
    setFormData({
      ...formData,
      used_services: [...formData.used_services, { name: '', price: 0 }]
    })
  }

  const updateUsedService = (index, field, value) => {
    const updated = [...formData.used_services]
    updated[index][field] = value
    setFormData({ ...formData, used_services: updated })
  }

  const removeUsedService = (index) => {
    setFormData({
      ...formData,
      used_services: formData.used_services.filter((_, i) => i !== index)
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">Hồ sơ y tế</h1>
            <p className="text-gray-600 text-sm sm:text-base">Quản lý hồ sơ y tế và chăm sóc thú cưng</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!selectedPet}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-plus"/>
            Thêm hồ sơ
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Pet Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Chọn thú cưng:</label>
          <select
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Chọn thú cưng --</option>
            {pets.map(pet => (
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {selectedPet ? `Hồ sơ y tế của ${pets.find(p => p.id === selectedPet)?.name || 'thú cưng'}` : 'Chọn thú cưng để xem hồ sơ'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20"/></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16"/></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32"/></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16"/></td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    {selectedPet ? 'Chưa có hồ sơ y tế nào' : 'Chọn thú cưng để xem hồ sơ y tế'}
                  </td>
                </tr>
              ) : (
                records.map((record, idx) => (
                  <tr key={record.id || record._id || `rec-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{formatDate(record.date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={getRecordTypeColor(record.record_type)}>
                        {getRecordTypeLabel(record.record_type)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 max-w-xs truncate">{record.description}</div>
                      {record.weight_kg && (
                        <div className="text-sm text-gray-500">Cân nặng: {record.weight_kg}kg</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <i className="fas fa-edit"/>
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-900"
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingRecord(null)
          resetForm()
        }}
        title={editingRecord ? 'Chỉnh sửa hồ sơ y tế' : 'Thêm hồ sơ y tế'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại bản ghi *</label>
              <select
                value={formData.record_type}
                onChange={(e) => setFormData({...formData, record_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="vet_visit">Khám bệnh</option>
                <option value="vaccination">Tiêm chủng</option>
                <option value="weight_check">Cân nặng</option>
                <option value="medication">Dùng thuốc</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cân nặng (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tái khám</label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({...formData, next_due_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="2"
            />
          </div>

          {/* Used Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Sản phẩm sử dụng</label>
              <button
                type="button"
                onClick={addUsedProduct}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Thêm sản phẩm
              </button>
            </div>
            {formData.used_products.map((product, index) => (
              <div key={index} className="flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                <select
                  value={product.product_id}
                  onChange={(e) => updateUsedProduct(index, 'product_id', e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">Chọn sản phẩm</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="SL"
                  value={product.quantity}
                  onChange={(e) => updateUsedProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="1"
                />
                <input
                  type="number"
                  placeholder="Giá"
                  value={product.unit_price}
                  onChange={(e) => updateUsedProduct(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => removeUsedProduct(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <i className="fas fa-times"/>
                </button>
              </div>
            ))}
          </div>

          {/* Used Services */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Dịch vụ sử dụng</label>
              <button
                type="button"
                onClick={addUsedService}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Thêm dịch vụ
              </button>
            </div>
            {formData.used_services.map((service, index) => (
              <div key={index} className="flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Tên dịch vụ"
                  value={service.name}
                  onChange={(e) => updateUsedService(index, 'name', e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Giá"
                  value={service.price}
                  onChange={(e) => updateUsedService(index, 'price', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => removeUsedService(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <i className="fas fa-times"/>
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                setEditingRecord(null)
                resetForm()
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              {editingRecord ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}