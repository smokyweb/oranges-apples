import paramiko
c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('server.bluestoneapps.com',port=22004,username='o2angapp',password='LwRbn8m@DhKAH@yC')
script = r"""<?php
$pdo = new PDO('mysql:host=localhost;dbname=o2angapp_orangapp', 'o2angapp_orangapp', '3W0_tihl[S;sz(a[');
$rows = $pdo->query("SELECT nutrient_key, target_value, unit FROM nutrition_targets WHERE age=62 AND gender='female' ORDER BY nutrient_key")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) echo $r['nutrient_key'].': '.$r['target_value'].' ['.$r['unit']."]\n";
"""
s=c.open_sftp()
with s.open('/home2/o2angapp/check_n2.php','w') as f: f.write(script)
s.close()
_,o,e=c.exec_command('php /home2/o2angapp/check_n2.php 2>&1')
print(o.read().decode())
c.close()
