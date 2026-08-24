"""Regression coverage for Fresher Frenzy health, registration, pass, auth, stats, and scan APIs."""
import os
import uuid

import pytest
import requests
from dotenv import dotenv_values

_frontend_env = dotenv_values("/app/frontend/.env")
_base = os.environ.get("REACT_APP_BACKEND_URL") or _frontend_env.get("REACT_APP_BACKEND_URL")
if not _base:
    raise RuntimeError("REACT_APP_BACKEND_URL missing from env and /app/frontend/.env")
BASE_URL = _base.rstrip("/")


@pytest.fixture(scope="module")
def client():
    with requests.Session() as session:
        session.headers.update({"Content-Type": "application/json"})
        yield session


@pytest.fixture(scope="module")
def admin_token(client):
    response = client.post(f"{BASE_URL}/api/admin/login", json={"email": "admin@frenzy.edu", "password": "frenzy2024"})
    if response.status_code != 200:
        pytest.fail(f"Admin login failed: {response.status_code} {response.text[:300]}")
    token = response.json().get("token")
    assert token, "Login response missing token"
    return token


# --- health / root ---
def test_root(client):
    response = client.get(f"{BASE_URL}/api/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health(client):
    response = client.get(f"{BASE_URL}/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body.get("server_time")


# --- pass lookup ---
@pytest.mark.parametrize("identifier", ["TEST-001", "FF-TEST-001", "ff-test-001"])
def test_demo_pass_lookup(client, identifier):
    response = client.get(f"{BASE_URL}/api/pass/{identifier}")
    assert response.status_code == 200
    registration = response.json()["registration"]
    assert registration["roll_no"] == "TEST-001"
    assert registration["qr_code_id"] == "FF-TEST-001"
    assert "_id" not in registration


def test_seeded_pass_ff_8492(client):
    response = client.get(f"{BASE_URL}/api/pass/FF-8492")
    assert response.status_code == 200
    registration = response.json()["registration"]
    assert registration["name"] == "BHUMIKA V CHALAGERI"
    assert registration["roll_no"] == "01FM26BCM001"
    assert registration["qr_code_id"] == "FF-8492"
    assert registration["status"] in {"pending", "scanned"}


def test_pass_not_found(client):
    response = client.get(f"{BASE_URL}/api/pass/FF-NOPE-999")
    assert response.status_code == 404


# --- registration ---
def test_register_and_lookup(client):
    roll = f"TEST-{uuid.uuid4().hex[:8]}"
    payload = {"roll_no": roll, "name": "TEST Regression", "email": "TEST@Example.com", "gender": "Other", "phone": "", "branch": "BCom"}
    created = client.post(f"{BASE_URL}/api/register", json=payload)
    assert created.status_code == 200
    registration = created.json()["registration"]
    assert registration["roll_no"] == roll.upper()
    assert registration["email"] == "test@example.com"
    assert registration["status"] == "pending"
    assert registration["qr_code_id"].startswith("FF-")
    fetched = client.get(f"{BASE_URL}/api/pass/{roll}")
    assert fetched.status_code == 200
    assert fetched.json()["registration"]["name"] == "TEST Regression"


def test_register_duplicate_roll(client):
    payload = {"roll_no": "TEST-001", "name": "TEST Dup", "email": "dup@example.com", "gender": "Other"}
    response = client.post(f"{BASE_URL}/api/register", json=payload)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_register_missing_required_field(client):
    response = client.post(f"{BASE_URL}/api/register", json={"roll_no": "TEST-X1", "name": "No Email"})
    assert response.status_code == 422


def test_register_blank_name_rejected(client):
    roll = f"TEST-{uuid.uuid4().hex[:8]}"
    response = client.post(f"{BASE_URL}/api/register", json={"roll_no": roll, "name": "  ", "email": "x@y.com", "gender": "Other"})
    assert response.status_code == 400


# --- auth ---
def test_admin_login_bad_password(client):
    response = client.post(f"{BASE_URL}/api/admin/login", json={"email": "admin@frenzy.edu", "password": "wrong"})
    assert response.status_code in (401, 403)


def test_admin_info(client):
    response = client.get(f"{BASE_URL}/api/admin/info")
    assert response.status_code == 200
    assert response.json()["admin_email"] == "admin@frenzy.edu"


# --- scan ---
def test_scan_requires_auth(client):
    response = client.post(f"{BASE_URL}/api/scan", json={"qr_code_id": "FF-TEST-001"})
    assert response.status_code == 401


def test_scan_bad_token(client):
    response = client.post(f"{BASE_URL}/api/scan", headers={"Authorization": "Bearer garbage"}, json={"qr_code_id": "FF-TEST-001"})
    assert response.status_code == 401


def test_scan_valid_then_already_used(client, admin_token):
    roll = f"TEST-{uuid.uuid4().hex[:8]}"
    created = client.post(f"{BASE_URL}/api/register", json={"roll_no": roll, "name": "TEST Scan", "email": "scan@example.com", "gender": "Other"})
    assert created.status_code == 200
    qr = created.json()["registration"]["qr_code_id"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    first = client.post(f"{BASE_URL}/api/scan", headers=headers, json={"qr_code_id": qr})
    assert first.status_code == 200
    assert first.json()["status"] == "valid"
    second = client.post(f"{BASE_URL}/api/scan", headers=headers, json={"qr_code_id": qr})
    assert second.status_code == 200
    assert second.json()["status"] == "already_used"
    persisted = client.get(f"{BASE_URL}/api/pass/{roll}")
    assert persisted.json()["registration"]["status"] == "scanned"
    assert persisted.json()["registration"]["scanned_at"]


def test_scan_unknown_code(client, admin_token):
    response = client.post(f"{BASE_URL}/api/scan", headers={"Authorization": f"Bearer {admin_token}"}, json={"qr_code_id": "FF-DOES-NOT-EXIST"})
    assert response.status_code == 404


# --- stats ---
def test_stats(client):
    response = client.get(f"{BASE_URL}/api/stats")
    assert response.status_code == 200
    data = response.json()
    for key in ("total_registered", "total_scanned", "total_pending"):
        assert isinstance(data[key], int), f"{key} not int"
    assert data["total_registered"] >= 2
    assert data["total_registered"] == data["total_scanned"] + data["total_pending"]
