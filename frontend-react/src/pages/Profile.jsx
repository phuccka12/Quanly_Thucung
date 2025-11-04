import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL, BASE_URL } from '../api'

export default function Profile(){
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ full_name: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(()=>{ load() }, [])

  const resolveAvatarUrl = (u)=>{
    if (!u) return null
    // If it's already absolute, return as-is
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    // If backend returns a path like /uploads/xxx, prefix with BASE_URL (root of API host)
    // BASE_URL is like 'http://localhost:8000'
    if (u.startsWith('/')) return `${BASE_URL}${u}`
    // Otherwise, assume relative under uploads
    return `${BASE_URL}/${u}`
  }

  const load = async ()=>{
    setLoading(true)
    try{
      const data = await fetchWithAuth(`${API_BASE_URL}/users/me`)
      setUser(data)
  setForm({ full_name: data.full_name || '', password: '' , avatar_url: data.avatar_url || ''})
  setPreviewUrl(resolveAvatarUrl(data.avatar_url || null))
    }catch(e){
      console.error('load profile', e)
      setError('Không thể tải thông tin người dùng')
    }finally{ setLoading(false) }
  }

  const handleSave = async (e)=>{
    e.preventDefault()
    setSaving(true)
    setError(null)
    try{
      const payload = { full_name: form.full_name }
      if (form.password) payload.password = form.password
      if (form.avatar_url) payload.avatar_url = form.avatar_url
      const updated = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      setUser(updated)
    setForm({ ...form, password: '' })
  try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Cập nhật thành công', type: 'update' } })) }catch(e){}
  // Notify other UI (Topbar) to refresh current user/avatar
  try{ window.dispatchEvent(new Event('tokenChanged')) }catch(e){}
    }catch(e){
      console.error('save profile', e)
      setError('Không thể lưu thông tin người dùng')
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Lưu thất bại', type: 'error' } })) }catch(e){}
    }finally{ setSaving(false) }
  }

  if (loading) return <div className="p-6 bg-white rounded-2xl shadow-sm">Đang tải...</div>

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Hồ sơ của tôi</h1>
        <p className="text-sm text-gray-600">Quản lý thông tin tài khoản</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              {previewUrl ? <img src={previewUrl} alt="avatar" className="w-full h-full object-cover"/> : <i className="fas fa-user text-2xl text-gray-400"/>}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Ảnh đại diện</label>
              <div className="flex gap-2">
                <input id="avatarFile" type="file" accept="image/*" onChange={async (e)=>{
                  const f = e.target.files && e.target.files[0]
                  if (!f) return
                  setUploading(true)
                  try{
                    const fd = new FormData()
                    fd.append('file', f)
                    const token = localStorage.getItem('hiday_pet_token')
                    const res = await fetch(`${API_BASE_URL}/upload`, {
                      method: 'POST',
                      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                      body: fd
                    })
                    const j = await res.json()
                    if (!res.ok) throw new Error(j.detail || 'Upload failed')
                    const url = j.url
                    setForm({...form, avatar_url: url})
                    setPreviewUrl(resolveAvatarUrl(url))
                  }catch(err){
                    console.error('upload avatar', err)
                    setError('Không thể upload ảnh')
                    try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Không thể upload ảnh', type: 'error' } })) }catch(e){}
                  }finally{ setUploading(false) }
                }} className="" />
                <button type="button" onClick={async ()=>{
                  // Clear avatar: persist by calling PUT /users/me with empty avatar_url
                  try{
                    setUploading(true)
                    await fetchWithAuth(`/users/me`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ avatar_url: '' })
                    })
                    setForm({...form, avatar_url: ''})
                    setPreviewUrl(null)
                    // notify Topbar to refresh
                    try{ window.dispatchEvent(new Event('tokenChanged')) }catch(e){}
                    setError(null)
                    try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Ảnh đại diện đã bị xóa', type: 'delete' } })) }catch(e){}
                  }catch(err){
                    console.error('clear avatar', err)
                    setError('Không thể xóa ảnh')
                  }finally{ setUploading(false) }
                }} className="px-3 py-2 border rounded">Xóa</button>
              </div>
              {uploading && <div className="text-sm text-gray-500 mt-1">Đang tải ảnh...</div>}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input type="text" readOnly value={user.email} className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Họ và tên</label>
            <input value={form.full_name} onChange={e=>setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Mật khẩu mới (để trống nếu không đổi)</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={()=>setForm({ full_name: user.full_name || '', password: '' })} className="px-4 py-2 border rounded-xl">Hủy</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">{saving? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
