import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailErr, setEmailErr] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const navigate = useNavigate()

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ'
    if (!password || password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEmailErr(''); setPwdErr('')
    const v = validate()
    if (v) {
      // set field errors if known
      if (v.includes('Email')) setEmailErr(v)
      if (v.includes('Mật khẩu')) setPwdErr(v)
      setError(v)
      return
    }
    setLoading(true)
    try {
      // 1) Register
      const res = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Đăng ký thất bại')
      }

      // 2) Auto login
      const form = new FormData()
      form.append('username', email)
      form.append('password', password)
      const loginRes = await fetch(`${API_BASE_URL}/login`, { method: 'POST', body: form })
      if (!loginRes.ok) throw new Error('Đăng nhập tự động thất bại')
      const data = await loginRes.json()
      localStorage.setItem('hiday_pet_token', data.access_token)
      window.dispatchEvent(new Event('tokenChanged'))

      // 3) get profile to decide redirect
      const profileRes = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      })
      if (profileRes.ok) {
        const profile = await profileRes.json()
        if (profile.role && profile.role === 'admin') navigate('/dashboard')
        else navigate('/portal')
      } else {
        navigate('/portal')
      }
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-100 px-6 py-10">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-indigo-300 via-pink-200 to-yellow-100 blur-3xl opacity-50 rounded-3xl" />

        <div className="relative bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl border border-white/60 p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-md">
              <i className="fas fa-user-plus" aria-hidden />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Đăng ký tài khoản</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Tạo tài khoản để bắt đầu quản lý thú cưng của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Họ tên */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
              <div className="flex items-center border rounded-xl bg-white hover:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-200">
                <span className="pl-3 text-gray-400">
                  <i className="far fa-user" />
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-3 rounded-r-xl outline-none text-gray-800 placeholder-gray-400"
                  placeholder="username"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className={`flex items-center rounded-xl border ${emailErr? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500'} bg-white`}>
                <span className="pl-3 text-gray-400">
                  <i className="far fa-envelope" />
                </span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-3 rounded-r-xl outline-none text-gray-800 placeholder-gray-400"
                  placeholder="you@example.com"
                  aria-invalid={!!emailErr}
                  aria-describedby={emailErr? 'email-error' : undefined}
                />
              </div>
              {emailErr && <p id="email-error" className="mt-1 text-sm text-red-600">{emailErr}</p>}
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
              <div className={`flex items-center rounded-xl ${pwdErr? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300'} bg-white focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-200`}>
                <span className="pl-3 text-gray-400">
                  <i className="fas fa-lock" />
                </span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-3 outline-none text-gray-800 placeholder-gray-400"
                  placeholder="••••••••"
                  aria-invalid={!!pwdErr}
                  aria-describedby={pwdErr? 'pwd-error' : undefined}
                />
                <button type="button" onClick={()=> setShowPassword(v=>!v)} className="px-3 text-gray-500 hover:text-gray-700" aria-label={showPassword? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  <i className={showPassword? 'far fa-eye-slash' : 'far fa-eye'} />
                </button>
              </div>
              {pwdErr && <p id="pwd-error" className="mt-1 text-sm text-red-600">{pwdErr}</p>}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center shadow-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                disabled={loading}
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Đăng ký'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Đã có tài khoản
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            © {new Date().getFullYear()} HIDAY PET — Hệ thống quản lý thú cưng
          </div>
        </div>
      </div>
    </div>
  )
}
