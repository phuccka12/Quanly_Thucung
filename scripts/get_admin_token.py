"""
Script to get admin JWT token for testing API endpoints.
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import asyncio
import urllib.request
import urllib.parse
import json

def get_admin_token():
    """Get admin token by logging in."""
    base_url = "http://127.0.0.1:8000"
    
    # Try common admin credentials
    credentials = [
        {"username": "admin@example.com", "password": "admin123"},
        {"username": "admin@admin.com", "password": "admin123"},
        {"username": "admin", "password": "admin123"},
    ]
    
    for creds in credentials:
        try:
            print(f"Trying username: {creds['username']}")
            data = urllib.parse.urlencode(creds).encode()
            req = urllib.request.Request(
                f"{base_url}/api/v1/login",
                data=data,
                method='POST'
            )
            with urllib.request.urlopen(req) as response:
                if response.status == 200:
                    result = json.loads(response.read().decode())
                    token = result.get("access_token")
                    print(f"\n✓ Login successful!")
                    print(f"Username: {creds['username']}")
                    print(f"Token: {token}\n")
                    return token, creds['username']
        except urllib.error.HTTPError as e:
            print(f"  Failed: {e.code} - {e.read().decode()}")
        except Exception as e:
            print(f"  Error: {e}")
    
    print("\n✗ Could not login with any credentials")
    print("Run scripts/create_admin.py first to create an admin user")
    return None, None

def list_pets(token):
    """List all pets to get a pet_id for testing."""
    base_url = "http://127.0.0.1:8000"
    
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/pets/",
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                pets = json.loads(response.read().decode())
                if pets:
                    print(f"Found {len(pets)} pets:")
                    for pet in pets[:3]:  # Show first 3
                        pet_id = pet.get('id') or pet.get('_id')
                        print(f"  - {pet.get('name')} (ID: {pet_id})")
                    return pets[0].get('id') or pets[0].get('_id')
                else:
                    print("No pets found in database")
            else:
                print(f"Failed to get pets: {response.status}")
    except Exception as e:
        print(f"Error getting pets: {e}")
    return None

def test_health_records(token, pet_id):
    """Test the health records endpoint."""
    base_url = "http://127.0.0.1:8000"
    
    print(f"\nTesting GET /api/v1/health-records/for-pet/{pet_id}")
    print("=" * 60)
    
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/health-records/for-pet/{pet_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req) as response:
            body = response.read().decode()
            print(f"Status: {response.status}")
            print(f"Response:\n{body}\n")
            
            if response.status == 200:
                print("✓ Success! Health records retrieved")
                data = json.loads(body)
                print(f"Number of records: {len(data)}")
            else:
                print("✗ Request failed")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Response:\n{e.read().decode()}\n")
        print("✗ Request failed")
    except Exception as e:
        print(f"✗ Error: {e}")

def main():
    print("Getting admin token...\n")
    token, username = get_admin_token()
    
    if not token:
        return
    
    print("\nGetting pet list...")
    pet_id = list_pets(token)
    
    if pet_id:
        test_health_records(token, pet_id)
    else:
        print("\nNo pets available for testing")
        print("Run scripts/seed_reports.py to create sample data")
    
    print("\n" + "=" * 60)
    print("PowerShell command to test manually:")
    print(f'$token = "{token}"')
    print(f'$headers = @{{ Authorization = "Bearer $token" }}')
    if pet_id:
        print(f'Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health-records/for-pet/{pet_id}" -Headers $headers -Method Get')

if __name__ == "__main__":
    main()
