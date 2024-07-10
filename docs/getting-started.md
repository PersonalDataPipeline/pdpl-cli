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

For more information about this and the other commands used in this tutorial, see the [commands documentation](./commands).

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
- You can prepend commands with `PATH_TO_ENV="/path/to/.env"` and the service will look in that path instead.
- You can define them system-wide [using these instructions](https://www.twilio.com/en-us/blog/how-to-set-environment-variables-html)

Once you have these variables defined, run the `api:list` command and you should see the **Conf?** column for the API you're configuring show "yes." You are now ready to get data!

Before we wire up the automation, we want to make sure that our API is configured properly and is pulling down data. We'll do that by enabling the API in the config file and running the command once. In the configuration file we created above, add an `apis` property set to an object. Add a property set to the name of the API you want to use (`github` is used as an example below but could be any of the provided APIs) set to `true`:

```js
// get.config.mjs

export default {
  // ... other configuration options
  apis: {
	  github: true,
  }
}
```

Now run the `api:get` command for your API:

```sh
~ pdpl-get api:get github
2024-07-10 08:38:37 [LEVEL: success] [ENDPOINT: user/followers] Got 1 total for 0 days; 0 files written and 1 files skipped.
# ... more
```

The output should only be `info` and `success` level logs with information about the run. If there is any `error` log entries, read the message and double-check your credentials. If you're having any trouble at this point, [submit a new issue](https://github.com/PersonalDataPipeline/pdpl-get/issues/new) and we can help troubleshoot.

So, what just happened? Assuming the run succeeded, this service:

1. Looked for a queue file for this API in the configured output directory and, because one was not found, created one at `/path/to/output/API_NAME/_queue.json`.
2. Walked through all the endpoints for the specific API, calling each one with the provided credentials. 
3. Saved the resulting JSON files in endpoint-specific directories adjacent to the queue file.

We can see that the first occurred using the `api:queue:get` command:

```sh
~ pdpl-get api:queue:get github
┌──────────────────────────┬───────────────────────┬──────────┬────────────────┐
│ Endpoint                 │ Next run (your time)  │ Historic │ Params         │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ user/followers           │ 7/11/2024, 8:37:37 AM │ no       │ None           │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ users/joshcanhelp/events │ 7/11/2024, 8:37:37 AM │ no       │ None           │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ users/joshcanhelp        │ 7/11/2024, 8:37:37 AM │ no       │ None           │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ user/starred             │ 7/11/2024, 8:37:37 AM │ no       │ None           │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ gists                    │ 7/11/2024, 8:37:37 AM │ no       │ None           │
└──────────────────────────┴───────────────────────┴──────────┴────────────────┘
# ... more
```

This shows us the endpoints that run and the earlier the name API pull can happen. If you run the `api:get` command again, you should see no output because the service was called earlier than the next runs are allowed. 