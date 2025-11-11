import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL, BASE_URL } from '../api'

export default function PortalProducts(){
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 12

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cửa hàng</h1>
          <p className="text-sm text-gray-600">Xem và mua sản phẩm cho thú cưng</p>
        </div>
        <div className="w-72">
          <input value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1) }} placeholder="Tìm sản phẩm..." className="w-full px-3 py-2 border rounded" />
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
                    <div>
                      <a href={`/portal/products/${p.id}`} className="text-indigo-600 text-sm">Xem</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

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

