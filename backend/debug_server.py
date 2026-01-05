import requests
import json

try:
    print("Checking Dashboard API...")
    r = requests.get('http://localhost:5000/api/dashboard')
    print(f"Status Code: {r.status_code}")
    print("Response Body:")
    print(r.text)
except Exception as e:
    print(f"Error: {e}")
