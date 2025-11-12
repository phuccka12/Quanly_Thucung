# PROJECT OVERVIEW — Quanly_Thucung

Ngắn gọn: Đây là một ứng dụng quản lý thú cưng (Pet Management) gồm backend FastAPI + Beanie (MongoDB) và frontend React (Vite + Tailwind). Ứng dụng hỗ trợ quản lý thú cưng, hồ sơ y tế, lịch hẹn, sản phẩm/dịch vụ, báo cáo và portal người dùng.

## Mục tiêu của dự án
- Quản lý thông tin thú cưng (tên, loài, giống, chủ nuôi, ngày sinh, cân nặng, ảnh, trạng thái triệt sản, ...)
- Lưu trữ hồ sơ y tế (khám bệnh, tiêm chủng, cân nặng, thuốc) kèm snapshot sản phẩm/dịch vụ sử dụng
- Quản lý lịch hẹn (scheduled events) với cơ chế nhắc (scheduler gửi email)
- Quản lý danh mục sản phẩm và dịch vụ, kiểm tra tồn kho thấp
- Giao diện portal cho người dùng quản lý thú cưng, đặt lịch và xem hồ sơ

---

## Cấu trúc chính của repository
- `app/` — Backend (FastAPI)
  - `app/main.py` — Entry point: khởi lifespan, init DB, đăng ký routers, mount static, cấu hình CORS, exception handler, file upload endpoint.
  - `app/db/database.py` — Khởi tạo Motor + Beanie (`init_beanie`) với document models.
  - `app/models/` — Các Document (Beanie): `User`, `Pet`, `HealthRecord`, `ScheduledEvent`, `Product`, `Service`.
  - `app/api/endpoints/` — Routers (đã include trong `main.py`): users, login, pets, health-records, scheduled-events, dashboard, products, services, reports, portal.
  - `app/services/scheduler_jobs.py` — Các job APScheduler: `check_upcoming_events` (gửi email nhắc) và `check_low_stock_and_notify`.
  - `app/api/middleware.py` — Middleware xác thực (AuthMiddleware) để populate `request.state.user` từ Bearer token.

- `frontend-react/` — Frontend (React + Vite + Tailwind)
  - `src/api.js` — helper `fetchWithAuth`, `API_BASE_URL = http://localhost:8000/api/v1`, `BASE_URL = http://localhost:8000`.
  - `src/pages/` — Các trang portal: `PortalPets.jsx`, `PortalPetDetail.jsx`, `UserDashboard.jsx`, `ScheduledEvents.jsx`, `Services.jsx`, `Reports.jsx`, `Profile.jsx`, ...
  - `package.json` — scripts (dev/build/preview) và dependencies (react, react-router-dom, chart.js, tailwindcss, vite).

- `scripts/` — Tools để seed dữ liệu, tạo admin, lấy token, kiểm tra DB...
- `requirements.txt` — dependencies backend (đã khoá khá nhiều phiên bản, gồm `pydantic==2.x` và `beanie==2.0.0`).
- `uploads/` — Thư mục tệp tin upload (được mount bởi backend tại `/uploads`).

---

## Models (tóm tắt từ `app/models`)
- User
  - `full_name`, `email` (EmailStr), `hashed_password`, `is_active`, `role` (Enum: `admin`/`user`), `avatar_url`
  - Collection: `users`

- Pet
  - `name`, `species`, `breed`, `gender` (Enum), `date_of_birth`, `weight_kg`, `is_neutered`, `avatar_url`, `image_url`, `owner_name`, `owner_email`, `owner_phone`
  - Collection: `pets`

- HealthRecord
  - Linked to `Pet` via `Link[Pet]` (field `pet`)
  - `record_type` (enum: vaccination, vet_visit, weight_check, medication), `date`, `description`, `notes`, `next_due_date`, `weight_kg`, `used_products` (snapshot), `used_services` (snapshot)
  - Collection: `health_records`

- ScheduledEvent
  - Linked to `Pet` via `Link[Pet]` (field `pet`)
  - `title`, `event_datetime` (datetime), `event_type`, `description`, `is_completed`, `reminder_sent`, optional `service_id`/`product_id`
  - Collection: `scheduled_events`

- Product
  - `name`, `description`, `price`, `stock_quantity`, `category`, `image_url`
  - Collection: `products`

- Service
  - `name`, `description`, `price`, `duration_minutes`, `category`, `image_url`
  - Collection: `services`

---

## API / Endpoints (overview)
Các router chính được mount dưới tiền tố `/api/v1` (do `API_BASE_URL` trong frontend là `/api/v1`). Các nhóm router gồm:
- `/api/v1/users` — user management (tạo, sửa, get, ...)
- `/api/v1/login` — authentication (đăng nhập trả token)
- `/api/v1/pets` — CRUD pets (admin) và `/api/v1/portal/pets` cho portal (user-facing)
- `/api/v1/health-records` — CRUD health records (có route `for-pet/{pet_id}` và portal variants)
- `/api/v1/scheduled-events` — quản lý lịch hẹn, có endpoint `upcoming` được scheduler sử dụng
- `/api/v1/products`, `/api/v1/services` — catalog, paginated endpoints
- `/api/v1/dashboard` — dashboard cho admin (thống kê)
- `/api/v1/reports` — báo cáo doanh thu, v.v.
- `/api/v1/portal/*` — các endpoint dành cho portal người dùng (frontend gọi nhiều endpoint này trực tiếp)

