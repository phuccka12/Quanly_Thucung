document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
  const token = localStorage.getItem('hiday_pet_token');
  if (!token) return window.location.href = 'login.html';

  async function loadRecords() {
    try {
      // No global list endpoint in OpenAPI; we can list by searching pets and nested health-records if needed.
      // For demo, we'll show an empty state and provide a simple create flow.
      document.getElementById('records-empty').textContent = 'Tính năng demo: tạo hồ sơ bằng nút "Thêm hồ sơ".';
    } catch (err) {
      console.error('Lỗi load records:', err);
      document.getElementById('records-empty').textContent = 'Lỗi kết nối.';
    }
  }

  document.getElementById('btnAddRecord')?.addEventListener('click', async () => {
    const pet_id = prompt('Pet ID');
    if (!pet_id) return;
    const type = prompt('Loại (vaccination / vet_visit / weight_check / medication)');
    if (!type) return;
    const date = prompt('Ngày (YYYY-MM-DD)');
    if (!date) return;
    const description = prompt('Mô tả ngắn');
    try {
      const payload = { record_type: type, date, description };
      const res = await fetch(`${API_BASE_URL}/pets/${pet_id}/health-records`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (res.status === 201) {
        alert('Tạo hồ sơ thành công');
        loadRecords();
      } else {
        const err = await res.json().catch(()=>({detail:'Lỗi'}));
        alert('Tạo thất bại: ' + (err.detail || res.status));
      }
    } catch (err) {
      console.error('Lỗi tạo record:', err);
      alert('Lỗi kết nối');
    }
  });

  loadRecords();
});