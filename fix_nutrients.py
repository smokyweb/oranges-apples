import paramiko
c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('server.bluestoneapps.com',port=22004,username='o2angapp',password='LwRbn8m@DhKAH@yC')

script = r"""<?php
$pdo = new PDO('mysql:host=localhost;dbname=o2angapp_orangapp', 'o2angapp_orangapp', '3W0_tihl[S;sz(a[');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Fix POTASIUM: stored as grams (4.7g), convert to mg
$n = $pdo->exec("UPDATE nutrition_targets SET target_value = target_value * 1000, unit = 'mg' WHERE nutrient_key = 'potasium' AND unit = ''");
echo "potasium fixed: $n rows\n";

// Fix SODIUM: stored as grams (1.3g), convert to mg
$n = $pdo->exec("UPDATE nutrition_targets SET target_value = target_value * 1000, unit = 'mg' WHERE nutrient_key = 'sodium' AND unit = ''");
echo "sodium fixed: $n rows\n";

// Fix FIBER: missing unit
$n = $pdo->exec("UPDATE nutrition_targets SET unit = 'g' WHERE nutrient_key = 'fiber' AND unit = ''");
echo "fiber unit fixed: $n rows\n";

// Fix VIT K: unit is 'ug k', should be 'mcg'
$n = $pdo->exec("UPDATE nutrition_targets SET unit = 'mcg' WHERE nutrient_key = 'vit_k'");
echo "vit_k unit fixed: $n rows\n";

// Fix ZINC: unit is 'ug', should be 'mg'
$n = $pdo->exec("UPDATE nutrition_targets SET unit = 'mg' WHERE nutrient_key = 'zinc'");
echo "zinc unit fixed: $n rows\n";

// Verify
$rows = $pdo->query("SELECT nutrient_key, target_value, unit FROM nutrition_targets WHERE nutrient_key IN ('potasium','sodium','fiber','vit_k','zinc') AND age=62 AND gender='female'")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) echo "CHECK: {$r['nutrient_key']}: {$r['target_value']} [{$r['unit']}]\n";
"""

s=c.open_sftp()
with s.open('/home2/o2angapp/fix_n.php','w') as f: f.write(script)
s.close()
_,o,e=c.exec_command('php /home2/o2angapp/fix_n.php 2>&1')
print(o.read().decode())
c.close()
