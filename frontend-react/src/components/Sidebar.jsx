import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar(){
  return (
    <aside className="bg-white/95 backdrop-blur-md border-r border-white/20 shadow-2xl flex flex-col h-screen" aria-label="Thanh điều hướng">
      <div className="p-6 border-b border-gray-100">
        <div className="font-bold text-xl flex gap-3 items-center text-indigo-600">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white">
            <i className="fas fa-dog text-lg"/>
          </div>
          HIDAY PET
        </div>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink to="/dashboard" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
              <i className="fas fa-th-large mr-3 text-lg"/>
              Tổng quan
            </NavLink>
          </li>
          <li>
            <NavLink to="/pets" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
              <i className="fas fa-paw mr-3 text-lg"/>
              Thú cưng
            </NavLink>
          </li>
          <li>
            <NavLink to="/products" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
              <i className="fas fa-boxes mr-3 text-lg"/>
              Sản phẩm
            </NavLink>
          </li>
          <li>
            <NavLink to="/services" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
              <i className="fas fa-concierge-bell mr-3 text-lg"/>
              Dịch vụ
            </NavLink>
          </li>
          <li>
            <NavLink to="/scheduled-events" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
              <i className="fas fa-calendar-alt mr-3 text-lg"/>
              Lịch hẹn
            </NavLink>
          </li>
          <li>
            <NavLink to="/health-records" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
              <i className="fas fa-notes-medical mr-3 text-lg"/>
              Hồ sơ y tế
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className={({isActive})=> `flex items-center p-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'text-gray-600 hover:bg-white hover:shadow-md hover:text-indigo-600'}`}>
              <i className="fas fa-chart-line mr-3 text-lg"/>
              Báo cáo
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button className="w-full p-4 text-left text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200" id="logout-button" onClick={()=>{ localStorage.removeItem('hiday_pet_token'); window.location.href='/login.html' }}>
          <i className="fas fa-sign-out-alt mr-3"/>
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
