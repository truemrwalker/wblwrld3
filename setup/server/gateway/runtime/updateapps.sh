#!/bin/bash

########################################################################

set -e

cd ~/www/wblwrld3/setup/server/nodes/runtime && bash updateapp.sh
cd ~/www/hokudai-hop && git pull
