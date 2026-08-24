import asyncio
import base64
import logging
import os
import secrets
from datetime import datetime, timezone
from typing import Any

import resend
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr

load_dotenv()
logger = logging.getLogger("frenzy")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
resend.api_key = RESEND_API_KEY

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


class EmailTicketIn(BaseModel):
    email: EmailStr
    name: str
    qr_code_id: str
    roll_no: str
    png_base64: str


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def public(doc: dict[str, Any]) -> dict[str, Any]:
    if not doc:
        return doc
    doc = {k: v for k, v in doc.items() if k != "_id"}
    return doc


async def authorized(token: str | None) -> bool:
    if not token:
        return False
    return bool(await sess.find_one({"token": token}))


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


def ticket_html(name: str, pass_id: str, roll_no: str) -> str:
    return f"""
    <div style="font-family:Helvetica,Arial,sans-serif;background:#0a0a10;color:#f4f4ef;padding:32px;max-width:560px;margin:auto;border:1px solid #1f2431;">
      <div style="font-size:11px;letter-spacing:.16em;color:#7ef9ff;text-transform:uppercase;">B.Com Association · Gokul Campus</div>
      <h1 style="font-size:36px;line-height:1;margin:14px 0 6px;color:#ff63d8;letter-spacing:-1px;">FRESHERS '26</h1>
      <p style="color:#a5abb7;font-size:14px;margin:0 0 24px;">Two Days, One Campus, New Faces, New Journey — Join B.Com Family.</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #7ef9ff;border-radius:6px;overflow:hidden;">
        <tr><td style="padding:22px;background:linear-gradient(120deg,#ff63d8,#8a4cff,#7ef9ff);color:#0a0a10;">
          <div style="font-size:11px;letter-spacing:.16em;">YOU'RE IN.</div>
          <div style="font-size:28px;font-weight:900;margin-top:6px;">Hi {name},</div>
          <div style="font-size:12px;margin-top:4px;">See you at Gokul Campus on 01 + 02 September 2026.</div>
        </td></tr>
        <tr><td style="padding:22px;background:#12151d;">
          <div style="font-size:10px;color:#a5abb7;letter-spacing:.2em;">ATTENDEE</div>
          <div style="font-size:20px;font-weight:700;color:#f4f4ef;">{name}</div>
          <div style="height:12px"></div>
          <div style="font-size:10px;color:#a5abb7;letter-spacing:.2em;">ROLL / USN</div>
          <div style="font-size:16px;color:#7ef9ff;">{roll_no}</div>
          <div style="height:12px"></div>
          <div style="font-size:10px;color:#a5abb7;letter-spacing:.2em;">PASS ID</div>
          <div style="font-size:16px;color:#c5ff55;">{pass_id}</div>
        </td></tr>
        <tr><td style="padding:16px 22px;background:#0f1218;font-size:11px;color:#a5abb7;">
          <b style="color:#c5ff55;">STATUS · CONFIRMED</b> — your printable ticket is attached to this email as a PNG. Save it to your phone lock screen or WhatsApp so you always have a backup at the gate.
        </td></tr>
      </table>
      <p style="color:#65697a;font-size:11px;margin-top:22px;">If you didn't register for Freshers '26, ignore this email.</p>
    </div>
    """


async def send_ticket_email(email: str, name: str, qr_code_id: str, roll_no: str, png_base64: str | None) -> dict[str, Any]:
    if not RESEND_API_KEY:
        return {"sent": False, "reason": "email_not_configured"}
    filename = f"Freshers26-{qr_code_id or roll_no or 'pass'}.png"
    params: dict[str, Any] = {
        "from": SENDER_EMAIL,
        "to": [email],
        "subject": f"Your Freshers '26 pass — {qr_code_id or roll_no}",
        "html": ticket_html(name, qr_code_id or "PENDING", roll_no),
    }
    if png_base64:
        params["attachments"] = [{"filename": filename, "content": png_base64}]
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"sent": True, "id": result.get("id")}
    except Exception as exc:  # noqa: BLE001
        logger.exception("Resend send failed")
        return {"sent": False, "reason": str(exc)}


@api.get("/")
async def root():
    return {"message": "Fresher Frenzy API online"}


@api.get("/health")
async def health():
    return {"status": "ok", "server_time": now(), "email_configured": bool(RESEND_API_KEY)}


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
    # Fire-and-forget welcome email (HTML only, no attachment). PNG attachment
    # is delivered later via /api/email-ticket when the frontend has rendered
    # the ticket, so the fresher always gets at least one confirmation email.
    email_result = await send_ticket_email(item["email"], item["name"], item["qr_code_id"], item["roll_no"], None)
    item["email_sent"] = email_result.get("sent", False)
    if email_result.get("sent"):
        await regs.update_one({"roll_no": roll}, {"$set": {"welcome_email_id": email_result.get("id"), "welcome_emailed_at": now()}})
    return {"success": True, "registration": public(item), "email": email_result}


@api.get("/pass/{identifier}")
async def get_pass(identifier: str):
    key = identifier.strip().upper()
    item = await regs.find_one({"$or": [{"roll_no": key}, {"qr_code_id": key}]})
    if not item:
        raise HTTPException(status_code=404, detail="Pass not found")
    return {"registration": public(item)}


@api.post("/email-ticket")
async def email_ticket(payload: EmailTicketIn):
    reg = await regs.find_one({"$or": [{"roll_no": payload.roll_no.strip().upper()}, {"qr_code_id": payload.qr_code_id}]})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    target_email = str(payload.email).lower()
    if reg.get("email") and reg["email"] != target_email:
        target_email = reg["email"]
    png_b64 = payload.png_base64.split(",", 1)[1] if payload.png_base64.startswith("data:") else payload.png_base64
    result = await send_ticket_email(target_email, reg["name"], reg["qr_code_id"], reg["roll_no"], png_b64)
    if not result["sent"]:
        raise HTTPException(status_code=502, detail=result.get("reason", "Email send failed"))
    await regs.update_one({"roll_no": reg["roll_no"]}, {"$set": {"emailed_at": now(), "last_email_id": result.get("id")}})
    return {"success": True, "email_id": result.get("id"), "sent_to": target_email}


@api.get("/stats")
async def stats():
    total = await regs.count_documents({})
    scanned = await regs.count_documents({"status": "scanned"})
    return {"total_whitelist": 61, "total_registered": total, "total_scanned": scanned, "total_pending": total - scanned}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
