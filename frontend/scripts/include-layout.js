async function include(mount, url) {
  const res = await fetch(url);
  mount.innerHTML = await res.text();
}

(async () => {
  const pageKey = document.body.dataset.page; // "dashboard" | "pets" | ...

  // Sidebar
  const sb = document.querySelector('[data-include="sidebar"]');
  if (sb) {
    await include(sb, './partials/sidebar.html');
    // set active theo trang
    const active = sb.querySelector(`.menu a[data-link="${pageKey}"]`);
    active?.classList.add('active');

    // Toggle sidebar (mobile)
    document.addEventListener('click', (e) => {
      if (e.target.closest('#openSidebar')) {
        document.getElementById('sidebar')?.classList.toggle('open');
      }
    });

    // Logout
    const logoutBtn = document.getElementById('logout-button');
    logoutBtn?.addEventListener('click', () => {
      localStorage.removeItem('hiday_pet_token');
      window.location.href = 'login.html';
    });
  }

  // Topbar
  const tb = document.querySelector('[data-include="topbar"]');
  if (tb) {
    await include(tb, './partials/topbar.html');
    // Breadcrumb theo trang
    const label = pageKey === 'pets' ? 'Quản lý Thú cưng' : 'Dashboard';
    tb.querySelector('#page-label').textContent = label;
  }
})();
