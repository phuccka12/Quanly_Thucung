import React, { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BASE_URL } from '../api'
import { ToastContext } from './ToastProvider'
import { AuthContext } from '../AuthContext'
import { useRef } from 'react'

export default function Topbar(){
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  // use current user from AuthContext
  const { user, loading, logout } = useContext(AuthContext)
  const { unread, markAllRead, notifications, markRead, clearNotification } = useContext(ToastContext)
  const [showNotifications, setShowNotifications] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState({ products: [], pets: [], services: [] })
  const [pageSuggestions, setPageSuggestions] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimer = useRef(null)
  const searchAbort = useRef(null)

  // close notifications menu when clicking outside
  useEffect(()=>{
    const onDoc = ()=> setShowNotifications(false)
    if (showNotifications) window.addEventListener('click', onDoc)
    return ()=> window.removeEventListener('click', onDoc)
  }, [showNotifications])
  // close search results when clicking outside
  useEffect(()=>{
    const onDoc = (e)=>{
      if(!e.target.closest) return
      const inside = e.target.closest('#topbar-search')
      if(!inside) setShowSearchResults(false)
    }
    if (showSearchResults) window.addEventListener('click', onDoc)
    return ()=> window.removeEventListener('click', onDoc)
  }, [showSearchResults])
  // AuthContext will refresh user on tokenChanged; no local fetch needed

  const resolveAvatarUrl = (u)=>{
    if (!u) return null
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    if (u.startsWith('/')) return `${BASE_URL}${u}`
    return `${BASE_URL}/${u}`
  }

  // handle search input with debounce
  const handleSearchChange = (e)=>{
    const v = e.target.value
    setQuery(v)
    setShowSearchResults(!!v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (searchAbort.current) { try{ searchAbort.current.abort() }catch(e){} }
    // client-side page matches (quick navigation)
    const pages = [
      { name: 'Tổng quan', path: '/dashboard' },
      { name: 'Thú cưng', path: '/pets' },
      { name: 'Sản phẩm', path: '/products' },
      { name: 'Dịch vụ', path: '/services' },
      { name: 'Lịch hẹn', path: '/scheduled-events' },
      { name: 'Hồ sơ y tế', path: '/health-records' },
      { name: 'Báo cáo', path: '/reports' },
      { name: 'Hồ sơ cá nhân', path: '/profile' }
    ]
    if (!v || v.length < 2){
      setSuggestions({ products: [], pets: [], services: [] })
      setPageSuggestions([])
      return
    }
    const qLow = v.toLowerCase()
    setPageSuggestions(pages.filter(p=> p.name.toLowerCase().includes(qLow)))
    searchTimer.current = setTimeout(async ()=>{
      setLoadingSearch(true)
      const q = encodeURIComponent(v)
      const ac = new AbortController(); searchAbort.current = ac
      try{
        const [p, pe, s] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/products/paginated?skip=0&limit=5&search=${q}`, { signal: ac.signal }).catch(()=>({ data: [] })),
          fetchWithAuth(`${API_BASE_URL}/pets/?skip=0&limit=5&search=${q}`, { signal: ac.signal }).catch(()=>({ data: [] })),
          fetchWithAuth(`${API_BASE_URL}/services/paginated?skip=0&limit=5&search=${q}`, { signal: ac.signal }).catch(()=>({ data: [] })),
        ])
        setSuggestions({ products: p.data || [], pets: pe.data || [], services: s.data || [] })
      }catch(err){
        console.error('search error', err)
      }finally{
        setLoadingSearch(false)
      }
    }, 300)
  }

  const handleSelectSuggestion = (category, item, q)=>{
    // dispatch event so list pages can pick up and set their local search state
    window.dispatchEvent(new CustomEvent('navigateToSearch', { detail: { category, search: q } }))
    // navigate to the list page
    if (category === 'products') navigate('/products')
    if (category === 'pets') navigate('/pets')
    if (category === 'services') navigate('/services')
    // close dropdown
    setShowSearchResults(false)
    setQuery('')
    setSuggestions({ products: [], pets: [], services: [] })
  }

  // Toast listener: listen for window 'showToast' CustomEvent { detail: { message, type? } }
  // (Toasts are handled globally by ToastProvider)

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Tổng quan'
      case '/pets':
        return 'Thú cưng'
      case '/products':
        return 'Sản phẩm'
      case '/services':
        return 'Dịch vụ'
      case '/reports':
        return 'Báo cáo'
      default:
        return 'Tổng quan'
    }
  }

  const toggleTheme = ()=>{
    const html = document.documentElement
    const currentTheme = html.getAttribute('data-theme') || 'light'
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleLogout = () => {
    // use AuthContext logout if available, otherwise fallback
    if (typeof logout === 'function') {
      logout()
    } else {
      localStorage.removeItem('hiday_pet_token')
      localStorage.removeItem('hiday_pet_saved_email')
      window.dispatchEvent(new Event('tokenChanged'))
      navigate('/login')
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-white/20 shadow-lg flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
      <button className="p-2 sm:p-3 rounded-xl hover:bg-gray-100 transition-all duration-200" id="btnSidebar" aria-label="Mở menu">
        <i className="fas fa-bars text-gray-600"/>
      </button>
      <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
        Bảng điều khiển / <strong className="text-indigo-600">{getBreadcrumb()}</strong>
      </div>
      <div className="flex-1"/>
      <div id="topbar-search" className="relative hidden sm:block">
        <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"/>
        <input value={query} onChange={handleSearchChange} className="pl-12 pr-4 py-3 w-64 lg:w-80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm" placeholder="Tìm nhanh…"/>
        { showSearchResults && (
          <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <div className="p-2 text-xs text-gray-500">Gợi ý</div>
            <div className="max-h-56 overflow-auto">
              {pageSuggestions.length > 0 && (
                <div>
                  <div className="px-4 py-1 text-xs text-gray-400">Trang</div>
                  {pageSuggestions.map(pg => (
                    <button key={pg.path} type="button" onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); navigate(pg.path); setShowSearchResults(false); setQuery('') }} className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <div className="text-sm text-gray-800">{pg.name}</div>
                    </button>
                  ))}
                </div>
              )}
              {loadingSearch && <div className="px-4 py-2 text-sm text-gray-500">Đang tìm...</div>}
              {(!loadingSearch && (suggestions.products.length || suggestions.pets.length || suggestions.services.length)) ? (
                <div>
                  {suggestions.products.length > 0 && (
                    <div>
                      <div className="px-4 py-1 text-xs text-gray-400">Sản phẩm</div>
                      {suggestions.products.map(p=> (
                        <button key={`prod-${p.id || p._id || p.name}`} type="button" onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); console.debug('select product', p); handleSelectSuggestion('products', p, query) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <div className="text-sm text-gray-800">{p.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.pets.length > 0 && (
                    <div>
                      <div className="px-4 py-1 text-xs text-gray-400">Thú cưng</div>
                      {suggestions.pets.map(p=> (
                        <button key={`pet-${p.id || p._id || p.name}`} type="button" onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); console.debug('select pet', p); handleSelectSuggestion('pets', p, query) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <div className="text-sm text-gray-800">{p.name} <span className="text-xs text-gray-400">— {p.owner_name}</span></div>
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.services.length > 0 && (
                    <div>
                      <div className="px-4 py-1 text-xs text-gray-400">Dịch vụ</div>
                      {suggestions.services.map(sv=> (
                        <button key={`svc-${sv.id || sv._id || sv.name}`} type="button" onMouseDown={(e)=>{ e.preventDefault(); e.stopPropagation(); console.debug('select service', sv); handleSelectSuggestion('services', sv, query) }} className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer">
                          <div className="text-sm text-gray-800">{sv.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (!loadingSearch && <div className="px-4 py-3 text-sm text-gray-500">Không có kết quả</div>)}
            </div>
          </div>
        )}
      </div>
      <button className="p-2 sm:p-3 rounded-xl hover:bg-gray-100 transition-all duration-200" id="btnTheme" onClick={toggleTheme}>
        <i className="fas fa-adjust text-gray-600"/>
      </button>
      <div className="relative">
        <button onClick={(e)=>{ e.stopPropagation(); setShowNotifications(s=>!s) }} className="p-2 sm:p-3 rounded-xl hover:bg-gray-100 transition-all duration-200 relative">
          <i className="far fa-bell text-gray-600"/>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">{unread}</span>
          )}
        </button>
        {showNotifications && (
          <div onClick={(e)=>e.stopPropagation()} className="absolute right-0 mt-2 w-96 max-h-80 overflow-auto bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
              <div className="font-semibold">Thông báo</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>{ markAllRead(); }} className="text-sm text-indigo-600">Đánh dấu tất cả đã đọc</button>
                <button onClick={()=>{ window.dispatchEvent(new Event('markNotificationsRead')); }} className="text-sm text-gray-400">Đóng</button>
              </div>
            </div>
            <div>
              { (notifications && notifications.length>0) ? notifications.map(n=> (
                <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${n.read ? 'bg-white' : 'bg-indigo-50'}`}>
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!n.read && <button onClick={()=>{ markRead(n.id) }} className="text-xs text-indigo-600">Đánh dấu</button>}
                    <button onClick={()=>{ clearNotification(n.id) }} className="text-xs text-red-500">Xóa</button>
                  </div>
                </div>
              )) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">Không có thông báo</div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        <button 
          id="btnUserMenu"
          className="p-1 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          {user && user.avatar_url ? (
            <img src={resolveAvatarUrl(user.avatar_url)} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 21c0-3.866-3.582-7-8-7s-8 3.134-8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </button>
        {showUserMenu && (
          <div className="user-menu absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <button 
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => { setShowUserMenu(false); navigate('/profile') }}
            >
              <i className="fas fa-user"/>
              Hồ sơ cá nhân
            </button>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => setShowUserMenu(false)}
            >
              <i className="fas fa-cog"/>
              Cài đặt
            </button>
            <hr className="my-1"/>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 flex items-center gap-2"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt"/>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
      {/* toasts rendered by ToastProvider */}
    </div>
  )
}
