#!/bin/bash

DEFAULT_USER=hokudai

########################################################################

set -e

sudo -H -u $DEFAULT_USER bash -c '~/www/wblwrld3/setup/server/gateway/runtime/updateservers.sh'
