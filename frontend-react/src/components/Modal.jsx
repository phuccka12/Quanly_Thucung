import React, { useEffect, useRef, useState } from 'react'

export default function Modal({ isOpen, onClose, title, children, className='' }){
  const ref = useRef(null)
  const [maxBodyHeight, setMaxBodyHeight] = useState(0)

  useEffect(()=>{
    if (isOpen){
      setMaxBodyHeight(Math.max(120, window.innerHeight - 160))
    }
  },[isOpen])

  useEffect(()=>{
    const onResize = () => {
      setMaxBodyHeight(Math.max(120, window.innerHeight - 160))
    }
    window.addEventListener('resize', onResize)
    return ()=> window.removeEventListener('resize', onResize)
  }, [])

  useEffect(()=>{
    const onKey = (e)=>{ if (e.key === 'Escape') onClose && onClose() }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={ref} className={`relative bg-white rounded-2xl shadow-lg ${className}`} style={{ minWidth: 320, maxWidth: 'min(92vw, 900px)' }}>
        <div className="px-4 py-3 border-b rounded-t-2xl flex items-center justify-between bg-white">
          <div className="font-semibold">{title}</div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Đóng</button>
          </div>
        </div>
        <div className="p-4" style={{ maxHeight: maxBodyHeight, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
