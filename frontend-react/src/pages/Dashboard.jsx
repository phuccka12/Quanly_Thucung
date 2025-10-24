import React, { useEffect, useState } from 'react'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { fetchWithAuth, API_BASE_URL } from '../api'

Chart.register(ArcElement, Tooltip, Legend)

export default function Dashboard(){
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total_pets: 0, upcoming_events_count: 0, total_health_records:0, due_vaccinations_count:0 })
  const [petsBySpecies, setPetsBySpecies] = useState({})
  const [latestPets, setLatestPets] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [events, setEvents] = useState([])
  const [revenue, setRevenue] = useState(null)

  useEffect(()=>{
    async function load(){
      setLoading(true)
      try{
        const d = await fetchWithAuth(`${API_BASE_URL}/dashboard/`)
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
      }catch(e){ console.error('dashboard load', e) }

      // widgets
      try{ const ls = await fetchWithAuth(`${API_BASE_URL}/products/low-stock`); setLowStock(ls || []) } catch(e){ console.error(e) }
      try{ const ev = await fetchWithAuth(`${API_BASE_URL}/scheduled-events/upcoming`); setEvents(ev || []) } catch(e){ console.error(e) }
      try{ const end = new Date(); const start = new Date(); start.setDate(end.getDate()-7); const qs = `?start_date=${start.toISOString()}&end_date=${end.toISOString()}`; const rev = await fetchWithAuth(`${API_BASE_URL}/reports/revenue${qs}`); setRevenue(rev) } catch(e){ console.error(e) }

      setLoading(false)
    }
    load()
  },[])

  const doughnutData = {
    labels: Object.keys(petsBySpecies),
    datasets: [{ data: Object.values(petsBySpecies), backgroundColor: ['#f28c4b','#ffd39a','#36A2EB','#9b59b6','#4BC0C0'] }]
  }

  return (
    <>
      <header className="page-title">
        <h2>Tổng quan</h2>
        <div className="quick-actions">
          <button className="ghost">Thêm thú cưng</button>
          <button className="primary">Tạo lịch hẹn</button>
        </div>
      </header>

      <section className="stats">
        <article className="card stat" aria-live="polite">
          <div className="icon"><i className="fas fa-paw"/></div>
          <div className="meta"><span className="value">{stats.total_pets}</span><span className="label">Tổng số thú cưng</span></div>
        </article>
        <article className="card stat" aria-live="polite">
          <div className="icon"><i className="fas fa-calendar-check"/></div>
          <div className="meta"><span className="value">{stats.upcoming_events_count}</span><span className="label">Lịch hẹn (24h tới)</span></div>
        </article>
        <article className="card stat" aria-live="polite">
          <div className="icon"><i className="fas fa-notes-medical"/></div>
          <div className="meta"><span className="value">{stats.total_health_records}</span><span className="label">Tổng hồ sơ y tế</span></div>
        </article>
        <article className="card stat" aria-live="polite">
          <div className="icon"><i className="fas fa-syringe"/></div>
          <div className="meta"><span className="value">{stats.due_vaccinations_count}</span><span className="label">Tiêm chủng (30 ngày tới)</span></div>
        </article>
      </section>

      <section className="grid">
        <article className="card">
          <div className="card-head"><h3>Thống kê theo loài</h3><span className="chip ghost">Biểu đồ</span></div>
          <div className="chart-wrap">{Object.keys(petsBySpecies).length ? <Doughnut data={doughnutData} options={{maintainAspectRatio:false, plugins:{legend:{position:'bottom'}}}}/> : <div className="empty">Không có dữ liệu biểu đồ</div>}</div>
        </article>

        <article className="card">
          <div className="card-head"><h3>Thú cưng mới nhất</h3><a className="chip ghost" href="#">Xem tất cả</a></div>
          {latestPets.length ? (
            <table className="table"><thead><tr><th>Tên</th><th>Loài</th><th>Chủ</th></tr></thead><tbody>{latestPets.map(p=> <tr key={p.id}><td>{p.name}</td><td>{p.species}</td><td>{p.owner_name}</td></tr>)}</tbody></table>
          ) : (
            <div className="empty">Không có thú cưng mới.</div>
          )}
        </article>

        <article className="card">
          <div className="card-head"><h3>Sản phẩm sắp hết hàng</h3><span className="chip ghost">Cảnh báo</span></div>
          <div className="list">{lowStock.length ? lowStock.slice(0,5).map(it=> (
            <div className="list-item" key={it.id}><div className="title">{it.name}</div><div className="pill">{it.stock_quantity} còn</div></div>
          )) : <div className="empty">Không có sản phẩm sắp hết.</div>}</div>
        </article>

        <article className="card">
          <div className="card-head"><h3>Lịch hẹn sắp tới</h3><span className="chip ghost">24 giờ</span></div>
          <div className="list">{events.length ? events.slice(0,6).map(ev=> (
            <div className="list-item" key={ev.id}><div className="title">{ev.title || ev.type}</div><div className="meta">{ev.pet_name} — {new Date(ev.event_datetime).toLocaleString()}</div></div>
          )) : <div className="empty">Không có lịch hẹn sắp tới.</div>}</div>
        </article>

        <article className="card">
          <div className="card-head"><h3>Doanh thu (7 ngày)</h3><span className="chip ghost">Tổng</span></div>
          <div className="list">{revenue ? (
            <>
              <div className="list-item"><div className="title">Tổng 7 ngày</div><div className="pill">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(revenue.total_revenue||0)}</div></div>
            </>
          ) : <div className="empty">Không có dữ liệu doanh thu.</div>}</div>
        </article>
      </section>

      <footer className="footer">© {new Date().getFullYear()} HIDAY PET</footer>
    </>
  )
}
