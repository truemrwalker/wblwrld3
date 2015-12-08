#!/usr/bin/env bash

# Build image
docker build -t meme/wblwrld3 .

# Run the database (mongodb) image - if not already running
docker run -d --name mongodb mongo

# Just generate mongoshell.js
cd serverside/scripts
node mongoshellgen.js
echo "Generated a brand new mongoshell.js file (probably)"
cd "$OLDPWD"

# Initialize database (if needed)
docker run --rm --link mongodb:db -it -v "$PWD/serverside/scripts/mongoshell.js:/tmp/mongoshell.js" mongo sh -c "exec mongo $DB_PORT_27017_TCP_ADDR:$DB_PORT_27017_TCP_PORT /tmp/mongoshell.js"

# Bootstrap the application
docker run --rm --link mongodb:db meme/wblwrld3:latest --deployment bootstrap
docker run --rm --link mongodb:db meme/wblwrld3:latest --deployment maintenance
