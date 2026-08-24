from datetime import datetime, timezone
import os
import secrets
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Fresher Frenzy API")
api = APIRouter(prefix="/api")
registrations: dict[str, dict[str, Any]] = {
    "TEST-001": {"roll_no": "TEST-001", "name": "Test Pass", "branch": "BCom", "phone": "+91 98765 43210", "email": "test001@gmail.com", "gender": "Male", "qr_code_id": "FF-TEST-001", "status": "pending", "registered_at": "2026-01-01T09:00:00Z", "scanned_at": None},
    "01FM26BCM001": {"roll_no": "01FM26BCM001", "name": "BHUMIKA V CHALAGERI", "branch": "BCom", "phone": "+91 98450 11001", "email": "bhumika.c@university.edu", "gender": "Female", "qr_code_id": "FF-8492", "status": "pending", "registered_at": "2026-01-01T09:00:00Z", "scanned_at": None},
}
sessions: set[str] = set()

class RegistrationIn(BaseModel):
    roll_no: str
    name: str
    branch: str = "BCom"
    phone: str = ""
    email: str
    gender: str

class LoginIn(BaseModel):
    email: str
    password: str

class ScanIn(BaseModel):
    qr_code_id: str

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

def authorized(token: str | None) -> bool:
    return bool(token and token in sessions)

@api.get("/")
async def root():
    return {"message": "Fresher Frenzy API online"}

@api.get("/health")
async def health():
    return {"status": "ok", "server_time": now()}

@api.post("/admin/login")
async def login(payload: LoginIn):
    email = os.getenv("ADMIN_EMAIL", "admin@frenzy.edu").lower()
    password = os.getenv("ADMIN_PASSWORD", "frenzy2024")
    if payload.email.lower() != email or payload.password != password:
        raise HTTPException(status_code=403, detail="Access denied")
    token = secrets.token_urlsafe(24)
    sessions.add(token)
    return {"success": True, "token": token, "user": {"email": email, "claims": {"admin": True}}}

@api.get("/admin/info")
async def admin_info():
    return {"admin_email": os.getenv("ADMIN_EMAIL", "admin@frenzy.edu")}

@api.post("/register")
async def register(payload: RegistrationIn):
    roll = payload.roll_no.strip().upper()
    if roll in registrations:
        raise HTTPException(status_code=400, detail="This roll number is already registered")
    if not payload.name.strip() or not payload.email.strip() or not payload.gender:
        raise HTTPException(status_code=400, detail="Name, email, and gender are required")
    item = payload.model_dump()
    item.update({"roll_no": roll, "email": payload.email.lower(), "qr_code_id": f"FF-{secrets.randbelow(9000) + 1000}", "status": "pending", "registered_at": now(), "scanned_at": None})
    registrations[roll] = item
    return {"success": True, "registration": item}

@api.get("/pass/{identifier}")
async def get_pass(identifier: str):
    key = identifier.strip().upper()
    item = registrations.get(key) or next((r for r in registrations.values() if r["qr_code_id"].upper() == key), None)
    if not item:
        raise HTTPException(status_code=404, detail="Pass not found")
    return {"registration": item}

@api.post("/scan")
async def scan(payload: ScanIn, authorization: str | None = Header(default=None)):
    token = authorization.replace("Bearer ", "") if authorization else None
    if not authorized(token):
        raise HTTPException(status_code=401, detail="Admin access required")
    item = next((r for r in registrations.values() if r["qr_code_id"].upper() == payload.qr_code_id.upper() or r["roll_no"].upper() == payload.qr_code_id.upper()), None)
    if not item:
        raise HTTPException(status_code=404, detail="QR code not found")
    if item["status"] == "scanned":
        return {"status": "already_used", "message": "Pass was already scanned", "registration": item}
    item["status"] = "scanned"
    item["scanned_at"] = now()
    return {"status": "valid", "message": f"Valid entry — welcome {item['name']}!", "registration": item}

@api.get("/stats")
async def stats():
    scanned = sum(r["status"] == "scanned" for r in registrations.values())
    return {"total_whitelist": 61, "total_registered": len(registrations), "total_scanned": scanned, "total_pending": len(registrations) - scanned}

app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.getenv("CORS_ORIGINS", "*").split(","), allow_methods=["*"], allow_headers=["*"])