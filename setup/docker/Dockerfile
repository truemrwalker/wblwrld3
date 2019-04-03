########################################################################
# Dockerfile to build a self-contained Webble World 3.0 ready to run images
# Based on node

#FROM node:0.10-onbuild
FROM ubuntu:14.04
MAINTAINER Giannis Georgalis

########################################################################
# Basic environment: Python, mongodb and ubuntu's nodejs version
#
RUN \
  apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10 && \
  echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' > /etc/apt/sources.list.d/mongodb.list && \
  apt-get update && \
  apt-get install -y mongodb-org && \
  apt-get install -y python python-dev python-pip python-virtualenv && \
  apt-get install -y nodejs npm build-essential git && \
  rm -rf /var/lib/apt/lists/*

# Ubuntu installs node executable as "nodejs" but npm expects it as "node"
RUN ln -s /usr/bin/nodejs /usr/bin/node

# Define mountable directories.
VOLUME ["/data/db"]

########################################################################
# Install webble world (Dockerfile directory is ../../)
#
COPY . /home/wblwrld3

RUN cp /home/wblwrld3/build/autonomous/scripts/*.sh /home/wblwrld3
RUN chmod +x /home/wblwrld3/*.sh

#RUN echo '00 00 * * * /home/wblwrld3/cron.sh' > /etc/cron.d/wblwrld3
#RUN cat /etc/cron.d/wblwrld3
#RUN cron

RUN npm cache clean
RUN npm install -g bower
RUN cd /home/wblwrld3; npm install --production
RUN cd /home/wblwrld3; bower --allow-root install

########################################################################
# Runtime stuff
#
EXPOSE 7443
#EXPOSE 7000 7443

WORKDIR /home/wblwrld3

ENV DEPLOYMENT development
ENV PROJECT_MANAGEMENT_DIR /home/wblwrld3

ENTRYPOINT ["sh", "/home/wblwrld3/start.sh"]
CMD ["--deployment development"]

########################################################################
# ABOUT RUNNING 
########################################################################
# At the actual deployment all secret keys can be conveniently given to the running app server
# via the --env-file "docker run" option.
#
# Specifically, all variables exposed in a container, include:
#    the ENV commands in the source container's Dockerfile
#    the -e, --env and --env-file options on the docker run command when the source container is started
#
# docker run -d -P --name wblwrld3 meme/wblwrld3
# docker run -d -p 443:7443 --name wblwrld3 meme/wblwrld3
#
# Persistent version
# docker run -d -P -v /home/docker/mongodb:/data/db --name wblwrld3 meme/wblwrld3
# docker run -d -p 443:7443 -v /home/docker/mongodb:/data/db --name wblwrld3 meme/wblwrld3
