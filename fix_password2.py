import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
s=c.open_sftp()
s.put(r'C:\Users\kevin\projects\oranges-to-apples\fix_mael_pass.php', '/home2/o2angapp/public_html/fix_mael_pass.php')
s.close()
cmd = "cd /home2/o2angapp/public_html && php artisan tinker --execute='require base_path(\"fix_mael_pass.php\");'"
stdin,stdout,stderr = c.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode()[:300])
# Clean up
c.exec_command("rm /home2/o2angapp/public_html/fix_mael_pass.php")
c.close()
