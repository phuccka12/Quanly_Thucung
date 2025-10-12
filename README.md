# Quanly_Thucung (Pet Management)

This repository contains a FastAPI backend (with Beanie/MongoDB) and a static frontend.
This README shows how to run the project locally on Windows using PowerShell.

## Overview
- Backend: FastAPI app under `app/` (APIs under `/api/v1`).
- Models use Beanie (MongoDB). Scheduler jobs run (APScheduler) to send reminders.
- Frontend: static HTML/CSS/JS in `app/frontend/HidayPetShop` and `app/frontend/Login`.

## Prerequisites
- Python 3.11+ and `venv` (a virtualenv folder `venv` is expected in the repo but you can create one). 
- MongoDB (local) or Docker.
- (Optional) Docker for running MongoDB.

## Quick start (Windows PowerShell)

1) Open PowerShell and go to the project root:

```powershell
Set-Location D:\pythonclass\Quanly_Thucung
```

2) Activate virtual environment (if present):

```powershell
.\venv\Scripts\Activate.ps1
# If you used cmd.exe instead of PowerShell, run: .\venv\Scripts\activate.bat
```

3) Install dependencies (only if needed):

```powershell
pip install -r requirements.txt
```

4) Configure environment variables

Create a `.env` file in the project root with values for at least these keys:

```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=hiday_pet_db
SECRET_KEY=change_this_to_a_secure_value
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Optional: mail config used by scheduler
MAIL_USERNAME=you@example.com
MAIL_PASSWORD=secret
MAIL_FROM=you@example.com
MAIL_PORT=587
MAIL_SERVER=smtp.example.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
MAIL_TO_ADMIN=admin@example.com
```

5) Start MongoDB

- If you have MongoDB installed locally, start the service.
- Or run via Docker:

```powershell
docker run -d -p 27017:27017 --name my-mongo mongo:5.0
```

6) Start the backend (use `python -m uvicorn` so it uses the venv Python):

```powershell
# from project root with venv activated
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see logs about the server starting and the scheduler job. The backend mounts the frontend statically, so by default the landing page is available at `http://localhost:8000/`.

7) Serve frontend separately (optional)

If you prefer serving frontend separately (e.g., VSCode Live Server), run from project `frontend` folder:

```powershell
Set-Location .\frontend
python -m http.server 5500
# open http://127.0.0.1:5500/HidayPetShop/index.html
```

If you serve frontend separately, make sure CORS includes the frontend origin (e.g. `http://127.0.0.1:5500`). This project already includes common localhost origins; if you see CORS errors, restart backend after updating `app/main.py` or allow all origins in dev.

## Create an admin user (for testing protected endpoints)

Run the helper script (MongoDB must be running):

```powershell
python scripts/create_admin.py
# enter email and password when prompted
```

Then login using the API to get a token:

```powershell
# example using curl (or use the login form in the frontend)
curl -X POST "http://localhost:8000/api/v1/login" -F "username=admin@example.com" -F "password=yourpassword"
```

## Troubleshooting

- ModuleNotFoundError: No module named 'beanie'
  - Activate the virtualenv that has dependencies installed, or `pip install beanie motor` inside venv.

- RuntimeError: Directory 'app/frontend/Landingpage' does not exist
  - The project mounts `app/frontend/HidayPetShop` by default. If you changed names, update `app/main.py`.

- CORS errors (browser console says No 'Access-Control-Allow-Origin')
  - If frontend runs on a different origin (e.g. http://127.0.0.1:5500), make sure that origin is listed in `origins` inside `app/main.py`. For dev you can temporarily set `allow_origins=["*"]` (not for production).

- 401 Unauthorized when calling protected API
  - Make sure you created an admin and pass Authorization header `Bearer <token>` when calling admin-only endpoints.

## Useful endpoints
- API root: `http://localhost:8000/api/`
- Login: `POST http://localhost:8000/api/v1/login` (form: username, password)
- Dashboard (admin): `GET http://localhost:8000/api/v1/dashboard/` (requires token)

## Development notes
- Frontend static files are under `app/frontend/HidayPetShop` and `app/frontend/Login`.
- The backend scheduler runs `app.services.scheduler_jobs.check_upcoming_events` every minute (configured in `app/main.py`).

If you want, I can:
- run the full startup sequence in your terminal now (activate venv, start MongoDB container, start uvicorn), or
- update `app/main.py` to temporarily allow all CORS origins for dev.

Tell me which option you prefer and I'll do it for you.
