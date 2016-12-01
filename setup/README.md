# Installation

This directory contains configuration files, scripts and instructions for deploying
Webble World on different systems and platforms, under different deployment configurations.

# Organization

## ```docker```

This directory contains an out-of-date Docker file that encapsulates all the dependent
servers in addition to the Webble World server. That was meant to be used for quick,
readonly demo deployments of the Webble World server. Now, however, its use is not
recommended.

A proper up-to-date ```Docker``` file is contained in the root directory of the project
and only encapsulates the Webble World server and its software dependencies.

## ```kubernetes```

This directory contains the [Kubernetes](http://kubernetes.io/) resources for deploying 
the Webble World server and its dependent servers on Kubernetes clusters.

Note that the ```mongodb``` Pod requires an [iSCSI](https://en.wikipedia.org/wiki/ISCSI)
volume to be accessible by all the nodes in the Kubernetes cluster.

## ```server```

The scripts in this directory, reflect the current (updated) Webble World reference deployment 
on the URL: https://wws.meme.hokudai.ac.jp

Essentially, there is one gateway server that terminates HTTPS/2 connections and load-balances
the requests over multiple instances of the Webble World server that run on multiple "nodes" servers.

### ```server/gateway```

Contains scripts and configuration files for deploying and configuring [NGINX](https://www.nginx.com/)
as Webble World server's reverse proxy and file server.

### ```server/nodes```

Contains scripts and configuration files for deploying Webble World server instances that serve
the requests that are forwarded and load-balanced by the "gateway" server.

## ```windows```

Contains scrips and instructions for installing and deploying a "development" version of Webble World
on Microsoft Windows systems.
