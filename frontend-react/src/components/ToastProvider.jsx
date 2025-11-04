import React, { createContext, useEffect, useState } from 'react'

export const ToastContext = createContext({ unread: 0, markAllRead: ()=>{}, notifications: [], markRead: ()=>{}, clearNotification: ()=>{} })

export default function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  const [notifications, setNotifications] = useState([]) // persistent list shown in menu
  const [unread, setUnread] = useState(0)

  const STORAGE_KEY = 'app_notifications_v1'

  // load persisted notifications
  useEffect(()=>{
    try{
      const raw = localStorage.getItem(STORAGE_KEY)
      if(raw){
        const parsed = JSON.parse(raw)
        if(Array.isArray(parsed)) setNotifications(parsed)
      }
    }catch(e){console.warn('Failed to load notifications from localStorage', e)}
  }, [])

  useEffect(()=>{
    const handler = (e) => {
      const d = e.detail || {}
      // badge defaults to true so notification count increases for visible toasts
      const { message = '', type = 'info', timeout = 4000 } = d
      const badge = (typeof d.badge === 'boolean') ? d.badge : true
      const id = Date.now() + Math.random()
      // transient toast: add with mounted=false for enter animation
      setToasts(prev => [...prev, { id, message, type, mounted: false }])
      // trigger enter animation in next tick
      setTimeout(()=>{
        setToasts(curr => curr.map(t => t.id === id ? { ...t, mounted: true } : t))
      }, 10)

      // persistent notification (prepend)
      setNotifications(prev => [{ id, message, type, read: false, created_at: new Date().toISOString() }, ...prev])

      // auto-dismiss: start exit animation then remove
      setTimeout(()=>{
        // start exit
        setToasts(curr => curr.map(t => t.id === id ? { ...t, mounted: false } : t))
        // remove after animation (300ms)
        setTimeout(()=>{
          setToasts(curr => curr.filter(t => t.id !== id))
        }, 300)
      }, timeout)
    }
  const markHandler = ()=> setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    window.addEventListener('showToast', handler)
    window.addEventListener('markNotificationsRead', markHandler)
    return ()=>{
      window.removeEventListener('showToast', handler)
      window.removeEventListener('markNotificationsRead', markHandler)
    }
  }, [])

  // Derived unread count from notifications to keep consistent
  useEffect(()=>{
    setUnread(notifications.filter(n=>!n.read).length)
  }, [notifications])

  // persist notifications to localStorage whenever they change
  useEffect(()=>{
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    }catch(e){ console.warn('Failed to save notifications', e) }
  }, [notifications])

  const markAllRead = ()=>{
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const markRead = (id)=>{
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const clearNotification = (id)=>{
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <ToastContext.Provider value={{ unread, markAllRead, notifications, markRead, clearNotification }}>
      {children}
      {/* Toast UI */}
      <div className="fixed right-4 top-16 z-50 flex flex-col items-end gap-2">
        {toasts.map(t=> {
          // color mapping: 'delete' and 'error' -> red, 'update'/'info' -> blue, 'success' -> green, fallback -> neutral
          const classes = t.type === 'error' || t.type === 'delete'
            ? 'bg-red-50 border-red-200 text-red-800'
            : t.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : t.type === 'update' || t.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-white border-gray-200 text-gray-800'

          const anim = t.mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'

          const icon = t.type === 'success' ? (
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
          ) : t.type === 'delete' || t.type === 'error' ? (
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>
          ) : t.type === 'update' ? (
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5h6M7 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7M7 7l4-4m0 0l4 4M11 3v4"/></svg>
          ) : (
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 9a1 1 0 112 0v3a1 1 0 11-2 0V9zm.25-3.75a1.25 1.25 0 112.5 0 1.25 1.25 0 01-2.5 0z"/></svg>
          )

          return (
            <div key={t.id} className={`max-w-sm w-full px-4 py-2 rounded-lg shadow-md border ${classes} transform transition-all duration-300 ease-out ${anim}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{icon}</div>
                  <div className="text-sm">{t.message}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>{
                    // start exit animation, then remove
                    setToasts(curr => curr.map(x => x.id === t.id ? { ...x, mounted: false } : x))
                    setTimeout(()=> setToasts(curr => curr.filter(x=>x.id !== t.id)), 300)
                  }} className="text-xs text-gray-500">Đóng</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
