#!/bin/bash

DEFAULT_USER=hokudai

########################################################################

set -e

sudo -H -u $DEFAULT_USER bash -c 'cd ~/www/wblwrld3/setup/server/nodes/runtime && bash updateapp.sh || echo WARNING: non-zero return value: $?'
