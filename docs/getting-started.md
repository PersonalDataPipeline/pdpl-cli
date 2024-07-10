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

We need to do three things before we're able to start pulling down data:

1. Configure the service
2. Add credentials for the APIs we want to call
3. Call the service on a regular interval

This service configures itself with a number of defaults. You can see the configuration it's using with the `config:get` command:

```sh
~ pdpl-get config:get
{
  timezone: 'GMT',
  outputDir: '/Users/home/api-data',
  filesOutputDir: '/Users/home/api-data/_files',
  originDate: '1900-01-01',
  apis: {},
  imports: [],
  compressJson: true,
  logLevel: 'info',
  debugSaveMocks: false,
  saveEmptyLogs: true,
  debugOutputDir: '/Users/home/api-data-DEBUG',
  debugCompressJson: false
}
```

We're going to provide definitions for a few important configuration properties in a file on your machine. Create this file with the `config:init` command, then edit the resulting file:

```sh
~ pdpl-get config:init
Created config file /Users/joshcanhelp/.pdpl/get.config.mjs

~ vim /Users/home/.pdpl/get.config.mjs
# ... or
~ code /Users/home/.pdpl/get.config.mjs
# ... or
~ open /Users/home/.pdpl/get.config.mjs
```

Edit the file to add values for the following properties in the exported object:

- `timezone` - your local timezone
- `outputDir` - direct path to where you want the raw JSON to be saved
- `originDate` - the earliest date for data in `YYYY-MM-DD` format

See the [configuration option documentation](./configuration) for specifics on content and format. Your final file should look something like this:

```js
export default {
  timezone: "America/Los_Angeles",
  outputDir: "/Users/home/Documents/pdpl",
  originDate: "1985-10-11",
}
```

Run the `config:get` command to see your configuration changes and confirm that the file is being read and used:

```sh
~ pdpl-get config:get

Config file: /Users/home/.pdpl/get.config.mjs

{
  timezone: 'America/Los_Angeles',
  outputDir: '/Users/home/Documents/pdpl',
  originDate: '1985-10-11',
  # ...
```

Next, we're going to configure an API so we can start downloading data. To show all the APIs that are available for use, run the `api:list` command. This will display a table of all the APIs that can pull data. 

- The **Ready?** column indicates whether the correct credentials are present. This should say "no" for all rows.
- The **Conf?** column indicates whether the API has been added to the configuration file. This should also say "no" for all rows.

Choose one of the available APIs, [find it in this list](https://github.com/PersonalDataPipeline/pdpl-get/tree/main/src/apis), and click on the name to see the configuration instructions. This will typically involve saving credentials to environment variables, which can be done one of a few ways:

- This service will look for and read the file `~/.pdpl/.env` on the machine that's running the command.
- You can prepend commands with `PATH_TO_ENV="/path.to/.env"` and the service will look in that path instead.
- You can define them system-wide [using these instructions](https://www.twilio.com/en-us/blog/how-to-set-environment-variables-html)

Once you have these variables defined, run the `api:list` command and you should see the **Conf?** column for the API you're configuring show "yes." You are now ready to get data!

Before we wire up the 
