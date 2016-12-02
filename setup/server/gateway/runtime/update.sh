#!/bin/bash

########################################################################

set -e

cd ~/www/wblwrld3/setup/server/gateway/runtime && bash updateapps.sh && bash updateservers.sh
