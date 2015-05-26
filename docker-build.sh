#!/usr/bin/env bash

docker build -t meme/wblwrld3 .

docker run -d --name mongodb mongo
docker run --rm --link mongodb:db -it -v "$PWD/serverside:/tmp" mongo sh -c "exec mongo $DB_PORT_27017_TCP_ADDR:$DB_PORT_27017_TCP_PORT /tmp/scripts/mongoshell.js"

docker run --rm --link mongodb:db meme/wblwrld3:latest --deployment bootstrap
docker run --rm --link mongodb:db meme/wblwrld3:latest --deployment maintenance
