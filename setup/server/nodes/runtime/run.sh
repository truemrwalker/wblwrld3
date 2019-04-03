#!/bin/bash

########################################################################

set -e

export DEPLOYMENT=testing
export SERVER_NAME=192.168.12.186:7443

export APP_CRYPT_PASSWORD=
export SESSION_SECRET=

export MAIL_USER=
export MAIL_PASS=

export MONGODB_HOST=133.87.133.85
export MONGODB_PORT=27017
export MONGODB_DB_NAME=wblwrld3
export MONGODB_DB_USERNAME=webbler

export MONGODB_DB_PASSWORD=

export REDIS_HOST=133.87.133.85
export REDIS_PORT=6379

export TWITTER_CONSUMER_KEY=
export TWITTER_CONSUMER_SECRET=

export GOOGLE_CLIENT_ID=
export GOOGLE_CLIENT_SECRET=

export FACEBOOK_APP_ID=
export FACEBOOK_APP_SECRET=

export PORT=7000
export SERVER_BEHIND_REVERSE_PROXY=1

########################################################################

cd ~/www/wblwrld3/serverside
node web-server.js
