"""Regression coverage for Fresher Frenzy health, registration, pass, auth, stats, and scan APIs."""
import os
import uuid

import pytest
import requests


BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="module")
def client():
    with requests.Session() as session:
        session.headers.update({"Content-Type": "application/json"})
        yield session


def test_health(client):
    response = client.get(f"{BASE_URL}/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.parametrize("identifier", ["TEST-001", "FF-TEST-001"])
def test_demo_pass_lookup(client, identifier):
    response = client.get(f"{BASE_URL}/api/pass/{identifier}")
    assert response.status_code == 200
    registration = response.json()["registration"]
    assert registration["roll_no"] == "TEST-001"
    assert registration["qr_code_id"] == "FF-TEST-001"


def test_register_and_lookup(client):
    roll = f"TEST-{uuid.uuid4().hex[:8]}"
    payload = {"roll_no": roll, "name": "TEST Regression", "email": "TEST@Example.com", "gender": "Other", "phone": "", "branch": "BCom"}
    created = client.post(f"{BASE_URL}/api/register", json=payload)
    assert created.status_code == 200
    registration = created.json()["registration"]
    assert registration["roll_no"] == roll.upper()
    assert registration["email"] == "test@example.com"
    fetched = client.get(f"{BASE_URL}/api/pass/{roll}")
    assert fetched.status_code == 200
    assert fetched.json()["registration"]["name"] == "TEST Regression"


def test_admin_login_and_scan(client):
    login = client.post(f"{BASE_URL}/api/admin/login", json={"email": "admin@frenzy.edu", "password": "frenzy2024"})
    assert login.status_code == 200
    token = login.json()["token"]
    assert token
    unauthorized = client.post(f"{BASE_URL}/api/scan", json={"qr_code_id": "FF-TEST-001"})
    assert unauthorized.status_code == 401
    scan = client.post(f"{BASE_URL}/api/scan", headers={"Authorization": f"Bearer {token}"}, json={"qr_code_id": "FF-TEST-001"})
    assert scan.status_code == 200
    assert scan.json()["status"] in {"valid", "already_used"}


def test_stats(client):
    response = client.get(f"{BASE_URL}/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["total_registered"], int)
    assert data["total_registered"] >= 2