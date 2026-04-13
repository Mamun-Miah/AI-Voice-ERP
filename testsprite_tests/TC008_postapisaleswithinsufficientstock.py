import requests

BASE_URL = "http://localhost:8000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW53c3B2NDIwMDAzNzVmYjQzYnl6ZWN1IiwicGhvbmUiOiIrODgwMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoib3duZXIiLCJidXNpbmVzc0lkIjoiY21ud3NwdjNuMDAwMDc1ZmJjeXN1cnFnZCIsImlhdCI6MTc3NjA2MDc4MSwiZXhwIjoxNzc2NjY1NTgxfQ.U_0yVv3M2FSPttZToX9y_dean6QvEaHqVvHugHQM1Xg"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_post_api_sales_with_insufficient_stock():
    # Step 1: Get current items and their quantities
    try:
        items_resp = requests.get(f"{BASE_URL}/api/items", headers=HEADERS, timeout=TIMEOUT)
        assert items_resp.status_code == 200, f"Failed to get items: {items_resp.status_code} {items_resp.text}"
        resp_json = items_resp.json()

        # If response is a dict, try to extract list
        if isinstance(resp_json, dict):
            if "items" in resp_json and isinstance(resp_json["items"], list):
                items = resp_json["items"]
            elif "data" in resp_json and isinstance(resp_json["data"], list):
                items = resp_json["data"]
            else:
                # Not a list, fail
                assert False, "Items response is not a list or does not contain 'items' or 'data' key"
        else:
            items = resp_json

        assert isinstance(items, list), "Items response is not a list"
        assert len(items) > 0, "Items list is empty"

        # Prepare a sale payload with quantities exceeding available stock
        sale_items = []
        for item in items:
            item_id = item.get("id")
            if item_id is None:
                continue
            available_qty = item.get("quantity")
            if available_qty is None:
                continue
            if not isinstance(available_qty, int):
                continue

            # Set requested quantity exceeding the available stock (e.g., +10)
            requested_qty = available_qty + 10

            sale_items.append({
                "itemId": item_id,
                "quantity": requested_qty
            })
            break  # Only need one item to exceed stock to test insufficient stock

        assert len(sale_items) > 0, "No valid item found to create sale payload with insufficient stock"

        sale_payload = {
            "items": sale_items
        }

        # Step 2: Attempt to create sale with insufficient stock
        sale_resp = requests.post(f"{BASE_URL}/api/sales", headers=HEADERS, json=sale_payload, timeout=TIMEOUT)
        # Expecting HTTP 400 Bad Request
        assert sale_resp.status_code == 400, f"Expected 400 Bad Request, got {sale_resp.status_code}"

        # Check for insufficient stock error message in response body
        resp_json = {}
        try:
            resp_json = sale_resp.json()
        except Exception:
            pass

        error_msg_keys = ["error", "message", "detail", "errors"]
        error_found = False
        for key in error_msg_keys:
            if key in resp_json:
                val = resp_json[key]
                if isinstance(val, str) and "insufficient stock" in val.lower():
                    error_found = True
                    break
                elif isinstance(val, list):
                    for e in val:
                        if isinstance(e, str) and "insufficient stock" in e.lower():
                            error_found = True
                            break
                elif isinstance(val, dict):
                    for v in val.values():
                        if isinstance(v, str) and "insufficient stock" in v.lower():
                            error_found = True
                            break

        assert error_found, "Insufficient stock error message not found in response body"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_sales_with_insufficient_stock()
