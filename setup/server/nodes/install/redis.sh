#!/bin/bash

#
# We don't need the latest version - Ubuntu's default version is fine.
#
# If you want to expose redis-server to your local network edit in
# /etc/redis/redis.conf the "bind" address.
#

sudo apt-get install redis-server
