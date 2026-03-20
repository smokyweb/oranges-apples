import paramiko
c=paramiko.SSHClient();c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('server.bluestoneapps.com',port=22004,username='o2angapp',password='LwRbn8m@DhKAH@yC')
_,o,e=c.exec_command('grep DB_ /home2/o2angapp/public_html/.env')
print(o.read().decode())
c.close()
