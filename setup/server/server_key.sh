#!/usr/bin/env bash

# Remove the encryption from the RSA private key (while keeping a backup copy of the original file):

cp server.key server.key.org
openssl rsa -in server.key.org -out server.key

# Make sure the server.key file is only readable by root:
chmod 400 server.key
