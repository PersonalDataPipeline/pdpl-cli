# Getting started

This document assumes you know why you're setting this service up and what it's used for. If you're still exploring what this is all about, [start here](https://www.joshcanhelp.com/personal-data-pipeline)!

PDPL was built to run unattended in a Unix-like environment. As of this writing, this service was built and tested in macOS 14 so changes may need to be (happily) made to make it work elsewhere. Commands below are for macOS but please submit a PR or issue for other systems if you find they are not working for you.

PDPL was also built to be able to save the resulting JSON files to the filesystem or a different static file service. As of this writing, only local file storage is supported. See the [storage API modules ADR](./decisions/009-storage-api-modules) for status on this functionality. 

Once we've completed this tutorial, we'll have PDPL running on a Unix-like machine saving raw json to the same machine and executing a simple processing job.

## Installation

First, we need to make sure our system has the correct version of Node.js and npm installed. PDPL was built using Node 20.x and is restricted to that version or newer using the `engines` property in package.json. We'll expand that when we're able to automate tests against other versions. Use [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) or [the instructions on nodejs.org](https://nodejs.org/en/download/package-manager) to install Node 20. If you think you might already have Node installed, check the version to make sure:

```sh
~ node --version
v20.11.1
```

Next, we'll install the `pdpl` command using npm:

```bash
~ npm install -g pdpl-cli
added X packages in Xms
  
~ which pdpl         
/Users/joshcanhelp/.nvm/versions/node/v20.11.1/bin/pdpl
```

Make sure it was installed correctly and can be called directly:

```sh
 ~ pdpl --help
VERSION
  pdpl/X.X.X darwin-arm64 node-v20.11.1
# ...
```

## Get Input Data

We need to do three things before we're able to start pulling down input data:

1. Configure PDPL
2. Add credentials for the APIs we want to call
3. Call the service on a regular interval

PDPL configures itself with a number of defaults. You can see the configuration it's using with the `config:get` command:

```sh
~ pdpl config:get
{
  timezone: 'GMT',
  outputDir: '/Users/username/api-data',
  filesOutputDir: '/Users/username/api-data/_files',
  originDate: '1900-01-01',
  apis: {},
  imports: [],
  compressJson: true,
  logLevel: 'info',
  debugSaveMocks: false,
  saveEmptyLogs: true,
  debugOutputDir: '/Users/username/api-data-DEBUG',
  debugCompressJson: false
}
```

For more information about this and the other commands used in this tutorial, see the [commands documentation](./commands.md).

We're going to provide definitions for a few important configuration properties in a file on your machine. Create this file with the `config:init` command, then edit the resulting file:

```sh
~ pdpl config:init
Created config file /Users/username/.pdpl/get.config.mjs

~ vim /Users/username/.pdpl/get.config.mjs
# ... or
~ code /Users/username/.pdpl/get.config.mjs
# ... or
~ open /Users/username/.pdpl/get.config.mjs
```

Edit the file to add values for the following properties in the exported object:

- `timezone` - your local timezone
- `outputDir` - direct path to where you want the raw JSON to be saved

See the [configuration option documentation](./configuration) for specifics on content and format. Your final file should look something like this:

```js
export default {
  timezone: "America/Los_Angeles",
  outputDir: "/Users/username/Documents/pdpl",
}
```

Run the `config:get` command to see your configuration changes and confirm that the file is being read and used:

```sh
~ pdpl config:get

Config file: /Users/username/.pdpl/get.config.mjs

{
  timezone: 'America/Los_Angeles',
  outputDir: '/Users/username/Documents/pdpl',
  originDate: '1985-10-11',
  # ...
```

Next, we're going to configure an API so we can start downloading data. To show all the APIs that are available for use, run the `api:list` command. This will display a table of all the APIs that can pull data. 

- The **Ready?** column indicates whether the correct credentials are present. This should say "no" for all rows.
- The **Conf?** column indicates whether the API has been added to the configuration file. This should also say "no" for all rows.

In the configuration file we created above, add an `apis` property set to an object. Add a property set to the name of the API you want to use (`github` is used as an example below but could be any of the provided APIs) set to `true`:

```js
// get.config.mjs

export default {
  // ... other configuration options
  apis: {
	  github: true,
  }
}
```

If you run the `api:list` command again, you should see the **Conf?** column say "yes."

Next, [find your API in this list](https://github.com/PersonalDataPipeline/pdpl-cli/tree/main/src/apis), and click on the name to see the configuration instructions README. The instructions for each API is different but, in general, the steps are:

1. Log into the service and create credentials of some kind
2. Save these credentials as environment variables, [as described here](./configuration#environment-variables)
3. Run an authorization process from the command line (not required for all APIs)

Follow the instructions for the API you're adding carefully and, once you have these variables defined, run the `api:list` command. You should see the **Ready?** column for the API you're configuring show "yes."

The last thing we need to do before getting data from the API is to generate the queue that's used to determine when an API call should be made by running the `api:queue:set` command:

```
~ pdpl api:queue:set github --standard-only
... Reading queue file: /path/to/output/github/_queue.json
... [ENDPOINT: users/githubuser] Added standard entry
... [ENDPOINT: user/starred] Added standard entry
... [ENDPOINT: user/followers] Added standard entry
... [ENDPOINT: gists] Added standard entry
... [ENDPOINT: users/githubuser/events] Added standard entry
```

If you run `api:queue:get`, you'll see the entries that were just created with a **Next run** time of a couple of seconds ago. 

You are now ready to get data! Run the `api:get` command for your API:

```sh
~ pdpl api:get github
2024-07-22 17:48:15 [LEVEL: info] [ENDPOINT: users/githubuser] Running standard now ...
# ... more
2024-07-22 17:48:15 [LEVEL: success] [ENDPOINT: users/githubuser] Got 1 total for 0 days; 1 files written and 0 files skipped.
# ... more
```

The output should only be `info` and `success` level logs with information about the run. If there is any `error` log entries, read the message and double-check your credentials. If you're having any trouble at this point, [submit a new issue](https://github.com/PersonalDataPipeline/pdpl-get/issues/new) and we can help troubleshoot.

So, what just happened? Assuming the run succeeded, PDPL 

1. Walked through all the queue entries found at `/path/to/output/API_NAME/_queue.json`, calling each one with the provided credentials. 
2. Saved the resulting JSON files in endpoint-specific directories adjacent to the queue file.
3. Updated the queue entries with the next run that should happen

We can verify the first and second occurred by listing out the files in the API folder in the output directory:

```sh
~ find /path/to/output/github -type f
/path/to/output/github/user--starred/2024-07-23T00-47-15-292Z.json
/path/to/output/github/user/2024-07-23T00-47-15-292Z.json
/path/to/output/github/user--followers/2024-07-23T00-47-15-292Z.json
# ... more
```

We can also see that this run occurred and a summary of the errors and successful calls by using the `api:logs` command:

```sh
~ pdpl api:logs github
┌────────────┬──────────┬────────┬─────────┬───────────────────────────────┐
│ Date       │ Time     │ Errors │ Success │ Filename                      │
├────────────┼──────────┼────────┼─────────┼───────────────────────────────┤
│ 2024-07-22 │ 17:48:15 │ 0      │ 7       │ 2024-07-23T00-47-15-292Z.json │
└────────────┴──────────┴────────┴─────────┴───────────────────────────────┘
```

We can see that the third occurred using the `api:queue:get` command:

```sh
~ pdpl api:queue:get github
┌──────────────────────────┬───────────────────────┬──────────┬────────────────┐
│ Endpoint                 │ Next run (your time)  │ Historic │ Params         │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ users/joshcanhelp        │ 7/23/2024, 5:47:15 PM │ no       │ None           │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ user/starred             │ 7/23/2024, 5:47:15 PM │ no       │ None           │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ user/followers           │ 7/23/2024, 5:47:15 PM │ no       │ None           │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ gists                    │ 7/23/2024, 5:47:15 PM │ no       │ None           │
├──────────────────────────┼───────────────────────┼──────────┼────────────────┤
│ users/joshcanhelp/events │ 7/23/2024, 5:47:15 PM │ no       │ None           │
└──────────────────────────┴───────────────────────┴──────────┴────────────────┘
```

This shows us the endpoints that run and the earliest that the API pull can happen. If you run the `api:get` command again, you should see log events saying the runs were skipped because PDPL was called earlier than the next runs are allowed.

At this point, we can be pretty sure that this run was successful and that files can be saved in the proper place.

The last step before we automate these calls is to add queue entries for runs to start pulling data from all time. These historic runs will run more often than the daily ones and use changing URL parameters to gather all data for all time. Run the `api:queue:set` command with a `--historic-only` flag to generate these entries then trigger another run:

```sh
~ pdpl api:queue:set github --historic-only --run-now

~ pdpl api:queue:get github
# ... note Historic = yes on 2 new rows

~ pdpl api:queue:get github
2024-07-10 09:60:17 [LEVEL: success] [ENDPOINT: gists] ...
2024-07-10 09:60:17 [LEVEL: success] [ENDPOINT: users/joshcanhelp/events] ...

~ pdpl api:queue:get github
# ... note new Param values for the historic runs
```

We're now ready to setup automation so this API pull happens regularly. We'll do this using cron as that's the most cross-platform way to handle it but macOS users can also look into [launchd](https://launchd.info). How this service is triggered should not make any difference to the output.

First, we'll create a script that will load our service-specific environment variables and trigger the API run. Create and open a file `run_pdpl.sh` in your home directory:

```sh
~ vim ~/run_pdpl.sh
# ... or
~ code ~/run_pdpl.sh
# ... or
~ open ~/run_pdpl.sh
```

Add the following lines:

```sh
#!/bin/bash

export $(egrep -v '^#' $HOME/.pdpl/.env | xargs)
pdpl api:get github
```

This script file will allow us to add and remove APIs easily without adjusting the cron schedule.

Add a cron job running every 15 minutes by editing the crontab file and add the line below:

```sh
~ crontab -e
# Type "i"
*/15 * * * * $HOME/run_pdpl.sh
# Type ":wq" then <enter>
crontab: installing new crontab
```

Leave your computer on and wait for about an hour. Once the time has passed, check the logs for the API you configured to make sure that runs are happening:

```sh
~ pdpl api:logs github
# ... you should see a few new runs depending on how long you waited
```

## Generate Output Data

Now that we have our input data coming in, let's write a simple set of instructions to transform the data we have now into a CSV file. 

The instruction files, called recipes, can come from 3 different locations:

1. The main store of public recipes distributed with PDPL ([listed here](https://github.com/PersonalDataPipeline/pdpl-cli/tree/main/recipes))
2. The default local configuration directory `~/.pdpl/recipes`
3. Directly from an argument passed to the processor command

To keep things simple, well use the third option here and write our recipe locally. Start by creating a file called `output-to-csv.yml` anywhere on your machine and open it in an editor. Add the following and save the file:

```yaml
input:
pipeline:
output:
```

Run the recipe validation command to check whether this recipe can be run successfully or not. You should receive a recipe validation error:

```bash
~ pdpl recipe:validate output-to-csv.yml
    Error: Recipe validation: "input" must be of type object
```

Recipes need to point to input data and an output handler to be considered valid. For the former, we'll need to get somewhat familiar with the data that we are getting. This part of the tutorial depends a bit on specific API data but is hopefully general enough that you can apply the steps to whatever API you used above. 

The GitHub API pulls down data from an events endpoint that we'll use to generate a CSV of events. In the output directory configured above, open one of the JSON files in the `github/user--events` folder. If you're using a different API, choose an endpoint that creates JSON files prepended with a date so the format will be similar. In that file, you should see data for an array of objects with a shape like this:

```js
[
  {
    "type": "PushEvent",
    "repo": {
      "name": "joshcanhelp/josh-to-11",
      // ... more data
    },
    "created_at": "2024-02-05T01:19:43Z"
    // ... more data
  },
  // ... other objects
]
```

We're going to represent the three properties above in the recipe under `input` and assign an internal field name to each of the data points we want to use:

```yaml
input:
  github:
    user--events:
      type: 'event_type'
      repo.name: 'repo_name'
      created_at: 'event_timecode'
# ...
```

The name of the property within object is on the left and the name we'll be using in the recipe is on the right.

Next, we want to adjust the incoming date to be a little easier to read in the output. Under the `pipeline` property in the recipe, add an array with a single object with the following properties:

```yaml
# ...
pipeline:
  - field: 'event_timecode'
    transform:
      - 'toStandardDate'
    toField: 'event_date'
# ...
```

We're telling the processor that we want to take the `event_timecode` field we identified above, run it through the `toStandardDate` function, and save that to a new field called `event_date`.

Finally, we're going to define the output that we want and the fields to be included. Under the `output` property in the recipe, add a `file` property that contains a single object describing the CSV output:

```yaml
# ...
output:
  file:
    - strategy: 'csv'
      data:
        fields:
          - 'event_date'
          - 'event_type'
          - 'repo_name'
```

With all this in place, it's time to try our recipe out for real. Run `recipe:run` command in your terminal:

```bash
~ pdpl recipe:run output-to-csv.yml
Run took 0.007 seconds
    Error: Output strategy file.csv is not configured: 
    No file path to use
```

Oops! We've got one problem left to solve and that's where the file should be saved. This output strategy can use a `path` property in the `data` object or a `DEFAULT_OUTPUT_FILE_PATH` environment variable to determine the directory where the CSV will be saved. Add a valid path in one of those locations and try the command again:

```
~ DEFAULT_OUTPUT_FILE_PATH="/path/to/output" pdpl recipe:run output-to-csv.yml
Run took 0.27 seconds
```

In the output path, you should see a new CSV file named with the date and time that the processing run completed. That file should be formatted something like this:

```
# 2024-07-25T18-48-41-785Z.csv
┌────────────┬─────────────┬───────────────────────────────┐
│ event_date │ event_type  │ repo_name                     │
├────────────┼─────────────┼───────────────────────────────┤
| 2024-07-19 | PushEvent   | PersonalDataPipeline/pdpl-cli |
| 2024-07-19 | PushEvent   | PersonalDataPipeline/pdpl-cli |
| 2024-07-21 | PushEvent   | PersonalDataPipeline/pdpl-cli |
| 2024-07-21 | CreateEvent | PersonalDataPipeline/pdpl-cli |
| 2024-07-21 | PushEvent   | PersonalDataPipeline/pdpl-cli |
└────────────┴─────────────┴───────────────────────────────┘
```

## 🎉 🎉 🎉

Great work! If you're having any trouble with errors in the service or getting this setup, [submit a new issue](https://github.com/PersonalDataPipeline/pdpl-get/issues/new) with reproduction steps and we'll take a look!