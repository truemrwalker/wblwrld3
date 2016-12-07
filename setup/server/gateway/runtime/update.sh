#!/bin/bash

########################################################################

set -e

cd ~/www/wblwrld3/setup/server/gateway/runtime && bash updateapp.sh && bash updateservers.sh && bash updatehop.sh
