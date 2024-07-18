# devlog

Notes taken during development, newest to oldest. 

## TODO

**Issues**
- https://github.com/PersonalDataPipeline/pdpl-cli/issues

**Open ADRs**
- [ADR 011: Type transformations during processing](./decisions/011-type-transformations)
- [ADR 009: Storage API modules](./decisions/009-storage-api-modules)
- [ADR 007: API module contribution](./decisions/007-api-modules.md)
- [ADR 003: Handling manual timeline entries](./decisions/003-handling-timeline-entries.md)
- [ADR 012: Recipe storage](./decisions/012-recipe-storage.md)
- [ADR 013: Handling multiple accounts](./decisions/013-handling-multiple-accounts.md)

- [ ] Update `--help` commands
- [ ] ADR++: Merging imported data with duplicate API data; reconciling/augmenting API data ... one way to do this would be merging APIs and imports into one module when the data is expected to be the same entities. The main named module could export handlers for APIs and/or files that share top-level data and utilities. This is somewhat paving the way for the separate library that's used by all the services ...
- [ ] ADR++: Need a way to delete and replace content on subsequent processing runs
- [ ] Need a way to skip values (like my name) and replace values (like names that should point elsewhere) during processing
- [ ] ADR++: Need better reporting/logging for processing and control over when an error is thrown versus no output
- [ ] ADR++: Testing strategy ... API modules, file storage modules, core commands (maybe [Mock Service Worker](ttps://mswjs.io)), Node version testing
- [ ] Fix: Secondary endpoints fail with no way to re-run
- [ ] https://nutjs.dev for data export

## [[2024-07-10]]

[Getting started](./getting-started) guide is complete!

After some pondering, I decided that combined this and the processing logic into a single package makes sense. Reducing development time overhead this early in the project feels critical and I can't really think of a great reason for them to be separate except for a focused UX, which is hard to argue since the commands can be separate topics. 

## [[2024-07-08]]

Working on the lost commands and seeing that the in-CLI help needs some updating so adding that to the list above. 

Looks like the main problem was that npm was following the `.gitignore` so adding an explicit `.npmignore` was the fix. Learned a bit about the npm versioning and release process so that's a positive!

With the command published and installed locally, the configuration file in the repo is not found (to be expected) so I need to come up with a location for that and have the script reference it. We probably want an option to pass the path to the config into the script as well as a good default location, like in the home directory. Added [configuration docs](./configuration).

Had a thought around keeping this and the processor as separate services ... I'm not sure much is gained from them being separate. They do completely different things but they need a lot of shared context around the APIs themselves so maybe it makes sense to combine them? Some shared config values, running locally is much easier, more likely that everything will run on the same machine ... not a lot of value separating them, especially this early in the process. Maintenance overhead on 3 repos (get, run, and shared) is going to suck. Going to sit on this but it feels like the right move to combine ...

## [[2024-07-07]]

Trying to get this command released and not having much luck. Following the oclif [releasing docs](https://oclif.io/docs/releasing/), I got it published to npm and installed locally but it's not executable (like it's not in `$PATH`) and when you try `npx`, there are no commands listed. 

- Upgrade to the latest oclif version, 4.x
- Match package name to command name
- Adjust oclif config in package.json
- Reinstall dependencies

After trying to install again, I saw this error:

> npm ERR! code EEXIST
> npm ERR! path /Users/joshcanhelp/.nvm/versions/node/v20.11.1/bin/xtrct
> npm ERR! EEXIST: file already exists

Turns out the `bin` property in package.json was still set to `xtract` so I updated that and re-published. Tried to install again and the command worked but was still not showing commands. I realized that this was because generated JS files were not being published.

## [[2024-07-02]]

Working on the update column logic. I'm trying to keep the language in the recipe as clear as possible and avoid tricks and shorthands as much as possible. The `toFieldUpdateIfEmpty` doesn't feel exactly right but is the direction I'm trying to go with the DX. This explicitly says what it does, as opposed to the other options I considered:

- Keep `toField` and add a field like `strategy` to tell us how to update. This felt like overloading the existing field and would make the validation logic more complicated.
- Keep `toField` and add a prefix character like `^` or `%` or something. This also explicitly says what it does but only if you know what the character is, making it harder for folks new to the system. 

I think it's better to be explicit and risk being verbose rather than hide features behind being clever. Works well for now!

And, with that, Obsidian and CSV outputs are complete!!! 

## [[2024-07-01]]

Jumping back in off a short break. I'm very close to this being a working prototype and want to be mindful about what remains and move the rest to the list above. I need to get the daily output working then the file output. The column transformations and everything else (that I know of now) are not required for the PoC.

Iterating through the results and building the daily note for each result means that each event will require reading and writing files, even if there are multiple events for a day. Performance-wise this sucks but it also makes the "delete previous run" logic also delete the previous written event. This also means if the process completes that we'll have incomplete events written to the day. 

The date field that's used to determine what note to write to needs to be a composite of two potential fields for this use case (see entry below). This is an actual problem because we'll be missing events if this isn't solved.

## [[2024-06-22]]

Lots of progress but not a lot of notes. I've figured out a number of the challenges that came up and the system is working well. There are still a few catch points, besides the `TODO`s that I've been adding. Big ones right now:

- Transforming the data before processing needs a lot more flexibility than it has right now. I need to be able to convert a column from one type to another but I don't want to expose too much of that process by requiring DB column types in the recipe. I want it to do a lot of this on it's own without explicit direction but I don't know how far I can get doing that. Converting to/from arrays is probably going to be the most problematic. I don't think this is going to be a show stopper but it definitely needs more thought.
- Somewhat related ... if a column does not have a value, there's no way to currently express "add if not exists" or something similar. This is a problem with Google Calendar data because there is a field `start.date` that's there sometimes (all day events) but should be filled in with another field, `start.dateTime` (with modifications) if not. This might just be as simple as some new property or transformation function that says what needs to be done. Again, I don't think this is a huge problem, just a current limitation.

## [[2024-06-16]]

Trying to figure out how to link two tables together ... there are a few layers of types to deal with:

- The types of the link from and link to fields. There are only certain combinations that can be linked automatically:
	- Intersection (value in one list appears in the other list)
	- Equality (columns are the same type)
	- Inclusion (value in one column appears in a list)
- The types of the link to columns. These will be aggregated based on the join, which has to happen in the query. Just realized that we're aggregating these together into a list so we don't have to be type-aware in the query.

## [[2024-06-14]]

Working through the pipeline actions now. No red flags on this approach so far but getting caught up in the words that I'm using to describe things and feel like I need a step back on that. Not where I need to be spending my time right now, though.

I'm working on getting the pipeline running and getting caught up on a couple of things. 

- I'm definitely seeing the benefit of having a data preparation stage before working with what we've got. The Apple contacts data comes from vCard data which parses out to a bunch of arrays. In many cases, those arrays represent a single value but they get imported by DuckDB as a list, making it hard to work with. I can handle that with the single processor service but I'm trying to decide if it makes sense to run two pipelines, the "prep" one and the "actual" one, or make it work with a single pipeline by allowing transforms to a new column. 
- I'm trying to figure out how to deal with pipeline transformation updates. I'm doing it all with single-row updates for each transformation, which is probably the slowest way to do that but I'm not too worried about performance right now. Problem is that there is no consistent id to run those queries on so I'm potentially transforming multiple values at once multiple times. I feel like there is a way to do this positionally, with the update coming in as a single array of new values but I'm not sure how to do it yet.
- Column types are starting to become problematic with transforms. I want to use DuckDB's duck-typing magic as much as possible and not require users to indicate it in the recipe. I think it's possible but, again, not sure how. 
- The linking is proving difficult, mostly as expected. I think the answer here is to create new columns as though we're joining but I'm not quite sure how to do that yet. 

I'm definitely going to level up (again) on SQL-like statements with this project!

## [[2024-06-13]]

Talking through the design that's kind of coming together in this service. Besides basic recipe validation, processing amounts to:

- Validate input data
	- This is currently just validating that the input name and "sub-name" point to a directory with data in it
	- Seems like there are use cases for both "have no data but processing can still happen" and "have no data but processing should stop." Might need to be indicated in the recipe somehow.
- Validate output handlers
	- Does the handler exist and is it configured properly
	- Validate the data object from the recipe
- Validate the pipeline
	- Check that all fields referenced exist in the input data or were created in the pipeline
	- Check that transformation functions exist
- Load input data from sources into their own tables
	- Fields map to columns
	- Only load the fields we're using

## [[2024-06-12]]

Finished up output validation and the modules for that are looking good. Similar shape as the API modules, typed, fairly straightforward. 

Now moving on to using DuckDB to parse all the data. Seems like a perfect fit for what I'm doing and the [Node.js](https://duckdb.org/docs/api/nodejs/overview) support is a good sign. The Node.js API works a bit differently than the command line and the output is JSON instead of a table. BUT ... it's all working very, very well so far! I can suck in all the JSON files for a certain endpoint in a single line and then select the fields that I want. Lots more to do here but everything is working right out of the box!

Got all the input field juggling working and stored in their own tables, ready to combine. The data types that DuckDB use makes this quite easy, even for nested JSON. The process to read and transform data is very intuitive. In a single statement, I'm:

- Reading in all JSON files
- Parsing specific properties to columns
- De-nesting properties that come in as objects
- Reducing arrays of objects down to arrays of strings
- Creating a table that I can immediately select from

## [[2024-06-10]]

Picking up where I left off now that I have [Google Calendar](https://github.com/PersonalDataPipeline/data-getter/commit/11978568d0b2f9b19c4be16a4e74a7ca4e1688b2) and [Apple Contacts](https://github.com/PersonalDataPipeline/data-getter/commit/f0213de58426341d17db2d4f9e982faab05ab564) data. Walking through the logic in English:

- Validate the recipe's structure
    - Convert YAML to JSON
    - Check against a [Joi](https://joi.dev) schema
- Validate the output strategy
	- Check for required strategy config
	- Check required recipe config
- Read in the input data
    - Read latest daily files in the indicated folder
    - Combine into one big array of entities while filtering out fields
- Run the pipeline

Starting with the basic recipe processing and validation ... I don't want to go too far down this road since the shape is likely to change but I want to show how this is meant to catch problems early.

It occurs to me that the processor will need to understand the input data shape (folders, snapshot vs chronological) so it will need to have access to those modules fairly quickly. Not for the PoC but as a part of the next step.

## [[2024-06-06]]

Back working on this project to get it in shape for the launch post I'm writing. I got Google import working without too much trouble and not taking on iCloud, which will be harder because there is no defined API, just work arounds.

I think it's a good place to acknowledge ... the endgame for this system definitely includes native applications so you can have direct access to contacts, photos, and others via [CloudKit on Mac](https://developer.apple.com/icloud/). Not sure what the corollary is for Windows.

There is no great way to access iCloud data from a non-native app. A few things I'm looking at:

- [`icloud.js`](https://github.com/foxt/icloud.js) - npm package, commits this year
- [`apple-icloud`](https://github.com/MauriceConrad/iCloud-API) - npm package, no real movement on this in the last 3 years
- [CloudKit JS](https://developer.apple.com/documentation/cloudkitjs) but it looks like you need a native app to back this up
- [Export](https://support.apple.com/guide/contacts/export-or-archive-contacts-adrbdcfd32e6/mac) as VCF and parse

In general, I greatly prefer API access when it's possible so updates can come through automatically. In this case, though, the iCloud API is not documented and could go away at any time. I don't know if the effort to add these endpoints to one of the libraries is worth it. Also, for the time being, this is just a PoC so whatever gets the data in to work with should be fine. I think that settles it for now.

Side note ... importing contacts makes me think about data models (thanks to Jp). The incoming data is just data but represents a higher order entity, a person. Imported contact data from various sources can just sit there as data but need to be connected somehow. How they connect is not quite universal (email is a close approximation but, as we know, not nearly perfect) so it would need to happen after import but before that data is used in output, hence the "level 1 -> 2 transformation" concept (going from raw raw data to normalized/standardized per source but unlinked).

Alright, back to importing ... this data is not chronological so it's more like a snapshot of records, like `[{Record1}, {Record2}]`. Importing like this would give us the import date in the file and new imports would be matched to the previous one. Separate files per person would make this challenging and be a whole new paradigm I would have to add.

Went with the [vcf package](https://www.npmjs.com/package/vcf) to parse VCF data. Output is quite ugly, nested arrays of nested arrays. Would have been nice to have a nicer format but whatever. It looks like everything is a pretty consistent format and outputting the data as a count looks fine.

Got kind of lost in data transformation for a minute there ... back on track.

## [[2024-05-31]]

I'm stuck on how to represent the data processing. I'm not sure if I should start from the UX of the file or from the processing that needs to get done. The more I think about it, the more it feels like the latter is the right starting point. How the transformations are represented is mostly irrelevant as long as it's clear. But the underlying code needs to work a certain way and that should inform the representation. I've been focused on the user-facing part and I think that's a mistake. 

So, let's work on how the transformations can happen, starting with the basic example below. If I were to write code to do that, I would (ignoring potential issues like running out of memory):

**Moved to the next day**

## [[2024-05-30]]

Played around with [DuckDB](https://duckdb.org) for a bit and it's kind of magical! This seems like the thing that should power the processor. 

## [[2024-05-29]]

Working through the recipe processing ... the validation went well, nothing too problematic there. Now I'm writing the logic that will follow the recipe and seeing some obstacles. 

The first is how to handle linking data. Combining one object with another is directional: start with one and add the other or vice versa. But the output depends on a specific "primary" entity. Like with the personal CRM use case, that depends on the date of the event and the contact is secondary data that augments the event. 

First I thought that you should indicate a primary or starting object and then go from there but I think that exposes too much about the inner working of the processor. For this declarative approach to work properly, users should not have to understand the order of ops for the processor. Instead, constructing the recipe should be intuitive. With that in mind, maybe everything should start from the output and build from there?

OK, let me talk through this one bit at a time here. The point of this component is to take raw JSON in an unknown format and convert it into text output of some kind. The most basic task for this system would be to take all entities from a single source and map them to, say, a list in a Markdown file. Using the current recipe format, it would look something like this:

```yaml
inputs:
  google:
    calendar:
      - 'summary'
      - 'start.date'
      - 'start.time'
outputs:
  obsidian:
    - strategy: 'replace_file'
      path: 'Data/All Events'
      template: >
        - ${google.calendar.start.date} at ${google.calendar.start.time} - ${google.calendar.summary}
```

I think this gives us enough to chew on. We need to:
- Pull in all `google/calendar` events and make sure we're encountering the fields we need
- Load the `obsidian` "connector" and check the strategy
- Verify the path
- Build the content using the template

Some problems that come to mind:
- Will this work if we have GB of JSON to work with? Will we run out of memory?
- How do we handle the template string?
- What do we do with the template if the field is not there?

## [[2024-05-28]]

Actually diving into the processing today after fitting together all the different initial pieces. 

First decision ... how to handle the shape of the recipe. I'm going to go with an old favorite, [Joi](https://joi.dev). This will handle the basic validation for the recipe to make sure processing runs against valid data.

## [[2024-05-07]]

I think I can put logging to bed for the time being. With the changes made and finding out about the dev script, this feels as good as it needs to be right now. 

## [[2024-05-05]]

Noticed today that, in certain cases when an error is throw, oclif will fail with a "command not found" output. I'm not entirely sure what's happening but it would be good to put through an issue on GitHub. 

## [[2024-05-04]]

Had to take a bit of a break from this project to handle some IRL stuff. I'm still very motivated to get this to a usable point and share it with the world. In order for this to be ready, everything above **THE LINE** above needs to be complete. I think a couple of weeks of focus on these tasks and I'll be in good shape to start making connections with the data.

Historic parameter juggling is challenging to debug. This last commit should help a bit but it's still hard to get at problems when they arise. 

## [[2024-04-24]]

[ADR 010: Logging (part 2)](./decisions/010-logging-part-2)

## [[2024-04-23]]

Back to working on logging as well as working through a few bugs that cropped up while this was running in the background.

[ADR 010: Logging (part 2)](./decisions/010-logging-part-2)

I'm also working on a post to explain the system that I'm building here and how this piece fits into a whole. It's helpful to keep reminding myself of the larger goal here so I don't get too stuck in the details!

## [[2024-04-14]]

Doing a little pruning today. The list has gotten a bit overwhelming lately, including several that are large/important enough that they need ADRs. I just want to make sure I'm able to stay focused on the most important things at this stage. I added "THE LINE" above to separate the things that need to happen pre-announcement (above the the) from the things that won't block data gathering right now.

- [ADR 009: Storage API modules](./decisions/009-storage-api-modules)
- [ADR 007: API module contribution](./decisions/007-api-modules.md)
- [ADR 010: Logging (part 2)](./decisions/010-logging-part-2)

I think I have the priority list in the order that makes the most sense now. Logging/debugging is the top concern right now, making that easier now makes everything easier in the future. Then I have a few minor fixes to handle, then need to tackle how the get command, queue management, storage module, and API/import modules all interact with each other. Then move on to how API and storage contributions are made. That handles all the foundational stuff and allows me to test that as a user/contributor. 

Focusing on logging now ... 

## [[2024-04-12]]

I'm still enjoying the development process here and I'm really happy with where this is at for the most part, besides what's on the TODO list. One thing that's making this a bit harder is that each new API means a change to the foundation. I expected this early on but it's definitely making it slow to add new APIs. I assume that I'll reach a point where I can add several APIs without that but not currently. 

Alright, imports are working again but this one is going to be hard. Need to remember: we're not going to boil the ocean here. Get the most important stuff out and anything extra can be handled later on as I, or others, need it. 

## [[2024-04-10]]

Lots of wins lately! oclif is proving to be a great way to organize and develop. Very easy to add new commands, most of the DX is straightforward, and no long side quests to understand it's behavior. I moved an existing command and added a new one and it all worked as expected. 

I've been thinking about logging and how that's still not where I need it. The current system is OK and more or less works for checking back through what's there after it's been running for a while. But it's not great for debugging and I'm missing the call stack. I sort of feel like I unintentionally reinvented logging and did not end up in a better place. I think the idea of structured logs is probably a good idea but how it's all working now is not ideal. I'm also not sure how oclif is going to affect what I've got. 

## [[2024-04-09]]

Back in the swing of things, going to see if I can implement oclif for the commands that I currently have. Going with `xtrct` for the command for now. 

OK, that went really well! I moved the newest log script over and it was, for the most part, uneventful. The shared args and flags will be very nice to have and the command structure feels good so far. The one thing I'm thinking about here is testing. It might be better to keep the business logic in separate files to test. I'll try writing a test against oclif and make sure it's easy to do and doesn't require a bunch of black magic.
## [[2024-04-08]]

Took a pause to investigate [oclif](https://www.joshcanhelp.com/oclif/) and see if it was a good framework for handling all the different parts of a CLI. I'm sold on at least doing a PoC with it, keeping the business logic separate from the framework.

I want to make sure the command structure makes sense. This is the outline I had in my head. The words themselves might change:

- `api <api name>`
	- get data
	- log reporting
	- queue management
	- readiness check
- `import <api name>`
	- import single file or directory of files
	- log reporting
	- dry run to check importability
- `add`
	- Event on date/time
	- Period of time

Feels like this is a big topic, now that I'm writing it out. This is something I want to get as right as I can early on so I don't have to unwire anything. I think the core actions of API getting and file importing aren't going to change much, just need to figure out how to structure it for commands that require an API name and ones that don't. 

I haven't checked on the automated API getting in a while and I want a command to be able to check in on what the API has done so I'll write that as a way to solve my own problem here. Realizing right away that oclif would help with all of this command boilerplate.

## [[2024-03-27]]

I was just thinking about this yesterday and having this all hooked up to an automated process, downloading data in the background feels like a big achievement. I'm seeing some places that could use some attention, like a way to parse out logs and report on the current condition of the API and filtering out info log entries.

I'm still working on the GitHub API for a bit today as I keep finding new endpoints to add. What's becoming clear to me, I guess maybe just more clear, is that some endpoints can be just added to the list and they run great out of the box. But there are always one or two that really need to be puzzled through. Calling the API and getting all the results is usually not a problem but when it comes to how it's stored, day parsing, historic walking ... some endpoints need some additional thought to make sure it's stored well. 

For example ... the Gists endpoint got GitHub. We can just go ahead and get all the Gists and that's that, big snapshot that changes over time. But that could be the same as, say, Strava workouts. Big list of workouts in a file. But that kind of goes against a more timeline-like view. Gists have two dates: created and updated. Do we instead group these by created date? Or updated date using a `since` parameter? Updated date probably doesn't make much sense because the date files will change too much. Using created means that the daily files will update too much. All this to say ... it's a challenge!

Just ran into an "interesting challenge" (we're going to phrase it like that instead of getting annoyed with API designers) with the Pocket API. First, the authorization process is kind of OAuth-flavored (redirect for consent, exchange codes for tokens) but was so different that I had to write a whole now authorization flow. Not a huge deal. But, when writing API requests, the access token (and "client ID") go in the body. I say body because it's a POST request for a "retrieve" call to an endpoint named ... wait for it ... `/get`. So all of the work that went into the logic around URL parameters would somehow need to be recreated (or ported over somehow) to the POST body. WAT? Well, this particular endpoint allows us to just get absolutely everything all at once so we're going to go ahead and do that instead! The interesting part here is that the endpoint is kind of a snapshot (get everything all at once, no historic run needed) but is also parsed by day. 

I'm thinking about this task on the list to add tests for the getter script ... it feels like that's very handler-dependent. Part of me feels like maybe the testing should be per API? Like the get script should be written so that it can be used in individual tests for APIs and their endpoints. But then maybe that's putting too much onus on the API authors. One of the things we want to optimize big-time is making it easy for folks to ad the APIs they want and that starts ASAP. If people are going to use this then they need to be able to add data sources. Having a getter script that functions as expected for a bunch of different cases and tests that illustrate how things work would make those contributions easier. The less that folks need to screw around with testing harnesses and unpredictable outcomes, the better.

## [[2024-03-26]]

I don't know why I was pushing on the Automator path so hard when I could just use crontab ... 

Now that I'm running these from a different directory, it looks like the paths are not lining up and I don't have env variables. After some path changes, landed on this as the bash script:

```bash
#!/bin/bash

export $(egrep -v '^#' ./data-getter/.env | xargs)
/Users/joshcanhelp/.nvm/versions/node/v20.11.1/bin/node \
	/Users/joshcanhelp/Code/data-getter/dist/scripts/get.js oura

# Repeated for all other APIs
```

Crontab looks like this:

```
*/15 * * * * /Users/joshcanhelp/Code/run_api_get.sh
```

Now we wait and hope that the script isn't malfunctioning when the script runs! Safest thing to do now is add another API (which I've been excited to do for a while). 

(Just saw the cron run ... works!! I got a little permission notification window popup, I wonder if it's possible to pre-authorize that)

Adding a new API is not that bad of an experience currently. I added some documentation for that and it feels like the hardest part will be directing folks on how to add historic parameters and logic. I think, with a bunch of examples and tests, that won't be too hard to overcome.

## [[2024-03-25]]

Started working on the external configuration file yesterday. Ran into a couple of complications stemming from circular dependencies, now working through just processing the config file once. I landed on something I like but need to document what we've got before I forget how it works 🙃

OK, it is time! Time to hook this up to Automator and see what happens! Here's what I did to get it started ... well, after I found a bug in the queue ... 

- Ran `npm run historic oura` to start the full download. Got the "outputDir" not found error and created the directory and ran again, no problem.
- Ran `npm run oura` and it finished properly
- Ran `npm run oura` again and it finished with no API calls
- Tried the same for Strava but did not notice that the historic delay was set to zero ... I thought it would be hard to unwire but I just set the historic params back to page 2 and now it will run the same pass next time around.
- Ran `npm run strava` a few time and no API calls, as expected
- Same for Wahoo ... adjusted delay and ran with no calls
- I'm realizing that I never finished up the parameters for the historical events

Glad I walked through that manually first! Walking through [Automator](https://support.apple.com/guide/automator/use-a-shell-script-action-in-a-workflow-autbbd4cc11c/mac) now ...

- **New Document** > **Workflow**
- **Library** > **Utilities** > **Run Shell Script** for each API I want to call
- Enter the command ... had to use the full `node` path, probably because this isn't running as a specific user?
```
/Users/joshcanhelp/.nvm/versions/node/v20.11.1/bin/node \
/Users/joshcanhelp/Code/tapestry/data-getter/dist/scripts/get.js oura
```

That runs well manually, now looking into scheduling ... and I'm surprised to find that Automator doesn't have a native "cron" functionality. I found [this](https://support.apple.com/guide/automator/loop-action-repeat-parts-workflow-atmtr27899/mac) which says you can use a loop. Add a delay in there and I guess that would work? But it wants an ending condition (time or quantity) so that's not going to work. There is a **Calendar Alarm** workflow type but that responds to Calendar events. There's a [long tutorial for doing this with Applescript](https://forums.macrumors.com/threads/running-shell-script-every-30min-with-automator.2281446/?post=29533611#post-29533611) that I need to try. 


## [[2024-03-24]]

I feel like testing is in a pretty good spot now and it's time to start moving forward on getting this tested and more data sources added. The getter script is mostly not tested but a number of underlying components are. I need to I still feel great about swapping in Vitest for Jest, no more (maybe less) fussing around with configuration and mocks. Feels like a much better choice for a TypeScript project.

## [[2024-03-22]]

I'm excited to be past some of the foundational issues and headed towards adding sources and seeing what we can do with all this data!

Writing unit tests for the getter script today. Just found [date mocking functionality in Vitest](https://vitest.dev/guide/mocking.html#dates), which will be very handy for other modules. 
## [[2024-03-21]]

I left this yesterday with the queue not updating standard entries and dove into that this morning. With this work, I refactored the queue management to process entries in place rather than clear the queue out and add entries back. The latter was meant to make it more "scalable" in that multiple services could potentially run against the same queue at the same time and there would not be a problem. But I'm realizing that that is a minor or none issue if the scripts are setup to run properly. Runs pulling down 8 endpoints for an API are taking  ~5 seconds and there is no reason for the script to run anywhere near that often. 

[ADR 008: Preventing concurrent runs](./decisions/008-preventing-concurrent-runs.md)

I've been working on a lot of refactoring and massaging lately and I haven't made much progress on adding new data sources, arguably the heart of what I'm trying to do here. I'm looking at my list above and it feels like I'm a long way off from being able to do that. But, if I want this to actually work and actually be useful, then the foundation needs to be strong. There are just so many places where this could fail or parse data inconsistently, making this system completely useless. I have to remind myself that this is an **actual hard problem**. Lots of moving parts, lots of date/time shuffling, lots of different API contracts. If I rush now to add lots of different APIs and have to go back an troubleshoot, I will have lost a lot of the context and likely be annoyed for longer. Solving this foundational issues early means better adoption, more trust, and better DX. I don't think I'm yak shaving but I'm open to that evaluation.

Just went on an obnoxious and unhelpful journey into the Jest/ESLint/TypeScript configuration world. I probably should have been taking notes but these build issues are so opaque, it's hard to find any learning that could happen. It started with adding this test:

```js
// ./src/scripts/get.spec.ts
import { run } from "./get.js";
describe("Getter script", () => {
	it("runs", async () => {
		await run();
	});
});
```

This lead to this error when running the tests:

> src/scripts/get.ts:267:3 - error TS1378: Top-level 'await' expressions are only allowed when the 'module' option is set to 'es2022', 'esnext', 'system', 'node16', or 'nodenext', and the 'target' option is set to 'es2017' or higher.

No combination of these properties would work either as acceptable configuration or running the tests. A bunch of Googling and random changes lead me to a bunch of config changes and then this command:

```bash
$ node --no-warnings --experimental-vm-modules node_modules/jest/bin/jest.js
```

... which told me that the Jest globals were not being loaded. Around and around I went until I just gave up and wrote this. I'm guessing the heart of the problem comes down to [only limited/experimental ESM support in Jest](https://jestjs.io/docs/ecmascript-modules). There is some magical incantation of configuration options that I'm not getting right and because the problem likely falls somewhere in between different libraries, there doesn't feel like a lot of value to deep dive. 

Going to try [Vitest](https://vitest.dev/guide/) and see how far I get before calling it a day.

18 minutes latest, Vitest is passing all tests including the new ones for the getter script!! 🎉 🎉 🎉 Very similar API as Jest but far, far less configuration. Super pleased with it so far and, honestly, glad to try something new in this space. 

## [[2024-03-20]]

Looking at unit tests for the getter script now. This will require everything to run in it's own function., which will end up being a good refactor since we can catch any uncaught errors, log them, and make sure the logger shuts down correctly:

```js
export const run = async () => {
	// ... gogogo!
};

try {
	await run();
} catch (error) {
	logger.error({ stage: "other", error});
}
```

## [[2024-03-18]]

[ADR 005: Handling API pagination](./decisions/005-handling-pagination.md)

Quick reflection here on what's making this harder, from a debugging standpoint. There are now a bunch of things that the getter script does and, before doing another test run, you have to setup the queue correctly, run the right command with debugging options, then examine the result. I think, because the input and expected output is so clear, this would be a great case for unit tests for the getter script, which I'm going to prioritize after the issues I'm working on (Oura and Wahoo). 

[ADR 007: API module contribution](./decisions/007-api-modules.md)

Also have been thinking a lot about the shape of the API handler and how to make that easier to contribute. My mind keeps coming back to a class that can extend a base class but I'm not sure I want to go that route. Seems like OOP in JS is frowned upon for a number of reasons and I want to make it as easy as possible for folks to contribute new API contracts. Obviously a good starting point template and documentation will help. 

🎉🎉🎉 Pagination is complete! Everything is working really well with Oura's picky heartrate endpoint, fingers crossed this is good for a while!

Now looking at the Wahoo authorization issue ... it seems like the access token is expiring quickly and not being refreshed by the refresh token. Just running the cURL command to get the authorization headers throws the error:

```bash
$ npm run curl wahoo
# ...
error: 'invalid_grant',
error_description: 'The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.'
# ...
```

Wahoo docs say this about tokens:

> Send an HTTP POST to Wahoo with the code and your app's OAuth2 credentials and receive the `access_token` and `refresh_token` ... When the `access_token` expires after 2 hours you can use the `refresh_token` to get a new `access_token` and a new `refresh_token`.

The `expires_in` value returned from the authorization call checks out, 7200. I'm seeing, though, that the new refresh token returned from the API is not being refreshed in the `.env` file. Turned out I had the parameters swapped in the `envWrite` function 🤦‍♂️.
## [[2024-03-17]]

Investigating the Oura heart rate endpoint issue ... the script was writing new files for the same date and, inspecting the files, it looked like the same day did not have the same data in it. This endpoint puts out a lot of data, such that a single call can only pull down a few days. My initial hypothesis here is that the historic runs are pulling down partial days at the start and finish of the run. Let's see what we get with a direct curl call ending at a specific time:

```bash
$ curl -H "Authorization: Bearer ACCESS_TOKEN" https://api.ouraring.com/v2/usercollection/heartrate\?end_datetime\=2024-03-17T06:59:59.999Z | jq . > ~/Downloads/oura.json
```

I can tinker with the JSON in `jq` now that it's saved:

```bash
$ jq '.data[] | .timestamp' ~/Downloads/oura.json
"2024-03-16T07:02:46+00:00"
# ...
"2024-03-17T06:56:12+00:00"
```

This shows me that we're not even getting 2 full days worth of data. Let's see if that changes with a start date:

```bash
$ curl -H "Authorization: Bearer ACCESS_TOKEN" https://api.ouraring.com/v2/usercollection/heartrate\?start_datetime\=2024-03-14T23:00:00.000Z\&end_datetime\=2024-03-17T06:59:59.999Z | jq '.data[] | .timestamp'
```

So, it looks like it can get about 3 full days worth of data ... but, what I just learned is that if you record a workout, it saves your heart rate at much shorter intervals, making it so that you can't get a full days worth of heart rate data. Trying to get a full day with a workout recorded comes back with a next token, which means we didn't get all of the results:

```
?start_datetime\=2024-03-14T23:00:00.000Z\
	&end_datetime\=2024-03-15T06:59:59.999Z
```

This is ... concerning to say the least as this calls into question what I decided in the [API pagination ADR](./decisions/005-handling-pagination.md). If we can't always pull a full day from an API (which, really, is probably not that much of an edge case) then we have to support this `next` token system. This is going to pagination and historic runs a lot more complex. This also means that we'll need to add some kind of loop for HTTP requests and handle rate limits and other errors gracefully because a single API call could generate a rate limit hit but that might be the last call in a series of, say, 4 different calls. Back to the drawing board ...

[ADR 005: Handling API pagination](./decisions/005-handling-pagination.md)

## [[2024-03-15]]

I'm working on a bug with the queue and seeing some ways which this isn't as clear as it should be. It's hard because it needs to be a list of different things to be done but also has some rules around what needs to be in there. I think the queue management needs to be part of the queue code but I don't want to refactor that right now, I've sunk too much time into this and it's working. But I think the queue needs to have a better sense of what's coming and going while handling the file writing better. At any point the service could lose connection with the stored queue. We want to be able to come back and pick up where we left off, including adding error retries to the queue.

I think I need to focus on getting this hooked up to a process that will run it for a few days and see where we're at. That's going to main I'm focusing on logging and getting the existing endpoints working, then adding more endpoints. 

[ADR 006: Logging](./decisions/006-logging)

I will say ... so far, the stats/logging has been really helpful. We just want to augment it a bit and make sure we can figure out what went wrong after the fact.

## [[2024-03-11]]

Digging in on API pagination and getting historic runs to work across all APIs. I'm heading into this nervous that the system I've spent a bunch of time on is not going to work but no sense in dwelling on that. If it doesn't work, we rip it out and start all over again!

Pagination still needed more work to allow for flexibility across APIs and endpoints but I think I've got a system in place that will work for a number of different end cases. Queue management has been working quite well also so that's a win!

One thing I just want to say out loud ... since API maintenance is one of the Big Rocks for this project, we want to move as much boilerplate code as possible out of the API contracts and into the main repo. At some point I'm going to abstract the API contracts to their own repo/dependency so that can be used for getting, processing, storing, etc. so their format will change a bit but, on the way, this should be abstracted as much as possible. Adding new APIs should be as simple and easy as possible. As I add new APIs and endpoints, I'm keeping this in mind as an important priority.

[ADR 007: API module contribution](./decisions/007-api-modules.md)

Slogging through a few issues with 2 APIs and realizing that logging and debugging is still not up to where it needs to be to figure out what's going on when something is not working properly. I bumped logging and debugging tasks up on the list to make troubleshooting easier. 

## [[2024-03-10]]

[ADR 004: Scheduling runs](./decisions/004-scheduling-runs.md)

I think we're good here for now 👍 adding a task to figure out how to trigger historic runs to the list above once I've written pagination for all the current APIs.
## [[2024-03-09]]

[ADR 004: Scheduling runs](./decisions/004-scheduling-runs.md)

## [[2024-03-08]]

[ADR 005: Handling API pagination](./decisions/005-handling-pagination.md)

The date situation is finally settling out and between unit tests and a more clear understanding of the impact of the issue, I'm starting to see the light. The complexity here came from JS `Date` behavior combined with operating in multiple timezones (local and UTC) and then abstracting all that to work with user-defined timezones. I learned **A TON** about how the core JS `Date` functionality works and still feel good about not adopting another library to handle this. The Date API is not great but handling dates and times across time zones is just hard and, while a poor API is annoying, it's not making this much more complex than it already is. 

It looks like the historical runs are working well, except for Oura's heart rate one. It seems like the datetime that we're passing is getting translated somehow. This was another part of that deep complexity, the JS date behavior combined with the black box of the API makes for some interesting problems. In the end, building this against data sources of any type that we don't control will always be a Hard Thing without much to do about it. 

[ADR 004: Scheduling runs](./decisions/004-scheduling-runs.md)

Thinking now about logging and how we need informative message as well. The way that the logs are saved per run and can be scanned after the fact was a good move in the beginning. I'd like to write all logging to go through the logger instead of ever relying on the console. The output can print to the console based on settings or debug or something else.

Another thing that I'm thinking about is how hard it is to test changes, make sure data is lining up, etc. I've been relying on unit tests for some of that, which has been helpful. But it's starting to feel like the whole get script could use a test suite soon, one that could be run against mock data maybe? That should probably come with a refactor to get this in better shape to be a packaged, npm-installed script. I'm realizing that the main thing I need to test better is pagination: first call, what's saved to the queue, second call, etc. Maybe there's a way to get better visibility on that ahead of time, like an API handler test harness that can be reused 🤔

I'm getting a little anxious/overwhelmed with this at the moment because it feels like I've put a lot into this and the get script still feels very rough around the edges. A critical part of this is getting accurate, complete data from these services and that's proving to be quite hard for just a handful of APIs. 

So, this is feeling like boiling an ocean here so let's slice things and set some priority. Main, abstracted problems right now:

- Handling historical runs is not solved (ADR 004)
- Pagination is difficult to write and test (ADR 005)
- Logging is incomplete and relies on the console currently
- Endpoint errors are not handled in any meaningful way besides logging
- Currently no way to gather new mock data
- Need more endpoints

OK, not so scary, right?! There are ADRs for the first two so we're on our way there. I think the amount thought it's taken to end up with not making much progress is what's causing anxiety here. But all of this writing and experimentation is working towards an answer for both of those.

Just added some color for the second PoC for ADR 004. I feel good about this approach and should no be too hard to code that. 

Added [ADR 006: Logging](./decisions/006-logging) to keep taking notes about how to handle logging.

The rest is on the list above in the right order. Feeling better 👍

## [[2024-03-04]]

The pagination continues to be a difficult problem. Let's start with the easiest and go from there!

First, Oura's "easy" endpoints. These results that are naturally organized by day. I'm not sure how, exactly, this is handled for different time zones. I'm not seeing a setting anymore, nor am I getting anything back from user info API endpoint. So we'll need to just trust Oura on this one ... 

These endpoints use the next token strategy, which can be problematic for how we're parsing data right now (see above). The question to answer right now is: should we write our own pagination here running off of dates or should we adjust our data model to allow for this next token strategy? 

[ADR 005: Handling API pagination](./decisions/005-handling-pagination.md)

Just a quick side note ... this is **very tough** to reason about, no wonder I was getting stuck on this! All the different ways to think about it, potential future cases we don't know about, data stability, wrangling dates and time zones ... there is no excellent answer here. And more reasons why this particular portion is both important to get right and a potential maintenance nightmare!!

I'm also now realizing that there needs to be an timezone setting in this library in order to make sense of records that come through with different times. The "day" framing of this requires the start and end of the day to be defined. Then, I'll need to decide on a consistent way to record time throughout the system (run marking, queue timestamps, etc.). Starting to re-think [ADR 001](./decisions/001-js-date-library.md) 🤔

I think what needs to happen before dealing with the historic params is doing a bit of an audit on how dates are used throughout. Thinking about a few things here:

- System time should always be GMT but needs to be used in calculation in some places (performance, queue times) and human-readable in others (file names). Thinking about a global class/utility that gets instantiated with the run start time and is then used throughout
- User-specific time zones should be used for anything that affects the data that we're getting. I don't want to adjust the times in data we get back, nor so I want to be more aware of what's in there than I need to be. But the day collection needs to be calculated on the user's timezone. Though, even that might be specious since users could move locations and not update their data pull settings. And if they did, that would change historical runs _*eye twitches*_.

## [[2024-03-01]]

For the historical run, there are two situations to deal with:

1. First historical run, which is a "get all the things" call with expected pagination. This needs to:
	- Make an API call that incorporates everything
	- Store pagination data in the next queue entity resource
2. Subsequent calls need to pull the message from the queue and act accordingly

So, all the different types of runs will have the same endpoint path and different params:

- Standard daily run indicating the last few days
- Error params that were used previously
- "Down of time" params for initial historic run
- Pagination/next token params for remaining historic calls

This makes this much simpler to reason about. We just need to determine what endpoints we're calling and what parameters to use within the endpoint-specific logic. Structuring this in the existing code is proving to be tough ... may need to refactor a few things to make this work. 

Logic is:

- If error:
	- entry-provided params
- Else if historical:
	- If first run:
		- historical params
	- Else:
		- entry-provided params
- Else is standard:
	- default params

The logic here is starting to get really convoluted between all the different states we could be in, how the endpoints are stored, and how the queue entries are working. I'm hesitant to start refactoring everything just to fit the edge case of re-trying error calls, especially since the error retries could be handled in the same run with something like [axios-retry](https://github.com/softonic/axios-retry). Also, with proper overlap in standard runs and occasional start-to-finish runs, errors will naturally be handled. OK, feeling good about that. 

Note as I'm working through this ... the getter script is starting to get hard to reason about and, in it's current form, it's not testable which is not ideal. I feel like this file is already begging for a rewrite in a more testable way ...

This is slowly coming together but it's going to take a lot more thought around pagination to get this working correctly. It's technically working as expected but regular tokenized pagination doesn't work for the Oura heart rate API because we're saving it on a daily basis and the days are getting cut in half so I'm going to have to write specific pagination for that endpoint. This is probably not a common case but, still, I can imagine this coming up on other API endpoints. 

## [[2024-02-28]]

Feeling good about [ADR 004: Scheduling runs](./decisions/004-scheduling-runs.md). I've thought about this a lot (maybe too much) and I'm worried about over-building and under-building. But I think I'm at a point where I can implement it and see how it goes.

Probably getting unit tests going about now is a good idea ... not too hard copying over from budget-cli. Learned a bit about TS config 👍

After all those chores, time to dive into the queue implementation!

There are so many paths to figure out here that I keep getting distracted by how much is left. Need to slice and focus on one thing at a time, starting with a standard run. This worked out fairly well by always adding a new standard entry when the latest entry is pulled from the queue.

## [[2024-02-27]]

[ADR 004: Scheduling runs](./decisions/004-scheduling-runs.md)

Also thinking about how to trigger the runs via automation. This service is going to have a number of different API contracts but it only needs to run certain ones, based on what cloud data we want to pull down. Not a critical problem to solve early but probably deserves its own ADR.

## [[2024-02-22]]

[ADR 004: Scheduling runs](./decisions/004-scheduling-runs.md)

## [[2024-02-13]]

✅ Fixed the duplicate entity bug, silly array instantiation issue.

Adding Wahoo endpoints was an absolute breeze, took maybe 5 minutes, minus an authorization issue. I'm happy that this module framework is working out so far!


## [[2024-02-12]]

I'm excited to dig into the enrichment refactor but first I need to wire up the mock data to make testing easier and solve the current duplicate data problem. 

Mock data ingestion was fairly straightforward and I like it as a model for anything I write in the future that needs to call APIs. That mock data functionality is so, so nice for testing and feels like a "Good Web Citizen" thing not hammering on APIs with a script. 

Enrichment refactor was pretty straightforward as well. A few loose ends with the types but that should not be too hard to shore up at some point soon.

Also thinking about this: [ADR 003: Handling manual timeline entries](./decisions/003-handling-timeline-entries.md)

Now, after hours of refactoring, I can finally figure out WTF is going on with the duplicate entries! Or maybe I'll just rewrite it in Ruby first ...


## [[2024-02-11]]

**Querying data:**

I was chatting with a fellow note-taker with Big Plans (TM) and he asked a simple question:

> You collect a lot of historic data.  Curious ... do you have a concept of how you want to visualize historic data?  Are you thinking something similar to a traditional calendar / agenda, or something different, maybe more analytical in nature?

It’s basically going to be querying JSON … or writing transforms to make it more queryable. I have a system in mind but I haven't done the work to write it all down properly outside of various bullet point lists. See the end of the [2024-01-26](#2024-01-26) note below about data querying. 

But the question of "how will you use this data" is an important one and it depends entirely on the data I’m getting and what I’m using it for. I have to ask myself ... if I had everything all plugged in and ready to go, what would I do with it? At this point, I’m honestly a little worried that the answer would be “I don’t know.” I don’t know that I am, or will ever be “data driven” enough in my personal life for that to make sense. 

So, here are the kinds of things I would like answers to with my life's data in a queryable format:

- What did I do on this specific date? What photos were taken? What was going on in the world then? This is more fulfilling a constant curiosity than it is about changing the course of my life but it's important to me none-the-less. 
- When did this specific thing happen? When were we in Hawaii that one time? What job did I have when we moved from here to there? Somewhat similar question but more around finding a date from an event.
- Actual athletic performance gains based on the exercise that I'm doing, like an automated coach based on inputs (how much and what type of training) and outputs (how well did the next training session go). This could also be correlated with sleep data.

In the end, I think the idea of being able to pull down and query personal data is just ... really neat and I like just knowing my “corpus” is complete, backed up, and accessible. That plus an answer for “when did this happen” feels like enough to keep making progress on this.

**Investigate incorrect data after TS conversion**

The script is now saving another copy of the activity data for Strava activities. This endpoint is different because it does the "enrichment" process (getting more data based on list data).

Side note here: this is the kind of investigation that will happen on a pretty regular basis with this system ("why is this data different than before") so I'm going to keep an eye open for ways to make this easier to track down. 

One issue is the compressed/not compressed data. If I reformat what's there then the next run sees it as different and saves a copy. Not a big deal, can use the debug mode to store in a new directory (if I remember to do that). 

Looks like this is duplicating data whether there is a previous file or not. It also looks like it's duplicating in two different APIs so the problem is not enrichment. And it's skipping duplicates for other APIs so this might have been happening since before the TS conversion.

I think having mock data would be a really nice way to test this out ... 

**Mock data generation + enrichment**

Minor tangent here ... working through this problem to help with the troubleshooting above ... first, I realized that we can't have mock data stored in the repo because that will, by necessity, be personal. We could probably enforce randomized generation at some point when folks add new API connections but, for now, we'll keep it simple and make folks generate their own. 

Second, this calls into question the problem with enrichment again so I started an ADR for it:

[ADR 002: Enriching single entity data](./decisions/002-handling-entity-enrichment.md)

See [2024-01-20](#2024-01-20) for original thinking about this.

## [[2024-01-28]]

Lesson learned: if you know you want your project to be TypeScript, START IT IN TYPESCRIPT. 

## [[2024-01-26]]

Starting to feel the motivation slipping away a bit as the problem becomes larger so I want to do a little level-setting. I've made some great progress so far and am not that far off from the very basic milestone of a backup solution for cloud-based applications. I still really love this idea on a number of levels and am excited for the possibility, just feeling a little overwhelmed with what "has to" be done and want to avoid stressing myself out over a passion project. I've been kind of thinking about everything, everywhere, all at once and that is my kryptonite. 

First, I think the foundation of this system makes a lot of sense so far. I was able to add the Wahoo API by copying the Strava one in very little time. I think the extensibility and shape of the get script is solid and working great. The addition of an enhancement hook and duplicate-checking make it quite competent at it's job. Also, centering the script on a single API per run means that rate limit mitigations and failures are localized. One failing API won't harm the others. With the right re-running logic, it could be as easy as catching failures and queueing another run.

Not only are adding new APIs easy, it's actually pretty fun. Each new API (we're at 4 now, including Amazon imports) brings a new, minor challenge to abstract and add to the system. 

I have a number of items on the "TODO" list (again, being careful with thinking about this like a requirement) and I want to be clear about the order of priority so I'm tackling the right hard stuff first. I have a vision in my mind about what this will be used for and that's composed of really important stuff and some other less-than-important stuff. 

Pulling from the list of what I'll be using this data for, the most important things are:

- Backup
- Moment in time
- Data queries

Of course, we're talking about the system as a whole here, not just this one component. If we're just talking about this thing, it's only the top two that matter right now and that's accomplished by just downloading all the things. The data queries are a somewhat different project altogether and don't actually have much sway on this part, which is downloading and saving this data close to it's raw form. 

With that in mind, it feels like the most important things to do now are (in no particular order):

- **Add more APIs and imports**: This is easy couch work.
	- https://developer.nytimes.com/apis
	- https://api-ninjas.com/api/historicalevents
- **Figure out full backup run:** This is medium hard, building in various ways of pagination to be able to download an endpoint's entire catalog. I *think* this is where [[Technology/Message Queues|Message Queues]] comes into play. We can't assume that an API has a high enough rate limit that a single script run could get everything (see Strava, 200 calls per 15 minutes). The calls need to happen and then leave behind an instruction of what to do next and when. This feels like something that needs a lot of thought but, while local, it can all be annoyingly manual 🙃.
- **Automate runs:** This looks to be pretty trivial with Automator locally and that will certainly uncover problems I've never thought about. This is also a problem that ties into a queue but I see the main challenge here as the final storage location. Running locally, I can pipe it to iCloud and life is good. In the cloud, the data needs to go somewhere accessible, like S3. We start to get into the system as a whole and running this in different environments, containers, etc.

Alongside that, though, are the things that will make this move faster:

- **Better debugging and testing:** I need to be able to move faster with better visibility into outcomes. Right now, I'm adjusting pagination numbers, un-formatting JSON, all this stuff that has to be walked back. I need to figure out a better debug mode so I can run it that way and be sure that I'm not going to screw something up. 
- **TypeScript:** The longer you wait ... and it definitely has to be done. I have to remember that, while I hit a few snags with the [[GitHub/budget-cli/docs/devlog|Budget CLI]], I overall move faster there now. Fairly easy couch work here as well. 
- **Unit tests:** The longer you wait ... at least I don't hate writing tests. Easy couch work.

And the other big things on the radar:

- **Data querying:** I think it's a good idea to try this out before things get ultra serious, on the off chance that the way that I'm saving data is going to make it much, much harder to query.
- **Timeline data:** I need to be able to add timeline events, like address changes, vacations, job changes, etc. There are a few facets here, though, like "on this date, what job and address did I have?" That's not just an event, that's a state. This is a key part of the "moment in time" functionality that I want.

## [[2024-01-25]]

For importing, it could be a strategy indicated, merge or re-run so the script knows whether to add the results to an existing file or compare and save or skip. Filename could still indicate the run date/time as the latest and still create a new file if there are changes.

## [[2024-01-24]]

Problems are stacking up!

I finished the Amazon product import, which was simple, but I realized that if you import from multiple accounts, the duplicate checking situation won't work. Same day, different data, it's going to look like a duplicate with different data and create a new file. There could be a merge strategy of sorts for imports but then the date/time in the file name is not going to work. It could be a string in the filename for the account? 

I'm also having a tough time wrapping my head around how to query data in the system but I think I just need to try it out. 

It's also a little exhausting thinking about maintaining these APIs ... but it's ok. No emergencies or anything going on right now!

## [[2024-01-20]]

Thinking about this "enrichment" problem a little more ... It makes sense to have these different cases pre-built and ready to use by the API handlers so the logic is not repeated over and over. Order of operations:

1. Pull the endpoint
2. If snapshot ...
	1. Save (want to keep what's there in case we have an error enriching)
	2. If enrich ...
		1. Read file
		2. Enrich
		3. Overwrite original
3. If list ...
	1. Parse out days
	2. Save files
	3. If enrich ...
		1. Iterate through list ...
			1. Read file
			2. Enrich
			3. Overwrite original

We want each of the HTTP calls to be first-class citizens here with error handling and reporting and all the necessary features. We also don't want the HTTP or file system calls to be in the handlers so they are swappable (remember that S3 and other systems will be a save option). So I think the shape needs to be the same/similar as the top-level items. 

Side note: We always need to decide if the error we encounter is something we can recover from and continue or something that needs to stop the current processing. Also need to decide if we can/should write the file or not. 

Started this on the commit below, moving boilerplate out of the API handler and more explicitly defining if an endpoint returns a list of entities or a single one (what I'm calling a snapshot).

https://github.com/PersonalDataPipeline/data-getter/commit/d4821d4149bde134794ba8b9e8641c1c172237e4

This is feeling like a much better way to handle this. Much less boilerplate in the API handler but enough control to do what we want. I'm considering putting the entire Axios config in the API handler but that might make it too "Axios-y" (there are definitely worse problems). I'm already kind of re-creating that programming API. Not going to worry about that yet.

Re-re-thinking the full HTTP config ... I think that needs to happen. 

I'm stuck on the enrichment, though. It occurred to me that saving the unenriched data first would create an unnecessary copy of the file in summary form. Then the enriched data would replace that data, creating duplicates forever and negating duplicate checking. There's no danger of losing data, which is the main thing to avoid, but we short-circuit the duplicate checking and expand storage costs unnecessarily. But we could handle this with clean-up, go back and delete the summary file if the final version is the same as the previous. 

In the get latest file method we need to get the latest *that is not the current file*. This is not a big change to behavior, it turns out.

Lots of nested `for` loops going on in here .... 

## [[2024-01-19]]

A lot to think through today ...

First, I tackled the problem with the Strava API. I just made the 2 separate calls and kept the data intact. This was the least impactful decision for now as storage is a later problem. After finding out that some activities don't have streams, I realized that the error handling deep in these calls is not great so it got me thinking about better ways to surface errors. 

We want to capture and log errors somewhere helpful but keep the process going. If we're going to chug through a bunch of API calls and file saves, we want that process to continue past failures so trying and catching errors is going to be our friend. There are certain errors that hint at code or API contract issues, something that's going to fails these calls regardless of retries. Then there are things like rate limits or connectivity errors that might work later if we try them again. I wonder how much of that we can figure out at a global level rather than per api ...

I think this kind of "self-healing" will end up leaning me towards building a processing feed. If the script can record "I got a 429 for this endpoint on this API for XXX call," the next pass the script can pick that up and just do it again. So, at the very least, we want to be able to log that a thing happened into the log that's being saved to disk. This would need to be per HTTP call so that specific call could be made again as-is. The HTTP calls nested in the success handler feels like a bit of a problem here, though ... have to think through if that's the right way to handle the Strava situation. 

Feels like there are a few patterns to handle:

- Snapshot endpoints where the data changes at unknown intervals but it's not date-based
- Lists of entities that can be parsed into days and saved in files
- Lists of entities that need to be enriched (more HTTP calls) and then parsed into days and saved

Third one being the "Strava problem." First two are working just fine but that third one is harder to figure out:

- Rate limits are more difficult to figure out and could bite us right in the middle of enrichment
- Errors are happening in the success handler and not being handled properly

It really seems like these calls all need to be first class citizens. Maybe an in-app queue of some kind ... matches the format of an external one .... might be onto something here.

## [[2024-01-18]]

Seeing a bit of a problem with getting all data for Strava (and, I'm sure, other APIs as well). The "list activities for this athlete" only provides some of the data. You have to get an ID from each and then get each from a separate endpoint. So you'll need to get:

- Detailed description from the activities endpoint
- Location data streamed from `/activities/{id}/streams\?keys=latlng,time,altitude`

I wonder if it's worth it to download and keep everything or if that's just too much data. Or I can provide some kind of filtering but ... do I The want to strip data off of downloaded data? Is keeping it all overkill or better to have everything?

Looking at the low Strava API rate limits and thinking about the additional per-activity call had me worried that I’d need some new way of working with JSON that skipped the API call if the activity was already there. This would go against what I originally planned to do which was (is) to make the request and check it against already saved data in case anything had changed. Not the end of the world. But I also realized that this is meant to be long-running and asynchronous so no one should be waiting for the outcome. If this needs to wait minutes between each batch, so be it. The manual script running is only during development. It’s also making me think much more seriously about a queue and a worker instead of a single script.

## [[2024-01-16]]

[ADR 001: Use native JS Date or npm library](./adr/001-js-date-library.md)

## [[2024-01-13]] 

After a few commits ... generally the plan is working well so far. Almost have this saving to files. Global logger concept feels like a big leg up in terms of having this run unattended. Runs that need repeating and repeatedly failing ones can be attended to. This also gives us reporting and alerts, in general. Doing a `thing`, saving the state, then having `thing` run against that state and so on feels like the right pattern. Right now this is running per API but I want to think about the idea of a full run, then per-API run, then per endpoint/day runs pretty quickly. Maybe some kind of queue for repairs? So trigger knows to always run XYZ, then check the "repair" "queue" for what else needs to be done 🤔 but feeling good about this so far. Also: pagination 🤢

## [[2024-01-11]]

Let's give this a try with Oura and Strava...

- https://cloud.ouraring.com/v2/docs#section/Authentication
- https://developers.strava.com/docs/authentication/
- https://axios-http.com/docs/req_config

I want to hint at extensibility so it's not hard to add it later. First thing is authorization for the API. Oura is an easy bearer token so I made an auth strategy for that. Strava is a refresh token so I wrote a small authorize server and store the refresh token (rotating ...) in the env file.

## [[2024-01-09]]

The web getter! A critical part of this whole system.

It seems simple at first, you're just getting some JSON from an endpoint. But there are a few things going on here that make it more complicated. 

The main job of this service is to create JSON archives of data stored in APIs. As such, the most critical job is **retain downloaded data**. This means that the script needs to save files early and handle errors well. 

It must be **resilient enough to run unattended**. I don't want to have to run this script manually every time, I want it to run via cloud or cron or automation and be smart enough to notify if something goes wrong (not sure how, many email). It needs to be HTTP code aware and smart about retries. Since this is an archiver, I don't want to have any reason to worry about rate limits (maybe a default 250ms pause in between calls).

One thing that helps here is that it can be re-run for recent content if there is a problem. There could be some kind of reconcile functionality that looks back through runs for problems, either errors in the metadata or missing days and re-runs for that time period. Thinking a bit more about that ... there should be a lot of verbose logging here at several levels to make checking back through runs much easier. This could point to some sort of alerting function or daily report to email. 

It also must be **aware of previously-saved content to backfill, if needed**. Meaning, I can turn it on against an API and it will try for historic content until it finds the end and stops. We're saving data per day so I want to know, at some point, that I have all the days I can possibly get and then it stops checking for older days. I also want it to be aware of missed days and try to figure out if those are missed because of a problem with the API or with the data returned or they are just not there. 

I'm not sure what to do about day for a day that may have changed. If I pull down a certain metric for a certain day from an endpoint, there's definitely a chance that, 3/6/12 months down the road, that this data will be different. It's unknown whether this new version, if different, will be better or worse than previous. So we want to keep both copies if they are different but deciding when to pull new versions of an already-saved day to compare might be hard to do in an automated way. `NEEDS THOUGHT`

It should **organize the content naturally based on the API endpoint**. We'll do transformations later but the raw data should be as close to the source as it can be, then parse out per day. It should also **save metadata about the GET runs** in a separate folder but close to the raw data and associated to the endpoint.

Folder structure could look like:

```
got/
├── api-name-1/
│   └── ...
├── api-name-2/
│   └── ...
└── api-name-2/
    └── endpoint/
        ├── runs/
        │   └──YYYY-MM-DD-HH:MM.json  # matches file name of raw data
        └── YYYY-MM-DD__run-YYYY-MM-DD-HH:MM.json   
```

This works because:
- We can sort via date and run date correctly (sort DESC will give me the newest day with the newest run first)
- We can ignore the run date easily (split on `__` or whatever delimiter we use)
- Run file name can easily find all days from that run

Not sure if something like `path/to/endpoint` should be a single folder (better to see everything in one place without knowing the exact structure) or multiple (more accurate or semantic maybe).