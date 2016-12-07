#!/bin/bash

DEFAULT_USER=hokudai

########################################################################

set -e

sudo -H -u $DEFAULT_USER bash -c 'cd ~/www/hokudai-hop && git pull'
sudo -H -u $DEFAULT_USER bash -c 'cd ~/www/hokudai-hop-wiki && git pull && tiddlywiki --build index'
