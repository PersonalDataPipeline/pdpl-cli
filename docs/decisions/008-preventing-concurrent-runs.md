# Preventing concurrent API runs

## Status

`ACCEPTED`

## Context

The API getter script needs to balance 2 behaviors:

- Making sure we have the latest data for obvious reasons and
- Not hitting APIs too often to be a good citizen and avoid 429s

The choices we make about how this service works needs to take these two into account. Running against APIs every few minutes might give us the absolute latest data but we also risk hitting rate limits and annoying our data providers.

The main way we do this is to maintain state in a queue that tells us when the next API call can be run for both standard runs (pull latest data regularly) and historic runs (pull all the data for all time in chunks). The delay is built into the API handler and written to the queue to make it so that if the getter script is run every, say, 15 minutes that API calls happen only happen, say, every hour. This makes it easier for API contract authors to calculate rate limit avoidance.

The current system works approximately like this:
![](../images/automation-flow-v1.svg)
The true delay between calls is stored in the queue and managed by the API contract module. The **Automation** node above can be configured to call the **API Getter** however often it wants. While the current run processes are quite quick, we can't be sure of that in the future and running two **API Getter** scripts at the same time is not desirable (see **Consequences** below).

One other thing to note here ... currently, the **API Getter** needs an API name as a part of the command to run so getting multiple APIs would require multiple automation entries. At some point, we want to be able to trigger all the runs at once but that has not been designed yet.
## Consequences

- Running a getter script twice at the same time could result in too many API calls (one is running while the other is reading the queue before it's been updated).
- This could also result in unknown queue output behavior.

## Decision

For now, we're going to rely on the **Automation** being configured to run at the appropriate delay. Generally, this should be greater than 15 minutes. Standard API runs should happen approximately daily and time periods between historic runs should be configured properly in the **API Getter** based on rate limits. At some point in the future, we should probably think about some way to indicate that a run is happening and to skip the current one (maybe change the queue format or add a lock file or ... ?) but, for now, we're going to assume that everything if configured as it needs to be, problems occurring from misconfiguration will be minor, and monitoring the logs will clue us into issues.

## Implementation

TBD

## Follow-up

TBD