# Scheduling runs

## Status

`DRAFT`

## Context

The API getter currently pulls down a list of entity data using a specific set of URL parameters. Running the get command over and over is expected to be idempotent and only new data that does not exist. This is currently working well and should function continually if set to run against all APIs daily.

Currently, there are two situations that would require this script to run against endpoints (specific or all) with non-default parameters (there might be more of these situations in the future) that we need to support:

- Re-fetch one or more endpoints that failed with a specific HTTP or error code indicating that re-running could help (429, 500, etc)
- Run against endpoints multiple times with different parameters to fetch all historic data

These types of runs would be scheduled for the get script to run sometime in the future. For re-fetch runs, those would either be scheduled by the get script when the error occurred or be something that's watching the log files. For the historic run, the next run would be scheduled when the current one completes if the get script is run with, say, a historic flag.

The idea I'm exploring here is a queue of jobs that need to be run by the get script. When the script starts, it reads the next item in the queue and takes the action required. When it's complete, it either leaves another item in the queue or not. If no item is found when the get script runs then it just does its default behavior of looking for new data.

So, modeling this as a simple JSON array, when the service is first deployed, the queue looks like this:

```json
[]
```

The getter would see an empty queue and understand that we need to get the entire history of data across all endpoints. The API handlers would need to handle pagination and generate the next call (exact logic TBD). So the first call would be made, data stored, then a new message would be added to the queue:

```json
[
	{
		"apiName": "strava",
		"endpoints": [
			{
				"endpoints": "athlete/activities",
				"params": "page=2&per_page=50"
			}
		]
	}
]
```

The entry should have all the data it needs for the next getter run to operate mostly normally except for the changed params. Secondary endpoints should work exactly as they do now. 

After each run, the entry would be deleted and a new one created to handle whatever endpoints remain. Once all history has been pulled down, the getter would add a new entity for a regular run:

```json
[
	{
		"apiName": "strava",
		"nextRun": "2024-02-27T15:05:00"
	}
]
```

This is the same entry that should be entered after a regular run. This would allow the getter script to be triggered regularly (1-4 times per hour) but only do a standard run against APIs daily. Absent a `nextRun` property the getter would run immediately.

If the run encounters an error on an endpoint that would benefit from a retry, it could generate an item in the queue (or rely on another actor looking at the logs):

```json
[
	{
		"apiName": "strava",
		"endpoint": "athlete/activities",
		"retries": 0
	}
]
```

On the next pass, the getter would pick up the task and run it instead of the default. Once complete, it would add a standard entry for the next run. 



## Consequences

> What becomes easier or more difficult to do because of this change?

## Decision

> What is the change that we're proposing and/or doing?
