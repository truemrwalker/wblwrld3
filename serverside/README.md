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

#### ```api/adm```

#### ```api/dev```

#### ```api/files```

### ```auth```

#### ```auth/providers```

### ```models```

### ```bootstrap``` and ```maintenance```

### ```control```

### ```realtime```

### ```keys```

### ```lib```

#### ```lib/ops```

### ```scripts```

## Dependencies

Webble World Server's dependencies are manged via npm and are declared in ```package.json``` which is 
located at the project's root (i.e., ```../package.json``` - relative to the server's directory).

A list of the dependencies and the way they are used follows:

### General (Core) dependencies

#### ```express```

This is the core library that we use to simplify the implementation of REST endpoints and plug-in
additional functionality to the whole infrastructure as *middleware*.

See also: http://expressjs.com/

#### ```express-session```

An expressjs middleware for session management.

See also: https://github.com/expressjs/session

#### ```mime```

Used for determining the mime type of a file from its extension.

See also: https://www.npmjs.com/package/mime

#### ```body-parser```

Used for parsing the body of an HTTP request and exposing it as a Javascript (JSON) object.

See also: https://github.com/expressjs/body-parser

#### ```busboy```

Used in few REST endpoints for decoding the contents of files that are sent via HTTP requests.

See also: https://github.com/mscdex/busboy

#### ```cookie```

Used for parsing cookies that are necessary for maintaining persistent sessions.

See also: https://www.npmjs.com/package/cookie

#### ```cookie-parser```

A lower level component than the ```cookie``` mentioned above, which actually uses it to
perform cookie parsing. It is explicitly declared as a dependency, however, since we need it
to perform websockets-based authentication in the ```auth/auth-socket.js``` file.

See also: https://github.com/expressjs/cookie-parser

#### ```serve-static```

See also: https://github.com/expressjs/serve-static

#### ```request```

See also: https://github.com/request/request

#### ```archiver```

See also: https://www.npmjs.com/package/archiver

#### ```bluebird```

See also: http://bluebirdjs.com/docs/getting-started.html

#### ```socket.io```

See also: http://socket.io/docs/

### Database (Persistence) dependencies

#### ```mongoose```

See also: http://mongoosejs.com/

#### ```gridfs-stream```

See also: https://github.com/aheckmann/gridfs-stream

#### ```connect-mongo```

See also: https://github.com/jdesboeufs/connect-mongo

#### ```tar-stream```

See also: https://github.com/mafintosh/tar-stream

#### ```redis```

See also: https://github.com/NodeRedis/node_redis


### Authentication dependencies

#### ```passport```

See also: http://passportjs.org/

#### ```passport-local```

See also: https://github.com/jaredhanson/passport-local

#### ```passport-twitter```

See also: https://github.com/jaredhanson/passport-twitter

#### ```passport-google-oauth```

See also: https://github.com/jaredhanson/passport-google-oauth

#### ```passport-facebook```

See also: https://github.com/jaredhanson/passport-facebook

#### ```nodemailer```

See also: https://github.com/nodemailer/nodemailer

#### ```nodemailer-mailgun-transport```

See also: https://github.com/orliesaurus/nodemailer-mailgun-transport

### Specialized

#### ```mkdirp```

See also: https://github.com/substack/node-mkdirp

#### ```tiddlywiki```

See also: https://github.com/Jermolene/TiddlyWiki5
Main website: http://tiddlywiki.com/
Wikipedia entry: https://en.wikipedia.org/wiki/TiddlyWiki

### Development

#### ```chokidar```

See also: https://github.com/paulmillr/chokidar

#### ```grunt```

See also: http://gruntjs.com/getting-started

#### ```grunt-angular-gettext```

See also: https://www.npmjs.com/package/grunt-angular-gettext
