#!/usr/bin/env bash

# At the actual deployment all secret keys can be conveniently given to the running app server
# via the --env-file "docker run" option.
#
# Specifically, all variables exposed in a container, include:
#    the ENV commands in the source container's Dockerfile
#    the -e, --env and --env-file options on the docker run command when the source container is started

#docker run -d -P --name wblwrld3 meme/wblwrld3
docker run -d -p 443:7443 --name wblwrld3 meme/wblwrld3

# Persistent version
#docker run -d -P -v /home/docker/mongodb:/data/db --name wblwrld3 meme/wblwrld3
#docker run -d -p 443:7443 -v /home/docker/mongodb:/data/db --name wblwrld3 meme/wblwrld3
