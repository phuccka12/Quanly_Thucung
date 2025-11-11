import React, { createContext, useState, useEffect } from 'react'
import { fetchWithAuth } from './api'

export const AuthContext = createContext({
  user: null,
  setUser: ()=>{},
  loading: false,
  logout: ()=>{},
  refresh: ()=>{},
})

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const refresh = async ()=>{
    const token = localStorage.getItem('hiday_pet_token')
    if (!token){ setUser(null); return }
    setLoading(true)
    try{
      const u = await fetchWithAuth('/users/me')
      setUser(u)
    }catch(e){
      setUser(null)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{
    refresh()
    const onToken = ()=> refresh()
    window.addEventListener('tokenChanged', onToken)
    return ()=> window.removeEventListener('tokenChanged', onToken)
  }, [])

  const logout = ()=>{
    localStorage.removeItem('hiday_pet_token')
    localStorage.removeItem('hiday_pet_saved_email')
    setUser(null)
    window.dispatchEvent(new Event('tokenChanged'))
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
