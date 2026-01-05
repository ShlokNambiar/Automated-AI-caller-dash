import requests

url = 'http://localhost:5000/api/upload'
files = {'file': ('leads.csv', 'Name,Phone\nTest User,+919999999999\n', 'text/csv')}

try:
    print("Testing Upload API...")
    r = requests.post(url, files=files)
    print(f"Status: {r.status_code}")
    print(r.text)
except Exception as e:
    print(f"Error: {e}")
