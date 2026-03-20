import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
# Check for server-level env var
cmd = "printenv MAIL_MAILER; ls /home2/o2angapp/public_html/.env*"
stdin,stdout,stderr = c.exec_command(cmd)
print("Server ENV + env files:", stdout.read().decode())
# Check if APP_ENV causes a different env file
cmd2 = "grep APP_ENV /home2/o2angapp/public_html/.env"
stdin2,stdout2,stderr2 = c.exec_command(cmd2)
print("APP_ENV:", stdout2.read().decode())
c.close()
