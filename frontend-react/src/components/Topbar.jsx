import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Topbar(){
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Tổng quan'
      case '/pets':
        return 'Thú cưng'
      case '/products':
        return 'Sản phẩm'
      case '/services':
        return 'Dịch vụ'
      case '/reports':
        return 'Báo cáo'
      default:
        return 'Tổng quan'
    }
  }

  const toggleTheme = ()=>{
    const html = document.documentElement
    const currentTheme = html.getAttribute('data-theme') || 'light'
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleLogout = () => {
    localStorage.removeItem('hiday_pet_token')
    localStorage.removeItem('hiday_pet_saved_email')
    window.dispatchEvent(new Event('tokenChanged'))
    navigate('/login')
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-white/20 shadow-lg flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
      <button className="p-2 sm:p-3 rounded-xl hover:bg-gray-100 transition-all duration-200" id="btnSidebar" aria-label="Mở menu">
        <i className="fas fa-bars text-gray-600"/>
      </button>
      <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
        Bảng điều khiển / <strong className="text-indigo-600">{getBreadcrumb()}</strong>
      </div>
      <div className="flex-1"/>
      <div className="relative hidden sm:block">
        <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"/>
        <input className="pl-12 pr-4 py-3 w-64 lg:w-80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm" placeholder="Tìm nhanh…"/>
      </div>
      <button className="p-2 sm:p-3 rounded-xl hover:bg-gray-100 transition-all duration-200" id="btnTheme" onClick={toggleTheme}>
        <i className="fas fa-adjust text-gray-600"/>
      </button>
      <button className="p-2 sm:p-3 rounded-xl hover:bg-gray-100 transition-all duration-200 relative">
        <i className="far fa-bell text-gray-600"/>
        <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
      </button>
      <div className="relative">
        <button 
          id="btnUserMenu"
          className="p-3 rounded-xl hover:bg-gray-100 transition-all duration-200" 
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <i className="far fa-user text-gray-600"/>
        </button>
        {showUserMenu && (
          <div className="user-menu absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <button 
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => setShowUserMenu(false)}
            >
              <i className="fas fa-user"/>
              Hồ sơ cá nhân
            </button>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => setShowUserMenu(false)}
            >
              <i className="fas fa-cog"/>
              Cài đặt
            </button>
            <hr className="my-1"/>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 flex items-center gap-2"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt"/>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
