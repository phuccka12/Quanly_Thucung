import React, { useEffect, useMemo, useState } from 'react'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { fetchWithAuth, API_BASE_URL } from '../api'


Chart.register(ArcElement, Tooltip, Legend)


// UI helpers
const currency = (n)=> new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(n||0)
const number = (n)=> new Intl.NumberFormat('vi-VN').format(n||0)
const datetime = (s)=> new Date(s).toLocaleString('vi-VN')


const Skeleton = ({className=''}) => (
<div className={`animate-pulse rounded bg-gray-100 ${className}`} />
)


const Badge = ({tone='gray', children}) => (
<span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${tone}-100 text-${tone}-700`}>{children}</span>
)


const StatCard = ({icon, tone='orange', value, label, loading}) => (
<article className="stat-card bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
<div className="flex items-center justify-between">
<div>
<div className="text-3xl font-bold text-gray-900 mb-1">
{loading ? <Skeleton className="h-8 w-24"/> : number(value)}
</div>
<div className="text-sm text-gray-600">{label}</div>
</div>
<div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl bg-gradient-to-br from-${tone}-400 to-${tone}-600`} aria-hidden>
<i className={icon}/>
</div>
</div>
</article>
)


const Card = ({title, badge, children, className=''}) => (
<article className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ${className}`}>
<div className="flex items-center justify-between mb-4">
<h3 className="text-lg font-semibold text-gray-800">{title}</h3>
{badge}
</div>
{children}
</article>
)


export default function Dashboard(){
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)


const [stats, setStats] = useState({ total_pets: 0, upcoming_events_count: 0, total_health_records:0, due_vaccinations_count:0 })
const [petsBySpecies, setPetsBySpecies] = useState({})
const [latestPets, setLatestPets] = useState([])
const [lowStock, setLowStock] = useState([])
const [events, setEvents] = useState([])
const [revenue, setRevenue] = useState(null)


useEffect(()=>{
const ac = new AbortController()
async function load(){
setLoading(true)
setError(null)
try{
const d = await fetchWithAuth(`${API_BASE_URL}/dashboard/`, { signal: ac.signal })
if (d) {
setStats({
total_pets: d.total_pets || 0,
upcoming_events_count: d.upcoming_events_count || 0,
total_health_records: d.total_health_records || 0,
due_vaccinations_count: d.due_vaccinations_count || 0
})
setPetsBySpecies(d.pets_by_species || {})
setLatestPets(d.latest_pets || [])
}
}catch(e){ 
if (e.name !== 'AbortError') {
setError('Không thể tải dữ liệu dashboard')
console.error('dashboard load', e) 
}
}

// widgets
try{ const ls = await fetchWithAuth(`${API_BASE_URL}/products/low-stock`, { signal: ac.signal }); setLowStock(ls || []) } catch(e){ if (e.name !== 'AbortError') console.error(e) }
try{ const ev = await fetchWithAuth(`${API_BASE_URL}/scheduled-events/upcoming`, { signal: ac.signal }); setEvents(ev || []) } catch(e){ if (e.name !== 'AbortError') console.error(e) }
try{ const end = new Date(); const start = new Date(); start.setDate(end.getDate()-7); const qs = `?start_date=${start.toISOString()}&end_date=${end.toISOString()}`; const rev = await fetchWithAuth(`${API_BASE_URL}/reports/revenue${qs}`, { signal: ac.signal }); setRevenue(rev) } catch(e){ if (e.name !== 'AbortError') console.error(e) }

setLoading(false)
}
load()
return ()=> ac.abort()
},[])

const doughnutData = {
labels: Object.keys(petsBySpecies),
datasets: [{ data: Object.values(petsBySpecies), backgroundColor: ['#f28c4b','#ffd39a','#36A2EB','#9b59b6','#4BC0C0'] }]
}

return (
<>
<div className="mb-8">
<h1 className="text-4xl font-bold text-gray-800 mb-2">Tổng quan</h1>
<p className="text-gray-600">Chào mừng bạn đến với hệ thống quản lý thú cưng HIDAY PET</p>
<div className="flex gap-4 mt-6">
<button className="btn-primary">Thêm thú cưng</button>
<button className="btn-secondary">Tạo lịch hẹn</button>
</div>
</div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
<StatCard icon="fas fa-paw" tone="orange" value={stats.total_pets} label="Tổng số thú cưng" loading={loading} />
<StatCard icon="fas fa-calendar-check" tone="blue" value={stats.upcoming_events_count} label="Lịch hẹn (24h tới)" loading={loading} />
<StatCard icon="fas fa-notes-medical" tone="green" value={stats.total_health_records} label="Tổng hồ sơ y tế" loading={loading} />
<StatCard icon="fas fa-syringe" tone="red" value={stats.due_vaccinations_count} label="Tiêm chủng (30 ngày tới)" loading={loading} />
</section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
<div className="lg:col-span-2">
<Card title="Thống kê theo loài" badge={<Badge tone="indigo">Biểu đồ</Badge>}>
<div className="h-80 flex items-center justify-center">
{Object.keys(petsBySpecies).length ? <Doughnut data={doughnutData} options={{maintainAspectRatio:false, plugins:{legend:{position:'bottom'}}}}/> : <div className="text-gray-500 text-center">Không có dữ liệu biểu đồ</div>}
</div>
</Card>
</div>

<div>
<Card title="Thú cưng mới nhất" badge={<a className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors" href="#">Xem tất cả</a>}>
{latestPets.length ? (
<div className="space-y-3">
{latestPets.slice(0,5).map(p=> (
<div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
<div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
{p.name.charAt(0).toUpperCase()}
</div>
<div>
<div className="font-medium text-gray-900">{p.name}</div>
<div className="text-sm text-gray-500">{p.species} • {p.owner_name}</div>
</div>
</div>
))}
</div>
) : (
<div className="text-gray-500 text-center py-8">Không có thú cưng mới.</div>
)}
</Card>
</div>
</section>

<section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
<div>
<Card title="Sản phẩm sắp hết hàng" badge={<Badge tone="red">Cảnh báo</Badge>}>
<div className="space-y-4">
{lowStock.length ? lowStock.slice(0,5).map(it=> (
<div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100" key={it.id}>
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
<i className="fas fa-box text-red-600"/>
</div>
<div>
<div className="font-medium text-gray-900">{it.name}</div>
<div className="text-sm text-gray-500">Sản phẩm</div>
</div>
</div>
<div className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-semibold">{it.stock_quantity} còn</div>
</div>
)) : <div className="text-gray-500 text-center py-8">Không có sản phẩm sắp hết.</div>}
</div>
</Card>
</div>

<div>
<Card title="Lịch hẹn sắp tới" badge={<Badge tone="blue">24 giờ</Badge>}>
<div className="space-y-4">
{events.length ? events.slice(0,5).map(ev=> (
<div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100" key={ev.id}>
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
<i className="fas fa-calendar text-blue-600"/>
</div>
<div>
<div className="font-medium text-gray-900">{ev.title || ev.type}</div>
<div className="text-sm text-gray-500">{ev.pet_name} • {new Date(ev.event_datetime).toLocaleString()}</div>
</div>
</div>
</div>
)) : <div className="text-gray-500 text-center py-8">Không có lịch hẹn sắp tới.</div>}
</div>
</Card>
</div>
</section>

      <section className="mt-6 sm:mt-8">
        <Card title="Doanh thu (7 ngày)" badge={<Badge tone="green">Tổng</Badge>} className="col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl">
                <i className="fas fa-dollar-sign"/>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tổng doanh thu 7 ngày</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{revenue ? currency(revenue.total_revenue) : '0 VND'}</div>
              </div>
            </div>
          </div>
        </Card>
      </section>      <footer className="mt-8 sm:mt-12 text-center text-gray-500 text-xs sm:text-sm py-4 sm:py-6">© {new Date().getFullYear()} HIDAY PET - Hệ thống quản lý thú cưng chuyên nghiệp</footer>
</>
)
}
