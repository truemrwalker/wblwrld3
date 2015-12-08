#!/bin/sh

MONGO=/usr/local/bin/mongo
NODE=/usr/local/bin/node

$NODE mongoshellgen.js
$MONGO mongoshell.js
$NODE ../web-server.js --deployment bootstrap
