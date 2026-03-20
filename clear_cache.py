import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
for cmd in [
    "cd /home2/o2angapp/public_html && php artisan config:clear",
    "cd /home2/o2angapp/public_html && php artisan cache:clear",
    "cd /home2/o2angapp/public_html && php artisan config:cache",
    "cd /home2/o2angapp/public_html && php artisan tinker --execute=\"echo config('mail.default');\"",
]:
    stdin,stdout,stderr = c.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f"CMD: {cmd.split('&&')[1].strip()}")
    print(f"  OUT: {out}")
    if err: print(f"  ERR: {err[:200]}")
c.close()
