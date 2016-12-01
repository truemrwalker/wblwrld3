#!/bin/bash

########################################################################

set -e

cd ~/www/wblwrld3
git pull
npm install

# It will be restarted by systemd (hopefully)
pkill node
