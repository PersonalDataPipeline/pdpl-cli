# Logging

## Status

`DRAFT`
## Context

Quick list of what we need:

- A way to handle information messages
- A way to know what process or stage we're in when the error happened
- Possibly the state of the run queue at the time

Things to be mindful of:

- Too many files generated (how many is too many?)
- Too much data in the files (how much is too much?)
- The log output is stored with the data files that were generated as well as with the service so we want to be mindful of what we put there
## Consequences

- Proper logging enables debugging and troubleshooting
- Hooking this up to a cron/automation process means that we won't be watching it while it gathers data and we need to know what happened while we were gone
- Structuring the logs well means we can enumerate over the run history and see trends, make decisions, etc.

## Implementation

As I dig into this, it seems important to structure this truly like a log (list of messages in time order) rather than separating out success, error, and information. 
## Decision

TBD
