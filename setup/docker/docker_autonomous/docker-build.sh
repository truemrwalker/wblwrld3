#!/usr/bin/env bash

# Generate mongoshell.js
#
#cd ../../serverside/scripts
#node mongoshellgen.js
#echo "Generated a brand new mongoshell.js file (probably)"
#cd "$OLDPWD"

cp Dockerfile ../../
cd ../../

# Build image
docker build -t meme/wblwrld3 .

rm Dockerfile
cd "$OLDPWD"
