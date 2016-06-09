########################################################################
# Dockerfile to build self-contained Webble World 3.0 server images
# Based on node

FROM node:6-onbuild
MAINTAINER Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>

# Bundle app source

COPY . /home/wblwrld3
RUN cd /home/wblwrld3; npm install --production

########################################################################
# Runtime stuff
#
EXPOSE 7000 7443

ENV DEPLOYMENT production

WORKDIR /home/wblwrld3
ENTRYPOINT ["node", "serverside/web-server.js"]
CMD ["--deployment production"]
