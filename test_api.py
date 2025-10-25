import requests
import json

# Test API endpoint
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# Headers với token (cần login trước để lấy token)
headers = {
    "Content-Type": "application/json",
    # Thêm token nếu có
}

def test_scheduled_events_api():
    print("Testing Scheduled Events API...")

    # Test 1: Get upcoming events without search
    print("\n1. Testing GET /scheduled-events/upcoming (no search)")
    try:
        response = requests.get(f"{API_URL}/scheduled-events/upcoming?skip=0&limit=10", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total events: {data.get('total', 'N/A')}")
            print(f"Events returned: {len(data.get('data', []))}")
            if data.get('data'):
                print("Sample event:", json.dumps(data['data'][0], indent=2, default=str)[:200] + "...")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

    # Test 2: Get upcoming events with search
    print("\n2. Testing GET /scheduled-events/upcoming (with search='TEST')")
    try:
        response = requests.get(f"{API_URL}/scheduled-events/upcoming?skip=0&limit=10&search=TEST", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total events: {data.get('total', 'N/A')}")
            print(f"Events returned: {len(data.get('data', []))}")
            if data.get('data'):
                print("Sample event:", json.dumps(data['data'][0], indent=2, default=str)[:200] + "...")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

    # Test 3: Get upcoming events with empty search
    print("\n3. Testing GET /scheduled-events/upcoming (with empty search)")
    try:
        response = requests.get(f"{API_URL}/scheduled-events/upcoming?skip=0&limit=10&search=", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Total events: {data.get('total', 'N/A')}")
            print(f"Events returned: {len(data.get('data', []))}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_scheduled_events_api()