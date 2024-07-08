# Getting started

This document assumes you know why you're setting this service up and what it's used for. If you're still exploring what this is all about, [start here](https://www.joshcanhelp.com/personal-data-pipeline)!

This service was built to run unattended in a Unix-like environment. As of this writing, this service was built and tested in macOS 14 so changes may need to be (happily) made to make it work elsewhere. Commands below are for macOS but please submit a PR or issue for other systems if you find they are not working for you.

This service was also built to be able to save the resulting JSON files to the filesystem or a different static file service. As of this writing, only local file storage is supported. See the [storage API modules ADR](./decisions/009-storage-api-modules) for status on this functionality. 

Once we've completed this tutorial, we'll have this service running on a Unix-like machine saving raw json to the same machine. 

First, we need to make sure our system has the correct version of Node.js and npm installed. This service was built using Node 20.x and is restricted to that version using the `engines` property in package.json. We'll expand that when we're able to automate tests against other versions. Use [# Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) or [the instructions on nodejs.org](https://nodejs.org/en/download/package-manager) to install Node 20. If you think you might already have Node installed, check the version to make sure:

```sh
~ node --version
v20.11.1
```

Next, we'll install the `pdpl-get` command using npm:

```bash
~ npm install -g pdpl-get
added X packages in Xms
  
~ which pdpl-get         
/Users/joshcanhelp/.nvm/versions/node/v20.11.1/bin/pdpl-get
```

Make sure it was installed correctly and can be called directly:

```sh
 ~ pdpl-get --help
VERSION
  pdpl-get/0.8.8 darwin-arm64 node-v20.11.1
# ...
```

