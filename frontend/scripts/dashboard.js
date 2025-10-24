document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = "http://localhost:8000/api/v1";
    const token = localStorage.getItem('hiday_pet_token');
    
    // --- HÀM CHÍNH: BẢO VỆ VÀ TẢI DỮ LIỆU ---
    async function initializeDashboard() {
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const logoutButton = document.getElementById('logout-button') || document.querySelector('.logout');
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);

        try {
            const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // If unauthorized specifically, logout. Otherwise allow other errors to be handled gracefully.
            if (userResponse.status === 401 || userResponse.status === 403) {
                handleLogout();
                return;
            }

            if (!userResponse.ok) {
                console.warn('Non-auth error from users/me:', userResponse.status);
            } else {
                const user = await userResponse.json();
                const welcomeEl = document.getElementById('welcome-message');
                if (welcomeEl) welcomeEl.textContent = `Chào, ${user.full_name || 'Admin'}!`;
            }

            // show skeletons while loading
            showDashboardSkeletons();
            await fetchDashboardData();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    function handleLogout() {
        localStorage.removeItem('hiday_pet_token');
        window.location.href = 'login.html';
    }

    async function fetchDashboardData() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Không thể tải dữ liệu dashboard.');
            
            const data = await response.json();
            
            document.getElementById('stats-total-pets').textContent = data.total_pets;
            document.getElementById('stats-upcoming-events').textContent = data.upcoming_events_count;
            document.getElementById('stats-total-health-records').textContent = data.total_health_records;
            document.getElementById('stats-due-vaccinations').textContent = data.due_vaccinations_count;
            renderSpeciesChart(data.pets_by_species);
            populateLatestPetsTable(data.latest_pets);

            // Additional widgets
            fetchLowStock();
            fetchUpcomingEvents();
            fetchRevenue7Days();

        } catch (error) {
            console.error("Lỗi tải dashboard:", error);
        }
    }

    async function fetchLowStock() {
        try {
            const res = await fetch(`${API_BASE_URL}/products/low-stock`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không lấy được low-stock');
            const items = await res.json();
            const container = document.getElementById('low-stock-list');
            if (!container) return;
            if (!items || items.length === 0) {
                container.innerHTML = '<div class="empty">Không có sản phẩm sắp hết.</div>';
                return;
            }

            container.innerHTML = '';
            items.slice(0,5).forEach(i => {
                const el = document.createElement('div');
                el.className = 'list-item';
                el.innerHTML = `<div class="title">${escapeHtml(i.name)}</div><div style="display:flex;gap:8px;align-items:center"><div class="meta">${i.price ? formatCurrency(i.price) : ''}</div><div class="pill">${i.stock_quantity} còn</div></div>`;
                container.appendChild(el);
            });
        } catch (e) {
            console.error('Low-stock lỗi:', e);
        }
    }

    async function fetchUpcomingEvents() {
        try {
            const res = await fetch(`${API_BASE_URL}/scheduled-events/upcoming`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không lấy được events');
            const events = await res.json();
            const container = document.getElementById('upcoming-events-list');
            if (!container) return;
            if (!events || events.length === 0) {
                container.innerHTML = '<div class="empty">Không có lịch hẹn sắp tới.</div>';
                return;
            }

            container.innerHTML = '';
            events.slice(0,6).forEach(ev => {
                const el = document.createElement('div');
                el.className = 'list-item';
                const dt = ev.event_datetime ? new Date(ev.event_datetime).toLocaleString() : 'Thời gian chưa rõ';
                el.innerHTML = `<div class="title">${escapeHtml(ev.title || ev.type || 'Lịch hẹn')}</div><div class="meta">${escapeHtml(ev.pet_name || 'Không rõ')} — ${dt}</div>`;
                container.appendChild(el);
            });
        } catch (e) {
            console.error('Events lỗi:', e);
        }
    }

    async function fetchRevenue7Days() {
        try {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 7);
            const qs = `?start_date=${start.toISOString()}&end_date=${end.toISOString()}`;
            const res = await fetch(`${API_BASE_URL}/reports/revenue${qs}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Không lấy được doanh thu');
            const data = await res.json();
            const container = document.getElementById('revenue-summary');
            if (!container) return;
            container.innerHTML = '';
            const total = data.total_revenue || 0;
            const totalEl = document.createElement('div');
            totalEl.className = 'list-item';
            totalEl.innerHTML = `<div class="title">Tổng 7 ngày</div><div class="pill">${formatCurrency(total)}</div>`;
            container.appendChild(totalEl);

            // breakdown
            if (data.by_product && data.by_product.length) {
                const header = document.createElement('div'); header.className = 'card-head'; header.innerHTML = '<h4 style="margin:0;font-size:13px">Sản phẩm bán chạy</h4>';
                container.appendChild(header);
                data.by_product.slice(0,3).forEach(p => {
                    const el = document.createElement('div'); el.className = 'list-item';
                    el.innerHTML = `<div class="title">${escapeHtml(p.name)}</div><div class="meta">${p.quantity} × ${formatCurrency(p.unit_price)}</div>`;
                    container.appendChild(el);
                });
            }

            if (data.by_service && data.by_service.length) {
                const header2 = document.createElement('div'); header2.className = 'card-head'; header2.innerHTML = '<h4 style="margin:0;font-size:13px">Dịch vụ</h4>';
                container.appendChild(header2);
                data.by_service.slice(0,3).forEach(s => {
                    const el = document.createElement('div'); el.className = 'list-item';
                    el.innerHTML = `<div class="title">${escapeHtml(s.name)}</div><div class="meta">${s.count} lần — ${formatCurrency(s.total)}</div>`;
                    container.appendChild(el);
                });
            }
        } catch (e) {
            console.error('Revenue lỗi:', e);
        }
    }

    function renderSpeciesChart(speciesData) {
        const ctx = document.getElementById('species-chart')?.getContext('2d');
        if (!ctx) return;
        
        const labels = Object.keys(speciesData);
        const dataValues = Object.values(speciesData);
        // derive colors from CSS variables for consistent branding
        const cs = getComputedStyle(document.documentElement);
        const brand = cs.getPropertyValue('--brand').trim() || '#f28c4b';
        const brand2 = cs.getPropertyValue('--brand-2').trim() || '#ffd39a';
        const palette = [brand, brand2, '#36A2EB', '#9b59b6', '#4BC0C0'];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng',
                    data: dataValues,
                    backgroundColor: palette.slice(0, labels.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false }
        });
    }

    function populateLatestPetsTable(latestPets) {
        const tableBody = document.getElementById('latest-pets-table');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        if (latestPets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">Không có thú cưng mới.</td></tr>';
            return;
        }
        latestPets.forEach(pet => {
            const row = tableBody.insertRow();
            row.innerHTML = `<td>${pet.name}</td><td>${pet.species}</td><td>${pet.owner_name}</td>`;
        });
    }

    /* ===== Helpers ===== */
    function showSkeleton(containerId = null) {
        const container = containerId ? document.getElementById(containerId) : null;
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const s = document.createElement('div'); s.className = 'list-item';
            s.innerHTML = `<div class="title" style="background:#eee;height:12px;width:40%"></div><div class="pill" style="background:#eee;height:12px;width:60px"></div>`;
            container.appendChild(s);
        }
    }

    function showDashboardSkeletons(){
        showSkeleton('low-stock-list');
        showSkeleton('upcoming-events-list');
        const rev = document.getElementById('revenue-summary'); if (rev) rev.innerHTML = '';
    }

    function escapeHtml(str){ if (!str && str !== 0) return ''; return String(str).replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }

    function formatCurrency(n){ try { return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(n); } catch(e){ return n; } }

    // --- CHẠY HÀM KHỞI TẠO ---
    initializeDashboard();
});