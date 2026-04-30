#!/usr/bin/env python3
"""Delete all IOS_DISTRIBUTION certs via Apple REST API before creating a fresh one."""
import jwt, time, requests, os, sys

key_id = os.environ['APP_STORE_CONNECT_KEY_IDENTIFIER']
issuer_id = os.environ['APP_STORE_CONNECT_ISSUER_ID']
private_key = os.environ['APP_STORE_CONNECT_PRIVATE_KEY']

payload = {'iss': issuer_id, 'exp': int(time.time()) + 900, 'aud': 'appstoreconnect-v1'}
tok = jwt.encode(payload, private_key, algorithm='ES256', headers={'kid': key_id})
h = {'Authorization': f'Bearer {tok}'}

r = requests.get(
    'https://api.appstoreconnect.apple.com/v1/certificates'
    '?filter[certificateType]=IOS_DISTRIBUTION&limit=20',
    headers=h
)
if r.status_code != 200:
    print(f'List failed: {r.status_code} {r.text[:200]}')
    sys.exit(0)

certs = r.json().get('data', [])
print(f'Found {len(certs)} IOS_DISTRIBUTION cert(s) to delete')
for c in certs:
    cid = c['id']
    d = requests.delete(f'https://api.appstoreconnect.apple.com/v1/certificates/{cid}', headers=h)
    print(f'  Deleted {cid}: HTTP {d.status_code}')

print('Done.')
