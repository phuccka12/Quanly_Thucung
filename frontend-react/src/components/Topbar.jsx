import React from 'react'

export default function Topbar(){
  const toggleTheme = ()=>{
    const html = document.documentElement
    const now = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', now)
    localStorage.setItem('theme', now)
  }
  return (
    <div className="topbar">
      <button className="icon-btn" id="btnSidebar" aria-label="Mở menu"><i className="fas fa-bars"/></button>
      <div className="crumb">Bảng điều khiển / <strong>Tổng quan</strong></div>
      <div className="grow"/>
      <label className="search"><i className="fas fa-search"/><input placeholder="Tìm nhanh…"/></label>
      <button className="icon-btn" id="btnTheme" onClick={toggleTheme}><i className="fas fa-adjust"/></button>
      <button className="icon-btn"><i className="far fa-bell"/></button>
      <button className="icon-btn"><i className="far fa-user"/></button>
    </div>
  )
}
