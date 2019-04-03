# Overview

This directory contains some scripts to simplify the setup and deployment of Webble World
on one or more Ubuntu 16.04 (systemd) servers.

The scripts assume that Webble World is used for production or testing deployments and thus 
requires the manual setup of secrets (via environment variables) and a few configuration values.

The recommended setup for deploying production or testing deployments of Webble World is to use
one Ubuntu server as the "gateway" and one or more Ubuntu servers as "nodes".

# Install Quick Reference

## Setup a "gateway" machine

1. Install: git (or run ```sudo apt-get install git```)
2. Install: nginx (or Run: ```bash setup/server/gateway/install/nginx_latest.sh```)
3. Install: nodejs (or Run: ```bash setup/server/gateway/install/nodejs_latest.sh```)
4. Copy: ```setup/server/gateway/install/nginx.conf``` to ```/etc/nginx/```
5. Copy: ```setup/server/gateway/install/conf.d/*``` to ```/etc/nginx/conf.d/```
6. Restart: nginx
7. Run: ```setup/server/gateway/install/www_file_server.sh```
8. Change the password of the ```hokudai``` user

## Setup a "node" machine that runs mongodb and redis

1. Install: git (or run ```sudo apt-get install git```)
2. Note the IP of the server (e.g., ```1.2.3.4```)
3. Install: mongodb (or Run: ```bash setup/nodes/install/mongodb_latest.sh```)
4. Install: redis (or Run: ```bash setup/nodes/install/redis.sh```)
5. Edit: ```/etc/redis/redis.conf``` with line: e.g., ```bind 1.2.3.4```
6. Edit: ```/etc/mongod.conf``` with line: ```bindIp 1.2.3.4```
7. Restart: mongodb
8. Restart: redis

## Setup a "node" machine that runs the Webble World server

1. Install: git (or run ```sudo apt-get install git```)
2. Install: nodejs (or Run: ```bash setup/nodes/install/nodejs_latest.sh```)
3. Run: ```bash setup/nodes/install/wblwrld3.sh```
4. Edit: ```~wblwrld3/www/wblwrld3/run.sh``` with the correct mongodb and redis machine IP
   (e.g., ```1.2.3.4```) and secrets
5. Run: ```sudo systemctl start wblwrld3.service```
6. Change the password of the ```wblwrld3``` user
7. Copy: the ```wblwrld3``` user's SSH keys
8. Note the IP of the machine (e.g., ```5.6.7.8```)
9. Login to the "gateway" machine
10. Edit: ```/etc/nginx/conf.d/wws.conf``` and add the machine's IP (e.g., ```5.6.7.8```) 
    to the ```main-app``` section
11. Edit: ```setup/server/gateway/runtime/updateservers.sh``` and append the machine's IP
    (e.g., ```5.6.7.8```) at the ```WEBBLE_WORLD_SERVERS``` variable at the beginning of the file

# Update Quick Reference

In general, running the following command (script) on the "gateway" machine updates (and restarts) all 
applications running on the Webble World cluster: 

```
bash ~hokudai/www/wblwrld3/setup/server/gateway/runtime/update.sh
```

The ```update.sh``` script just runs the three scripts mentioned below that update the three different
applications that currently run on the Webble World cluster. For better, more fine-grained control,
the following scripts can be invoked independently.

The following command (script) when invoked on the "gateway" updates the client-side Webble World
application that runs on the browser:

```
bash ~hokudai/www/wblwrld3/setup/server/gateway/runtime/updateapp.sh
```

The following command (script) when invoked on the "gateway" updates all the instances of the
Webble World server that run on the "node" machines of the Webble World cluster:

```
bash ~hokudai/www/wblwrld3/setup/server/gateway/runtime/updateservers2.sh
```

Finally, the following command (script) when invoked on the "gateway" updates the Hands-on Portal
website and generates a static, read-only version of the Hands-on Portal wiki:

```
bash ~hokudai/www/wblwrld3/setup/server/gateway/runtime/updatehop.sh
```

# Install

