# Overview

This directory contains some scripts to simplify the setup and deployment of Webble World
on Microsoft Windows systems.

The scripts assume that Webble World is used for development purposes and thus sets up
and deploys the server using its default "development" configuration values.

# Install

To run Webble World server on the local Windows machine, the following dependencies have
to be installed first:

1. https://git-scm.com/download/win
2. https://nodejs.org/en/download/current/
3. https://www.mongodb.com/download-center

Subsequently, to download and save the latest version of Webble World from its 
[github repository](https://github.com/truemrwalker/wblwrld3) the project's repository has to be
cloned on the local machine and the Webble World server has to be bootstrapped.

Open a terminal (```win+R, cmd```), go to the projects directory and type the following command:

```
git clone https://github.com/truemrwalker/wblwrld3
```

After that, the latest version of Webble World will be saved in a sub-directory called ```wblwrld3```.
Therefore visit its ```setup/windows``` sub-directory either with Windows explorer or with
```cd wblwrld3``` in a terminal.

Inside the "setup/windows" folder run the following script:

```
bootstrap.bat
```

# Run

After the installation, Webble World can be started by running the following script:

```
start.bat
```

Note that, first of all, this script is contained in this directory (```setup/windows```) and secondly,
a shortcut to the above script can be created on the Desktop for faster and easier deployment.

Following the successful invocation of the ```start.bat``` script, Webble World can be accessed at the URL:

https://localhost:7443

# Update

To get the latest version of Webble World from its [github repository](https://github.com/truemrwalker/wblwrld3)
and update its software dependencies, the following script - in the "setup/windows" folder - can be invoked:

```
update.bat
```
