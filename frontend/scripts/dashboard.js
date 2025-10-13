document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = "http://localhost:8000/api/v1";
    const token = localStorage.getItem('hiday_pet_token');
    
    // --- HÀM CHÍNH: BẢO VỆ VÀ TẢI DỮ LIỆU ---
    async function initializeDashboard() {
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);

        try {
            const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!userResponse.ok) throw new Error('Invalid token');
            const user = await userResponse.json();
            document.getElementById('welcome-message').textContent = `Chào, ${user.full_name || 'Admin'}!`;
            
            await fetchDashboardData();
        } catch (error) {
            handleLogout(); // Nếu token không hợp lệ, tự động đăng xuất
        }
    }

    function handleLogout() {
        localStorage.removeItem('hiday_pet_token');
        window.location.href = 'login.html';
    }

    async function fetchDashboardData() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard`, {
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

        } catch (error) {
            console.error("Lỗi tải dashboard:", error);
        }
    }

    function renderSpeciesChart(speciesData) {
        const ctx = document.getElementById('species-chart')?.getContext('2d');
        if (!ctx) return;
        
        const labels = Object.keys(speciesData);
        const dataValues = Object.values(speciesData);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng',
                    data: dataValues,
                    backgroundColor: ['#FF8C00', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
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

    // --- CHẠY HÀM KHỞI TẠO ---
    initializeDashboard();
});