import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar(){
  return (
    <aside className="sidebar" aria-label="Thanh điều hướng">
      <div className="brand"><i className="fas fa-dog"/> HIDAY PET</div>
      <nav>
        <ul className="menu">
          <li><NavLink to="/dashboard" className={({isActive})=> isActive? 'active':''}><i className="fas fa-th-large"/> Tổng quan</NavLink></li>
          <li><NavLink to="/pets"><i className="fas fa-paw"/> Thú cưng</NavLink></li>
          <li><NavLink to="/products"><i className="fas fa-boxes"/> Sản phẩm</NavLink></li>
          <li><NavLink to="/services"><i className="fas fa-concierge-bell"/> Dịch vụ</NavLink></li>
          <li><NavLink to="/reports"><i className="fas fa-chart-line"/> Báo cáo</NavLink></li>
        </ul>
      </nav>
      <div style={{flex:1}} />
      <button className="logout" id="logout-button" onClick={()=>{ localStorage.removeItem('hiday_pet_token'); window.location.href='/login.html' }}><i className="fas fa-sign-out-alt"/> Đăng xuất</button>
    </aside>
  )
}
