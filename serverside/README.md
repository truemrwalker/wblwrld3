# Running

The Webble World Server is implemented as a node.js application. The server's entry point is
```web-server.js``` and, thus, can be invoked as: ```node web-server.js```.

Note that the server can be invoked from any working directory, e.g.,
```node serverside/web-server.js```.

When the server starts it prints its main endpoint via which the Webble World application
is served. An example output can be seen below:

```
connect: 1451.201ms
[OK] Server public endpoint: https://localhost:7443 [http://localhost:7000]
startup: 4394.589ms
```

In this case, the ```http``` endpoint in the square brackets, just redirects the browser
to the appropriate (equivalent) ```https``` endpoint.

Note that the Webble World application is a single-page application (SPA) that uses
the Webble World server for parts of its functionality and for persistence.

The Webble World application is located under the ```app``` subdirectory
(```../app``` relative to the ```serverside``` directory).

## Dependencies

The Webble World Server is a typical node.js application. Its core dependencies are the following:

* [node.js](https://nodejs.org/) for implementing the whole application logic and exposing the
REST endpoints that are used by the Webble World application.

* [git](https://git-scm.com/) for managing the source code of Webble World but also to
enable the use of the ```npm``` tool (usually, bundled with node.js) that is, in turn,
used for the management of the Webble World server's software libraries.

* [mongoDB](https://www.mongodb.com/) as Webble World server's database for persisting
user-generated content (objects and files).

* Optionally, [redis](http://redis.io/) for enabling real-time message-based communication
between distinct instances of Webble World server in order to support correct handling
of websockets-based communication.

## Installation

To run Webble World server the aforementioned dependencies have to be installed in the
target system. The subdirectory ```setup``` (```../setup```) contains helpful scripts
and information for installing the server on Microsoft Windows and Ubuntu-based
GNU/Linux systems.

In general, the installation process consists of the following steps:

1. Cloning the Webble World Github repository
2. Installation of the dependent servers/tools
3. Installation of the dependent software libraries
4. Creation of the database and its principal user
5. Initialization of the database with preexisting objects and values

### Cloning the Webble World Github repository

Webble World platform's source code is hosted on Github under the following URL:
https://github.com/truemrwalker/wblwrld3

The repository is public, meaning anybody can clone and work on it. In this respect, the
repository can be cloned in the local platform with the following command:

```
git clone https://github.com/truemrwalker/wblwrld3.git
```

### Installation of the dependent servers/tools

This depends on the target platform. Each tool's website contains packages and/or
information for installing the tool on many different platforms and operating systems.

More information can be found on each tool's website:

* [node.js](https://nodejs.org/)
* [git](https://git-scm.com/)
* [mongoDB](https://www.mongodb.com/)
* [redis](http://redis.io/)

### Installation of the dependent software libraries

The Webble World server uses the [npm](https://www.npmjs.com/) tool for managing the
software libraries on which it relies upon to deliver its functionality.

Then, the following command installs all the required sofware libraries when invoked
in the project's root directory (```../```, relative to the ```serverside``` directory):

```npm install```

Usually, the ```npm``` command is bundled together with [node.js](https://nodejs.org/).
If that's not the case for the default distribution of a specific platform, then
the ```npm``` command should be installed separately.

### Creation of the database and its principal user

Webble World server saves all its objects, user-generated objects and user-generated files
in a [mongoDB](https://www.mongodb.com/) database called by default ```wblwrld3``` which
has as a principal user a user named ```webbler```. All these default names be changed
by specifying different configuration values (see section [config.js]).

The default password for the ```webbler``` user can be seen (and changed)  in the
file ```secretsdb.json```. See also sections [config.js] and [secrets.js]
for more information.

The creation of the ```wblwrld3``` database and its ```webbler``` user can be automated
by running the command ```mongo scripts/mongoshell.js```, where ```mongo``` is an
interactive mongoDB client distributed together with the  mongoDB database and the script
```scripts/mongoshell.js``` includes the required commands needed for the creation
of the database and its principal user. Before the invocation of the ```mongo``` command,
the mongoDB server has to be running already on the appropriate host and port.

The ```scripts/mongoshell.js``` script contains default values for the name of the database,
its principal user and the principal user's password. If those values are changed in
the Webble World server's configuration, then the following command can be used to
generate a new ```scripts/mongoshell.js``` file with the most up-to-date values:

```node scripts/mongoshellgen.js```

### Initialization of the database with preexisting objects and values

After the creation of Webble World server's database (```wblwrld3``` by default), the
command ```node serverside/web-server.js --deployment maintenace``` initializes the
database and populates it with a set of predefined objects that are either part
of the server's functionality or were developed by the core team of the Webble World platform.

## Updates and maintenance

To get the latest updates from Webble World server's repository, the command
```git pull``` has to be invoked inside the directory of the local, cloned repository.
Note that this command will update both the Webble World server and the SPA Webble World client.

Subsequently, to update the server's objects in the database, the following command has to
be invoked in the project's root directory:

```node serverside/web-server.js --deployment maintenance```

The above command, apart from updating the database with respect to the newly fetched
file modifications, it also performs some maintenace operations. Section [maintenance], contains
more details.

Most user-generated objects and files stored in the database are related to Webble World
platform's main components, called *webbles*. Additionally, the reference, main deployment of
Webble World platform is accessible at the following URL:

https://wws.meme.hokudai.ac.jp

Since the reference deployment of Webble World is supposed to contain the definitive collection
of *webbles*, there is a maintenance configuration option (off by default) to synchronize the
central database with the local one:

```node serverside/web-server.js --deployment maintenance --sync-online-webbles 1```

After the successful invocation of the above command, all published components (webbles) on the
https://wws.meme.hokudai.ac.jp server are also made available to the local server instance.

# General Organization

The ```serverside``` directory includes all the node.js-specific code for the Webble World server.

In general, all the Webble World Server does is expose a REST API which is invoked by the client-side
application in order to persist it's state and implement additional functionality (e.g. trust indicators).
The Webble World Server, thus, does not render any HTML page itself - with the exception of the
/api/wiki endpoint which is handled and rendered by the ```TiddlyWiki``` library.

## Files and Directories

The server comprises of three javascript files in the root directory (```serverside```) and 10
subdirectories that contain the top-level modules that implement the functionality of the server.

A detailed explanation for each of them follows.

### ```web-server.js```

This is the server's entrypoint and the only thing it does is initialize and start the server
depending on the:

1. Deployment mode
2. The current configuration
3. The provided secrets

One minor detail is that the server is exposed under an https endpoint if the configuration value
```config.SERVER_BEHIND_REVERSE_PROXY``` is true. And in that case it can also serve local files
located under the ```app``` directory (```../app``` - relative to the server's directory). Then,
the cryptographic keys needed for the https endpoint are located under the ```keys``` directory.
Note that those keys are self-signed and are probably already expired but can be utilized for
local testing.

On the other hand, if the configuration value ```config.SERVER_BEHIND_REVERSE_PROXY``` is false,
then the server assumes that is located behind a loadbalancing reverse-proxy that terminates TLS/SSL.
Therefore, in that case, it exposes its functionality under an http endpoint and cannot serve any
static files (this can be the job of the reverse-proxy or a CDN).

### ```secrets.js```

This file tries to decrypt and read stored secrets from a file named ```secretsdb.ejson```. It
searches this particular file in a sub-directory named ```wblwrld3``` which in turn is located under
the first valid directory contained into the following environment variables (in order).

1. ```LOCALAPPDATA```
2. ```HOME```
3. ```HOMEPATH```
4. ```USERPROFILE```

Only the first valid directory is considered for resolving the full path of the file
(e.g., ```$HOME/weblwlrd3/secretsdb.ejson```).

The ```secretsdb.ejson``` file is created from the ```secretsdb.json``` file - that should be located
in the same directory as the first - by running the script ```scripts/secretsdbgen.js```. Note that
the script should be run under node.js - i.e., ```node scripts/secretsdbgen.js```

If the file ```secretsdb.ejson``` is not found, then any available secrets are read from
the file ```secretsdb.json```, which is located in the ```serverside``` directory.

Secrets can also be overriden by (a) ```config.js```, (b) environment variables, or even
(c) command-line arguments. See next section.

### ```config.js```

This file uses only ```secrets.js``` (that's its only in-project dependency) to read and expose
all the available secrets and the other configuration options needed for the initialization and
operation of the server.

Therefore, all secrets utilized by other components are read via the ```config``` module and
not via the secrets module directly.

```config``` options can be overriden by either environment variables or command-line arguments
that are defined when the server entrypoint is invoked - e.g.:

```node serverside/web-server.js --deployment maintenance --sync-online-webbles 1```

Command-line arguments can override environment variables and preset ```config.js``` values and
environment variables can only override the preset ```config.js``` values.

### ```api```

This sub-directory contains all the REST endpoints that essentially comprise the Webble World server's
API. Different resources are grouped into distinct files. These REST endpoints are invoked from the
Angular services that are located into the ```/app/scripts/services``` sub-directory, which is part
of Webble World SPA client.

Files that begin with an underscore (```_```), e.g., ```_server.js```, are not loaded in the Webble
World server and thus all the routes (REST endpoints) they define are not available.

#### ```api/adm```

This sub-directory contains all the REST endpoints that are exported/are accessible only to users that
have the role ```adm``` - i.e., they are *administrators* of the Webble World platform.

#### ```api/dev```

This sub-directory contains all the REST endpoints that are exported/are accessible only to users that
have the role ```dev``` - i.e., they are *developers* of the Webble World platform. Developers are those
users that are able to create components (webbles) by writing Javascript code.

This role differs from the ```usr``` role where normal users are allowed to create new components
(webbles) only by combining existing ones.

Since the Webble World platform is still experimental and under heavy development, by default new user
accounts are given the role ```dev```.

#### ```api/files```

This sub-directory contains all the REST endpoints that concern the creation and update of files. Those
files are either user-generated files associated with user-generated components (webbles) or files related
to automatically generated Software Development Kit (SDK) bundles and documentation.

Note that user-generated files associated with webbles are saved and kept in the database for two reasons:

1. To allow the Webble World server to be replicated easily, without requiring the additional setup of
distributed filesystems and/or the introduction of additional file synchronization mechanisms.

2. To enable the easy *dockerization* of the Webble World server, since the latter only needs a read-only
filesystem to fully deliver its functionality.

### ```auth```

This sub-directory contains all the REST endpoints (routes) and application code for authenticating
and managing user accounts.

The file ```auth-socket.js``` contains code for authenticating websocket connections to determine
whether a specific websocket connection is made by a authenticated user or not. The reason for this
is that some websocket-based interactions are only permitted for logged-in (authenticated) users
while others are permitted for all users. See [realtime] for more information.

#### ```auth/providers```

This sub-directory contains all the necessary code and REST endpoints in order to be able to authenticate
users using either third-party authentication providers (e.g., Google or Twitter) or local password-based
user accounts (```local.js```).

### ```models```

This sub-directory contains all [mongoose](http://mongoosejs.com/) objects that model the documents stored
in the underlying [mongoDB](https://www.mongodb.com/) database.

### ```bootstrap``` and ```maintenance```

These two sub-directories contain a set of self-contained, autonomous scripts that are used for performing
boostrap and maintenance operations that in turn influence the operation of the Webble World server and
the set of the user-generated objects and files that are stored in the database.

In this sense, if the property ```config.DEPLOYMENT``` or the environment variable ```DEPLOYMENT```
holds the value ```bootstrap``, or if the argument ```--deployment bootstrap``` is specified in the
command-line when ```web-server.js``` is invoked, then the Webble World server runs all the scripts
inside the ```bootstrap``` sub-directory and then exits.

On the other hand, if the property ```config.DEPLOYMENT``` or the environment variable ```DEPLOYMENT```
holds the value ```maintenance``, or if the argument ```--deployment maintenance``` is specified in the
command-line when ```web-server.js``` is invoked, then the Webble World server runs all the scripts
inside the ```maintenance``` sub-directory and then exits.

Finally, if the specified value is ```development``` (instead of ```bootstrap``` or ```maintenance```),
which is also the default value, then the Webble World server runs all the scripts  inside the
```maintenance``` sub-directory and then starts normally, accepting requests over its default endpoints.

In all other cases, the scripts under those directories are ignored. Scripts are also ignored if they
start with an underscore (```_```), e.g., ```_workspaces.js```.

### ```control```

This sub-directory contains code that controls peripheral aspects of the functionality, configuration
and state of the Webble World server and has nothing to do with its actual "business logic" or the
operation of its exported endpoints.

As before, scripts starting with an underscore (```_```), e.g., ```_machine.js``` are ignored.

Therefore, currently, the only active script (```autosync.js```) runs when the Webble World server is invoked
in a ```development``` deployment setting and the only thing it does is monitoring the modification of those
files (on the local filesystem) that are associated with Webble World components (webbles) and synchronizes those
modifications with the corresponding database entities in real-time.

### ```realtime```

This sub-directory contains the components that implement Webble World server's real-time functions. These realtime
functions are implemented via websockets that can be either in authenticated or unauthenticated state.

### ```keys```

This sub-directory contains the public and private keys needed for the initialization and operation of Webble World
server's ```https``` endpoint. Of course, the keys inside that directory are self-signed, have expired and are meant
only for testing and development purposes.

The reference deployment of Webble World, running under https://wws.meme.hokudai.ac.jp uses a different, valid and
widely trusted certificate.

### ```lib```

This sub-directory contains reusable components and functions with minimum dependencies that are reused throughout
Webble World's server codebase.

#### ```lib/ops```

This particular sub-directory contains reusable components that model *behaviors* or *operations* (hence ```ops```)
that Webble World server's first class objects exhibit. Therefore, the components defined in this sub-directory
are only used inside REST endpoint functions as a response to client-requested operations (e.g., publishing a webble).

### ```scripts```

This sub-directory contains some peripheral, independent and self-contained scripts/meta-scripts that create or modify
the Webble World server's source and configuration files. As such they are mostly used for bootstrapping Webble World
server on a new system and are never loaded or executed if they are not explicitly invoked by the user.

## Dependencies

Webble World Server's dependencies are manged via npm and are declared in ```package.json``` which is
located at the project's root (i.e., ```../package.json``` - relative to the server's directory).

A list of the dependencies and the way they are used follows:

### General (Core) dependencies

#### ```express```

This is the core library that we use to simplify the implementation of REST endpoints and plug-in
additional functionality to the whole infrastructure as *middleware*.

* See also: http://expressjs.com/

#### ```express-session```

An expressjs middleware for session management.

* See also: https://github.com/expressjs/session

#### ```mime```

Used for determining the mime type of a file from its extension.

* See also: https://www.npmjs.com/package/mime

#### ```body-parser```

Used for parsing the body of an HTTP request and exposing it as a Javascript (JSON) object.

* See also: https://github.com/expressjs/body-parser

#### ```busboy```

Used in few REST endpoints for decoding the contents of files that are sent via HTTP requests.

* See also: https://github.com/mscdex/busboy

#### ```cookie```

Used for parsing cookies that are necessary for maintaining persistent sessions.

* See also: https://www.npmjs.com/package/cookie

#### ```cookie-parser```

A lower-level component than the ```cookie``` mentioned above, which actually uses the former to
perform cookie parsing. It is explicitly declared as a dependency, however, since we need it
to perform websockets-based authentication in the ```auth/auth-socket.js``` file.

* See also: https://github.com/expressjs/cookie-parser

#### ```serve-static```

Webble World server can either be exposed directly on a specific endpoint or, alternatively, it
can be deployed behind a reverse proxy that will forward all REST invocations to the Webble World
server instance.

When the Webble World server is fully responsible for serving both the REST Application Programming
Interface (API) and the Webble World SPA client's files and assets, the ```serve-static``` library
(express *middleware*) is used to serve the latter.

On the other hand, when the configuration parameter ```config.SERVER_BEHIND_REVERSE_PROXY``` is
*true*, then Webble World server assumes that a reverse proxy (e.g., [nginx](https://www.nginx.com/))
is used in front of its (potentially multiple) deployed instances. In that case, the server is **not**
responsible for serving the Webble World SPA client's files and assets, and, thus, the
```serve-static``` library is not used.

* See also: https://github.com/expressjs/serve-static

#### ```request```

This library is used specifically for performing REST requests to the definitive deployment of
the Webble World server (under the https://wws.meme.hokudai.ac.jp endpoint) in order to obtain
and synchronize the user-generated objects and files that represent the platforms components
(webbles). It is, thus, utilized only when the following command is invoked:

```node serverside/web-server.js --deployment maintenance --sync-online-webbles 1```

Specifically, these requests are implemented by the ```maintenace/online-webbles.js``` file.

* See also: https://github.com/request/request

#### ```archiver```

This library is used for creating a zip archive of any sub-directory under the ```/app```
directory. The Webble World server exposes this functionality under a route defined in the
file ```api/files/zip.js```. That REST endpoint is subsequently used by the Webble World
SPA client to enable the downloading of the ```/app/data/WebbleDevPack``` directory,
which contains some source and documentation files related to the development of Webble
World components (called webbles).

* See also: https://www.npmjs.com/package/archiver

#### ```bluebird```

This library is used throughout the Webble World server implementation as the primary
Javascript promise library for obtaining and managing the results of all asynchronous
operations.

* See also: http://bluebirdjs.com/docs/getting-started.html

#### ```socket.io```

This library is used for establishing websocket connections between the Webble World SPA
client and the Webble World server in order to implement the platforms real-time functions.
See also [realtime] section.

* See also: http://socket.io/docs/


### Database (Persistence) dependencies

#### ```mongoose```

This library is used for higher-level, streamlined and more type-safe access to the objects
stored in the [mongoDB](https://www.mongodb.com/) database.

* See also: http://mongoosejs.com/

#### ```gridfs-stream```

This library is used for creating, modifying and accessing the user-generated files stored in
the [mongoDB](https://www.mongodb.com/) database.

* See also: https://github.com/aheckmann/gridfs-stream

#### ```connect-mongo```

This library offers an [express](http://expressjs.com/) *middleware* for storing session
information into the [mongoDB](https://www.mongodb.com/) database.

* See also: https://github.com/jdesboeufs/connect-mongo

#### ```tar-stream```

This library is used for creating archives of one or more Webble World components (webbles)
when those need to be exported. These archives can be subsequently imported into other
deployments of the Webble World server. This functionality is exposed as a REST endpoint
and implemented in the file ```api/takeout.js```.

* See also: https://github.com/mafintosh/tar-stream

#### ```redis```

[Redis](http://redis.io/) is used for broadcasting websocket messages to all the instances of
the Webble World server. This is essential for avoiding the partition of the websocket
message-space.

If the Webble World server fails to connect to the configured [redis](http://redis.io/) instance,
the websocket messages sent to a specific Webble World server instance are only delivered to the
websockets managed by that same instance. Other instances running under the same endpoint will
never get those messages.

* See also: https://github.com/NodeRedis/node_redis


### Authentication dependencies

#### ```passport```

This library is used for authenticating users to the Webble World server. The use of passport and
its sub-libraries is therefore restricted to scripts under the ```auth``` sub-directory.

* See also: http://passportjs.org/

#### ```passport-local```

This passport sub-library is used for authenticating users against local, password based accounts.

* See also: https://github.com/jaredhanson/passport-local

#### ```passport-twitter```

This passport sub-library is used for authenticating users against their Twitter account.

* See also: https://github.com/jaredhanson/passport-twitter

#### ```passport-google-oauth```

This passport sub-library is used for authenticating users against their Google account.

* See also: https://github.com/jaredhanson/passport-google-oauth

#### ```passport-facebook```

This passport sub-library is used for authenticating users against their Facebook account.

* See also: https://github.com/jaredhanson/passport-facebook

#### ```nodemailer```

This library is used for sending emails to users. Currently, mails are sent to users only
when they want to reset their password. In that case an email with a reset link is sent
via ```nodemailer``` to their email address.

Following that link users are able to set a new password to their account.

* See also: https://github.com/nodemailer/nodemailer

#### ```nodemailer-mailgun-transport```

This nodemailer sub-library (nodemailer backend) is used to send email messages via the
[mailgun](http://www.mailgun.com/) email delivery service.

As mentioned before, currently, emails are sent to users only when they want to reset their
password.

* See also: https://github.com/orliesaurus/nodemailer-mailgun-transport


### Specialized

#### ```mkdirp```

This library is used to create directory hierarchies in the filesystem. This mostly used by
maintenance scripts, which are located under the ```maintenace``` sub-directory.

* See also: https://github.com/substack/node-mkdirp

#### ```tiddlywiki```

* See also: https://github.com/Jermolene/TiddlyWiki5
* Main website: http://tiddlywiki.com/
* Wikipedia entry: https://en.wikipedia.org/wiki/TiddlyWiki


### Development

#### ```chokidar```

* See also: https://github.com/paulmillr/chokidar

#### ```grunt```

* See also: http://gruntjs.com/getting-started

#### ```grunt-angular-gettext```

* See also: https://www.npmjs.com/package/grunt-angular-gettext
