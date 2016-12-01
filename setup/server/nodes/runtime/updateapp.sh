#!/usr/bin/env bash

########################################################################

set -e

cd ~/www/wblwrld3
git pull
bower install --force-latest
#bower update --force-latest
