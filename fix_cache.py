import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
for cmd in [
    "rm -f /home2/o2angapp/public_html/bootstrap/cache/config.php",
    "rm -f /home2/o2angapp/public_html/bootstrap/cache/*.php",
    "cd /home2/o2angapp/public_html && php artisan config:cache 2>&1",
    "grep 'default' /home2/o2angapp/public_html/bootstrap/cache/config.php | grep mail | head -3",
    "cd /home2/o2angapp/public_html && php artisan tinker --execute=\"echo config('mail.default');\"",
]:
    stdin,stdout,stderr = c.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    print(f">> {cmd.split('&&')[-1].strip()}")
    if out: print(f"   {out[:300]}")
    if err: print(f"   ERR: {err[:200]}")
c.close()