Ghi chú: Frontend dùng `fetchWithAuth` để thêm header Authorization từ `localStorage.hiday_pet_token`.

---

## Luồng chính (ngắn)
- Người dùng (portal) đăng nhập → nhận JWT token → lưu `localStorage.hiday_pet_token`.
- Frontend gọi các endpoint portal (ví dụ `/portal/pets`, `/portal/pets/{id}/health-records`, `/portal/scheduled-events`) bằng `fetchWithAuth`.
- Backend AuthMiddleware kiểm tra header Bearer, populate `request.state.user` nếu token hợp lệ.
- Scheduler (APScheduler) trong `main.py` chạy các job mỗi 1 phút / 24 giờ để nhắc sự kiện và kiểm tra tồn kho, dùng `smtplib` để gửi email.

---

## Cách chạy (dev) — tóm tắt
1. Tạo venv + active (PowerShell):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

2. Tạo file `.env` (các tối thiểu):
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=quanly_thucung
SECRET_KEY=change_me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
# Mail config (nếu cần scheduler gửi mail)
MAIL_USERNAME=you@example.com
MAIL_PASSWORD=...
MAIL_FROM=you@example.com
MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_TO_ADMIN=admin@example.com
MAIL_STARTTLS=True
```

3. Chạy MongoDB (local or docker):
```powershell
docker run -d -p 27017:27017 --name my-mongo mongo:6
```

4. Khởi backend:
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

5. Khởi frontend (trong `frontend-react/`):
```powershell
cd frontend-react
npm install
npm run dev
# hoặc: pnpm/yarn tuỳ môi trường
```

Frontend mặc định truy cập `http://localhost:5173` (vite) và backend API `http://localhost:8000/api/v1`.

---

## Những điểm cần lưu ý / rủi ro / đề xuất
1. Phiên bản thư viện
   - `requirements.txt` hiện liệt kê `pydantic==2.x` và `beanie==2.0.0`. README có note cũ về `pydantic<2`/Beanie 1.x — hãy coi `requirements.txt` là source-of-truth. Trước khi nâng/cập nhật, test kỹ vì Beanie 2.x và Pydantic v2 có breaking changes so với v1.

2. CORS
   - `app/main.py` hiện đặt `allow_origins=["*"]` (dev). Không dùng cho production.

3. Email (scheduler)
   - Scheduler dùng `smtplib` (synchronous). Việc này chạy trong job asyncio nhưng dùng `smtplib` là blocking; hiện code chạy từ APScheduler (AsyncIOScheduler) mà tác vụ gửi mail có thể block event loop nếu gửi nhiều. Nên cân nhắc:
     - Sử dụng thư viện async mailer; hoặc
     - Chạy gửi mail trong threadpool (asyncio.to_thread) để tránh block; hoặc
     - Dùng dịch vụ webhook/queue để xử lý gửi mail.

4. Uploads & static
   - `uploads/` được mount; đảm bảo permission phù hợp và không expose sensitive files.

5. Bảo mật
   - Kiểm tra input validation, giới hạn kích thước upload, rate limiting cho endpoints quan trọng.

6. Tests / CI
   - Có `test_api.py` và `test_db.py` — nếu muốn, có thể chạy để smoke-test sau khi server và DB sẵn sàng.

---

## Mapping frontend → API (ví dụ)
- `PortalPetDetail.jsx` gọi:
  - `GET /api/v1/portal/pets/{id}`
  - `GET /api/v1/portal/pets/{id}/health-records`
  - `GET /api/v1/portal/scheduled-events` (lọc theo pet_id local)
  - `POST /api/v1/portal/pets/{id}/scheduled-events` (tạo lịch)
  - `DELETE /api/v1/portal/scheduled-events/{id}` (hủy lịch)
  - `POST /api/v1/portal/pets/{id}/health-records` (thêm hồ sơ y tế)
  - `DELETE /api/v1/portal/health-records/{id}`
  - `GET /api/v1/portal/products/paginated?skip=0&limit=1000`
  - `GET /api/v1/portal/services/paginated?skip=0&limit=1000`

(Frontend dùng `fetchWithAuth` để đính kèm Bearer token và xử lý 401 -> logout.)

---

## Next steps tôi có thể làm cho bạn
- Tạo report ngắn này (đã xong) và commit vào repo (`PROJECT_OVERVIEW.md`) — HOÀN THÀNH.
- Đọc chi tiết từng file endpoint (nếu bạn muốn tôi liệt kê mọi route + request/response schema).
- Chạy smoke tests (`test_api.py`) — cần quyền chạy tiến trình trên môi trường của bạn; yêu cầu DB/ENV sẵn sàng.
- Sửa scheduler gửi email non-blocking (đề xuất code).

---

Nếu muốn tôi tiếp tục đọc sâu (liệt kê mọi endpoint và schema chi tiết), trả lời "Tiếp tục đọc endpoints"; nếu muốn chạy các test/cài đặt local, nói "Chạy thử trên máy" và tôi sẽ hướng dẫn hoặc chạy theo quyền bạn cho phép.

---

File này được tạo tự động để giúp bạn nắm nhanh đề tài và kiến trúc dự án. Nếu cần bản tiếng Anh hoặc chi tiết hơn (route-by-route), tôi sẽ mở rộng.