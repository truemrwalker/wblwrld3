# Installation

This directory contains configuration files, scripts and instructions for deploying
Webble World on different systems and platforms, under different deployment configurations.

The resources contained here are only provided to streamline and simplify the deployment of
Webble World for a few common deployment scenarios. Detailed instructions, explanations and
more fine-grained deployment and configuration options can be found in the ```README.md``` file
under the ```serverside``` sub-directory of the Webble World repository.

In this context, the instructions, suggestions, scripts and configurations that appear in this
directory only comprise a few possible deployment methodologies for the Webble World platform
and should not be considered as the only or "ultimate" way to configure and deploy the platform.

Particular emphasis has been put on the following two deployment methods:

1. Development deployment under Microsoft Windows (see ```windows``` )
2. Production deployment under Ubuntu 16.04 (systemd) (see ```server```)

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
