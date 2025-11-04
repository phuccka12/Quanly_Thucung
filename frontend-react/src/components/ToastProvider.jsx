import React, { createContext, useEffect, useState } from 'react'

export const ToastContext = createContext({ unread: 0, markAllRead: ()=>{}, notifications: [], markRead: ()=>{}, clearNotification: ()=>{} })

export default function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  const [notifications, setNotifications] = useState([]) // persistent list shown in menu
  const [unread, setUnread] = useState(0)

  useEffect(()=>{
    const handler = (e) => {
      const d = e.detail || {}
      // badge defaults to true so notification count increases for visible toasts
      const { message = '', type = 'info', timeout = 4000 } = d
      const badge = (typeof d.badge === 'boolean') ? d.badge : true
      const id = Date.now() + Math.random()
  // transient toast
  setToasts(prev => [...prev, { id, message, type }])
  // persistent notification (prepend)
  setNotifications(prev => [{ id, message, type, read: false, created_at: new Date().toISOString() }, ...prev])
      setTimeout(()=>{
        setToasts(curr => curr.filter(t => t.id !== id))
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

          return (
            <div key={t.id} className={`max-w-sm w-full px-4 py-2 rounded-lg shadow-md border ${classes}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">{t.message}</div>
                <button onClick={()=> setToasts(curr => curr.filter(x=>x.id !== t.id))} className="text-xs text-gray-500">Đóng</button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
