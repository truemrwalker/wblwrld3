#!/bin/sh

MONGO=/usr/local/bin/mongo
NODE=/usr/local/bin/node

$MONGO mongoshell.js
$NODE ../web-server.js --deployment bootstrap
