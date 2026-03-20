import paramiko
HOST='server.bluestoneapps.com'
PORT=22004
USER='o2angapp'
PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
# Reset Maelstrom's password to the lowercase version so login works
cmd = """cd /home2/o2angapp/public_html && php artisan tinker --execute="$u = App\\\\Models\\\\User::where('email','maelstrom@orangestoapples.app')->first(); $u->password = bcrypt('orangesapp2026!'); $u->save(); echo 'done id:'.$u->id;" """
stdin,stdout,stderr = c.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode()[:300])
c.close()
