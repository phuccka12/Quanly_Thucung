import React, { useEffect, useState } from 'react'
import { fetchWithAuth } from '../api'

export default function AdminOrders(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [processing, setProcessing] = useState(false)

  const load = async () => {
    setLoading(true)
    try{
      const res = await fetchWithAuth('/orders?skip=0&limit=200')
      setOrders(res || [])
    }catch(err){ console.error(err); setError('Không tải được danh sách đơn hàng') }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  const view = async (order_id) => {
    setViewing(null)
    try{
      const res = await fetchWithAuth(`/orders/${order_id}`)
      setViewing(res)
    }catch(err){ handleError('Tải đơn hàng', err) }
  }

  const setStatus = async (order_id, status) => {
    setProcessing(true)
    try{
      await fetchWithAuth(`/orders/${order_id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
      await load()
      setViewing(null)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã xác nhận đơn hàng', type: 'update' } })) }catch(e){}
    }catch(err){ handleError('Cập nhật trạng thái', err) }
    finally{ setProcessing(false) }
  }

  // Improved error reporting for admin actions (shows server status/body)
  const handleError = (action, err) => {
    console.error(action, err)
    const code = err?.status || 'unknown'
    const body = err?.body || err?.message || JSON.stringify(err)
    try{
      alert(`${action} thất bại (status=${code}): ${typeof body === 'string' ? body.substring(0,200) : JSON.stringify(body)}`)
    }catch(e){ /* ignore alert errors */ }
    setError(`${action} thất bại`)
  }

  const adminCancel = async (order_id) => {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return
    setProcessing(true)
    try{
      const res = await fetchWithAuth(`/orders/${order_id}/cancel`, { method: 'POST' })
      await load()
      setViewing(null)
      try{ window.dispatchEvent(new CustomEvent('showToast', { detail: { message: 'Đã hủy đơn', type: 'delete' } })) }catch(e){}
    }catch(err){ handleError('Hủy đơn', err) }
    finally{ setProcessing(false) }
  }


  if (loading) return <div>Đang tải...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Quản lý đơn hàng</h2>
        <div className="flex items-center gap-2">
          <button onClick={load} className="px-3 py-1 border rounded">Làm mới</button>
        </div>
      </div>

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Mã đơn hàng</th>
              <th className="p-3 text-left">Khách hàng</th>
              <th className="p-3 text-left">Điện thoại / Địa chỉ</th>
              <th className="p-3 text-left">Số lượng</th>
              <th className="p-3 text-left">Tổng</th>
              <th className="p-3 text-left">Trạng thái</th>
              <th className="p-3 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id || o._id} className="border-t">
                <td className="p-3">{o.id}</td>
                <td className="p-3">
                  <div className="font-medium">{o.user_name || o.user_email || '-'}</div>
                  <div className="text-sm text-gray-500">{o.user_email || ''}</div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-900">{(o.shipping && (o.shipping.phone || o.shipping.name)) || o.user_phone || '-'}</div>
                  <div className="text-sm text-gray-500">{(o.shipping && o.shipping.address) || '-'}</div>
                </td>
                <td className="p-3">{(o.items || []).length}</td>
                <td className="p-3">{o.total}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={()=>view(o.id)} className="px-2 py-1 border rounded text-sm">Xem</button>
                  <button onClick={()=>setStatus(o.id, 'confirmed')} disabled={processing} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Xác nhận</button>
                  <button onClick={()=>adminCancel(o.id)} disabled={processing} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Hủy</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-40" onClick={()=>setViewing(null)} />
          <div className="relative bg-white rounded shadow-lg w-11/12 max-w-3xl p-4">
            <h3 className="font-semibold mb-2">Đơn {viewing.id}</h3>
            <div className="mb-2 text-sm text-gray-700">
              <div><strong>Khách hàng:</strong> {viewing.user_name || viewing.user_email || '-'}</div>
              <div><strong>Email:</strong> {viewing.user_email || '-'}</div>
              <div><strong>Điện thoại:</strong> {(viewing.shipping && viewing.shipping.phone) || '-'}</div>
              <div><strong>Địa chỉ:</strong> {(viewing.shipping && viewing.shipping.address) || '-'}</div>
            </div>
            <div className="grid gap-2">
              {(viewing.items || []).map((it, idx) => (
                <div key={idx} className="p-2 border rounded flex justify-between">
                  <div>
                    <div className="font-medium">{it.name || it.product_id}</div>
                    <div className="text-sm text-gray-500">Số lượng: {it.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Giá: {it.unit_price ? it.unit_price : '-'}</div>
                    <div className="text-sm">Tạm tính: {it.subtotal ? it.subtotal : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setViewing(null)} className="px-3 py-1 border rounded">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
