import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
# Check live VerificationController
cmd = "grep -n 'log\\|123456\\|mail.default' /home2/o2angapp/public_html/app/Http/Controllers/Api/VerificationController.php"
stdin,stdout,stderr = c.exec_command(cmd)
print("LIVE FILE:", stdout.read().decode())
# Check config cache
cmd2 = "cd /home2/o2angapp/public_html && php artisan tinker --execute=\"echo config('mail.default');\""
stdin2,stdout2,stderr2 = c.exec_command(cmd2)
print("MAIL DEFAULT CONFIG:", stdout2.read().decode())
c.close()
