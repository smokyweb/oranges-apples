import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
s=c.open_sftp()
s.put(
    r'C:\Users\kevin\projects\oranges-to-apples\app\Http\Controllers\Api\VerificationController.php',
    '/home2/o2angapp/public_html/app/Http/Controllers/Api/VerificationController.php'
)
s.close()
print("Deployed VerificationController.php")
# Verify
stdin,stdout,stderr = c.exec_command("grep -n 'Beta\\|123456' /home2/o2angapp/public_html/app/Http/Controllers/Api/VerificationController.php")
print(stdout.read().decode())
c.close()
