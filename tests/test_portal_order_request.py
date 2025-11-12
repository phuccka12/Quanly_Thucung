import json
from unittest.mock import patch

# This test is a lightweight check that the frontend would send the expected
# payload shape to the backend. It does not run the frontend; instead it
# simulates the POST payload the UI constructs.


def test_portal_order_payload_shape():
    # sample cart state
    cart = [
        {"productId": "64f1a1b2c3d4e5f678901234", "quantity": 2},
        {"productId": "64f1a1b2c3d4e5f678901235", "quantity": 1}
    ]
    shipping = {"name": "Nguyen Van A", "address": "123 Pho Co", "phone": "0123456789"}

    payload = {
        "items": [{"product_id": i["productId"], "quantity": i["quantity"]} for i in cart],
        "shipping": shipping
    }

    # basic assertions about the shape
    assert "items" in payload
    assert isinstance(payload["items"], list)
    assert payload["shipping"]["name"] == "Nguyen Van A"
    assert payload["items"][0]["product_id"] == cart[0]["productId"]
    assert payload["items"][0]["quantity"] == 2

    # serialize to json to ensure it's JSON-serializable
    s = json.dumps(payload)
    assert isinstance(s, str)
