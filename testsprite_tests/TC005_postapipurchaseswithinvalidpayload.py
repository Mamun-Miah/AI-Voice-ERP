import requests

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW53c3B2NDIwMDAzNzVmYjQzYnl6ZWN1IiwicGhvbmUiOiIrODgwMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoib3duZXIiLCJidXNpbmVzc0lkIjoiY21ud3NwdjNuMDAwMDc1ZmJjeXN1cnFnZCIsImlhdCI6MTc3NjA2MDc4MSwiZXhwIjoxNzc2NjY1NTgxfQ.U_0yVv3M2FSPttZToX9y_dean6QvEaHqVvHugHQM1Xg"

def test_post_api_purchases_with_invalid_payload():
    url = f"{BASE_URL}/api/purchases"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    # Invalid payload: missing required fields (e.g. missing 'items' field)
    invalid_payload = {
        # intentionally left empty or missing required fields
    }
    try:
        response = requests.post(url, headers=headers, json=invalid_payload, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
    try:
        error_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    # Check that error_response contains validation error details - assume presence of 'errors' or 'message'
    assert isinstance(error_response, dict), "Error response is not a JSON object"
    validation_keys = ["errors", "message", "detail", "validationErrors"]
    assert any(k in error_response for k in validation_keys), "Validation error details missing in response"

test_post_api_purchases_with_invalid_payload()