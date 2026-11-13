"""Сквозная проверка API: python tests/smoke_test.py"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def login(email: str, password: str) -> dict:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def main() -> None:
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/services").json(), "каталог услуг пуст"
    assert client.get("/api/services/categories").json()

    register = client.post(
        "/api/auth/register",
        json={
            "full_name": "Тестовый Клиент",
            "email": "smoke@example.com",
            "phone": "+7 900 000-00-00",
            "password": "secret123",
        },
    )
    if register.status_code == 409:
        headers = login("smoke@example.com", "secret123")
    else:
        assert register.status_code == 201, register.text
        headers = {"Authorization": f"Bearer {register.json()['access_token']}"}

    services = client.get("/api/services").json()
    order = client.post(
        "/api/client/requests",
        headers=headers,
        json={
            "service_id": services[0]["id"],
            "device_type": "Смартфон",
            "device_model": "Test Phone",
            "issue_desc": "Не включается после падения, нужна диагностика.",
        },
    )
    assert order.status_code == 201, order.text
    order_id = order.json()["id"]
    my = client.get("/api/client/requests", headers=headers).json()
    assert any(item["id"] == order_id for item in my)

    master_headers = login("master@workshop.ru", "master123")
    available = client.get("/api/master/requests?scope=available", headers=master_headers).json()
    assert isinstance(available, list)
    taken = client.post(f"/api/master/requests/{order_id}/take", headers=master_headers)
    assert taken.status_code == 200, taken.text

    moved = client.patch(
        f"/api/master/requests/{order_id}/status",
        headers=master_headers,
        json={"status": "accepted", "comment": "Принято в работу", "labor_cost": 3500},
    )
    assert moved.status_code == 200, moved.text
    assert moved.json()["status"] == "accepted"

    parts = client.get("/api/master/parts", headers=master_headers).json()
    assert parts
    added = client.post(
        f"/api/master/requests/{order_id}/parts",
        headers=master_headers,
        json={"part_id": parts[0]["id"], "quantity": 1},
    )
    assert added.status_code == 201, added.text
    assert added.json()["parts_cost"] > 0
    assert added.json()["total_cost"] == round(
        added.json()["labor_cost"] + added.json()["parts_cost"], 2
    )

    receipt = client.post(
        f"/api/master/requests/{order_id}/receipts",
        headers=master_headers,
        json={"doc_type": "invoice"},
    )
    assert receipt.status_code == 201, receipt.text
    token = receipt.json()["qr_token"]
    page = client.get(f"/r/{token}")
    assert page.status_code == 200 and "Квитанция" in page.text

    admin_headers = login("admin@workshop.ru", "admin123")
    assert client.get("/api/admin/spare-parts", headers=admin_headers).status_code == 200
    assert client.get("/api/admin/services", headers=admin_headers).status_code == 200
    employees = client.get("/api/admin/employees", headers=admin_headers)
    assert employees.status_code == 200 and employees.json()
    stats = client.get("/api/stats/overview", headers=admin_headers)
    assert stats.status_code == 200, stats.text
    assert stats.json()["totals"]["orders"] > 0
    assert len(stats.json()["monthly"]) == 6

    assert client.get("/api/client/requests").status_code == 401
    assert client.get("/api/admin/spare-parts", headers=headers).status_code == 403
    print("Smoke test: OK")


if __name__ == "__main__":
    main()
