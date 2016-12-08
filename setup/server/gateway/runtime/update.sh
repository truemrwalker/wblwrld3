#!/bin/bash

DEFAULT_USER=hokudai

########################################################################

set -e

cd "/home/$DEFAULT_USER/www/wblwrld3/setup/server/gateway/runtime" && bash updateapp.sh && bash updateservers2.sh && bash updatehop.sh
