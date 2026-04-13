import requests

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW53c3B2NDIwMDAzNzVmYjQzYnl6ZWN1IiwicGhvbmUiOiIrODgwMTIzNDU2Nzg5MCIsInVzZXJuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoib3duZXIiLCJidXNpbmVzc0lkIjoiY21ud3NwdjNuMDAwMDc1ZmJjeXN1cnFnZCIsImlhdCI6MTc3NjA2MDc4MSwiZXhwIjoxNzc2NjY1NTgxfQ.U_0yVv3M2FSPttZToX9y_dean6QvEaHqVvHugHQM1Xg"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_postapisaleswithvalidpayload():
    # Step 1: GET /api/items to find items with available stock > 0
    items_resp = requests.get(f"{BASE_URL}/api/items", headers=HEADERS, timeout=TIMEOUT)
    assert items_resp.status_code == 200
    items_list = items_resp.json()

    assert isinstance(items_list, list), "Items list response is not a list"
    assert len(items_list) > 0, "No items found in inventory"

    # Select items that have quantity > 0 for sale
    sale_items = []
    for item in items_list:
        item_id = item.get("id")
        quantity = item.get("quantity")
        if item_id and isinstance(quantity, int) and quantity > 0:
            sale_quantity = 1
            sale_items.append({
                "itemId": item_id,
                "quantity": sale_quantity
            })
            break  # Only one item needed for test

    assert len(sale_items) > 0, "No items with available stock to create sale"

    sale_payload = {
        "items": sale_items
    }

    # Step 2: POST /api/sales with valid payload
    post_resp = requests.post(f"{BASE_URL}/api/sales", headers=HEADERS, json=sale_payload, timeout=TIMEOUT)
    assert post_resp.status_code == 201, f"Expected 201 Created but got {post_resp.status_code}"
    created_sale = post_resp.json()

    # Validate created sale response structure
    assert "id" in created_sale or "_id" in created_sale, "Created sale record missing id"
    assert "items" in created_sale, "Created sale record missing items"
    returned_items = created_sale["items"]
    assert isinstance(returned_items, list) and len(returned_items) > 0, "Created sale record items missing or empty"

    # Step 3: GET /api/items again to confirm stock decreased accordingly
    items_resp_after = requests.get(f"{BASE_URL}/api/items", headers=HEADERS, timeout=TIMEOUT)
    assert items_resp_after.status_code == 200
    items_list_after = items_resp_after.json()

    assert isinstance(items_list_after, list), "Items list response after sale is not a list"

    # Create dict for quick lookup by itemId
    items_dict_after = {}
    for item in items_list_after:
        item_id = item.get("id")
        if item_id:
            items_dict_after[item_id] = item

    # Check stock decrements
    for sold_item in sale_items:
        item_id = sold_item["itemId"]
        sold_qty = sold_item["quantity"]
        before_qty = None
        after_qty = None

        # Find quantity before sale
        for item in items_list:
            if item.get("id") == item_id:
                before_qty = item.get("quantity")
                break

        # Find quantity after sale
        item_after = items_dict_after.get(item_id)
        if item_after:
            after_qty = item_after.get("quantity")

        assert before_qty is not None and after_qty is not None, f"Could not find quantities for item {item_id}"
        assert after_qty == before_qty - sold_qty, f"Item {item_id} stock did not decrease correctly after sale"


test_postapisaleswithvalidpayload()
