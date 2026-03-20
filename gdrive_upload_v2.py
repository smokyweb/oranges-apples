import json, requests, os

with open(r'C:\Users\kevin\.openclaw\workspace\google-drive-creds.json') as f:
    creds = json.load(f)

# Refresh access token
r = requests.post('https://oauth2.googleapis.com/token', data={
    'client_id': creds['client_id'],
    'client_secret': creds['client_secret'],
    'refresh_token': creds['refresh_token'],
    'grant_type': 'refresh_token'
})
token = r.json()['access_token']
print('Token refreshed')

# Upload APK
apk_path = r'C:\Users\kevin\Downloads\OrangesToApples-v2.apk'
file_size = os.path.getsize(apk_path)
print(f'Uploading {file_size/1024/1024:.1f}MB...')

metadata = {'name': 'OrangesToApples-v2.apk', 'mimeType': 'application/vnd.android.package-archive'}
with open(apk_path, 'rb') as apk:
    r2 = requests.post(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
        headers={'Authorization': f'Bearer {token}'},
        files={
            'metadata': ('metadata', json.dumps(metadata), 'application/json'),
            'file': ('OrangesToApples-v2.apk', apk, 'application/vnd.android.package-archive')
        }
    )

result = r2.json()
print('Upload result:', json.dumps(result, indent=2))

# Make it publicly accessible
if 'id' in result:
    file_id = result['id']
    r3 = requests.post(
        f'https://www.googleapis.com/drive/v3/files/{file_id}/permissions',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        json={'role': 'reader', 'type': 'anyone'}
    )
    print('Permission set:', r3.status_code)
    print(f'\nDownload link: https://drive.google.com/uc?export=download&id={file_id}')
    print(f'View link: https://drive.google.com/file/d/{file_id}/view')
