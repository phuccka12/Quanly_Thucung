import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL, BASE_URL } from '../api'
import ImageUpload from '../components/ImageUpload'
import Modal from '../components/Modal'

const normalizePet = (p)=>{
  if (!p) return p
  const out = { ...p }
  out.id = out.id || out._id || (out._id && out._id.$oid)
  out.weight = p.weight_kg ?? p.weight
  if (p.date_of_birth) {
    try{
      const dob = new Date(p.date_of_birth)
      const diff = Date.now() - dob.getTime()
      out.age = Math.floor(new Date(diff).getUTCFullYear() - 1970)
    }catch(e){ out.age = p.age }
  } else out.age = p.age
  return out
}

export default function PortalPets(){
  const [loading, setLoading] = useState(true)
  const [pets, setPets] = useState([])
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  // form state (include additional fields expected by backend)
  // gender: 'male'|'female'|'' , date_of_birth: 'YYYY-MM-DD', is_neutered: boolean
  const [form, setForm] = useState({ name:'', species:'', breed:'', age:'', weight:'', image_url:'', gender:'', date_of_birth:'', is_neutered:false })

  useEffect(()=>{ load() }, [])

  const load = async ()=>{
    setLoading(true)
    try{
      const res = await fetchWithAuth('/portal/pets')
      setPets((res || []).map(normalizePet))
    }catch(e){ console.error(e); setError('Không tải được thú cưng') }
    setLoading(false)
  }

  const resetForm = ()=> setForm({ name:'', species:'', breed:'', age:'', weight:'', image_url:'', gender:'', date_of_birth:'', is_neutered:false })

  const handleSubmit = async (e)=>{
    e.preventDefault()
    try{
      const payload = { ...form }
      if (payload.age) {
        const years = parseInt(payload.age)
        if (!Number.isNaN(years)) payload.date_of_birth = new Date(new Date().getFullYear()-years,0,1).toISOString().split('T')[0]
      }
      if (payload.weight) payload.weight_kg = parseFloat(payload.weight)
      
      // remove UI-only fields before sending
      delete payload.age
      delete payload.weight
      const url = editing ? `/portal/pets/${editing.id}` : '/portal/pets'
      const method = editing ? 'PUT' : 'POST'
      await fetchWithAuth(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      await load()
      setShowAdd(false); setEditing(null); resetForm()
      window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Lưu thú cưng thành công', type:'update' } }))
    }catch(err){ console.error(err); setError('Lưu thất bại') }
  }

  const handleEdit = (p)=>{ 
    setEditing(p);
    setForm({
      name: p.name||'',
      species: p.species||'',
      breed: p.breed||'',
      age: p.age||'',
      weight: (p.weight || p.weight_kg) || '',
      image_url: p.image_url||'',
      gender: p.gender||'',
      date_of_birth: p.date_of_birth||'',
      is_neutered: !!p.is_neutered
    });
    setShowAdd(true)
  }

  const handleDelete = async (p) => {
    const id = p.id || p._id || (p._id && p._id.$oid)
    if (!id) return
    if (!confirm('Bạn có chắc muốn xóa thú cưng này?')) return
    try{
      await fetchWithAuth(`/portal/pets/${id}`, { method: 'DELETE' })
      await load()
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã xóa thú cưng', type: 'delete' } })) }catch(e){}
    }catch(err){ console.error(err); setError('Xóa thất bại') }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trang của tôi</h1>
          <p className="text-sm text-gray-500">Quản lý thú cưng của bạn</p>
        </div>
        <button className="btn-primary" onClick={()=> setShowAdd(true)}>Thêm thú cưng</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}

      <div className="bg-white border rounded-2xl p-4">
        {loading ? (
          <div>Đang tải...</div>
        ) : pets.length === 0 ? (
          <div className="text-gray-500">Bạn chưa có thú cưng nào.</div>
        ) : (
          <ul className="space-y-3">
            {pets.map(p => (
              <li key={p.id} className="flex items-center justify-between border-b py-3">
                <div className="flex items-center gap-3">
                  {p.image_url ? <img src={p.image_url.startsWith('http')?p.image_url:`${BASE_URL}${p.image_url}`} className="w-12 h-12 rounded-full object-cover"/> : <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">{p.name?.charAt(0)}</div>}
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.species} • {(p.age || p.age === 0) ? p.age : '-'} tuổi</div>
                  </div>
                </div>
                  <div className="flex items-center gap-2">
                  <a href={`/portal/pets/${p.id}`} className="text-indigo-600">Chi tiết</a>
                  <button onClick={()=> handleEdit(p)} className="text-indigo-600">Sửa</button>
                  <button onClick={()=> handleDelete(p)} className="text-red-600">Xóa</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal simple */}
      {showAdd && (
          <Modal isOpen={showAdd} onClose={()=>{ setShowAdd(false); setEditing(null); resetForm() }} title={editing ? 'Sửa thú cưng' : 'Thêm thú cưng'}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Tên" value={form.name} onChange={(e)=> setForm({...form, name:e.target.value})} className="w-full p-2 border rounded" />
            <input required placeholder="Loài" value={form.species} onChange={(e)=> setForm({...form, species:e.target.value})} className="w-full p-2 border rounded" />
            <input placeholder="Giống" value={form.breed} onChange={(e)=> setForm({...form, breed:e.target.value})} className="w-full p-2 border rounded" />

            <div className="grid grid-cols-2 gap-3">
              <select value={form.gender} onChange={(e)=> setForm({...form, gender: e.target.value})} className="p-2 border rounded">
                <option value="">Giới tính</option>
                <option value="male">Đực</option>
                <option value="female">Cái</option>
                <option value="unknown">Không rõ</option>
              </select>
              <input type="date" value={form.date_of_birth} onChange={(e)=> setForm({...form, date_of_birth: e.target.value})} className="p-2 border rounded" />
            </div>

            <div className="flex items-center gap-3">
              <input id="is_neutered" type="checkbox" checked={!!form.is_neutered} onChange={(e)=> setForm({...form, is_neutered: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="is_neutered" className="text-sm">Đã triệt sản</label>
            </div>

            <input type="number" placeholder="Cân nặng (kg)" value={form.weight} onChange={(e)=> setForm({...form, weight:e.target.value})} className="w-full p-2 border rounded" />
            <ImageUpload value={form.image_url} onChange={(url)=> setForm({...form, image_url: url})} />
            <div className="flex gap-3 pt-4">
              <button type="button" className="flex-1 px-4 py-2 border rounded" onClick={()=>{ setShowAdd(false); setEditing(null); resetForm() }}>Hủy</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded">Lưu</button>
            </div>
          </form>
          </Modal>
      )}
    </div>
  )
}
