#!/usr/bin/env bash

docker build -t meme/wblwrld3 .

docker run -d --name mongodb mongo
docker run --rm --link mongodb:db meme/wblwrld3:latest --deployment bootstrap
docker run --rm --link mongodb:db meme/wblwrld3:latest --deployment maintenance
