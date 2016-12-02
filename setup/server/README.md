# Overview

This directory contains some scripts to simplify the setup and deployment of Webble World
on one or more Ubuntu 16.04 (systemd) servers.

The scripts assume that Webble World is used for production or testing deployments and thus 
requires the manual setup of secrets (via environment variables) and a few configuration values.

The recommended setup for deploying production or testing deployments of Webble World is to use
one Ubuntu server as the "gateway" and one or more Ubuntu servers as "nodes".

# TLDR

## Setup a "gateway" server

1. Install: nginx (or Run: ```bash gateway/install/nginx_latest.sh```)
2. Install: nodejs (or Run: ```bash gateway/install/nodejs_latest.sh```)
3. Copy: ```gateway/install/nginx.conf``` to ```/etc/nginx/```
4. Copy: ```gateway/install/conf.d/*``` to ```/etc/nginx/conf.d/```
5. Restart: nginx
6. Run: ```gateway/install/www_file_server.sh```
7. Change the password of the ```hokudai``` user

## Setup a "node" server that runs mongodb and redis

1. Note the IP of the server as ```DB_SERVER_IP``` (e.g., by checking ```ifconfig```)
2. Install: mongodb (or Run: ```bash nodes/install/mongodb_latest.sh```)
3. Install: redis (or Run: ```bash nodes/install/redis.sh```)
4. Edit: ```/etc/redis/redis.conf``` with line: ```bind DB_SERVER_IP```
5. Edit: ```/etc/mongod.conf``` with line: ```bindIp DB_SERVER_IP```
6. Restart: mongodb
7. Restart: redis

## Setup a "node" server that runs the Webble World server

1. Install: nodejs (or Run: ```bash nodes/install/nodejs_latest.sh```)
2. Run: ```nodes/install/wblwrld3.sh```
3. Edit: ```~wblwrld3/www/wblwrld3/run.sh``` with the correct ```DB_SERVER_IP``` and secrets
4. Run: ```sudo systemctl start wblwrld3.service```
5. Change the password of the ```wblwrld3``` user
6. Note the IP of the server as ```WW_SERVER_IP```
7. Login to the "gateway" server
8. Edit: ```/etc/nginx/conf.d/wws.conf``` and add the ```WW_SERVER_IP``` to the ```main-app``` section
9. Edit: ```gateway/runtime/updateservers.sh``` and append the ```WW_SERVER_IP``` at the 
   ```WEBBLE_WORLD_SERVERS``` variable at the beginning of the file

# Install

# Run

# Update
