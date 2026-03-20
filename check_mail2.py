import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
cmd = "cd /home2/o2angapp/public_html && php artisan tinker --execute=\"var_dump(config('mail'));\" 2>&1 | head -10"
stdin,stdout,stderr = c.exec_command(cmd)
print(stdout.read().decode()[:1000])
c.close()
