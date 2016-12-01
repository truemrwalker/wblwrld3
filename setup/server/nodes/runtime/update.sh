#!/usr/bin/env bash

########################################################################

set -e

cd ~/www/wblwrld3
git pull

npm install
bower install --force-latest

# It will be restarted by systemd (hopefully)
pkill node
