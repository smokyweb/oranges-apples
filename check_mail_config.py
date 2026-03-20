import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
# Check the mail config file
cmd = "head -20 /home2/o2angapp/public_html/config/mail.php"
stdin,stdout,stderr = c.exec_command(cmd)
print("mail.php:", stdout.read().decode())
# Also check what MAIL_MAILER resolves to
cmd2 = "cd /home2/o2angapp/public_html && php artisan tinker --execute=\"echo env('MAIL_MAILER');\""
stdin2,stdout2,stderr2 = c.exec_command(cmd2)
print("ENV MAIL_MAILER:", stdout2.read().decode())
c.close()
