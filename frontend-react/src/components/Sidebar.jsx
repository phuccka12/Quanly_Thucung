import React, { useContext } from 'react'
import { NavLink } from 'react-router-dom'
import { AuthContext } from '../AuthContext'

export default function Sidebar(){
  const { user, loading } = useContext(AuthContext)
  // while loading user profile, avoid showing admin/user specific links
  if (loading) {
    return (
      <div className="w-64 bg-white border-r h-screen p-4">
        <div className="text-lg font-semibold mb-4">Loading...</div>
      </div>
    )
  }
  const role = user?.role || 'user'
  return (
    <aside className="bg-white/95 backdrop-blur-md border-r border-white/20 shadow-3xl flex flex-col h-screen" aria-label="Thanh điều hướng">
      <div className="p-6 border-b border-gray-100">
        <div className="font-bold text-xl flex gap-3 items-center text-indigo-600">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white">
            <i className="fas fa-dog text-lg"/>
          </div>
          HIDAY PET
        </div>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {role === 'admin' ? (
            <>
              <li>
                <NavLink to="/dashboard" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-th-large mr-3 text-lg"/>
                  Tổng quan
                </NavLink>
              </li>
              <li>
                <NavLink to="/pets" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-paw mr-3 text-lg"/>
                  Thú cưng
                </NavLink>
              </li>
              <li>
                <NavLink to="/products" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-boxes mr-3 text-lg"/>
                  Sản phẩm
                </NavLink>
              </li>
              <li>
                <NavLink to="/services" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-concierge-bell mr-3 text-lg"/>
                  Dịch vụ
                </NavLink>
              </li>
              <li>
                <NavLink to="/scheduled-events" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-calendar-alt mr-3 text-lg"/>
                  Lịch hẹn
                </NavLink>
              </li>
              <li>
                <NavLink to="/health-records" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-notes-medical mr-3 text-lg"/>
                  Hồ sơ y tế
                </NavLink>
              </li>
              <li>
                <NavLink to="/reports" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-chart-line mr-3 text-lg"/>
                  Báo cáo
                </NavLink>
              </li>
              <li>
                <NavLink to="/users" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-users mr-3 text-lg"/>
                  Người dùng
                </NavLink>
              </li>
              <li>
                <NavLink to="/orders" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-receipt mr-3 text-lg"/>
                  Đơn hàng
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/portal" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-home mr-3 text-lg"/>
                  Trang của tôi
                </NavLink>
              </li>
              <li>
                <NavLink to="/portal/pets" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-paw mr-3 text-lg"/>
                  Thú cưng của tôi
                </NavLink>
              </li>
              <li>
                <NavLink to="/portal/products" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-boxes mr-3 text-lg"/>
                  Sản phẩm
                </NavLink>
              </li>
              <li>
                <NavLink to="/portal/orders" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-receipt mr-3 text-lg"/>
                  Đơn hàng
                </NavLink>
              </li>
              <li>
                <NavLink to="/portal/services" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-concierge-bell mr-3 text-lg"/>
                  Dịch vụ
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
                  <i className="fas fa-user mr-3 text-lg"/>
                  Hồ sơ
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  )
}
