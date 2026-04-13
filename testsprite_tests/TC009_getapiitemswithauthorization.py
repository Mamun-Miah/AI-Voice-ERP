import requests

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW53c3B2NDIwMDAzNzVmYjQzYnl6ZWN1IiwicGhvbmUiOiIrODgwMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoib3duZXIiLCJidXNpbmVzc0lkIjoiY21ud3NwdjNuMDAwMDc1ZmJjeXN1cnFnZCIsImlhdCI6MTc3NjA2MDc4MSwiZXhwIjoxNzc2NjY1NTgxfQ.U_0yVv3M2FSPttZToX9y_dean6QvEaHqVvHugHQM1Xg"

def test_get_api_items_with_authorization():
    url = f"{BASE_URL}/api/items"
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response data is not a list"
        for item in data:
            assert isinstance(item, dict), "Item is not an object"
            assert "id" in item, "Item missing 'id' field"
            assert "quantity" in item, "Item missing 'quantity' field"
            assert isinstance(item["quantity"], (int, float)), "'quantity' is not a number"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_items_with_authorization()
