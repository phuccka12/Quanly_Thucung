import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchWithAuth, BASE_URL } from '../api'
import ImageUpload from '../components/ImageUpload'
import Modal from '../components/Modal'

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold text-gray-900">{value ?? '-'}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

export default function PortalPetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [events, setEvents] = useState([])
  const [records, setRecords] = useState([])
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [recordForm, setRecordForm] = useState({ record_type: 'vet_visit', date: new Date().toISOString().split('T')[0], description: '', notes: '', weight_kg: '', next_due_date: '', used_products: [], used_services: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [form, setForm] = useState({ name: '', species: '', breed: '', age: '', weight: '', image_url: '' })
  const [newEvent, setNewEvent] = useState({ title: '', event_datetime: '', event_type: 'appointment', description: '' })

  const formatDateTimeVN = (iso) => {
    if (!iso) return '-'
    try{
      const d = new Date(iso)
      const time = d.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
      const date = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })
      return `${time} · ${date} (GMT+7)`
    }catch(e){ return iso }
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

  const addUsedProduct = () => {
    setRecordForm({ ...recordForm, used_products: [...(recordForm.used_products || []), { product_id: '', quantity: 1, unit_price: 0 }] })
  }

  const updateUsedProduct = (index, field, value) => {
    const updated = [...(recordForm.used_products || [])]
    updated[index] = { ...updated[index], [field]: value }
    setRecordForm({ ...recordForm, used_products: updated })
  }

  const removeUsedProduct = (index) => {
    setRecordForm({ ...recordForm, used_products: (recordForm.used_products || []).filter((_, i) => i !== index) })
  }

  const addUsedService = () => {
    setRecordForm({ ...recordForm, used_services: [...(recordForm.used_services || []), { name: '', price: 0 }] })
  }

  const updateUsedService = (index, field, value) => {
    const updated = [...(recordForm.used_services || [])]
    updated[index] = { ...updated[index], [field]: value }
    setRecordForm({ ...recordForm, used_services: updated })
  }

  const removeUsedService = (index) => {
    setRecordForm({ ...recordForm, used_services: (recordForm.used_services || []).filter((_, i) => i !== index) })
  }

  const getVNMinForInput = () => {
    // return YYYY-MM-DDTHH:MM for current VN local time
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const vn = new Date(utc + 7 * 3600 * 1000)
    const pad = (n) => String(n).padStart(2, '0')
    const yyyy = vn.getFullYear()
    const mm = pad(vn.getMonth() + 1)
    const dd = pad(vn.getDate())
    const hh = pad(vn.getHours())
    const min = pad(vn.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }

  useEffect(() => { load() }, [id])

  const load = async () => {
    setLoading(true)
    try {
      const p = await fetchWithAuth(`/portal/pets/${id}`)
      // helper: compute age in years from a date string (safe)
      const computeAgeFromDOB = (dob) => {
        if (!dob) return undefined
        const d = new Date(dob)
        if (isNaN(d.getTime())) return undefined
        const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        return Number.isFinite(years) ? years : undefined
      }

      const petNorm = { ...p }
      // prefer date_of_birth-derived age, otherwise use provided age (coerce to number)
      const ageFromDob = computeAgeFromDOB(petNorm.date_of_birth)
      petNorm.age = (ageFromDob !== undefined) ? ageFromDob : ((petNorm.age !== undefined && petNorm.age !== null) ? Number(petNorm.age) : undefined)
      // normalize weight
      petNorm.weight = petNorm.weight_kg ?? petNorm.weight

      setPet(petNorm)
      setForm({ name: petNorm.name || '', species: petNorm.species || '', breed: petNorm.breed || '', age: petNorm.age ?? '', weight: petNorm.weight ?? '', image_url: petNorm.image_url || '' })

      const hr = await fetchWithAuth(`/portal/pets/${id}/health-records`)
      setRecords(hr || [])
      const evsRaw = await fetchWithAuth('/portal/scheduled-events')
      // normalize events: backend may return array or object; ensure each event has `id` string
      const rawList = Array.isArray(evsRaw) ? evsRaw : (evsRaw && Array.isArray(evsRaw.data) ? evsRaw.data : [])
      const normalized = rawList.map(ev => ({
        ...ev,
        id: ev.id || ev._id || (ev._id && (ev._id.$oid || ev._id['$oid']))
      }))
      setEvents(normalized.filter(e => String(e.pet_id) === String(id)))
      // load portal product/service catalog for used_products/used_services selects
      try {
        const prodResp = await fetchWithAuth('/portal/products/paginated?skip=0&limit=1000')
        const prodList = Array.isArray(prodResp) ? prodResp : (prodResp && Array.isArray(prodResp.data) ? prodResp.data : (prodResp.data || []))
        window.__portalProducts = prodList || []
      } catch (e) {
        window.__portalProducts = []
      }
      try {
        const svcResp = await fetchWithAuth('/portal/services/paginated?skip=0&limit=1000')
        const svcList = Array.isArray(svcResp) ? svcResp : (svcResp && Array.isArray(svcResp.data) ? svcResp.data : (svcResp.data || []))
        window.__portalServices = svcList || []
      } catch (e) {
        window.__portalServices = []
      }
    } catch (e) { console.error(e); setError('Không tải được dữ liệu') }
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (payload.age) {
        const years = parseInt(payload.age)
        if (!Number.isNaN(years)) payload.date_of_birth = new Date(new Date().getFullYear() - years, 0, 1).toISOString().split('T')[0]
      }
      if (payload.weight) payload.weight_kg = parseFloat(payload.weight)
      delete payload.age
      delete payload.weight
      await fetchWithAuth(`/portal/pets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      await load()
      setEditing(false)
      try { window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Cập nhật thú cưng thành công', type: 'update' } })) } catch (e) { }
    } catch (err) { console.error(err); setError('Cập nhật thất bại') }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa thú cưng này?')) return
    try {
      await fetchWithAuth(`/portal/pets/${id}`, { method: 'DELETE' })
      try { window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã xóa thú cưng', type: 'delete' } })) } catch (e) { }
      navigate('/portal/pets')
    } catch (err) { console.error(err); setError('Xóa thất bại') }
  }

  if (loading) return <div>Đang tải...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!pet) return <div>Thú cưng không tồn tại</div>

  return (
    <div className="space-y-8 p-6">
      {/* Header - hero style */}
      <div className="bg-gradient-to-b from-indigo-50 to-white rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="w-44 h-44 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-md border">
              {pet.image_url ? <img src={pet.image_url.startsWith('http') ? pet.image_url : `${BASE_URL}${pet.image_url}`} alt={pet.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 uppercase">{pet.name}</h1>
              <div className="text-sm md:text-base text-gray-500 mt-1 uppercase">{pet.species} • {pet.breed || '-'}</div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={() => setEditing(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 transition">Sửa</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition">Xóa</button>
                <button onClick={() => setActiveTab('appointments')} className="px-4 py-2 border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition">Đặt lịch</button>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <div className="bg-white rounded-2xl p-6 shadow-xl min-w-[320px]">
              <div className="flex items-center justify-between gap-6">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Tuổi</div>
                  <div className="text-2xl font-bold text-gray-900">{pet.age ?? '-'}</div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-500">Cân nặng (kg)</div>
                  <div className="text-2xl font-bold text-gray-900">{pet.weight_kg ?? pet.weight ?? '-'}</div>
                </div>

                <div className="flex-1 pl-4">
                  <div className="text-sm text-gray-400">Chủ nuôi</div>
                  <div className="text-lg md:text-xl font-semibold text-gray-900 truncate">{ pet.owner_name || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <div className="mb-6">
          <nav className="flex gap-8 items-end">
            <button onClick={() => setActiveTab('overview')} className={`pb-3 ${activeTab === 'overview' ? 'border-b-4 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-800'}`}>Tổng quan</button>
            <button onClick={() => setActiveTab('appointments')} className={`pb-3 ${activeTab === 'appointments' ? 'border-b-4 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-800'}`}>Lịch hẹn ({events.length})</button>
            <button onClick={() => setActiveTab('records')} className={`pb-3 ${activeTab === 'records' ? 'border-b-4 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-800'}`}>Hồ sơ y tế ({records.length})</button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="font-semibold text-xl text-gray-800 mb-4">Chi tiết</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="space-y-2"><div className="text-xs text-gray-500">Tên</div><div className="font-medium text-gray-900">{pet.name}</div></div>
                <div className="space-y-2"><div className="text-xs text-gray-500">Loài</div><div className="font-medium text-gray-900">{pet.species}</div></div>
                <div className="space-y-2"><div className="text-xs text-gray-500">Giống</div><div className="font-medium text-gray-900">{pet.breed || '-'}</div></div>
                <div className="space-y-2"><div className="text-xs text-gray-500">Giới tính</div><div className="font-medium text-gray-900">{pet.gender || '-'}</div></div>
                <div className="space-y-2"><div className="text-xs text-gray-500">Ngày sinh</div><div className="font-medium text-gray-900">{pet.date_of_birth || '-'}</div></div>
                <div className="space-y-2"><div className="text-xs text-gray-500">Trạng thái triệt sản</div><div className="font-medium text-gray-900">{pet.is_neutered ? 'Có' : 'Không'}</div></div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-xl text-gray-800 mb-4">Chủ nuôi</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div className="font-semibold text-gray-900">{pet.owner_name || '-'}</div>
                <div className="text-sm text-indigo-700">{pet.owner_email || ''}</div>
                <div className="text-xs text-gray-500">{pet.owner_phone || ''}</div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-3">Đặt lịch mới</h4>
                <form onSubmit={async (e) => { e.preventDefault();
                    try{
                      const payload = { ...newEvent }
                      // Convert datetime-local (YYYY-MM-DDTHH:MM) into an explicit UTC ISO string
                      // treating the input as Vietnam time (UTC+7). This avoids client TZ surprises.
                      // If the input is a naive datetime-local (no timezone), treat it as Vietnam time (GMT+7).
                      // Instead of doing manual math (which can cause off-by-offset issues), append an explicit
                      // "+07:00" offset so the server can parse and convert to UTC reliably.
                      if (payload.event_datetime && !/([Zz]|[+\-]\d{2}:\d{2})$/.test(payload.event_datetime)) {
                        payload.event_datetime = `${payload.event_datetime}:00+07:00`
                      }
                      await fetchWithAuth(`/portal/pets/${id}/scheduled-events`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
                      // reload events
                      const evs = await fetchWithAuth('/portal/scheduled-events')
                      setEvents((evs || []).filter(e => String(e.pet_id) === String(id)))
                      setNewEvent({ title: '', event_datetime: '', event_type: 'appointment', description: '' })
                      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã đặt lịch thành công', type:'create' } })) }catch(e){}
                    }catch(err){ console.error(err); setError('Đặt lịch thất bại') }
                  }} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input required placeholder="Tiêu đề" value={newEvent.title} onChange={(e)=> setNewEvent({...newEvent, title: e.target.value})} className="p-2 border rounded" />
                  <div>
                    <input required type="datetime-local" min={getVNMinForInput()} value={newEvent.event_datetime} onChange={(e)=> setNewEvent({...newEvent, event_datetime: e.target.value})} className="p-2 border rounded w-full" />
                    <div className="text-xs text-gray-400 mt-1">Thời gian </div>
                  </div>
                  <select value={newEvent.event_type} onChange={(e)=> setNewEvent({...newEvent, event_type: e.target.value})} className="p-2 border rounded">
                    <option value="appointment">Khám / Dịch vụ</option>
                    <option value="medication">Uống thuốc</option>
                    <option value="feeding">Cho ăn</option>
                    <option value="activity">Hoạt động</option>


                  </select>
                  <textarea placeholder="Mô tả (tuỳ chọn)" value={newEvent.description} onChange={(e)=> setNewEvent({...newEvent, description: e.target.value})} className="md:col-span-3 p-2 border rounded" />
                  <div className="md:col-span-3 text-right">
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Đặt lịch</button>
                  </div>
                </form>
              </div>

              {events.length === 0 ? <div className="text-gray-500">Không có lịch hẹn</div> : (
                <ul className="space-y-4">
                  {events.map(ev => (
                    <li key={ev.id} className="p-4 border rounded-lg flex items-start justify-between hover:shadow-md transition-all">
                      <div>
                        <div className="font-semibold text-gray-800">{ev.title}</div>
                        <div className="text-sm text-gray-600">{ev.description}</div>
                        <div className="text-xs text-gray-400">{formatDateTimeVN(ev.event_datetime)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500">{ev.event_type}</div>
                        <button onClick={async ()=>{
                          if (!confirm('Bạn có chắc muốn huỷ lịch hẹn này?')) return
                          try{
                            const eid = ev.id || ev._id || (ev._id && (ev._id.$oid || ev._id['$oid']))
                            await fetchWithAuth(`/portal/scheduled-events/${eid}`, { method: 'DELETE' })
                            // reload events
                            const evsRaw2 = await fetchWithAuth('/portal/scheduled-events')
                            const rawList2 = Array.isArray(evsRaw2) ? evsRaw2 : (evsRaw2 && Array.isArray(evsRaw2.data) ? evsRaw2.data : [])
                            const normalized2 = rawList2.map(ev => ({ ...ev, id: ev.id || ev._id || (ev._id && (ev._id.$oid || ev._id['$oid'])) }))
                            setEvents(normalized2.filter(e => String(e.pet_id) === String(id)))
                            try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Lịch hẹn đã được huỷ', type:'delete' } })) }catch(e){}
                          }catch(err){ console.error(err); setError('Huỷ lịch thất bại') }
                        }} className="px-3 py-1 bg-red-600 text-white rounded">Huỷ</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Hồ sơ y tế</h4>
              <div>
                <button onClick={() => setShowRecordModal(true)} className="px-3 py-1 bg-indigo-600 text-white rounded">Thêm hồ sơ</button>
              </div>
            </div>

            {records.length === 0 ? <div className="text-gray-500">Không có hồ sơ y tế</div> : (
              <ul className="space-y-4">
                {records.map(r => {
                  const rid = r.id || r._id || (r._id && (r._id.$oid || r._id['$oid']))
                  return (
                    <li key={rid} className="p-4 border rounded-lg hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{getRecordTypeLabel(r.record_type) || r.description || 'Ghi chú'}</div>
                          <div className="text-sm text-gray-500">{r.description || r.notes || ''}</div>
                          <div className="text-xs text-gray-400">{r.date ? new Date(r.date).toLocaleDateString('vi-VN') : ''}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async ()=>{
                            if (!confirm('Bạn có chắc muốn xóa hồ sơ y tế này?')) return
                            try{
                              await fetchWithAuth(`/portal/health-records/${rid}`, { method: 'DELETE' })
                              // reload records
                              const hr = await fetchWithAuth(`/portal/pets/${id}/health-records`)
                              setRecords(hr || [])
                              try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã xóa hồ sơ y tế', type: 'delete' } })) }catch(e){}
                            }catch(err){ console.error(err); setError('Xóa hồ sơ thất bại') }
                          }} className="px-3 py-1 bg-red-600 text-white rounded">Xóa</button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

      {/* Add Record Modal */}
      {showRecordModal && (
        <Modal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} title={`Thêm hồ sơ cho ${pet.name}`}>
          <form onSubmit={async (e)=>{ e.preventDefault(); try{
              const payload = { ...recordForm }
              // normalize numeric weight
              if (payload.weight_kg) payload.weight_kg = parseFloat(payload.weight_kg)
              // convert date fields to ISO strings (server expects datetimes)
              if (payload.date) payload.date = new Date(payload.date).toISOString()
              if (payload.next_due_date) payload.next_due_date = new Date(payload.next_due_date).toISOString()

              // normalize used_products
              if (Array.isArray(payload.used_products)) {
                payload.used_products = payload.used_products
                  .map(up => ({ product_id: up.product_id || '', quantity: parseInt(up.quantity) || 0, unit_price: parseFloat(up.unit_price) || 0 }))
                  .filter(up => up.product_id && up.quantity > 0 && up.unit_price > 0)
                if (payload.used_products.length === 0) delete payload.used_products
              }

              // normalize used_services
              if (Array.isArray(payload.used_services)) {
                payload.used_services = payload.used_services
                  .map(us => ({ name: us.name?.trim?.() || '', price: parseFloat(us.price) || 0 }))
                  .filter(us => us.name && us.price > 0)
                if (payload.used_services.length === 0) delete payload.used_services
              }

              await fetchWithAuth(`/portal/pets/${id}/health-records`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
              const hr = await fetchWithAuth(`/portal/pets/${id}/health-records`)
              setRecords(hr || [])
              setShowRecordModal(false)
              setRecordForm({ record_type: 'vet_visit', date: new Date().toISOString().split('T')[0], description: '', notes: '', weight_kg: '', next_due_date: '', used_products: [], used_services: [] })
              try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Hồ sơ y tế đã được lưu', type: 'create' } })) }catch(e){}
            }catch(err){ console.error(err); setError('Không thể lưu hồ sơ y tế') } }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={recordForm.record_type} onChange={(e)=> setRecordForm({...recordForm, record_type: e.target.value})} className="p-2 border rounded">
                <option value="vet_visit">Khám bệnh</option>
                <option value="vaccination">Tiêm chủng</option>
                <option value="weight_check">Cân nặng</option>
                <option value="medication">Dùng thuốc</option>
              </select>
              <input type="date" value={recordForm.date} onChange={(e)=> setRecordForm({...recordForm, date: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Mô tả" value={recordForm.description} onChange={(e)=> setRecordForm({...recordForm, description: e.target.value})} className="p-2 border rounded md:col-span-2" />
              <input placeholder="Ghi chú" value={recordForm.notes} onChange={(e)=> setRecordForm({...recordForm, notes: e.target.value})} className="p-2 border rounded md:col-span-2" />
              <input type="number" step="0.1" placeholder="Cân nặng (kg)" value={recordForm.weight_kg} onChange={(e)=> setRecordForm({...recordForm, weight_kg: e.target.value})} className="p-2 border rounded" />
              <input type="date" placeholder="Ngày tái khám" value={recordForm.next_due_date} onChange={(e)=> setRecordForm({...recordForm, next_due_date: e.target.value})} className="p-2 border rounded" />
            </div>
            {/* Used Products (optional) */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Sản phẩm sử dụng</label>
                <button type="button" onClick={addUsedProduct} className="text-sm text-indigo-600 hover:text-indigo-800">+ Thêm sản phẩm</button>
              </div>
              {(recordForm.used_products || []).map((product, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                  <select value={product.product_id} onChange={(e) => updateUsedProduct(index, 'product_id', e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm">
                    <option value="">Chọn sản phẩm</option>
                    {(window.__portalProducts || []).concat([]).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="SL" value={product.quantity} onChange={(e) => updateUsedProduct(index, 'quantity', parseInt(e.target.value) || 1)} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" min="1" />
                  <input type="number" placeholder="Giá" value={product.unit_price} onChange={(e) => updateUsedProduct(index, 'unit_price', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" min="0" />
                  <button type="button" onClick={() => removeUsedProduct(index)} className="text-red-600 hover:text-red-800"><i className="fas fa-times"/></button>
                </div>
              ))}
            </div>

            {/* Used Services (optional) */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Dịch vụ sử dụng</label>
                <button type="button" onClick={addUsedService} className="text-sm text-indigo-600 hover:text-indigo-800">+ Thêm dịch vụ</button>
              </div>
              {(recordForm.used_services || []).map((service, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                  <input type="text" placeholder="Tên dịch vụ" value={service.name} onChange={(e) => updateUsedService(index, 'name', e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
                  <input type="number" placeholder="Giá" value={service.price} onChange={(e) => updateUsedService(index, 'price', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border border-gray-300 rounded text-sm" min="0" />
                  <button type="button" onClick={() => removeUsedService(index)} className="text-red-600 hover:text-red-800"><i className="fas fa-times"/></button>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={()=> setShowRecordModal(false)} className="w-full px-4 py-2 border rounded-lg">Hủy</button>
              <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg">Lưu</button>
            </div>
          </form>
        </Modal>
      )}
      </div>

      {/* Edit modal */}
      {editing && (
        <Modal isOpen={editing} onClose={() => setEditing(false)} title={`Sửa: ${pet.name}`}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3 border rounded-lg shadow-sm" />
              <input required placeholder="Loài" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className="w-full p-3 border rounded-lg shadow-sm" />
              <input placeholder="Giống" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} className="w-full p-3 border rounded-lg shadow-sm" />
              <input type="number" placeholder="Tuổi (năm)" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full p-3 border rounded-lg shadow-sm" />
            </div>
            <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setEditing(false)} className="w-full px-4 py-2 border rounded-lg">Hủy</button>
              <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg">Lưu</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
