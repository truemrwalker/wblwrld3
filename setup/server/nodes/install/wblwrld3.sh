#!/bin/bash

DEFAULT_USER=wblwrld3

########################################################################

set -e

# Create wblwrld3 user
#
id -u $DEFAULT_USER &>/dev/null || sudo su -c "useradd $DEFAULT_USER -s /bin/bash -m -g users"

echo $DEFAULT_USER:defaultpasswordtahtshouldbechanged | sudo chpasswd

# Install bower
#
sudo npm install -g bower

# Clone repository
#
sudo -H -u $DEFAULT_USER bash -c 'mkdir -p ~/www && cd ~/www && git clone https://github.com/truemrwalker/wblwrld3.git'
sudo -H -u $DEFAULT_USER bash -c 'cd ~/www/wblwrld3/setup/server/nodes/runtime && bash update.sh'
sudo -H -u $DEFAULT_USER bash -c 'cp ~/www/wblwrld3/setup/server/nodes/runtime/run.sh ~/www/wblwrld3 && chmod +x ~/www/wblwrld3/run.sh'

cat > /tmp/wblwrld3.service <<EOF
[Unit]
Description=Webble World 3
After=network.target mongod.service
Documentation=https://github.com/truemrwalker/wblwrld3

[Service]
User=$DEFAULT_USER
Group=users
Restart=on-failure
RestartSec=5
ExecStart=/home/wblwrld3/www/wblwrld3/run.sh

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/wblwrld3.service /lib/systemd/system/wblwrld3.service
sudo systemctl enable wblwrld3.service

# Display some messages
#
echo "WARNING: Default password set for user $DEFAULT_USER. Please change with: sudo passwd $DEFAULT_USER"
echo "WARNING: EDIT the file ~/www/wblwrld3/run.sh with the correct keys and configuration values"
echo "WARNING: Then start the service with: sudo systemctl start wblwrld3.service"
echo "WARNING: Then check its output with: systemctl status wblwrld3.service -l"

#sudo systemctl start wblwrld3.service
#sudo systemctl status wblwrld3.service -l
