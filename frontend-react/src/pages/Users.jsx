import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL } from '../api'

export default function Users(){
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState({})

  const load = async () => {
    setLoading(true)
    try{
      const res = await fetchWithAuth('/users?skip=0&limit=200')
      const list = Array.isArray(res) ? res : (res && res.data ? res.data : [])
      setUsers(list)
    }catch(err){ console.error(err); setError('Không tải được danh sách người dùng') }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])


  const toggleRole = async (u) => {
    const id = u.id || u._id
    setUpdating(prev => ({...prev, [id]: true}))
    try{
      const newRole = (u.role || 'user') === 'admin' ? 'user' : 'admin'
      await fetchWithAuth(`/users/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ role: newRole }) })
      await load()
    }catch(err){ console.error(err); setError('Cập nhật thất bại') }
    finally{ setUpdating(prev => ({...prev, [id]: false})) }
  }

  const del = async (u) => {
    if (!confirm('Xóa người dùng này?')) return
    const id = u.id || u._id
    setUpdating(prev => ({...prev, [id]: true}))
    try{
      await fetchWithAuth(`/users/${id}`, { method: 'DELETE' })
      await load()
    }catch(err){ console.error(err); setError('Xóa thất bại') }
    finally{ setUpdating(prev => ({...prev, [id]: false})) }
  }

  // --- Create new user (admin) modal ---
  const [creatingModalOpen, setCreatingModalOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '' })

  const createUser = async () => {
    setCreating(true)
    setError(null)
    try{
      // Use a plain fetch for registration so admin creating a user does not
      // trigger the global logout logic in fetchWithAuth if the register
      // endpoint ever responds with 401 for some reason.
      const res = await fetch(`${API_BASE_URL}/users/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newUser) })
      if (!res.ok) {
        const body = await res.text().catch(()=> '')
        console.error('Register failed', res.status, body)
        throw new Error('Tạo người dùng thất bại')
      }
      setNewUser({ email: '', password: '', full_name: '' })
      setCreatingModalOpen(false)
      await load()
    }catch(err){ console.error(err); setError('Tạo người dùng thất bại') }
    finally{ setCreating(false) }
  }

  if (loading) return <div>Đang tải...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Quản lý người dùng</h2>
        <div className="flex items-center gap-2">
          <button onClick={load} className="px-3 py-1 border rounded">Làm mới</button>
          <button onClick={()=>setCreatingModalOpen(true)} className="px-3 py-1 bg-green-600 text-white rounded">Thêm tài khoản</button>
        </div>
      </div>
      {/* Modal for creating user */}
      {creatingModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-40" onClick={()=>setCreatingModalOpen(false)} />
          <div className="relative bg-white rounded shadow-lg w-96 p-4">
            <h3 className="font-semibold mb-2">Tạo tài khoản mới</h3>
            <div className="grid gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Email (dùng để đăng nhập)</label>
                <input placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="p-2 border rounded w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Họ tên (tùy chọn)</label>
                <input placeholder="Họ tên" value={newUser.full_name} onChange={e=>setNewUser({...newUser, full_name: e.target.value})} className="p-2 border rounded w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Mật khẩu (ít nhất 6 ký tự)</label>
                <input placeholder="Mật khẩu" type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="p-2 border rounded w-full" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>{ setCreatingModalOpen(false); setNewUser({ email: '', password: '', full_name: '' }) }} className="px-3 py-1 border rounded">Hủy</button>
              <button onClick={createUser} disabled={!newUser.email || !newUser.password} className="px-3 py-1 bg-blue-600 text-white rounded">{creating ? 'Đang tạo...' : 'Tạo'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Họ tên</th>
              <th className="p-3 text-left">Vai trò</th>
              <th className="p-3 text-left">Đang hoạt động</th>
              <th className="p-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const id = u.id || u._id
              return (
                <tr key={id} className="border-t">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.full_name || '-'}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.is_active ? 'Có' : 'Không'}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={()=>toggleRole(u)} disabled={updating[id]} className="px-2 py-1 border rounded text-sm">{updating[id] ? '...' : (u.role === 'admin' ? 'User ' : 'Admin')}</button>
                    <button onClick={()=>del(u)} disabled={updating[id]} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Xóa</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
