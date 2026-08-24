import logging
import os
import secrets
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr

load_dotenv()
logger = logging.getLogger("frenzy")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
regs = db["registrations"]
sess = db["admin_sessions"]

app = FastAPI(title="Fresher Frenzy API")
api = APIRouter(prefix="/api")


class RegistrationIn(BaseModel):
    roll_no: str
    name: str
    branch: str = "BCom"
    phone: str = ""
    email: EmailStr
    gender: str


class LoginIn(BaseModel):
    email: str
    password: str


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def public(doc: dict[str, Any]) -> dict[str, Any]:
    if not doc:
        return doc
    return {k: v for k, v in doc.items() if k != "_id"}


async def seed():
    seeds = [
        {"roll_no": "TEST-001", "name": "Test Pass", "branch": "BCom", "phone": "+91 98765 43210", "email": "test001@gmail.com", "gender": "Male", "qr_code_id": "FF-TEST-001", "status": "pending", "registered_at": "2026-01-01T09:00:00Z", "scanned_at": None},
        {"roll_no": "01FM26BCM001", "name": "BHUMIKA V CHALAGERI", "branch": "BCom", "phone": "+91 98450 11001", "email": "bhumika.c@university.edu", "gender": "Female", "qr_code_id": "FF-8492", "status": "pending", "registered_at": "2026-01-01T09:00:00Z", "scanned_at": None},
    ]
    for s in seeds:
        await regs.update_one({"roll_no": s["roll_no"]}, {"$setOnInsert": s}, upsert=True)


@app.on_event("startup")
async def on_start():
    await regs.create_index("roll_no", unique=True)
    await regs.create_index("qr_code_id")
    await sess.create_index("token", unique=True)
    await seed()


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
    await sess.insert_one({"token": token, "created_at": now()})
    return {"success": True, "token": token, "user": {"email": email, "claims": {"admin": True}}}


@api.get("/admin/info")
async def admin_info():
    return {"admin_email": os.getenv("ADMIN_EMAIL", "admin@frenzy.edu")}


@api.post("/register")
async def register(payload: RegistrationIn):
    roll = payload.roll_no.strip().upper()
    if await regs.find_one({"roll_no": roll}):
        raise HTTPException(status_code=400, detail="This roll number is already registered")
    if not payload.name.strip() or not payload.gender:
        raise HTTPException(status_code=400, detail="Name and gender are required")
    item = payload.model_dump()
    item.update({
        "roll_no": roll,
        "email": str(payload.email).lower(),
        "qr_code_id": f"FF-{secrets.randbelow(9000) + 1000}",
        "status": "pending",
        "registered_at": now(),
        "scanned_at": None,
    })
    await regs.insert_one(dict(item))
    return {"success": True, "registration": public(item)}


@api.get("/pass/{identifier}")
async def get_pass(identifier: str):
    key = identifier.strip().upper()
    item = await regs.find_one({"$or": [{"roll_no": key}, {"qr_code_id": key}]})
    if not item:
        raise HTTPException(status_code=404, detail="Pass not found")
    return {"registration": public(item)}


@api.get("/stats")
async def stats():
    total = await regs.count_documents({})
    scanned = await regs.count_documents({"status": "scanned"})
    return {"total_whitelist": 61, "total_registered": total, "total_scanned": scanned, "total_pending": total - scanned}


async def _require_admin(authorization: str | None) -> None:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing admin token")
    token = authorization.split(" ", 1)[1].strip()
    if not await sess.find_one({"token": token}):
        raise HTTPException(status_code=401, detail="Invalid admin token")


@api.get("/admin/registrations")
async def admin_registrations(q: str = "", authorization: str | None = Header(default=None)):
    await _require_admin(authorization)
    query: dict[str, Any] = {}
    if q.strip():
        needle = q.strip()
        query = {"$or": [
            {"name": {"$regex": needle, "$options": "i"}},
            {"roll_no": {"$regex": needle, "$options": "i"}},
            {"qr_code_id": {"$regex": needle, "$options": "i"}},
            {"email": {"$regex": needle, "$options": "i"}},
            {"phone": {"$regex": needle, "$options": "i"}},
        ]}
    cursor = regs.find(query).sort("registered_at", -1).limit(500)
    items = [public(doc) async for doc in cursor]
    return {"count": len(items), "registrations": items}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
