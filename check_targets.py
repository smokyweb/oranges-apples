import paramiko
HOST='server.bluestoneapps.com'; PORT=22004; USER='o2angapp'; PASS='LwRbn8m@DhKAH@yC'
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy()); c.connect(HOST,port=PORT,username=USER,password=PASS)
# Check what nutrition_targets exist and what ages/genders
cmd = "cd /home2/o2angapp/public_html && php artisan tinker --execute='print_r(DB::select(\"SELECT DISTINCT age, gender, COUNT(*) as cnt FROM nutrition_targets GROUP BY age, gender ORDER BY age LIMIT 20\"));'"
stdin,stdout,stderr = c.exec_command(cmd)
print("Targets:", stdout.read().decode()[:2000])
# Check if user 17 (Maelstrom) has food_preferences
cmd2 = "cd /home2/o2angapp/public_html && php artisan tinker --execute='print_r(DB::select(\"SELECT * FROM food_preferences WHERE user_id=17\"));'"
stdin2,stdout2,stderr2 = c.exec_command(cmd2)
print("Food prefs:", stdout2.read().decode()[:1000])
c.close()
