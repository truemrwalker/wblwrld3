FROM node:0.10-onbuild
MAINTAINER Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>

#patch for mongodb driver issue with node.js https://github.com/mongodb/js-bson/issues/58
#RUN npm install -g node-gyp
#RUN cd node_modules/mongodb/node_modules/mongodb-core/ & rm -rf node_modules & npm install

# replace this with your application's default port
EXPOSE 7443
