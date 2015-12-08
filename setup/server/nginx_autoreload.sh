#!/usr/bin/env bash

dpkg --list | grep inotify-tools &> /dev/null
if [ $? -eq 0 ]
then
        echo "Inotify Tools Already Installed"
else
        echo "Installing Inotify Tools..."
        apt-get -y install inotify-tools
fi
while true
do
        inotifywait --exclude .swp -e create -e modify -e delete -e move  /etc/nginx/sites-enabled
        nginx -t
        if [ $? -eq 0 ]
        then
                echo "Reloading Nginx Configuration"
                service nginx reload
        fi
done
