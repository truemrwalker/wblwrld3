#!/bin/bash

########################################################################
# List all webble world servers here - separated by space:
#
WEBBLE_WORLD_SERVERS='133.87.133.85 133.87.133.215 133.87.133.216'

DEFAULT_USER=wblwrld3

########################################################################

set -e

for server in $WEBBLE_WORLD_SERVERS; do

	echo "Trying to UPDATE Webble World on machine: $server"
	ssh "$DEFAULT_USER@$server" "bash ~/www/wblwrld3/setup/server/nodes/runtime/updateserver.sh"
done

echo "WARNING: Please note that hokudai-hop server is not updated by this script"
