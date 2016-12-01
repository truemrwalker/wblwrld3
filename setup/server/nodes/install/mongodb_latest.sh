#!/usr/bin/env bash

#
# INFORMATION FROM HERE:
# https://docs.mongodb.com/v3.2/tutorial/install-mongodb-on-ubuntu/
#
# If you want to expose mongodb to your local network edit in
# /etc/mongod.conf the "bindIp" address.
#

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927

#echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list

sudo apt-get update
sudo apt-get install -y mongodb-org

cat > /tmp/mongod.service <<EOF
[Unit]
Description=High-performance, schema-free document-oriented database
After=network.target
Documentation=https://docs.mongodb.org/manual

[Service]
User=mongodb
Group=mongodb
ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/mongod.service /lib/systemd/system/mongod.service
sudo service mongod start
sudo tail -100 /var/log/mongodb/mongod.log
