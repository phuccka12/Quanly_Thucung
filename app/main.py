# removed stray import 'scheduler' from sched (not used)
from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.db.database import init_db
from app.api.endpoints import users
from app.api.endpoints import login ,pets ,health_records,scheduled_events,dashboard
from app.services.scheduler_jobs import check_upcoming_events
from apscheduler.schedulers.asyncio import AsyncIOScheduler 
from fastapi.middleware.cors import CORSMiddleware
scheduler = AsyncIOScheduler()
# Sử dụng Lifespan API mới của FastAPI
async def lifespan(app: FastAPI):
    # Khởi tạo DB
    await init_db()
    
    # Thêm job vào scheduler và bắt đầu
    scheduler.add_job(check_upcoming_events, "interval", minutes=1) # Chạy job mỗi 1 phút
    scheduler.start()
    print("Database connection established and scheduler started.")
    
    yield
    
    # Dừng scheduler khi ứng dụng tắt
    scheduler.shutdown()
    print("Closing database connection and shutting down scheduler.")

app = FastAPI(lifespan=lifespan)
api_router_v1 = APIRouter(prefix="/api/v1")
# Tất cả các endpoint trong users.router sẽ có tiền tố là /users
api_router_v1.include_router(users.router, prefix="/users", tags=["Users"])
api_router_v1.include_router(login.router, tags=["Login"]) 
api_router_v1.include_router(pets.router, prefix="/pets", tags=["Pets"]) 
api_router_v1.include_router(health_records.router, prefix="/health-records", tags=["Health Records"]) 
api_router_v1.include_router(scheduled_events.router, prefix="/scheduled-events", tags=["Scheduled Events"])
api_router_v1.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
origins = [
    "http://localhost",
    "http://localhost:3000", # Địa chỉ mặc định của React
    "http://localhost:5173", # Địa chỉ mặc định của Vite (dùng cho Vue, React mới)
    "http://localhost:4200",
    "http://localhost:8000",
    "http://localhost:5500",
]
# Thêm các dạng địa chỉ 127.0.0.1 thường dùng (ví dụ Live Server trên VSCode dùng 127.0.0.1:5500)
origins += [
    "http://127.0.0.1",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Cho phép các origin được truy cập
    allow_credentials=True,      # Cho phép gửi cookie/authorization headers
    allow_methods=["*"],         # Cho phép tất cả các phương thức (GET, POST, etc.)
    allow_headers=["*"],         # Cho phép tất cả các header
)

app.include_router(api_router_v1)

# Mount admin static files
app.mount("/admin", StaticFiles(directory="app/frontend/admin", html=True), name="admin")

# Keep an API root under /api to avoid collision with the frontend root
@app.get("/api/", include_in_schema=False)
def read_api_root():
    return {"message": "Pet Management API with MongoDB is running!"}