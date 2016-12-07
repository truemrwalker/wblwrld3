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

http://hop.meme.hokudai.ac.jp

More information on how the Hands-on Portal wiki can be independently deployed, can be found 
under the ```setup``` directory and specifically in the ```setup/server/README.md``` and 
```setup/server/gateway/runtime/updatehop.sh``` files.

# Seting up the ```ssh``` keys for accessing the wiki's ```git``` repository



```
~/.ssh/id_rsa.pub
```



```
~/.ssh/id_rsa
```


# Editing the Hands-on Portal wiki

https://wws.meme.hokudai.ac.jp/#/wiki

# Troubleshooting the Hands-on Portal wiki



```
sudo rm -fr /home/wblwrld3/www/wblwrld3/app/tmp/hop
```



```
sudo rm -fr /home/wblwrld3/www/wblwrld3/app/tmp
```

# Alternative ways to edit the Hands-on Portal wiki



```
sudo npm install -g tiddlywiki
```



```
git clone https://gitlab.com/giannis/hokudai-hop-wiki.git
```

From inside the repository's directory (```cd hokudai-hop-wiki```):

```
tiddlywiki --server
```

To export the wiki and generate a self-contained ```index.html``` file:

```
tiddlywiki --build index
```

The ```index.html``` file will be generated inside the sub-directory ```output```.

# TiddlyWiki resources

https://en.wikipedia.org/wiki/TiddlyWiki


http://tiddlywiki.com/

http://tiddlywiki.com/dev/

https://github.com/TiddlyWiki/tiddlywiki

## Basic editing

http://www.richshumaker.com/tw5/FiveStepsToTiddlyWiki5.htm

http://tiddlywiki.tiddlyspace.com/TiddlyWiki%20Markup

http://www.tcm.phy.cam.ac.uk/~mdt26/PWT/hints.pdf

https://www.cheatography.com/simon-fermor/cheat-sheets/tiddlywiki/

## Macros and plugins

http://www.networkworld.com/article/2263176/software/applications-tiddlywiki-macros-and-plugins.html

http://tiddlywiki.com/dev/index.html#JavaScript%20Macros

http://tiddlywiki.com/static/PluginMechanism.html

http://tiddlywiki.tiddlyspace.com/Core%20Macros
