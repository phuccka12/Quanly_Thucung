document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = "http://localhost:8000/api/v1";
    const token = localStorage.getItem('hiday_pet_token');
    const logoutButton = document.getElementById('logout-button');

    // --- HÀM CHÍNH: BẢO VỆ VÀ TẢI DỮ LIỆU ---
    async function initializeDashboard() {
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        try {
            const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!userResponse.ok) {
                throw new Error('Invalid token');
            }
            // Token hợp lệ, tiến hành tải dữ liệu dashboard
            await fetchDashboardData();
        } catch (error) {
            localStorage.removeItem('hiday_pet_token');
            window.location.href = 'login.html';
        }
    }

    // --- CÁC HÀM CON ---
    function handleLogout() {
        localStorage.removeItem('hiday_pet_token');
        alert('Đã đăng xuất!');
        window.location.href = 'login.html';
    }

    async function fetchDashboardData() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Không thể tải dữ liệu dashboard.');
            
            const data = await response.json();
            
            // Cập nhật các thẻ thống kê
            document.getElementById('stats-total-pets').textContent = data.total_pets;
            document.getElementById('stats-upcoming-events').textContent = data.upcoming_events_count;
            document.getElementById('stats-total-health-records').textContent = data.total_health_records;
            document.getElementById('stats-due-vaccinations').textContent = data.due_vaccinations_count;

            // Vẽ biểu đồ
            renderSpeciesChart(data.pets_by_species);

            // Điền dữ liệu vào bảng
            populateLatestPetsTable(data.latest_pets);

        } catch (error) {
            console.error("Lỗi tải dashboard:", error);
            alert(error.message);
        }
    }

    function renderSpeciesChart(speciesData) {
        const ctx = document.getElementById('species-chart').getContext('2d');
        const labels = Object.keys(speciesData);
        const data = Object.values(speciesData);

        new Chart(ctx, {
            type: 'doughnut', // Kiểu biểu đồ (có thể là 'pie', 'bar')
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 140, 0, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    function populateLatestPetsTable(latestPets) {
        const tableBody = document.getElementById('latest-pets-table');
        tableBody.innerHTML = '';
        if (latestPets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">Không có thú cưng mới.</td></tr>';
            return;
        }
        latestPets.forEach(pet => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${pet.name}</td>
                <td>${pet.species}</td>
                <td>${pet.owner_name}</td>
            `;
        });
    }

    // --- GẮN SỰ KIỆN VÀ CHẠY ---
    logoutButton.addEventListener('click', handleLogout);
    initializeDashboard();
});