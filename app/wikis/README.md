# Overview

This directory contains the metadata for enabling the creation and management of Webble World
wiki objects.

Webble World wikis use [Tiddlywiki](http://tiddlywiki.com/) for editing and rendering. Wikis can 
be owned and shared among multiple users. 

In general, editing a Wiki object by its owners, results in the creation and modification of 
TiddlyWiki-specific files under a temporary directory (```app/tmp/wiki/wiki_name```) that is 
[pulled](https://git-scm.com/docs/git-pull) (or [cloned](https://git-scm.com/docs/git-clone)) from the 
Wiki's remote ```git``` repository. When a wiki is saved, all the changes to the wiki's files in
the local repository (```app/tmp/wiki/wiki_name```) are packaged into a new 
["commit" object](https://git-scm.com/docs/git-commit), which is then 
[pushed](https://git-scm.com/docs/git-push) back to the wiki's remote repository.

Wikis can also be exported (published) to a self-contained HTML file, saved as ```index.html```.
That means that an exported (published) wiki can be subsequently accessed as a static file, served
via a typical file server. This capability is particularly useful, since it was essential to be
able to deploy independent, self-contained wikis outside the context of the Webble World server's 
infrastructure.

Although the Webble World server supports the creation and management of multiple wikis, currently,
the wiki functionality is restricted only to the Hands-on Portal wiki via which multiple Webble
World applications are showcased.

The ability to export and idependently deploy wikis outside of the Webble World server platform
was utilized in the context of the Hands-on Portal wiki, which, on one hand, can be fully rendered
and managed under Webble World, but on the other hand can be completely decoupled from it and
deployed under its own domain (URL). Inside Webble World, the Hands-on Portal wiki can be viewed,
edited and managed only by its owner and the users who the owner has shared it with. However,
when the Hands-on Portal wiki is exported and deployed independently, any user can access it.
Moreover, despite the exported Hands-on Portal wiki being read-only, users can edit and save
a self-contained, full copy of the Hands-on Portal wiki with their own modifications.

The Hands-on Portal wiki is currently available under the following URL:

http://hop.meme.hokudai.ac.jp/wiki

More information on how the Hands-on Portal wiki can be independently deployed, can be found 
under the ```setup``` directory and specifically in the ```setup/server/README.md``` and 
```setup/server/gateway/runtime/updatehop.sh``` files.

# Setting up wikis

Wiki files in this directory are named after the wiki's identifier (e.g., ```hop```) with the
extension ```.json```.

Files present in this directory are automatically added to the database and become available to
their owner. On the other hand, if there isn't any ```.json``` file corresponding to a wiki entry
in the database, then the latter is deleted from the database. This synchronization facility is
implemented by the ```serverside/maintenance/wiki.js``` script.

Currently, adding ```.json``` files in this directory is the only way to create and manage new wikis
in the Webble World platform. In the future, however, if there's a need for user-generated wikis,
creation and deletion functionality can be easily implemented via the wiki REST api (see 
```serverside/api/wiki.js```) and exposed via the client-side wiki interface (see ```app/views/wiki.html```
and ```app/scripts/controllers/wiki.js```).

The contents of a wiki file have the following form:

```javascript
{
	"name": "Hands-on Portal",
	"description": "Hands-on portal for CREST"
	"owner": "j",
	"repository": "git@gitlab.com:giannis/hokudai-hop-wiki.git",
}
```

* The attributes "name" and "description" can contain any text that describes the wiki
* The attribute "owner" must contain the username or email of an existing Webble World user account
* The attribute "repository" must contain a URL to a repository accessible via SSH

Since a wiki's repository is accessed via ```SSH```, the appropriate key-pair must be setup. In the
reference deployment of Webble World - under the URL: https://wws.meme.hokudai.ac.jp - all instances
of the Webble World server, via which repositories are accessed, have the following public key:

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDjruHGK/7OphK1xeLTEcoSIcN9L3QaGK7gIHdn8WKwqmTQTzmA1wBAkJh3Pv+iUc+Q2kui+GUeQMF4G/kbNJ9q2FLHGbFZgXpUm8Jlu4zat67X6QnOo1wa3c90L/hISHs1LxGcon/sCrnT/NDZT9uCG/cE0S5VLJQznWBzbf4BT+AylvuqbO91UOioYTCSoHcWlft27qugdmvOCRJOp+8oY09wrSBHpZDp9jrv9/MqEfOhsBNUtgEXsB9SlbqMtJ15lOrSYMkaGbJ8GqJUBk2QpQvaT+frk/l9GvsOgjAgeQ7+jTx44YY3oUU2hfW3LduFdL2nHNdRTnW9qhCw/ADT wblwrld3@g-Precision-M6500
```

Therefore, at the target, remote wiki repository, the above public key must be given read and write access. 
Refer to the remote git repository's manual on how to setup the aforementioned public key (e.g., for 
gitlab.com the setting is under: "Profile Settings" -> "SSH Keys").

## SSH key-pairs in more detail

The public and private key of a Webble World server instance is the public and private key of the operating
system's user account under which the Webble World server runs.

Then, the public key of the account (and the Webble World server) is in the file:

```
~/.ssh/id_rsa.pub
```

The private key of the account (and the Webble World server) is in the file:

```
~/.ssh/id_rsa
```

A key-pair for the currently logged-in user can be generated with the following command:

```
ssh-keygen
```

Therefore, the default key-pair, currently used by all the Webble World server instances, is present
inside the ```wblwrld3``` user's ```.ssh``` directory:

1. ```~wblwrld3/.ssh/id_rsa``` (private key)
2. ```~wblwrld3/.ssh/id_rsa.pub``` (public key)

In order to give access to a newly-deployed Webble World server instance with a different, newly-created
key-pair, the generated ```id_rsa.pub``` key must be given read and write access. Refer to the remote git 
repository's manual on how to setup the aforementioned public key (e.g., for gitlab.com the setting 
is under: "Profile Settings" -> "SSH Keys").

# Editing wikis

A wiki object is only visible to its owner under the ```/#/wiki``` path. For example: 

 * https://localhost:7443/#/wiki
 * https://wws.meme.hokudai.ac.jp/#/wiki (at the reference Webble World deployment)

Via the presented User Interface (UI), the owner can then perform one of the following four operations:

1. Share the wiki with other users (their username must be known)
2. Stop sharing the wiki with specific users
3. Open the wiki for editing
4. Save and close the wiki

When a wiki is shared with another user with the username, e.g., ```test```, then the wiki will also
become available for editing in the ```test``` user's session (under the ```/#/wiki``` path). In this
case however the ```test``` user will only be able to perform the following two operations:

1. Open the wiki for editing
2. Save and close the wiki

If the owner of a wiki, stops sharing it with another user with the username, e.g., ```test```, then
the user ```test``` will not be able to view and edit the wiki anymore. In case, however, the user
```test``` was editing the wiki while it was being unshared, they will be able to continue making
modifications and saving them until they navigate away from the ```/#/wiki``` path.

When a wiki is "opened", the repository referenced in the ```wiki_id.json``` file is
[cloned](https://git-scm.com/docs/git-clone) or [pulled](https://git-scm.com/docs/git-pull), if it already
exists, under the directory ```app/tmp/wiki/wiki_id```. If the directory contains some conflicting changes
from a previous unsaved edit session, then the repository is [reset](https://git-scm.com/docs/git-reset).

When a wiki is "saved", all the changes in the local repository (under ```app/tmp/wiki/wiki_id```) are
wrapped in a ["commit" object](https://git-scm.com/docs/git-commit), which is then 
[pushed](https://git-scm.com/docs/git-push) to the wiki's repository. If, in the meantime, the repository
has been modified (by another user with who the repository is shared), all the modifications are merged
before pushing. If the target repository contains conflicting changes, and thus the two change-sets
cannot be merged automatically, then the local repository is [reset](https://git-scm.com/docs/git-reset).
In that specific case, part or all modifications by the last user may be lost.

## Alternative ways to edit a wiki

Since the wiki is stored in a plain, self-contained ```git``` repository, outside of the Webble World 
platform, a wiki can be edited directly by accessing, modifying and pushing its files via other means
and tools.

In this case, once a repository is cloned, e.g., for the Hands-on Portal wiki with the command: 

```
git clone https://gitlab.com/giannis/hokudai-hop-wiki.git
```

The wiki can be edited via the following two ways:

1. By editing the wiki files directly
2. By using tiddlywiki server

In the first case, the files are plain text (UTF-8) and can be edited with any text editor. In the 
latter case the tiddlywiki executable must be installed first via npm. In this case, the following
command can be used:

```
sudo npm install -g tiddlywiki
```

(on Windows systems: ```npm install -g tiddlywiki```).

Subsequently, from inside the repository's directory (e.g., ```cd hokudai-hop-wiki```) the following
command must be used:

```
tiddlywiki --server
```

The above command starts a TiddlyWiki server that when accessed via a web browser, modifies, creates
and deletes files inside the ```tiddlers``` directory depending on the user's editing actions.

The default TiddlyWiki server, serves the wiki under the root path of the localhost's url 
(e.g., http://localhost:8080). When wikis are accessed and edited under the Webble World platform, 
however, the latter exposes them under a the path ```/api/wiki/wiki_id```, (e.g., 
https://localhost:7443/api/wiki/hop). Therefore, to allow wikis to be edited in Webble World,
the following file has to be present in the ```tiddlers``` directory:

```
$__config_tiddlyweb_host.tid
```

With the following contents (e.g., for the wiki with wiki_id ```hop```):

```
title: $:/config/tiddlyweb/host

$protocol$//$host$/api/wiki/hop/
```

When, however, a wiki is edited via the default TiddlyWiki server, the above file has to be edited
or (temporarily) deleted to allow the user's web browser to access the wiki under the correct path.

Finally, using the TiddlyWiki executable, it's possible to export the wiki and generate a self-contained 
```index.html``` file with the following command:

```
tiddlywiki --build index
```

The ```index.html``` file will be generated inside the sub-directory ```output```.

## Fixing a corrupt wiki local repository

When accessed through the Webble World platform, a wiki's local, temporary repository on the server's 
disk may become corrupt by external and unforseen forces. Of course, a corrupt local repository will 
prevent all users from editing and pushing changes to the wiki's remote repository.

Therefore, in the (hopefully, unlikely) case where a local repository with id, e.g., ```hop``` becomes 
corrupt it can be safely deleted. The next time a user will try to access the wiki, a fresh copy of the 
remote repository will be cloned in the local repository.

This can be achieved by logging in to every machine that runs a Webble World server instance and executing
the following command:

```
sudo rm -fr /home/wblwrld3/www/wblwrld3/app/tmp/hop
```

# TiddlyWiki

An overview of TiddlyWiki and how it compares to other wiki software can be found in wikipedia:

* https://en.wikipedia.org/wiki/TiddlyWiki
* https://en.wikipedia.org/wiki/Comparison_of_wiki_software


The official website of TiddlyWiki is the following:

* http://tiddlywiki.com/

The official website that contains information related to developing and extending TiddlyWiki 
is the following:

* http://tiddlywiki.com/dev/

TiddlyWiki is open source software hosted on github. Its official github page is the following:

* https://github.com/TiddlyWiki/tiddlywiki


## Basic editing

The following links provide information on editing TiddlyWiki wikis:

* http://www.richshumaker.com/tw5/FiveStepsToTiddlyWiki5.htm
* http://tiddlywiki.tiddlyspace.com/TiddlyWiki%20Markup
* http://www.tcm.phy.cam.ac.uk/~mdt26/PWT/hints.pdf
* https://www.cheatography.com/simon-fermor/cheat-sheets/tiddlywiki/

TiddlyWiki contains by default the following macros:

* http://tiddlywiki.tiddlyspace.com/Core%20Macros

## Macros and plugins

Besides the default plugins and macros contained in the official TiddlyWiki distribution,
it is possible for individual wikis to implement their own plugins and macros to extend
the functionality of TiddlyWiki.

More information on the plugin mechanism and examples of plugins can be found in the
following links:

* http://tiddlywiki.com/static/PluginMechanism.html
* https://github.com/Jermolene/TiddlyWiki5/tree/master/plugins/tiddlywiki

Moreover, the following websites contain information on developing macros and extensions for 
TiddlyWiki:

* http://tiddlywiki.com/dev/index.html#JavaScript%20Macros
* http://tiddlywiki.com/static/SystemTiddlers.html
* http://tiddlywiki.com/static/Macros%2520in%2520WikiText.html
* http://tw5magick.tiddlyspot.com/
* http://tiddlywiki.tiddlyspace.com/HTML%20Formatting
* http://www.networkworld.com/article/2263176/software/applications-tiddlywiki-macros-and-plugins.html

## The Hands-on Portal TiddlyWiki

The Hands-on Portal wiki is hosted under the following gitlab repository: 
https://gitlab.com/giannis/hokudai-hop-wiki

It can be cloned with the following command:

```
git clone https://gitlab.com/giannis/hokudai-hop-wiki.git
```

The Hands-on Portal wiki is a normal TiddlyWiki that has the following characteristics:

1. Contains a ```$__config_tiddlyweb_host.tid```
2. Contains a few extra macros in the file ```$__tags_Macro.tid```
3. Contains a plugin in the file ```$__plugins_webbleworld.tid```

### Host

As also mentioned before, the file:

```
tiddlers/$__config_tiddlyweb_host.tid
```

Has the following contents:

```
title: $:/config/tiddlyweb/host

$protocol$//$host$/api/wiki/hop/
```

As mentioned previously, when the wiki is edited outside the Webble World platform, via the TiddlyWiki 
server, the contents of that file should be temporarily deleted.

### Webble application macro

The file:

```
tiddlers/$__tags_Macro.tid
```

Contains a few Webble World and Hands-on Portal specific TiddlyWiki macros.

For example the macro ```webble-app``` embeds a whole Webble World application (implemented as a Webble)
inside the target TiddlyWiki post (called tiddler).

The usage of the ```webble-app``` macro is: ```<<webble-app WEBBLE_ID>```.

For example, the following text embeds the Webble World platform that only loads the fundamental webble:

```
<<webble-app fundamental>>
```

The file ```tiddlers/$__tags_Macro.tid``` contains more macros that can be used in the Hands-on Portal
wiki.

### Webble World plugin

Apart from the macros the Hands-on Portal wiki also contains some widgets that are much more powerful than
macros since they can run arbitrarily complex javascript code.

These widgets are implemented inside a plugin called ```webbleworld```. The plugin with all its metadata is
contained under the ```plugins/webbleworld``` sub-directory.

An example usage of the widgets implemeted by the ```webbleworld``` plugin is the following:

```
<$webbledata webble="supernovaclassifier" ext=".jpg"/>
<$webbleimage webble="supernovaclassifier"/>
<$webblelist query="basic"/>
```

The javascript file ```plugins/webbleworld/webbleinfo.js``` implements those two widgets that can be used in
the Hands-on Portal wiki inside any tiddler.
