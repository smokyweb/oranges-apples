import requests, json, sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'https://orangestoapples2.betaplanets.com/api/v1'

# Login first
r = requests.post(f'{BASE}/login', json={'email': 'maelstrom@orangestoapples.app', 'password': 'orangesapp2026!'})
TOKEN = r.json().get('access_token')
print(f'Logged in: {TOKEN[:20]}...')

H = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}

# Get lists
lists_resp = requests.get(f'{BASE}/shopping-lists', headers=H)
lists = lists_resp.json()
print('Lists response keys:', list(lists.keys()) if isinstance(lists, dict) else type(lists))
data = lists.get('data', lists)
if isinstance(data, list):
    print(f'Found {len(data)} lists')
    for l in data[:3]:
        print(f"  id={l.get('id')} name={l.get('name')}")
else:
    print('Data:', json.dumps(data, indent=2)[:300])

# Try delete on the first list if any
if isinstance(data, list) and data:
    test_id = data[0]['id']
    print(f'\nTrying DELETE on list id={test_id}...')
    # Method 1: POST with _method=delete
    r1 = requests.post(f'{BASE}/shopping-lists/{test_id}', headers=H, json={'_method': 'delete'})
    print(f'POST _method=delete: {r1.status_code} -> {r1.text[:200]}')
    # Method 2: actual DELETE
    r2 = requests.delete(f'{BASE}/shopping-lists/{test_id}', headers=H)
    print(f'DELETE: {r2.status_code} -> {r2.text[:200]}')
