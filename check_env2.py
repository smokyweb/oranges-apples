import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
# Check .env location and MAIL_MAILER line
cmd = "ls -la /home2/o2angapp/public_html/.env && grep MAIL_MAILER /home2/o2angapp/public_html/.env"
stdin,stdout,stderr = c.exec_command(cmd)
print(stdout.read().decode())
# Check if config cache has smtp hardcoded
cmd2 = "grep -i 'smtp\\|mail' /home2/o2angapp/public_html/bootstrap/cache/config.php 2>/dev/null | head -10"
stdin2,stdout2,stderr2 = c.exec_command(cmd2)
print("Config cache:", stdout2.read().decode()[:500])
c.close()
