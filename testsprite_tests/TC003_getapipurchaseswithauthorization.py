import requests

def test_get_api_purchases_with_authorization():
    base_url = "http://localhost:8000"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW53c3B2NDIwMDAzNzVmYjQzYnl6ZWN1IiwicGhvbmUiOiIrODgwMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoib3duZXIiLCJidXNpbmVzc0lkIjoiY21ud3NwdjNuMDAwMDc1ZmJjeXN1cnFnZCIsImlhdCI6MTc3NjA2MDc4MSwiZXhwIjoxNzc2NjY1NTgxfQ.U_0yVv3M2FSPttZToX9y_dean6QvEaHqVvHugHQM1Xg"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    url = f"{base_url}/api/purchases"
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        try:
            purchases = response.json()
        except ValueError:
            assert False, "Response is not valid JSON"
        assert isinstance(purchases, list), f"Expected response to be a list, got {type(purchases)}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_purchases_with_authorization()