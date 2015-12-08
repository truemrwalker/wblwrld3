#!/usr/bin/env bash

sudo iptables -L --line-numbers
sudo iptables -D Iext 8
sudo iptables -D Iext 8
sudo iptables -D Iext 5

sudo iptables -D Oext 7
sudo iptables -D Oext 7

sudo iptables -t nat -L -n -v --line-numbers
sudo iptables -t nat -D PREROUTING 1
sudo iptables -t nat -D PREROUTING 1
