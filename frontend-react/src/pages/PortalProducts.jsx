import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL, BASE_URL } from '../api'

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500">Đóng</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function PortalProducts(){
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 12
  // Cart state
  const [cart, setCart] = useState([]) // { productId, name, unit_price, quantity, stock }
  const [showCart, setShowCart] = useState(false)
  const [shipping, setShipping] = useState({ name: '', address: '', phone: '' })
  const [orderError, setOrderError] = useState(null)

  useEffect(()=>{ load() }, [page, search])

  const load = async () => {
    setLoading(true)
    try{
      const skip = (page - 1) * pageSize
      const params = new URLSearchParams({ skip: String(skip), limit: String(pageSize) })
      if (search) params.append('search', search)
      const res = await fetchWithAuth(`${API_BASE_URL}/portal/products/paginated?${params}`)
      setProducts(res.data || [])
      setTotal(res.total || 0)
    }catch(e){
      console.error('load products', e)
    }finally{ setLoading(false) }
  }

  const cartTotal = cart.reduce((s, it) => s + (Number(it.unit_price || 0) * (it.quantity || 0)), 0)

  const removeCartItem = (pid) => setCart(prev => prev.filter(i => i.productId !== pid))
  const updateCartQty = (pid, qty) => setCart(prev => prev.map(i => i.productId === pid ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock || 9999)) } : i))

  const handleCheckout = async () => {
    setOrderError(null)
    if (cart.length === 0) { setOrderError('Giỏ hàng trống'); return }
    if (!shipping.name || !shipping.address) { setOrderError('Vui lòng nhập tên và địa chỉ giao hàng'); return }
    try {
      const payload = {
        items: cart.map(i => ({ product_id: i.productId, quantity: Number(i.quantity) })),
        shipping: { name: shipping.name, address: shipping.address, phone: shipping.phone }
      }
      const res = await fetchWithAuth('/portal/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      // on success, backend returns { order_id, total }
      setCart([])
      setShowCart(false)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đặt hàng thành công', type: 'create' } })) }catch(e){}
      // navigate user to orders page (client-side path)
      if (res && res.order_id) {
        // save last order id so orders page / UX can show confirmation if needed
        try{ sessionStorage.setItem('last_order_id', res.order_id) }catch(e){}
        window.location.href = '/portal/orders'
      }
    } catch (e) {
      console.error('checkout error', e)
      setOrderError(e?.message || 'Không thể đặt hàng')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cửa hàng</h1>
          <p className="text-sm text-gray-600">Xem và mua sản phẩm cho thú cưng</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56">
            <input value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1) }} placeholder="Tìm sản phẩm..." className="w-full px-3 py-2 border rounded" />
          </div>
          <button onClick={()=> setShowCart(true)} className="px-3 py-2 border rounded bg-white flex items-center gap-2">
            <i className="fas fa-shopping-cart" />
            <span className="text-sm">Giỏ ({cart.length})</span>
            <span className="text-xs text-gray-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}</span>
          </button>
        </div>
      </div>

      <div>
        {loading ? <div>Đang tải...</div> : (
          products.length === 0 ? (
            <div className="text-gray-500">Không có sản phẩm</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={String(p.id)} className="bg-white rounded-xl p-3 shadow-sm flex flex-col">
                  <div className="w-full h-40 bg-gray-100 rounded overflow-hidden mb-3 flex items-center justify-center">
                    {p.image_url ? <img src={p.image_url.startsWith('http') ? p.image_url : `${BASE_URL}${p.image_url}`} alt={p.name} className="w-full h-full object-cover"/> : <div className="text-gray-400">No Image</div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{p.description}</div>
                  </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price || 0)}</div>
                      <div className="flex items-center gap-2">
                        <a href={`/portal/products/${p.id}`} className="text-indigo-600 text-sm">Xem</a>
                        <button
                          onClick={() => {
                            const pid = String(p.id)
                            setCart(prev => {
                              const found = prev.find(i=> i.productId === pid)
                              if (found) return prev.map(i => i.productId === pid ? { ...i, quantity: Math.min((i.quantity||0)+1, p.stock_quantity||9999) } : i)
                              return [...prev, { productId: pid, name: p.name, unit_price: p.price, quantity: 1, stock: p.stock_quantity||0 }]
                            })
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          title="Thêm vào giỏ"
                        >Thêm</button>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Cart modal */}
      <Modal isOpen={showCart} onClose={() => setShowCart(false)} title={`Giỏ hàng (${cart.length})`}>
        <div className="space-y-3">
          {cart.length === 0 ? (
            <div className="text-gray-500">Giỏ hàng trống</div>
          ) : (
            <div>
              {cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unit_price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={item.quantity} min="1" max={item.stock} onChange={(e)=> updateCartQty(item.productId, Number(e.target.value))} className="w-20 px-2 py-1 border rounded" />
                    <div className="text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unit_price * item.quantity)}</div>
                    <button onClick={()=> removeCartItem(item.productId)} className="text-red-600">Xóa</button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between mt-3">
                <div className="font-semibold">Tổng</div>
                <div className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}</div>
              </div>

              <div className="space-y-2 mt-3">
                <input placeholder="Họ và tên" value={shipping.name} onChange={(e)=> setShipping({...shipping, name: e.target.value})} className="w-full px-3 py-2 border rounded" />
                <input placeholder="Địa chỉ giao hàng" value={shipping.address} onChange={(e)=> setShipping({...shipping, address: e.target.value})} className="w-full px-3 py-2 border rounded" />
                <input placeholder="Số điện thoại" value={shipping.phone} onChange={(e)=> setShipping({...shipping, phone: e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>

              {orderError && <div className="text-red-600">{orderError}</div>}

              <div className="flex gap-2 mt-3">
                <button onClick={()=> setShowCart(false)} className="flex-1 px-4 py-2 border rounded">Hủy</button>
                <button onClick={handleCheckout} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded">Đặt hàng</button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {total > pageSize && (
        <div className="flex items-center justify-center space-x-2">
          <button disabled={page===1} onClick={()=> setPage(page-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <div className="px-3 py-1">{page}</div>
          <button disabled={page*pageSize >= total} onClick={()=> setPage(page+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}

