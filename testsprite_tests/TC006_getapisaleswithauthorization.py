import requests

def test_getapisaleswithauthorization():
    base_url = "http://localhost:8000"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW53c3B2NDIwMDAzNzVmYjQzYnl6ZWN1IiwicGhvbmUiOiIrODgwMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoib3duZXIiLCJidXNpbmVzc0lkIjoiY21ud3NwdjNuMDAwMDc1ZmJjeXN1cnFnZCIsImlhdCI6MTc3NjA2MDc4MSwiZXhwIjoxNzc2NjY1NTgxfQ.U_0yVv3M2FSPttZToX9y_dean6QvEaHqVvHugHQM1Xg"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    try:
        response = requests.get(f"{base_url}/api/sales", headers=headers, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # The PRD expects a list, but if a dict with key 'sales' or 'data' contains list, handle it
    if isinstance(data, dict):
        if 'sales' in data and isinstance(data['sales'], list):
            data = data['sales']
        elif 'data' in data and isinstance(data['data'], list):
            data = data['data']
        else:
            assert False, f"Expected response data to be a list or dict with 'sales' or 'data' key containing a list, got dict with keys {list(data.keys())}"

    assert isinstance(data, list), f"Expected response data to be a list, got {type(data)}"


test_getapisaleswithauthorization()
