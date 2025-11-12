import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL } from '../api'

export default function PortalOrders(){
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(null)
  const [rawRes, setRawRes] = useState(null)
  const [cancelErrors, setCancelErrors] = useState({})
  const [cancelling, setCancelling] = useState({})

  useEffect(()=>{ load() }, [])

  const load = async () => {
    setLoading(true)
    try{
  const res = await fetchWithAuth('/portal/orders')
  console.log('PortalOrders - raw response:', res)
  setRawRes(res)
  // Normalize possible response shapes into an array of order objects
  let normalized = []
  if (!res) normalized = []
  else if (Array.isArray(res)) normalized = res
  else if (res.data && Array.isArray(res.data)) normalized = res.data
  else if (res.data && res.data.data && Array.isArray(res.data.data)) normalized = res.data.data
  else if (res.data && Array.isArray(res.data?.docs)) normalized = res.data.docs
  else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.items)) normalized = res.data.items
  else if (Array.isArray(res.orders)) normalized = res.orders
  else normalized = Array.isArray(res) ? res : []

  // Ensure each order has an id string (and keep legacy _id)
  normalized = normalized.map(o => {
    const copy = { ...o }
    if (!copy.id && copy._id) copy.id = typeof copy._id === 'object' ? String(copy._id) : copy._id
    if (!copy.id && copy.id === undefined) copy.id = null
    return copy
  })

  setOrders(normalized)
    }catch(e){
      console.error('load orders', e)
      setError('Không thể tải đơn hàng')
    }finally{ setLoading(false) }
  }

  const cancelOrder = async (orderId) => {
    if (!orderId) return
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return
    setCancelErrors(prev => ({...prev, [orderId]: null}))
    setCancelling(prev => ({...prev, [orderId]: true}))
    try {
      const res = await fetchWithAuth(`/portal/orders/${orderId}`, { method: 'DELETE' })
      console.log('cancelOrder result', res)
      // update local orders: mark as cancelled
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o)))
      try { window.dispatchEvent(new CustomEvent('showToast', { detail: { message: res?.detail || 'Đã hủy đơn hàng', type: 'delete' } })) } catch(e) {}
    } catch (err) {
      console.error('cancel order error', err)
      const msg = err?.body || err?.message || 'Không thể hủy đơn hàng. Vui lòng liên hệ CSKH.'
      setCancelErrors(prev => ({ ...prev, [orderId]: msg }))
    } finally {
      setCancelling(prev => ({...prev, [orderId]: false}))
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
        <p className="text-sm text-gray-600">Lịch sử đặt hàng và trạng thái</p>
      </div>

      {loading ? <div>Đang tải...</div> : (
        error ? <div className="text-red-600">{error}</div> : (
          orders.length === 0 ? (
            <div>
              <div className="text-gray-500">Bạn chưa có đơn hàng nào</div>
              <div className="mt-2 text-xs text-gray-500">Nếu bạn vừa đặt hàng, thử nhấn <button onClick={load} className="underline text-blue-600">tải lại</button>.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(o => (
                <div key={o.id || o._id} className="bg-white border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm text-gray-600">Mã đơn: {o.id || o._id || '—'}</div>
                      <div className="text-xs text-gray-500">Trạng thái: {o.status || 'new'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(o.total || 0)}</div>
                      <div className="text-xs text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleString() : '—'}</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    {o.items && o.items.length > 0 && (
                      <div className="space-y-2">
                        {o.items.map(it => (
                          <div key={it.product_id} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{it.name}</div>
                              <div className="text-xs text-gray-500">Số lượng: {it.quantity}</div>
                            </div>
                            <div className="text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.subtotal || (it.unit_price * it.quantity) || 0)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                    <div className="mt-3 flex justify-end">
                      { (o.status || '').toLowerCase() === 'pending' ? (
                        <button onClick={()=>cancelOrder(o.id || o._id)} disabled={!!cancelling[o.id || o._id]} className={`px-3 py-1 rounded text-sm ${cancelling[o.id || o._id] ? 'bg-yellow-400 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}>{cancelling[o.id || o._id] ? 'Đang huỷ...' : 'Hủy đơn'}</button>
                      ) : (
                        <button disabled className="px-3 py-1 rounded bg-gray-200 text-gray-500 text-sm">Không thể hủy</button>
                      )}
                    </div>
                    { cancelErrors[o.id || o._id] && (
                      <div className="mt-2 text-sm text-red-600">{cancelErrors[o.id || o._id]}</div>
                    )}
                </div>
              ))}
            </div>
          )
        )
      )}
    </div>
  )
}
