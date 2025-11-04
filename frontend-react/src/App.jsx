import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Pets from './pages/Pets'
import Products from './pages/Products'
import Services from './pages/Services'
import ScheduledEvents from './pages/ScheduledEvents'
import HealthRecords from './pages/HealthRecords'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('hiday_pet_token'))

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('hiday_pet_token'))
    }
    const handleTokenChange = () => {
      setToken(localStorage.getItem('hiday_pet_token'))
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('tokenChanged', handleTokenChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tokenChanged', handleTokenChange)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {token ? (
        <div className="grid grid-cols-[280px_1fr] w-full min-h-screen">
          <Sidebar />
          <div className="flex flex-col">
            <Topbar />
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard/>} />
                <Route path="/pets" element={<Pets/>} />
                <Route path="/products" element={<Products/>} />
                <Route path="/services" element={<Services/>} />
                <Route path="/scheduled-events" element={<ScheduledEvents/>} />
                <Route path="/health-records" element={<HealthRecords/>} />
                <Route path="/reports" element={<Reports/>} />
                <Route path="/profile" element={<Profile/>} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  )
}
