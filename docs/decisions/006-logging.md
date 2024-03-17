# Logging

## Status

`ACCEPTED`
## Context

Quick list of what we need:

- A way to handle information messages
- A way to know what process or stage we're in when the error happened
- Possibly the state of the run queue at the time

Things to be mindful of:

- Too many files generated (how many is too many?)
- Too much data in the files (how much is too much?)
- The log output is stored with the data files that were generated as well as with the service so we want to be mindful of what we put there
- The logs needs to always end up somewhere we can inspect; sending the log to an external service is fine but there needs to be a backup in case that call fails during runtime

What I know about logs in general:

- It's nice to have a schema and hard to add one down the road
- Day-to-day service logs can generate a lot of data and are not useful long-term, except when they're misused as analytics

## Consequences

- Proper logging enables debugging and troubleshooting
- Hooking this up to a cron/automation process means that we won't be watching it while it gathers data and we need to know what happened while we were gone
- Structuring the logs well means we can enumerate over the run history and see trends, make decisions, etc.

## Implementation

As I dig into this, it seems important to structure this truly like a log (list of messages in time order) rather than separating out success, error, and information. I tried this out and it feels good but I'm thinking that the info ones are not terribly helpful unless there is a problem. I think what, exactly, goes into them can change over time but this format feels like an evolution.
## Decision

This felt like a big, hairy task but, really, this was just just a matter of coming up with a more standard way to add log entries and allowing info-level logs. I'm going to keep the context from above in mind as I work through some of the issues, keeping an eye out for where this can improve. Right now, I think we have a good shape and format as a foundation.
