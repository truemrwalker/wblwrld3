#!/bin/bash

DEFAULT_USER=hokudai

########################################################################

set -e

sudo -H -u $DEFAULT_USER bash -c 'bash ~/www/wblwrld3/setup/server/gateway/runtime/updateservers.sh'
