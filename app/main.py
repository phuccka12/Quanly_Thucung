from fastapi import FastAPI, APIRouter
from contextlib import asynccontextmanager
from app.db.database import init_db
from app.api.endpoints import users
from app.api.endpoints import login ,pets ,health_records
# Sử dụng Lifespan API mới của FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code chạy khi ứng dụng khởi động
    await init_db()
    print("Database connection established.")
    yield
    # Code chạy khi ứng dụng tắt (nếu cần)
    print("Closing database connection.")


app = FastAPI(lifespan=lifespan)
api_router_v1 = APIRouter(prefix="/api/v1")
# Tất cả các endpoint trong users.router sẽ có tiền tố là /users
app.include_router(users.router, prefix="/users", tags=["Users"])
api_router_v1.include_router(login.router, tags=["Login"]) 
api_router_v1.include_router(pets.router, prefix="/pets", tags=["Pets"]) 
api_router_v1.include_router(health_records.router, prefix="/health-records", tags=["Health Records"]) 
# ...
app.include_router(api_router_v1)
@app.get("/")
def read_root():
    return {"message": "Pet Management API with MongoDB is running!"}