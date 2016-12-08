#!/bin/bash

########################################################################

set -e

cd ~/www/wblwrld3/setup/server/gateway/runtime && bash updateapp.sh && bash updateservers2.sh && bash updatehop.sh
