#!/usr/bin/env bash

docker run -d --name mongodb mongo
docker run -d -P --name wblwrld3 --link mongodb:db meme/wblwrld3:latest
