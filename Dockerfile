########################################################################
# Dockerfile to build self-contained Webble World 3.0 server images
# Based on node

FROM node:0.10-onbuild
MAINTAINER Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>

#patch for mongodb driver issue with node.js https://github.com/mongodb/js-bson/issues/58
#RUN npm install -g node-gyp
#RUN cd node_modules/mongodb/node_modules/mongodb-core/ & rm -rf node_modules & npm install

# Bundle app source

COPY . /home/wblwrld3

RUN npm install -g bower

RUN cd /home/wblwrld3; npm install --production
RUN cd /home/wblwrld3; bower --allow-root install

########################################################################
# Runtime stuff
#
EXPOSE 7000 7443

ENV DEPLOYMENT production

WORKDIR /home/wblwrld3
ENTRYPOINT ["node", "serverside/web-server.js"]
CMD ["--deployment production"]
