import React, { useEffect, useState } from 'react'
import { fetchWithAuth, API_BASE_URL } from '../api'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const Skeleton = ({className=''}) => (
  <div className={`animate-pulse rounded bg-gray-100 ${className}`} />
)

const Card = ({ title, value, subtitle, icon, color = 'blue' }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
        <i className={`fas ${icon} text-${color}-600`}/>
      </div>
    </div>
  </div>
)

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

export default function Reports(){
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [groupBy, setGroupBy] = useState('day')

  useEffect(() => {
    loadReport()
  }, [startDate, endDate, groupBy])

  const loadReport = async () => {
    setLoading(true)
    try {
  const params = new URLSearchParams()
      if (startDate) params.append('start_date', new Date(startDate).toISOString())
      if (endDate) params.append('end_date', new Date(endDate).toISOString())
  if (groupBy) params.append('group_by', groupBy)

      const data = await fetchWithAuth(`${API_BASE_URL}/reports/revenue?${params}`)
      setReportData(data)
    } catch (e) {
      setError('Không thể tải báo cáo')
      console.error('load report', e)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!reportData) return

    // Build a CSV export: summary + product table + service table
    const rows = []
    // Summary
    rows.push(['Key', 'Value'])
    rows.push(['Total Revenue', reportData.total_revenue || 0])
    rows.push(['Records Count', reportData.records_count || 0])
    rows.push([])

    // Products
    rows.push(['Products'])
    rows.push(['Product', 'Quantity', 'Revenue'])
    Object.entries(reportData.by_product || {}).forEach(([name, d]) => {
      rows.push([name, d.quantity || 0, d.revenue || 0])
    })
    rows.push([])

    // Services
    rows.push(['Services'])
    rows.push(['Service', 'Count', 'Revenue'])
    Object.entries(reportData.by_service || {}).forEach(([name, d]) => {
      rows.push([name, d.count || 0, d.revenue || 0])
    })

    // Convert rows to CSV string
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    const exportFileDefaultName = `bao-cao-doanh-thu-${new Date().toISOString().split('T')[0]}.csv`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2"/>
          <Skeleton className="h-4 w-96"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200">
              <Skeleton className="h-4 w-24 mb-2"/>
              <Skeleton className="h-8 w-32 mb-2"/>
              <Skeleton className="h-3 w-20"/>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <Skeleton className="h-6 w-48 mb-4"/>
          <Skeleton className="h-64 w-full"/>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">Báo cáo doanh thu</h1>
            <p className="text-gray-600 text-sm sm:text-base">Thống kê doanh thu từ sản phẩm và dịch vụ</p>
          </div>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <i className="fas fa-download"/>
            Xuất báo cáo
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
  <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {/* Preset buttons */}
          <div className="flex gap-2 mb-3 sm:mb-0 sm:mr-2">
            <button
              onClick={() => {
                // Today (local)
                const now = new Date()
                const s = new Date(now)
                s.setHours(0,0,0,0)
                const e = new Date(now)
                e.setHours(23,59,59,999)
                setStartDate(s.toISOString().split('T')[0])
                setEndDate(e.toISOString().split('T')[0])
              }}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100"
            >Hôm nay</button>

            <button
              onClick={() => {
                // This week (Monday - Sunday, local)
                const now = new Date()
                const day = now.getDay() // 0 (Sun) - 6 (Sat)
                const diffToMonday = (day + 6) % 7
                const s = new Date(now)
                s.setDate(now.getDate() - diffToMonday)
                s.setHours(0,0,0,0)
                const e = new Date(s)
                e.setDate(s.getDate() + 6)
                e.setHours(23,59,59,999)
                setStartDate(s.toISOString().split('T')[0])
                setEndDate(e.toISOString().split('T')[0])
              }}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100"
            >Tuần này</button>

            <button
              onClick={() => {
                // This month (local)
                const now = new Date()
                const s = new Date(now.getFullYear(), now.getMonth(), 1)
                s.setHours(0,0,0,0)
                const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                e.setHours(23,59,59,999)
                setStartDate(s.toISOString().split('T')[0])
                setEndDate(e.toISOString().split('T')[0])
              }}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100"
            >Tháng này</button>

            <button
              onClick={() => {
                // This year (local)
                const now = new Date()
                const s = new Date(now.getFullYear(), 0, 1)
                s.setHours(0,0,0,0)
                const e = new Date(now.getFullYear(), 11, 31)
                e.setHours(23,59,59,999)
                setStartDate(s.toISOString().split('T')[0])
                setEndDate(e.toISOString().split('T')[0])
              }}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 hover:bg-indigo-100"
            >Năm nay</button>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="ml-2">
              <label className="block text-sm text-gray-600">Nhóm theo</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl"
              >
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
                <option value="year">Năm</option>
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card
          title="Tổng doanh thu"
          value={formatCurrency(reportData?.total_revenue || 0)}
          subtitle="Từ sản phẩm và dịch vụ"
          icon="fa-dollar-sign"
          color="green"
        />
        <Card
          title="Sản phẩm đã bán"
          value={Object.keys(reportData?.by_product || {}).length}
          subtitle="Loại sản phẩm khác nhau"
          icon="fa-box"
          color="blue"
        />
        <Card
          title="Dịch vụ đã sử dụng"
          value={Object.keys(reportData?.by_service || {}).length}
          subtitle="Loại dịch vụ khác nhau"
          icon="fa-concierge-bell"
          color="purple"
        />
        <Card
          title="Số bản ghi"
          value={reportData?.records_count || 0}
          subtitle="Lượt sử dụng dịch vụ"
          icon="fa-file-alt"
          color="orange"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time series chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Doanh thu theo thời gian</h3>
          {(!reportData || !reportData.series || reportData.series.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-chart-line text-4xl mb-2"/>
              <p>Chưa có dữ liệu để hiển thị biểu đồ</p>
            </div>
          ) : (
            <div>
              <Line
                data={{
                  labels: reportData.series.map(s => s.period),
                  datasets: [{
                    label: 'Doanh thu',
                    data: reportData.series.map(s => s.revenue),
                    borderColor: 'rgba(99,102,241,1)',
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    fill: true,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }}
              />
            </div>
          )}
        </div>
        {/* Product Revenue */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Doanh thu theo sản phẩm</h3>
          {Object.keys(reportData?.by_product || {}).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-chart-bar text-4xl mb-2"/>
              <p>Chưa có dữ liệu sản phẩm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(reportData.by_product)
                .sort(([,a], [,b]) => b.revenue - a.revenue)
                .slice(0, 10)
                .map(([productName, data]) => (
                  <div key={productName} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{productName}</div>
                      <div className="text-sm text-gray-500">{data.quantity} sản phẩm</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Service Revenue */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Doanh thu theo dịch vụ</h3>
          {Object.keys(reportData?.by_service || {}).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-chart-pie text-4xl mb-2"/>
              <p>Chưa có dữ liệu dịch vụ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(reportData.by_service)
                .sort(([,a], [,b]) => b.revenue - a.revenue)
                .slice(0, 10)
                .map(([serviceName, data]) => (
                  <div key={serviceName} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{serviceName}</div>
                      <div className="text-sm text-gray-500">{data.count} lần sử dụng</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Details Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Chi tiết sản phẩm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(reportData?.by_product || {}).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  Object.entries(reportData.by_product)
                    .sort(([,a], [,b]) => b.revenue - a.revenue)
                    .map(([productName, data]) => (
                      <tr key={productName} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{productName}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{data.quantity}</td>
                        <td className="px-6 py-4 text-gray-900">{formatCurrency(data.revenue)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Details Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Chi tiết dịch vụ</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lần</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(reportData?.by_service || {}).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  Object.entries(reportData.by_service)
                    .sort(([,a], [,b]) => b.revenue - a.revenue)
                    .map(([serviceName, data]) => (
                      <tr key={serviceName} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{serviceName}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{data.count}</td>
                        <td className="px-6 py-4 text-gray-900">{formatCurrency(data.revenue)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}