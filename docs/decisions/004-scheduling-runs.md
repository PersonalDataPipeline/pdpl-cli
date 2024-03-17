# Scheduling runs

## Status

`ACCEPTED`

## Context

The API getter currently pulls down a list of entity data using a specific set of URL parameters. Running the get command over and over is expected to be idempotent and only new data that does not exist. This is currently working well and should function continually if set to run against all APIs daily.

Currently, there are two situations that would require this script to run against endpoints (specific or all) with non-default parameters (there might be more of these situations in the future) that we need to support:

- Re-fetch one or more endpoints that failed with a specific HTTP or error code indicating that re-running could help (429, 500, etc)
- Run against endpoints multiple times with different parameters to fetch all historic data

These types of runs would be scheduled for the get script to run sometime in the future. For re-fetch runs, those would either be scheduled by the get script when the error occurred or be something that's watching the log files. For the historic run, the next run would be scheduled when the current one completes if the get script is run with, say, a historic flag.

The idea I'm exploring here is a queue of jobs that need to be run by the get script. When the script starts, it reads the next item in the queue and takes the action required. When it's complete, it either leaves another item in the queue or not. If no item is found when the get script runs then it just does its default behavior of looking for new data.

So, modeling this as a simple JSON array, when the service is first deployed, the queue looks like this:

```js
// Initial state
[]
```

The getter would see an empty queue and understand that we need to get the entire history of data across all endpoints. The API handlers would need to handle pagination and generate the next call (exact logic TBD). So the first call would be made, data stored, then a new message would be added to the queue:

```js
// Historic download
[
	{
		"apiName": "strava",
		"endpoints": [
			{
				"endpoint": "athlete/activities",
				"params": "page=2&per_page=50"
			}
		]
	}
]
```

The entry should have all the data it needs for the next getter run to operate mostly normally except for the changed params. Secondary endpoints should work exactly as they do now. 

After each run, the entry would be deleted and a new one created to handle whatever endpoints remain. Once all history has been pulled down, the getter would add a new entity for a regular run:

```js
// Standard run
[
	{
		"apiName": "strava",
		"nextRun": "2024-02-27T15:05:00"
	}
]
```

This is the same entry that should be entered after a regular run. This would allow the getter script to be triggered regularly (1-4 times per hour) but only do a standard run against APIs daily. Absent a `nextRun` property the getter would run immediately.

If the run encounters an error on an endpoint that would benefit from a retry, it could generate an item in the queue (or rely on another actor looking at the logs):

```js
// Error retry
[
	{
		"apiName": "strava",
		"endpoint": "athlete/activities",
		"retries": 0
	}
]
```

On the next pass, the getter would pick up the task and run it instead of the default. Once complete, it would add a standard entry for the next run (see above). 

I think this should work fine in the happy path but this might not work as just a JSON file stored locally and accessed directly by the getter script, especially if the different APIs all share a single queue. I started thinking about a separate service that manages the queue, locks the state during read/write, accepts requests to read/alter the queue ... but I think that's overkill for this initial build. 

If the queue is saved per API, then a single instance does not need to take into account multiple processes accessing it. We can mostly assume that by the time one starts, the last run as ended. Though we should be wary of how often then processes are triggered. If we start triggering every few minutes then there is a chance that one process could empty the queue, next process sees an empty queue and starts a historic run, then the other process finishes and stores a standard run. 

**1st PoC notes:**

I've been working with this queue for a while and, for the most part, it's doing its state job fairly well. The one main thing that I'm not wild about is the empty queue behavior. The first item on the queue is removed, leaving the queue empty. If the run errors out for some reason then the queue remains empty and we start another historic run. This is not a terrible thing to happen but it's also unintended and avoidable. The problem is that, without a way to interact with the queue directly, we would have no way to indicate that we need to start a historic run. 

It's clear that we need state of some kind and we don't need anything more than JSON stored on "disk" (wherever that disk happens to be). I think the "one job per run" might be part of the problem, maybe the run could just pull in the queue and process everything that's there. Queue items are added as needed as single endpoints instead of being saved up during the run and potentially lost.

I still agree that errors should not appear in the queue, that should be handled by scanning the logs and deciding at that time (in a separate script/service) if it should be retried.

**2nd PoC notes:**

So, we need a new PoC that:

- handles the queue all at once
- treats an empty queue as "run standard and save a next entry"
- allows for single endpoint entries that are added as-needed in the get script
- queue entries are single endpoints and params (if not default) which can hold multiple for the same endpoint

The queue items should be individual endpoints that can be used to get data. The endpoint handler will be in scope when they are used so not everything is necessary. 

```js
// _queue.json
[
	{
		"endpoint": "relative/path", // Maps to a handler
		"runAfter": 123456789, // Timestamp to avoid hitting rate limit
		"params": {}, // Could be empty/undefined to indicate default params
		"historical": true // Triggers the next historic queue entry to be saved
	}
]
```

Every endpoint would need to have at least one entry to indicate the next standard run. Endpoints that don't have an entry should do a standard run immediately and schedule the next one in the future. Endpoints that exist in the queue but not in the endpoint handlers should be removed with a note logged.

This is working much better now and much easier to follow in the code. I think a lot of the logic that's in the get script could be moved to the queue class to keep things a bit more encapsulated and easy to test but I think I need to work with this current system for a bit before I go too far down that road. 
## Consequences

- Historic runs requiring pagination becomes possible with this system. This allows many calls over time to avoid rate limits and being bad citizens. 
- Error re-tries become possible.
- State is now stored with the data files, which I think is, overall, a good thing. A new instance of the service could be hooked to the same file system and pick up where it left off. 

## Decision

- Building a per-API queue as a flat JSON file
- Each run will add something in the queue for the next run
- Queue entries as individual endpoints that can be run separately and have their own state
- Queue management should account for empty queues and all handled endpoints
