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

...

## Consequences

> What becomes easier or more difficult to do because of this change?

## Decision

> What is the change that we're proposing and/or doing?
