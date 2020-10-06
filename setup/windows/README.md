# Overview

This directory contains some scripts to simplify the setup and deployment of Webble World
on Microsoft Windows systems.

The scripts assume that Webble World is used for development purposes and thus sets up
and deploys the server using its default "development" configuration values.

# Install Quick Reference

1. Install: https://git-scm.com/download/win
2. Install: https://nodejs.org/en/download/current/
	a) Current version of NodeJS seem to have some issues with the Webble World update activities, so instead use a earlier version 6.10.3 
		* https://nodejs.org/download/release/v6.10.3/ 
3. Install: https://www.mongodb.com/download-center
4. Run: ```bootstrap.bat``` once
5. Run: ```start.bat``` every time you need to run the server and visit https://localhost:7443
6. Run: ```update.bat``` every time you need to update the server

# Install

To run Webble World server on the local Windows machine, the following programs have
to be installed first:

1. https://git-scm.com/download/win
2. https://nodejs.org/en/download/current/
	a) Current version of NodeJS seem to have some issues with the Webble World update activities, so instead use a earlier version 6.10.3 
		* https://nodejs.org/download/release/v6.10.3/ 
3. https://www.mongodb.com/download-center

Subsequently, to download and save the latest version of Webble World from its 
[github repository](https://github.com/truemrwalker/wblwrld3) the project's repository has to be
cloned on the local machine and the Webble World server has to be bootstrapped.

To clone Webble World's [github repository](https://github.com/truemrwalker/wblwrld3), open a terminal 
(```win+R, cmd```), go to your projects directory (e.g., ```cd Documents/Projects```) and type the
following ```git``` command:

```
git clone https://github.com/truemrwalker/wblwrld3
```

After that, the latest version of Webble World will be saved in a sub-directory called ```wblwrld3```.

To initialize the Webble World server, visit its ```setup/windows``` sub-directory 
(e.g., ```Documents/Projects/wblwrld3/setup/windows```)  either with Windows Explorer or with
```cd wblwrld3/setup/windows``` in the previously opened "git" terminal.

Then, inside the "setup/windows" folder run (or double-click) the following script:

```
bootstrap.bat
```

Some Windows machine may throw some error messages during the node.js packages installations, but these errors will not affect Webble World in any way and can be completely ignored. If you would like to remove most if these errors anyway, you can run the following command line in the command window before you run bootstrap.bat.

```
npm install --global --production windows-build-tools
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
