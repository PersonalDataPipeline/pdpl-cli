# API Getter

This service is a WIP project to create a way to download cloud data from the APIs we use. It's ambitious, mainly because of the near-infinite API contracts, but, at the very least, I'll have something for myself. 

## JTBD

The main job of this service is to create JSON archives of data stored in APIs. As such, the most critical job is **retain downloaded data**. This means that the script needs to save files early and handle errors well. 

It must be **resilient enough to run unattended**. I don't want to have to run this script manually every time, I want it to run via cloud or cron or automation and be smart enough to notify if something goes wrong (not sure how, many email). It needs to be HTTP code aware and smart about retries. Since this is an archiver, I don't want to have any reason to worry about rate limits (maybe a default 250ms pause in between calls).

One thing that helps here is that it can be re-run for recent content if there is a problem. There could be some kind of reconcile functionality that looks back through runs for problems, either errors in the metadata or missing days and re-runs for that time period. Thinking a bit more about that ... there should be a lot of verbose logging here at several levels to make checking back through runs much easier. This could point to some sort of alerting function or daily report to email. 

It also must be **aware of previously-saved content to backfill, if needed**. Meaning, I can turn it on against an API and it will try for historic content until it finds the end and stops. We're saving data per day so I want to know, at some point, that I have all the days I can possibly get and then it stops checking for older days. I also want it to be aware of missed days and try to figure out if those are missed because of a problem with the API or with the data returned or they are just not there. 

I'm not sure what to do about day for a day that may have changed. If I pull down a certain metric for a certain day from an endpoint, there's definitely a chance that, 3/6/12 months down the road, that this data will be different. It's unknown whether this new version, if different, will be better or worse than previous. So we want to keep both copies if they are different but deciding when to pull new versions of an already-saved day to compare might be hard to do in an automated way. `NEEDS THOUGHT`

It should **organize the content naturally based on the API endpoint**. We'll do transformations later but the raw data should be as close to the source as it can be, then parse out per day. It should also **save metadata about the GET runs** in a separate folder but close to the raw data and associated to the endpoint.
