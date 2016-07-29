#!/usr/bin/env bash

mongod --fork --quiet --logpath /home/wblwrld3/mongodb.log

# Persistent database is under /data/db
# Check if we already have the wblwrld3 database - If not, bootstrap
#
if [ ! -f /data/db/wblwrld3.ns ]; then

	mongo serverside/scripts/mongoshell.js

	#node serverside/web-server.js --deployment bootstrap
	node serverside/web-server.js --deployment maintenance
fi

#ls /data/db
node serverside/web-server.js "$@"
#cat /home/wblwrld3/mongodb.log
