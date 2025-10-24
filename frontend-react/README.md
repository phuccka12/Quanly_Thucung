# HIDAY PET · Frontend (React / Vite)

This is a lightweight React scaffold (Vite) migrated from the original static frontend.

Quick start (Windows PowerShell):

```powershell
cd frontend-react
npm install
npm run dev
```

Open the app at the address Vite prints (usually http://localhost:5173). The app expects the backend API at `http://localhost:8000/api/v1`. If your backend runs elsewhere, update `src/api.js` -> `API_BASE_URL`.

Notes:
- The Dashboard page (`/dashboard`) fetches same endpoints as the static UI: `/dashboard/`, `/products/low-stock`, `/scheduled-events/upcoming`, `/reports/revenue`.
- Auth: the app reads the JWT from `localStorage.getItem('hiday_pet_token')` (same key as before).
- This scaffold includes `react-chartjs-2` / `chart.js` for charts.
