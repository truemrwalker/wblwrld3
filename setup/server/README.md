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
2. Install: nginx (or Run: ```bash gateway/install/nginx_latest.sh```)
3. Install: nodejs (or Run: ```bash gateway/install/nodejs_latest.sh```)
4. Copy: ```gateway/install/nginx.conf``` to ```/etc/nginx/```
5. Copy: ```gateway/install/conf.d/*``` to ```/etc/nginx/conf.d/```
6. Restart: nginx
7. Run: ```gateway/install/www_file_server.sh```
8. Change the password of the ```hokudai``` user

## Setup a "node" machine that runs mongodb and redis

1. Install: git (or run ```sudo apt-get install git```)
2. Note the IP of the server (e.g., ```1.2.3.4```)
3. Install: mongodb (or Run: ```bash nodes/install/mongodb_latest.sh```)
4. Install: redis (or Run: ```bash nodes/install/redis.sh```)
5. Edit: ```/etc/redis/redis.conf``` with line: e.g., ```bind 1.2.3.4```
6. Edit: ```/etc/mongod.conf``` with line: ```bindIp 1.2.3.4```
7. Restart: mongodb
8. Restart: redis

## Setup a "node" machine that runs the Webble World server

1. Install: git (or run ```sudo apt-get install git```)
2. Install: nodejs (or Run: ```bash nodes/install/nodejs_latest.sh```)
3. Run: ```bash nodes/install/wblwrld3.sh```
4. Edit: ```~wblwrld3/www/wblwrld3/run.sh``` with the correct mongodb and redis machine IP
   (e.g., ```1.2.3.4```) and secrets
5. Run: ```sudo systemctl start wblwrld3.service```
6. Change the password of the ```wblwrld3``` user
7. Note the IP of the machine (e.g., ```5.6.7.8```)
8. Login to the "gateway" machine
9. Edit: ```/etc/nginx/conf.d/wws.conf``` and add the machine's IP (e.g., ```5.6.7.8```) 
   to the ```main-app``` section
10. Edit: ```gateway/runtime/updateservers.sh``` and append the machine's IP
    (e.g., ```5.6.7.8```) at the ```WEBBLE_WORLD_SERVERS``` variable at the beginning of the file

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

## Setup a "node" machine that runs mongodb and redis

## Setup a "node" machine that runs the Webble World server

The Webble World server depends on [node.js](https://nodejs.org/) therefore that's the only third-party
software package that needs to be installed on the target machine. The latest version of
[node.js](https://nodejs.org/) is recommended for running the Webble World server. Although there are 
detailed instructions for installing the latest version of node.js on Ubuntu systems on the web, 
the script ```nodes/install/nodejs_latest.sh``` can also be used.

Following that, the Webble World server can be installed with the ```nodes/install/wblwrld3.sh``` script,
which essentially performs the following operations:

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
Note that if the ```nodes/install/wblwrld3.sh``` script doesn't have its executable flag set, it 
should be run through ```bash``` with the following command:

```
bash nodes/install/wblwrld3.sh
```

After the ```nodes/install/wblwrld3.sh``` script executes without any problems, there are a few things
that need to be done to enable the Webble World server to function properly:

1. The user ```wblwrld3``` is created with a default (and weak) password and after the execution of the
   ```nodes/install/wblwrld3.sh``` script it should be changed; the new, strong password will be
   necessary in the future for enabling the remote (automated) update of Webble World
2. The generated, empty ```run.sh``` file, located in the directory ```/home/wblwrld3/www/wblwrld3```
   has to be edited to contain the correct values and secrets for the following
   1. The deployment mode that should be either ```testing``` or ```production```
   2. The server name that should be the domain via which the gateway can be accessed
      (e.g., wws.meme.hokudai.ac.jp)
   3. The secrets for the application and for the session that should be common among all
      Webble World server instances
   4. The ```host``` (e.g., ```1.2.3.4```) and ```port``` for the mongodb and redis servers
   5. The credentials for accessing the mongodb database
   6. The API ids and keys for utilizing the third-party login services (i.e., Google+, Twitter and Facebook)
   7. The target port of the Webble World server (that can be any available port on the target machine)
   8. The setting of the value ```SERVER_BEHIND_REVERSE_PROXY``` to true to indicate that this particular
      instance of the Webble World server is running behind a reverse proxy (the gateway)

Subsequently, after all the correct values are set into the ```run.sh``` script, the Webble World server
can be started with the following ```systemd``` command:

```
sudo systemctl start wblwrld3.service
```

Whether the Webble World server started successfully or not, can be checked with the following command:

```
sudo systemctl status wblwrld3.service -l
```

Note that to change the password of the ```wblwrld3``` user, the following command can be used:

```
sudo passwd wblwrld3
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

# Update

## Update the Webble World client application

## Update the Webble World servers

## Update the Hands-on Portal website and wiki
