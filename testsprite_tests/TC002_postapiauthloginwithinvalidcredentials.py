import requests

def test_postapiauthloginwithinvalidcredentials():
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/auth/login"
    # Removed Authorization header because login does not require prior token
    headers = {
        "Content-Type": "application/json"
    }
    # Intentionally invalid payload with wrong username/password
    payload = {
        "username": "invaliduser",
        "password": "wrongpassword"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert "error" in resp_json or "message" in resp_json, "Response JSON does not contain an error message"
    error_msg = resp_json.get("error") or resp_json.get("message") or ""
    assert "authentication" in error_msg.lower() or "unauthorized" in error_msg.lower(), "Error message does not indicate authentication failure"

test_postapiauthloginwithinvalidcredentials()