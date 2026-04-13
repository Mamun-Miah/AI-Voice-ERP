import requests

def test_postapiauthloginwithvalidcredentials():
    url = "http://localhost:8000/api/auth/login"
    payload = {
        "username": "John Doe",
        "password": "valid_password"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected HTTP 200 but got {response.status_code}"
        json_response = response.json()
        assert "token" in json_response or "jwt" in json_response or "access_token" in json_response, "JWT token not found in response body"
        token_value = (
            json_response.get("token") or
            json_response.get("jwt") or
            json_response.get("access_token")
        )
        assert isinstance(token_value, str) and len(token_value) > 0, "JWT token is invalid or empty"
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_postapiauthloginwithvalidcredentials()