# removed stray import 'scheduler' from sched (not used)
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.db.database import init_db
from app.api.endpoints import users
from app.api.endpoints import login ,pets ,health_records,scheduled_events,dashboard,products,services
from app.services.scheduler_jobs import check_upcoming_events, check_low_stock_and_notify
from apscheduler.schedulers.asyncio import AsyncIOScheduler 
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.api.middleware import AuthMiddleware
import shutil
import uuid
import os
scheduler = AsyncIOScheduler()
# Sử dụng Lifespan API mới của FastAPI
async def lifespan(app: FastAPI):
    # Khởi tạo DB
    await init_db()
    
    # Thêm job vào scheduler và bắt đầu
    scheduler.add_job(check_upcoming_events, "interval", minutes=1) # Chạy job mỗi 1 phút
    # Low-stock check once per day
    scheduler.add_job(check_low_stock_and_notify, "interval", hours=24)
    scheduler.start()
    print("Database connection established and scheduler started.")
    
    yield
    
    # Dừng scheduler khi ứng dụng tắt
    scheduler.shutdown()
    print("Closing database connection and shutting down scheduler.")

app = FastAPI(lifespan=lifespan)
# Add authentication middleware to populate `request.state.user` from Bearer tokens
app.add_middleware(AuthMiddleware)
api_router_v1 = APIRouter(prefix="/api/v1")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
# Tất cả các endpoint trong users.router sẽ có tiền tố là /users
api_router_v1.include_router(users.router, prefix="/users", tags=["Users"])
api_router_v1.include_router(login.router, tags=["Login"]) 
api_router_v1.include_router(pets.router, prefix="/pets", tags=["Pets"]) 
api_router_v1.include_router(health_records.router, prefix="/health-records", tags=["Health Records"]) 
api_router_v1.include_router(scheduled_events.router, prefix="/scheduled-events", tags=["Scheduled Events"])
api_router_v1.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router_v1.include_router(products.router, prefix="/products", tags=["Products"])
api_router_v1.include_router(services.router, prefix="/services", tags=["Services"])
from app.api.endpoints import reports
api_router_v1.include_router(reports.router, prefix="/reports", tags=["Reports"])
from app.api.endpoints import portal
api_router_v1.include_router(portal.router, prefix="/portal", tags=["Portal"])
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
    # For development convenience allow all origins so frontend can call API even on error responses.
    # NOTE: This is permissive and should be restricted in production.
    allow_origins=["*"],       # Cho phép tất cả origin (dev only)
    allow_credentials=True,      # Cho phép gửi cookie/authorization headers
    allow_methods=["*"],         # Cho phép tất cả các phương thức (GET, POST, etc.)
    allow_headers=["*"],         # Cho phép tất cả các header
)

# Ensure unhandled exceptions still return a JSON response with CORS headers so the
# browser doesn't hide the real error behind a CORS failure. This is a dev-time helper.
from fastapi.responses import JSONResponse
import traceback


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    # Log full traceback to console for debugging
    tb = traceback.format_exc()
    print("Unhandled exception in request:", tb)
    # Return traceback in response body to help debugging on local dev
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "traceback": tb},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )

# File upload endpoint
@api_router_v1.post("/upload", tags=["Upload"])
async def upload_file(file: UploadFile = File(...)):
    """Upload a file and return its URL"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return file URL
    file_url = f"/uploads/{unique_filename}"
    return {"filename": unique_filename, "url": file_url}

app.include_router(api_router_v1)

# Mount frontend static files (serve `frontend/` directory at site root) if present.
# This makes static frontend available at '/' while API remains under '/api/v1'.
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

# Keep an API root under /api to avoid collision with the frontend root
@app.get("/api/", include_in_schema=False)
def read_api_root():
    return {"message": "Pet Management API with MongoDB is running!"}