First of all, to obtain the source distribution of the Webble World server and its dependencies, the
[git](https://git-scm.com/) distributed version control system has to be available on the target
machines. Therefore, if the ```git``` command is not available, the following page contains
detailed information on installing it: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git

Alternatively, on Debian and Ubuntu-based systems, the following command installs ```git``` on the
target machine:

```
sudo apt-get install git
```

## Setup a "gateway" machine

The main server that should run on the "gateway" machine of a standard Webble World cluster is the
[nginx](https://www.nginx.com/) web server.

The following page contains detailed information on installing [nginx](https://www.nginx.com/) on
different platforms:

https://www.nginx.com/resources/admin-guide/installing-nginx-open-source/

Alternatively, on Debian and Ubuntu-based systems, the following script installs nginx on the
target machine:

```
bash setup/server/gateway/install/nginx_latest.sh
```

Subsequently, to configure nginx to correctly serve static files and dispatch requests, the following
steps have to be performed:

1. Copy the file ```setup/server/gateway/install/nginx.conf``` to ```/etc/nginx/```
2. Copy the all the files in ```setup/server/gateway/install/conf.d/``` to ```/etc/nginx/conf.d/```
3. Reload nginx with the command: ```sudo /etc/init.d/nginx reload```

Moreover, for HTTPS to work correctly the correct keys have to be configured in all the files under the 
```/etc/nginx/conf.d/``` folder of the target machine. The files in the repository, under the
```setup/server/gateway/install/conf.d/``` directory contain a working HTTPS configuration and more information
can be found at the following page:

http://nginx.org/en/docs/http/configuring_https_servers.html

For managing the software dependencies of the Webble World application and to generate static,
self-contained versions of Webble World wikis, [node.js](https://nodejs.org/) is required.
There are detailed instructions for installing the latest version of node.js on its official
website: https://nodejs.org/en/download/package-manager/

Alternatively, the script ```setup/nodes/install/nodejs_latest.sh``` can also be used.

Following the installation of [node.js](https://nodejs.org/), the necessary files for enabling the operation
of the "gateway" machine as the file-server and load-balancer of the Webble World cluster, can be installed
with the following script:

```
bash setup/server/gateway/install/www_file_server.sh
```

The above script, creates a new user called ```hokudai```, fetches all the necessary files and installs all
the necessary software libraries under the credentials of the ```hokudai``` user. The user ```hokudai``` is 
created with a default (and weak) password after the execution of the 
```setup/server/gateway/install/www_file_server.sh``` script and, thus, it should be changed by, e.g., using the
Following command:

```
sudo passwd hokudai
```

## Setup a "node" machine that runs mongodb and redis

Since this "node" machine hosts two core servers needed by the Webble World server to function properly
(see also ```serverside/README.md```), it has to be accessible to all the other "node" machines that
comprise the Webble World cluster. It shouldn't however be accessible to machines outside of the
Webble World cluster. If that's not the case, then, the machine should be protected by a firewall
(e.g., ```iptables```).

The following page contains detailed information on installing [mongoDB](https://www.mongodb.com/) on
different platforms:

https://docs.mongodb.com/manual/installation/

Alternatively, on Debian and Ubuntu-based systems, the following script installs mongodb on the
target machine:

```
bash setup/nodes/install/mongodb_latest.sh
```

Furthermore, the following page contains detailed information on installing [redis](http://redis.io/)
on different platforms:

https://redis.io/topics/quickstart

Again, alternatively, on Debian and Ubuntu-based systems, the following script installs redis on the
target machine:

```
bash setup/nodes/install/redis.sh
```

Assuming that the IP address with which the machine is exposed to the other "node" machines in the
Webble World cluster is ```1.2.3.4```, the following two files have to be edited. This is necessary 
to "bind" the two servers to the IP via which the other "node" machines can access them:

* The file ```/etc/redis/redis.conf``` has to contain the following line: ```bind 1.2.3.4```
* The file ```/etc/mongod.conf``` has to contain the following line: ```bindIp 1.2.3.4```

Subsequently, the two servers can be restarted with the following commands:

```
sudo systemctl restart mongod.service
sudo systemctl restart redis-server.service
```

## Setup a "node" machine that runs the Webble World server

The Webble World server depends on [node.js](https://nodejs.org/) therefore that's the only third-party
software package that needs to be installed on the target machine. The latest version of
[node.js](https://nodejs.org/) is recommended for running the Webble World server. Although there are 
detailed instructions for installing the latest version of node.js on Ubuntu systems on the web, 
the script ```setup/nodes/install/nodejs_latest.sh``` can also be used.

Following that, the Webble World server can be installed with the ```setup/nodes/install/wblwrld3.sh```
script, which essentially performs the following operations:

1. Creates a simple user account (without administrative priviledges) called ```wblwrld3```
2. Logs in as the ```wblwrld3``` user and performs the following operations
  1. Clones the Webble World repository from https://github.com/truemrwalker/wblwrld3.git
  2. Installs all the software dependencies needed by the Webble World server
  3. Creates an empty ```run.sh``` script inside the directory of the cloned repository that should be
     edited with the correct secrets and configuration values (see below)
3. Creates and installs a [systemd](https://www.freedesktop.org/wiki/Software/systemd/) "service" entry
   that is used for
   1. Starting and the Webble World server automatically when the machine reboots
   2. Restarting the Webble World server automatically if it crashes

During its execution, the script may ask for the user's password to continue (```sudo``` credentials).
Note that if the ```setup/nodes/install/wblwrld3.sh``` script doesn't have its executable flag set, it 
should be run through ```bash``` with the following command:

```
bash setup/nodes/install/wblwrld3.sh
```

After the ```setup/nodes/install/wblwrld3.sh``` script executes without any problems, there are a few things
that need to be done to enable the Webble World server to function properly:

1. The user ```wblwrld3``` is created with a default (and weak) password and after the execution of the
   ```setup/nodes/install/wblwrld3.sh``` script it should be changed; the new, strong password will be
   necessary in the future for enabling the remote (automated) update of Webble World
2. Since the Webble World server accesses git repositories through SSH, to enable access to those
   repositories either create a new SSH key-pair (```ssh-keygen```) or copy the standard ```wblwrld3```
   SSH key-pair from another "node" machine that runs the Webble World server
3. The generated, empty ```run.sh``` file, located in the directory ```/home/wblwrld3/www/wblwrld3```
   has to be edited to contain the correct values and secrets for the following
   1. The deployment mode that should be either ```testing``` or ```production```
   2. The server name that should be the domain via which the gateway can be accessed
      (e.g., CURRENT ONLINE SERVER)
   3. The secrets for the application and for the session that should be common among all
      Webble World server instances
   4. The ```host``` (e.g., ```1.2.3.4```) and ```port``` for the mongodb and redis servers
   5. The credentials for accessing the mongodb database
   6. The API ids and keys for utilizing the third-party login services (i.e., Google+, Twitter and Facebook)
   7. The target port of the Webble World server (that can be any available port on the target machine)
   8. The setting of the value ```SERVER_BEHIND_REVERSE_PROXY``` to true to indicate that this particular
      instance of the Webble World server is running behind a reverse proxy (the gateway)

Note that to change the password of the ```wblwrld3``` user, the following command can be used:

```
sudo passwd wblwrld3
```

The Webble World server uses ```nodegit``` via SSH in order to access the repositories of the Webble World
wikis that can be modified and managed within the Webble World platform but can also be exported as external
static websites. The file ```app/wikis/README.md``` contains more information on the Webble World wikis.

Therefore, to allow the Webble World server to [pull](https://git-scm.com/docs/git-pull) and 
[push](https://git-scm.com/docs/git-push) to the wiki repositories, either one of these two things have to 
be setup:

1. A new SSH key-pair can be created for the ```wblwrld3``` user and its public key (```id_rsa.pub```) has
   to be setup on all the remote repositories of all the supported wikis
2. The standard ```wblwrld3``` key-pair can be copied into the ```~wblwrld3/.ssh``` directory from another
   "node" machine (```~wblwrld3/.ssh```) that runs the Webble World server

First, using the newly setup password, the following command can be used to login as the ```wblwrld3``` user:

```
su - wblwrld3
```

After that, a new SSH key-pair can be generated using the following command:

```
ssh-keygen
```

As mentioned before, alternatively, the standard ```wblwrld3``` key-pair can be used for the current "node"
machine's ```wblwrld3``` user. In this case, the following files have to be copied from another "node" machine
that runs the Webble World server to the current machine, inside the ```wblwrld3``` user's ```.ssh``` directory:

1. ```~wblwrld3/.ssh/id_rsa``` (private key)
2. ```~wblwrld3/.ssh/id_rsa.pub``` (public key)

The standard ```wblwrld3``` account's public key is the following:

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDjruHGK/7OphK1xeLTEcoSIcN9L3QaGK7gIHdn8WKwqmTQTzmA1wBAkJh3Pv+iUc+Q2kui+GUeQMF4G/kbNJ9q2FLHGbFZgXpUm8Jlu4zat67X6QnOo1wa3c90L/hISHs1LxGcon/sCrnT/NDZT9uCG/cE0S5VLJQznWBzbf4BT+AylvuqbO91UOioYTCSoHcWlft27qugdmvOCRJOp+8oY09wrSBHpZDp9jrv9/MqEfOhsBNUtgEXsB9SlbqMtJ15lOrSYMkaGbJ8GqJUBk2QpQvaT+frk/l9GvsOgjAgeQ7+jTx44YY3oUU2hfW3LduFdL2nHNdRTnW9qhCw/ADT wblwrld3@g-Precision-M6500
```

Therefore, at the target, remote wiki repository, either the newly generated ```id_rsa.pub``` key or the standard public
key mentioned above should be given read and write access. Refer to the remote git repository's manual on how to setup
the aforementioned public key (e.g., for gitlab.com the setting is under: "Profile Settings" -> "SSH Keys").

Subsequently, after the SSH key-pair is setup and all the correct values are set into the ```run.sh``` script, the 
Webble World server can be started with the following ```systemd``` command:

```
sudo systemctl start wblwrld3.service
```

(Of course, the above command should run from a ```sudo```-able account, therefore, logout from the ```wblwrld3``` 
account, in case the SSH key-pair installation was performed before via the ```wblwrld3``` account).

Whether the Webble World server started successfully or not, can be checked with the following command:

```
sudo systemctl status wblwrld3.service -l
```

After the successfull setup and invocation of the Webble World server the following two tasks have to be
performed to enable the gateway to send requests to the new instance of the Webble World server and to
allow its remote, automated update in the future.

1. The file ```/etc/nginx/conf.d/wws.conf``` in the gateway machine has to be edited to include the 
   new server under the ```main-app``` section
2. The file ```gateway/runtime/updateservers.sh``` (inside this repository) has to be edited to
   include the new server at the end of the ```WEBBLE_WORLD_SERVERS``` variable

For example, assuming that the machine's IP (can also be seen via ```ifconfig```) is ```5.6.7.8```, the following
line should be added in the ```/etc/nginx/conf.d/wws.conf``` that is located in the gateway server:

```
upstream main-app {
    ip_hash;
    server 133.87.133.85:7000 fail_timeout=1s; # Previous server instances

	server 5.6.7.8; # Newly installed server instance
}
```

After the nginx configuration file, ```/etc/nginx/conf.d/wws.conf```, is updated, the following command
can check whether the resulting configuration is syntactically correct or not:

```
sudo /etc/init.d/nginx configtest
```

Subsequently, if the output of the above command reports that the configuration is well-formed, then, 
the following command will force the ```nginx``` server to load and apply the new configuration:

```
sudo /etc/init.d/nginx reload
```

Moreover, to enable the automatic updating of all the Webble World server instances that run inside the 
Webble World cluster, the new server's IP address (e.g., ```5.6.7.8```) has to be added at the beginning of 
the file ```gateway/runtime/updateservers.sh```, which is located inside the repository. A better strategy, however,
is to copy the file ```gateway/runtime/updateservers.sh``` from the repository to the home directory of the 
gateway's main user, (e.g., ```cp /home/hokudai/www/wblwrld3/setup/server/gateway/runtime/updateservers.sh ~```)
and make the required change on that copy. Then, inside the ```updateservers.sh``` file, the following 
line has to be edited:

```bash
WEBBLE_WORLD_SERVERS='133.87.133.216 5.6.7.8'
```

# Run

During the installation step (see previous section), a "service" file was created for each of the installed
servers. A "service" file, makes it very easy to start, restart and stop servers using the facilities of
the operating system.

Since the default Webble World cluster machines run either Ubuntu 16.04 or Ubuntu 14.04, the "service" files
target either the "systemd" (16.04) or the "upstart" (14.04) system.

More information about those systems can be found in the following pages:

* https://www.freedesktop.org/wiki/Software/systemd/
* http://upstart.ubuntu.com/cookbook/

Therefore, starting, restarting and stopping servers is generally consistent among the different machines
and different servers running on default the Webble World cluster.

## Run ```nginx``` on the "gateway" machine

[Nginx](https://www.nginx.com/) can be started with the following command:

```
sudo /etc/init.d/nginx start
```

It can be stopped with the following command:

```
sudo /etc/init.d/nginx stop
```

The following command checks whether the nginx's configuration files are well-formed or not.

```
sudo /etc/init.d/nginx configtest
```

The files checked by the ```configtest``` command are:

1. The file ```/etc/nginx/nginx.conf```
2. All the files under the directory ```/etc/nginx/conf.d/```

The following command reloads all the configuration files and updates the functionality of nginx:

```
sudo /etc/init.d/nginx reload
```

The files that are reloaded are the following:

1. The file ```/etc/nginx/nginx.conf```
2. All the files under the directory ```/etc/nginx/conf.d/```

## Run mongodb and redis on a "node" machine 

The [redis](http://redis.io/) server can be started with the following command:
```
sudo systemctl start redis-server.service
```

It can be stopped with the following command:

```
sudo systemctl stop redis-server.service
```

The following command restarts the redis server:

```
sudo systemctl restart redis-server.service
```

Similarly, [mongoDB](https://www.mongodb.com/) can be started with the following command:


```
sudo systemctl start mongod.service
```

It can be stopped with the following command:

```
sudo systemctl stop mongod.service
```

Then, the following command restarts the mongodb server:

```
systemctl restart mongod.service
```

## Run the Webble World server on a "node" machine 

The Webble World server can be started with the following command:

```
sudo systemctl start wblwrld3.service
```

It can be stopped with the following command:

```
sudo systemctl stop wblwrld3.service
```

Finally, the following command restarts the server:

```
sudo systemctl restart wblwrld3.service
```

Moreover, on the two backup machines that serve requests if and only if all the other ```main-app``` 
machines are offline, the Webble World server can be started and stopped with the following commands
respectively:

```
sudo /etc/init.d/wblwrld3 start
sudo /etc/init.d/wblwrld3 stop
```

The reason for this is that the two backup machines in the default Webble World cluster run Ubuntu
14.04 instead of Ubuntu 16.04 that uses [systemd](https://www.freedesktop.org/wiki/Software/systemd/).

# Update

If the instructions in this file (```README.md```) are followed correctly, then all the machines
in the Webble World cluster that serve requests either for the Webble World platform or the
Hands-on Portal wiki can be updated via the ```gateway``` machine using the scripts located
under the ```setup/server/gateway/runtime``` sub-directory.

In this sense, executing the file ```setup/server/gateway/runtime/update.sh``` fetches from their respective
git repositories and updates:

1. The Webble World server instances that are running on all the "node" machines
3. The Hands-on Portal wiki that is exported to a self-contained index.html file
2. The "classic" Hands-on Portal website that contains a simple, static, javascript-less version of
   the Hands-on Portal content

If the ```update.sh``` file doesn't have its executable flag set, it can be run with the following
command:

```
bash setup/server/gateway/runtime/update.sh
```

On the default Webble World cluster:

* The Webble World cluster is available at: CURRENT ONLINE SERVER
* The Hands-on Portal wiki is available at: CURRENT ONLINE HOP SERVER/wiki
* The Hands-on Portal classic website is available at: CURRENT ONLINE HOP SERVER/classic

## Update the Webble World client application

The following command updates only the client-side Webble World application that runs on the browser
and communicates with the server through the Webble World server's REST API:

```
bash setup/server/gateway/runtime/updateapp.sh
```

## Update the Webble World servers

The following command updates and hopefully restarts all the instances of the Webble World server that
run on all the different "node" manchines of the Webble World cluster:

```
bash setup/server/gateway/runtime/updateservers.sh
```

There's another version of the above script that updates the servers using the ```hokudai``` user's
account:

```
bash setup/server/gateway/runtime/updateservers2.sh
```


## Update the Hands-on Portal website and wiki

Finally, the following command, updates and generates all the files required for the Hands-on Portal website
and the Hands-on Portal wiki:

```
bash setup/server/gateway/runtime/updatehop.sh
```
