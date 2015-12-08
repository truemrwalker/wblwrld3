#!/usr/bin/env bash

# At the actual deployment all secret keys can be conveniently given to the running app server
# via the --env-file "docker run" option.
#
# Specifically, all variables exposed in a container, include:
#    the ENV commands in the source container's Dockerfile
#    the -e, --env and --env-file options on the docker run command when the source container is started

docker run -d --name mongodb mongo
docker run -d -P --name wblwrld3 --link mongodb:db meme/wblwrld3:latest
