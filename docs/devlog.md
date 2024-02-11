
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
- **TypeScript:** The longer you wait ... and it definitely has to be done. I have to remember that, while I hit a few snags with the [[Projects/Budget CLI|Budget CLI]], I overall move faster there now. Fairly easy couch work here as well. 
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
		3. Read file
		4. Enrich
		5. Overwrite original
4. If list ...
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

https://github.com/joshcanhelp/api-getter/commit/d4821d4149bde134794ba8b9e8641c1c172237e4

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