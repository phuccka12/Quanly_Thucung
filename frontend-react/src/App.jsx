import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

export default function App(){
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard/>} />
            {/* future routes: /pets, /products, /services, /reports ... */}
          </Routes>
        </div>
      </main>
    </div>
  )
}
