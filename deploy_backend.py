import paramiko, os

HOST='server.bluestoneapps.com';PORT=22004;USER='o2angapp';PASS='LwRbn8m@DhKAH@yC'
REMOTE_BASE='/home2/o2angapp/public_html'

files = [
    ('C:/Users/kevin/projects/oranges-to-apples/app/Services/FoodDataService.php',
     f'{REMOTE_BASE}/app/Services/FoodDataService.php'),
]

c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy());c.connect(HOST,port=PORT,username=USER,password=PASS)
s=c.open_sftp()
for local, remote in files:
    print(f'Uploading {os.path.basename(local)}...')
    s.put(local, remote)
s.close()

# Clear Laravel cache so new diversification logic takes effect immediately
stdin,stdout,stderr=c.exec_command(f'cd {REMOTE_BASE} && php artisan cache:clear')
print('Cache clear:', stdout.read().decode().strip())

c.close()
print('Done')
