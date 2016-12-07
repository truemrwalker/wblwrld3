#!/bin/bash

DEFAULT_USER=hokudai

########################################################################

set -e

# Create hokudai user
#
id -u $DEFAULT_USER &>/dev/null || sudo su -c "useradd $DEFAULT_USER -s /bin/bash -m -g users"

echo $DEFAULT_USER:defaultpasswordtahtshouldbechanged | sudo chpasswd

# Install bower
#
sudo npm install -g bower
sudo npm install -g tiddlywiki

# Clone repositories
#
sudo -H -u $DEFAULT_USER bash -c 'mkdir -p ~/www && cd ~/www && git clone https://github.com/truemrwalker/wblwrld3.git'
sudo -H -u $DEFAULT_USER bash -c 'cd ~/www/wblwrld3/setup/server/nodes/runtime && bash updateapp.sh || echo WARNING: non-zero return value: $?'

sudo -H -u $DEFAULT_USER bash -c 'mkdir -p ~/www && cd ~/www && git clone https://gitlab.com/giannis/hokudai-hop.git'
sudo -H -u $DEFAULT_USER bash -c 'mkdir -p ~/www && cd ~/www && git clone https://gitlab.com/giannis/hokudai-hop-wiki.git'

# Display some messages
#
echo "WARNING: Default password set for user $DEFAULT_USER. Please change with: sudo passwd $DEFAULT_USER"
