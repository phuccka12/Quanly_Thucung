import React, { useEffect, useState } from 'react'
import { fetchWithAuth } from '../api'
import ImageUpload from '../components/ImageUpload'

function StatCard({ title, value, icon, className = '' }) {
  return (
    <div className={`bg-white/90 border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500">{title}</div>
          <div className="mt-2 text-3xl font-bold text-gray-800">{value}</div>
        </div>
        {icon && <div className="text-indigo-500 text-2xl">{icon}</div>}
      </div>
    </div>
  )
}

export default function UserDashboard() {
  const [pets, setPets] = useState([])
  const [events, setEvents] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [healthRecords, setHealthRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', species: '', owner_name: '' })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [p, e, prod, svc] = await Promise.all([
          fetchWithAuth('/portal/pets'),
          fetchWithAuth('/portal/scheduled-events'),
          fetchWithAuth('/portal/products/paginated?skip=0&limit=6'),
          fetchWithAuth('/portal/services/paginated?skip=0&limit=6')
        ])
        if (!mounted) return
  const petsArrRaw = p || []
  // normalize pet ids (API may return _id or id)
  const petsArr = (petsArrRaw || []).map(x => ({ ...x, id: x.id ?? x._id ?? (x._id ? String(x._id) : undefined) }))
  setPets(petsArr)
        setEvents((e || []).sort((a, b) => new Date(a.event_datetime) - new Date(b.event_datetime)).slice(0, 6))
        setProducts((prod && prod.data) || [])
        setServices((svc && svc.data) || [])

  const firstPetIds = (petsArr || []).slice(0, 2).map(x => x.id).filter(id => !!id && /^[0-9a-fA-F]{24}$/.test(id))
  const hrPromises = firstPetIds.map(id => fetchWithAuth(`/portal/pets/${id}/health-records`).catch(() => []))
        const hrResults = await Promise.all(hrPromises)
        const merged = hrResults.flat().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6)
        setHealthRecords(merged)
      } catch (err) {
        console.error('dashboard load', err)
        setError(err?.message || String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleCreatePet = async () => {
    setCreating(true)
    try {
      if (!form.name || !form.species) { setError('Vui lòng nhập tên và loài'); setCreating(false); return }
      await fetchWithAuth('/portal/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const p = await fetchWithAuth('/portal/pets')
      setPets(p || [])
      setForm({ name: '', species: '', owner_name: '' })
      try { window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Thêm thú cưng thành công', type: 'success' } })) } catch (e) { }
    } catch (err) { console.error(err); setError(err?.message || String(err)) }
    finally { setCreating(false) }
  }

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-7 w-1/4 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-28 bg-gray-100 rounded" />
        <div className="h-28 bg-gray-100 rounded" />
        <div className="h-28 bg-gray-100 rounded" />
      </div>
    </div>
  )

  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">👋 Xin chào!</h1>
          <p className="text-gray-600 mt-1">Tổng quan nhanh về thú cưng và lịch hẹn của bạn</p>
        </div>
        <a href="/portal/pets" className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition">
          + Thêm thú cưng
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard title="Tổng thú cưng" value={pets.length} icon={<i className="fas fa-paw" />} />
        <StatCard title="Lịch hẹn sắp tới" value={events.filter(ev => new Date(ev.event_datetime) > new Date()).length} icon={<i className="fas fa-calendar-check" />} />
        <StatCard title="Hồ sơ y tế" value={healthRecords.length} icon={<i className="fas fa-notes-medical" />} />
      </div>

      {/* Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Events */}
          <div className="bg-white/90 border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">📅 Lịch hẹn sắp tới</h2>
              <a href="/scheduled-events" className="text-sm text-indigo-600 hover:underline">Xem tất cả</a>
            </div>
            {events.length === 0 ? (
              <div className="text-gray-500 text-sm py-2">Không có lịch hẹn sắp tới.</div>
            ) : (
              <ul className="space-y-3">
                {events.slice(0, 5).map(ev => (
                  <li key={ev.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:bg-indigo-50/40 transition">
                    <div className="w-2.5 h-2.5 mt-2 rounded-full bg-indigo-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{ev.title} <span className="text-sm text-gray-500">— {ev.pet_name}</span></div>
                      <div className="text-sm text-gray-600">{new Date(ev.event_datetime).toLocaleString('vi-VN')}</div>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(ev.event_datetime) > new Date() ? 'Sắp tới' : 'Đã qua'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Health Records */}
          <div className="bg-white/90 border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">🩺 Hồ sơ y tế gần đây</h2>
              <a href="/health-records" className="text-sm text-indigo-600 hover:underline">Xem tất cả</a>
            </div>
            {healthRecords.length === 0 ? (
              <div className="text-gray-500 text-sm py-2">Chưa có hồ sơ y tế.</div>
            ) : (
              <ul className="space-y-3">
                {healthRecords.slice(0, 5).map(r => (
                  <li key={r.id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                    <div className="font-medium text-gray-800">{r.title || r.note || 'Ghi chú'}</div>
                    <div className="text-sm text-gray-500">
                      {r.date ? new Date(r.date).toLocaleDateString('vi-VN') : ''} — Pet #{r.pet_id}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white/90 border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">⚡ Hành động nhanh</h3>
            <div className="space-y-3">
              <input placeholder="Tên thú cưng" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm" />
              <input placeholder="Loài" value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm" />
              <button onClick={handleCreatePet} disabled={creating} className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition text-sm">
                {creating ? 'Đang...' : 'Thêm thú cưng'}
              </button>
              <a href="/portal/pets" className="block w-full text-center px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">
                Quản lý thú cưng
              </a>
              <a href="/portal/products" className="block w-full text-center px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm">
                Duyệt sản phẩm
              </a>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white/90 border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">🎁 Gợi ý cho bạn</h3>
            <div className="grid grid-cols-1 gap-3">
              {products.slice(0, 3).map(p => (
                <div key={String(p.id)} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {p.image_url && (
                      <img src={p.image_url.startsWith('http') ? p.image_url : `${p.image_url}`} alt={p.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price) : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
