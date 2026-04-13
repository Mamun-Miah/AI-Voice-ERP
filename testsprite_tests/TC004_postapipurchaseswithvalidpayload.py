import requests

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW53c3B2NDIwMDAzNzVmYjQzYnl6ZWN1IiwicGhvbmUiOiIrODgwMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoib3duZXIiLCJidXNpbmVzc0lkIjoiY21ud3NwdjNuMDAwMDc1ZmJjeXN1cnFnZCIsImlhdCI6MTc3NjA2MDc4MSwiZXhwIjoxNzc2NjY1NTgxfQ.U_0yVv3M2FSPttZToX9y_dean6QvEaHqVvHugHQM1Xg"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
TIMEOUT = 30

def test_post_api_purchases_with_valid_payload():
    purchase_url = f"{BASE_URL}/api/purchases"
    items_url = f"{BASE_URL}/api/items"
    created_purchase_id = None

    # Step 1: Get current items list and quantities
    try:
        items_resp_before = requests.get(items_url, headers=HEADERS, timeout=TIMEOUT)
        items_resp_before.raise_for_status()
        items_before = items_resp_before.json()
        # items_before format assumed: list of items with id and quantity keys
        if not items_before or not isinstance(items_before, list):
            raise AssertionError("Items list is empty or invalid before purchase")

        # Select 1 or more items with known ids and quantities for purchase payload
        # For simplicity, pick first two items with integer quantities
        selected_items = []
        for itm in items_before:
            if isinstance(itm.get("quantity"), int) and itm.get("quantity") >= 0:
                selected_items.append(itm)
            if len(selected_items) >= 2:
                break
        if not selected_items:
            raise AssertionError("No suitable items found in inventory to create purchase payload")

        purchase_items_payload = []
        for itm in selected_items:
            purchase_items_payload.append({
                "itemId": itm["id"],
                "quantity": 5
            })

        payload = {"items": purchase_items_payload}

        # Step 2: POST purchase with valid payload
        resp = requests.post(purchase_url, headers=HEADERS, json=payload, timeout=TIMEOUT)

        assert resp.status_code == 201, f"Expected HTTP 201, got {resp.status_code}"
        purchase_data = resp.json()
        assert "id" in purchase_data, "Response missing 'id' for created purchase"
        assert "items" in purchase_data and isinstance(purchase_data["items"], list), "Purchase items missing or invalid"
        created_purchase_id = purchase_data["id"]

        # Validate purchase items match request payload (item ids and quantities)
        purchase_items_resp_map = {i['itemId']: i['quantity'] for i in purchase_data["items"]}
        for pi in purchase_items_payload:
            assert pi["itemId"] in purchase_items_resp_map, "Purchased itemId missing in response"
            assert purchase_items_resp_map[pi["itemId"]] == pi["quantity"], "Purchased quantity mismatch in response"

        # Step 3: GET items post purchase to verify updated quantities
        items_resp_after = requests.get(items_url, headers=HEADERS, timeout=TIMEOUT)
        items_resp_after.raise_for_status()
        items_after = items_resp_after.json()
        if not items_after or not isinstance(items_after, list):
            raise AssertionError("Items list is empty or invalid after purchase")

        # Make dicts keyed by item id for comparison
        qty_before_map = {i["id"]: i["quantity"] for i in items_before}
        qty_after_map = {i["id"]: i["quantity"] for i in items_after}

        # For each purchased item, quantity after should be quantity before + purchased quantity
        for pi in purchase_items_payload:
            item_id = pi["itemId"]
            qty_before = qty_before_map.get(item_id)
            qty_after = qty_after_map.get(item_id)
            assert qty_before is not None, f"Item {item_id} missing in items_before"
            assert qty_after is not None, f"Item {item_id} missing in items_after"
            expected_qty = qty_before + pi["quantity"]
            assert qty_after == expected_qty, f"Item {item_id} quantity not updated correctly: expected {expected_qty}, got {qty_after}"

    finally:
        # Cleanup: Delete the created purchase to revert changes if created
        if created_purchase_id:
            try:
                del_resp = requests.delete(f"{purchase_url}/{created_purchase_id}", headers=HEADERS, timeout=TIMEOUT)
                # Assuming delete returns 204 No Content for success
                if del_resp.status_code not in (200, 204):
                    print(f"Warning: failed to delete purchase id {created_purchase_id}, status code: {del_resp.status_code}")
            except Exception as e:
                print(f"Exception occurred while deleting purchase id {created_purchase_id}: {e}")

test_post_api_purchases_with_valid_payload()