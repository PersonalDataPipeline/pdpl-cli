# Logging (part 2)

## Status

`DRAFT`
## Context

[ADR 006: Logging](./006-logging.md)

Re-opening this topic because the current logging system is not working well for debugging. The run files that we're currently using are great for aggregate reporting but not great for in-the-moment debugging. We're also missing the call stack and line numbers, making troubleshooting much harder than it should be. 

Two big improvements we can make right now are below. I'm going to implement those now and see where we're at after.

**Output to console/stdout**

Outputting to stdout will help with development and is the way that users will be able to stream to a logging service, should they choose to do that. If we need an option to turn it off later then that will be easy to add. I don't think there is a lot to worry about here. 

**Log level selection**

This is one that I've been thinking about for a while. I think this needs to be a config option, so it can be set to a certain level for a while, as well as an env option so it can be turned on for single calls. I don't think it needs to be in the command flags, though, but easy enough to add later if needed. 

---


## Consequences

See [ADR 006: Logging](./006-logging.md)

## Decision

TBD

## Implementation

TBD