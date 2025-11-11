import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const navigate = useNavigate()

  useEffect(()=>{
    const savedEmail = localStorage.getItem('hiday_pet_saved_email')
    if (savedEmail) setEmail(savedEmail)
  },[])

  const validate = ()=>{
    let ok = true
    setEmailErr(''); setPwdErr('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErr('Email không hợp lệ'); ok = false }
    if (!password || password.length < 6) { setPwdErr('Mật khẩu tối thiểu 6 ký tự'); ok = false }
    return ok
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        if (res.status === 401) throw new Error('Sai email hoặc mật khẩu')
        throw new Error('Đăng nhập thất bại, vui lòng thử lại')
      }

      const data = await res.json()
      localStorage.setItem('hiday_pet_token', data.access_token)
      if (remember) localStorage.setItem('hiday_pet_saved_email', email)
      else localStorage.removeItem('hiday_pet_saved_email')
      window.dispatchEvent(new Event('tokenChanged'))
      // fetch profile and redirect according to role (admin -> /dashboard, user -> /portal)
      try {
        const profRes = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` }
        })
        if (profRes.ok) {
          const profile = await profRes.json()
          if (profile.role && profile.role === 'admin') navigate('/dashboard')
          else navigate('/portal')
        } else {
          // fallback
          navigate('/dashboard')
        }
      } catch (e) {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute inset-0 -z-10 blur-2xl opacity-40 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200 rounded-3xl"/>
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4">
                <i className="fas fa-dog" aria-hidden/>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">HIDAY PET</h1>
              <p className="text-gray-600">Đăng nhập vào hệ thống quản lý</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">Email</label>
                <div className={`flex items-center rounded-xl border ${emailErr? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500'} bg-white`}> 
                  <span className="pl-3 text-gray-400"><i className="far fa-envelope"/></span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-3 rounded-r-xl outline-none"
                    placeholder="admin@hidaypet.com"
                    autoComplete="username"
                    required
                    aria-invalid={!!emailErr}
                    aria-describedby={emailErr? 'email-error': undefined}
                  />
                </div>
                {emailErr && <p id="email-error" className="mt-1 text-sm text-red-600">{emailErr}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">Mật khẩu</label>
                <div className={`flex items-center rounded-xl border ${pwdErr? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500'} bg-white`}>
                  <span className="pl-3 text-gray-400"><i className="fas fa-lock"/></span>
                  <input
                    id="password"
                    type={showPassword? 'text':'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-3 outline-none"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    aria-invalid={!!pwdErr}
                    aria-describedby={pwdErr? 'pwd-error': undefined}
                  />
                  <button type="button" onClick={()=> setShowPassword(v=>!v)} className="px-3 text-gray-500 hover:text-gray-700" aria-label={showPassword? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    <i className={showPassword? 'far fa-eye-slash' : 'far fa-eye'} />
                  </button>
                </div>
                {pwdErr && <p id="pwd-error" className="mt-1 text-sm text-red-600">{pwdErr}</p>}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={remember} onChange={(e)=> setRemember(e.target.checked)} />
                  Ghi nhớ email
                </label>
                <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Quên mật khẩu?</button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <span className="inline-block h-5 w-5 border-2 border-white/60 border-t-transparent rounded-full animate-spin"/>}
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              <div className="pt-1 text-center text-xs text-gray-500">
                Bằng việc tiếp tục, bạn đồng ý với <a className="underline hover:text-gray-700" href="#">Điều khoản</a> & <a className="underline hover:text-gray-700" href="#">Chính sách</a>
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              <p className="text-gray-600">Chưa có tài khoản? <button type="button" onClick={()=> navigate('/register')} className="text-indigo-600 underline">Đăng ký</button></p>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} HIDAY PET - Hệ thống quản lý thú cưng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
