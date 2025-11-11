import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL, BASE_URL } from '../api'

export default function PortalServices(){
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 12
  const [pets, setPets] = useState([])
  const [bookingService, setBookingService] = useState(null)
  const [booking, setBooking] = useState({ pet_id: '', title: '', event_datetime: '', description: '' })

  useEffect(()=>{ load() }, [page, search])

  useEffect(()=>{ loadPets() }, [])

  // compute VN local min for datetime-local input (YYYY-MM-DDTHH:MM)
  const getVNMinForInput = () => {
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

  const loadPets = async () => {
    try{
      const res = await fetchWithAuth(`${API_BASE_URL}/portal/pets`)
      // normalize id: API may return id or _id; ensure pets[].id is string id
      const list = (res || []).map(p => ({ ...p, id: p.id ?? p._id ?? (p._id ? String(p._id) : undefined) }))
      setPets(list)
    }catch(e){ console.error('load pets', e) }
  }

  const load = async () => {
    setLoading(true)
    try{
      const skip = (page - 1) * pageSize
      const params = new URLSearchParams({ skip: String(skip), limit: String(pageSize) })
      if (search) params.append('search', search)
      const res = await fetchWithAuth(`${API_BASE_URL}/portal/services/paginated?${params}`)
      setItems(res.data || [])
      setTotal(res.total || 0)
    }catch(e){
      console.error('load services', e)
    }finally{ setLoading(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dịch vụ</h1>
          <p className="text-sm text-gray-600">Xem và đặt dịch vụ cho thú cưng</p>
        </div>
        <div className="w-72">
          <input value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1) }} placeholder="Tìm dịch vụ..." className="w-full px-3 py-2 border rounded" />
        </div>
      </div>

      <div>
        {loading ? <div>Đang tải...</div> : (
          items.length === 0 ? (
            <div className="text-gray-500">Không có dịch vụ</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(s => (
                <div key={String(s.id)} className="bg-white rounded-xl p-3 shadow-sm flex flex-col">
                  <div className="w-full h-40 bg-gray-100 rounded overflow-hidden mb-3 flex items-center justify-center">
                    {s.image_url ? <img src={s.image_url.startsWith('http') ? s.image_url : `${BASE_URL}${s.image_url}`} alt={s.name} className="w-full h-full object-cover"/> : <div className="text-gray-400">No Image</div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900 truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{s.description}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-900">{s.duration_minutes ? `${s.duration_minutes} phút` : ''}</div>
                    <div className="flex items-center gap-2">
                      <a href={`/portal/services/${s.id}`} className="text-indigo-600 text-sm">Chi tiết</a>
                      <button onClick={()=>{ setBookingService(s); setBooking({ pet_id: pets[0]?.id || '', title: `Đặt: ${s.name}`, event_datetime: '', description: '', event_type: 'appointment' }) }} className="text-green-600 text-sm">Đặt</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-center space-x-2">
          <button disabled={page===1} onClick={()=> setPage(page-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <div className="px-3 py-1">{page}</div>
          <button disabled={page*pageSize >= total} onClick={()=> setPage(page+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      )}
      {/* Booking modal */}
      {bookingService && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Đặt dịch vụ: {bookingService.name}</h3>
              <button onClick={()=> setBookingService(null)} className="text-gray-500">Đóng</button>
            </div>

            <form onSubmit={async (e)=>{ e.preventDefault();
                try{
                  // build payload and ensure event_type present
                  const payload = { title: booking.title, event_datetime: booking.event_datetime, description: booking.description, event_type: booking.event_type || 'appointment' }
                  // validate pet_id looks like an ObjectId-ish string (24 hex chars)
                  const petId = booking.pet_id
                  console.log('Booking submit', { petId, payload, serviceId: bookingService.id })
                  if (!petId || !/^[0-9a-fA-F]{24}$/.test(petId)){
                    alert('Pet id không hợp lệ. Vui lòng chọn thú cưng khác.')
                    return
                  }
                  // append +07:00 if naive
                  if (payload.event_datetime && !/([Zz]|[+\-]\d{2}:\d{2})$/.test(payload.event_datetime)) payload.event_datetime = `${payload.event_datetime}:00+07:00`
                  // client-side check: ensure event_datetime (after offset) is in the future
                  if (payload.event_datetime){
                    const eventMs = Date.parse(payload.event_datetime)
                    if (Number.isNaN(eventMs) || eventMs <= Date.now()){
                      alert('Vui lòng chọn thời gian trong tương lai.')
                      return
                    }
                  }
                  // POST to pet's scheduled-events with service_id
                  await fetchWithAuth(`${API_BASE_URL}/portal/pets/${petId}/scheduled-events`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...payload, service_id: bookingService.id }) })
                  try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã đặt dịch vụ', type: 'create' } })) }catch(e){}
                  setBookingService(null)
                }catch(err){ console.error(err); alert('Đặt dịch vụ thất bại') }
              }} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700">Chọn thú cưng</label>
                      <select required value={booking.pet_id} onChange={(e)=> setBooking({...booking, pet_id: e.target.value})} className="w-full p-2 border rounded">
                  <option value="">-- Chọn thú cưng --</option>
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700">Tiêu đề</label>
                <input required value={booking.title} onChange={(e)=> setBooking({...booking, title: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Thời gian (VN GMT+7)</label>
                  <input required type="datetime-local" min={getVNMinForInput()} value={booking.event_datetime} onChange={(e)=> setBooking({...booking, event_datetime: e.target.value})} className="w-full p-2 border rounded" />
                <div className="text-xs text-gray-400 mt-1">Giờ theo Việt Nam (GMT+7). Không chọn thời gian trong quá khứ.</div>
              </div>
                <div>
                  <label className="block text-sm text-gray-700">Loại lịch</label>
                  <select value={booking.event_type || 'appointment'} onChange={(e)=> setBooking({...booking, event_type: e.target.value})} className="w-full p-2 border rounded">
                    <option value="appointment">Khám / Dịch vụ</option>
                    <option value="medication">Uống thuốc</option>
                    <option value="feeding">Cho ăn</option>
                    <option value="activity">Hoạt động</option>
                  </select>
                </div>
              <div>
                <label className="block text-sm text-gray-700">Mô tả</label>
                <textarea value={booking.description} onChange={(e)=> setBooking({...booking, description: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div className="text-right">
                <button type="button" onClick={()=> setBookingService(null)} className="px-4 py-2 mr-2 border rounded">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

