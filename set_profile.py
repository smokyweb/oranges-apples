import paramiko
HOST='server.bluestoneapps.com'; PORT=22004; USER='o2angapp'; PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy()); c.connect(HOST,port=PORT,username=USER,password=PASS)

# Check if age 62 / female has targets
cmd = "cd /home2/o2angapp/public_html && php artisan tinker --execute='print_r(DB::select(\"SELECT DISTINCT age FROM nutrition_targets ORDER BY age DESC LIMIT 10\"));'"
stdin,stdout,stderr = c.exec_command(cmd)
print("Max ages:", stdout.read().decode()[:500])

# Check if age 62 exists
cmd2 = "cd /home2/o2angapp/public_html && php artisan tinker --execute='echo DB::table(\"nutrition_targets\")->where(\"age\",62)->where(\"gender\",\"female\")->count();'"
stdin2,stdout2,stderr2 = c.exec_command(cmd2)
print("Age 62 female count:", stdout2.read().decode())

# Update Maelstrom profile
cmd3 = "cd /home2/o2angapp/public_html && php artisan tinker --execute='DB::table(\"users\")->where(\"id\",17)->update([\"age\"=>62,\"gender\"=>\"female\"]); echo \"done\";'"
stdin3,stdout3,stderr3 = c.exec_command(cmd3)
print("Update:", stdout3.read().decode())
c.close()
