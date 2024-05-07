# Logging (part 2)

## Status

`ACCEPTED`
## Context

[ADR 006: Logging](./006-logging.md)

Re-opening this topic because the current logging system is not working well for debugging. The run files that we're currently using are great for aggregate reporting but not great for in-the-moment debugging. We're also missing the call stack and line numbers, making troubleshooting much harder than it should be. 

Two big improvements we can make right now are below. I'm going to implement those now and see where we're at after.

- **Output to console/stdout** - Outputting to stdout will help with development and is the way that users will be able to stream to a logging service, should they choose to do that. If we need an option to turn it off later then that will be easy to add. I don't think there is a lot to worry about here. 
- **Log level selection** - This is one that I've been thinking about for a while. I think this needs to be a config option, so it can be set to a certain level for a while, as well as an env option so it can be turned on for single calls. I don't think it needs to be in the command flags, though, but easy enough to add later if needed.

**Update post implementation:**

These changes are working really well for both reporting and debugging. The main problem now is errors getting converted to nice text output by oclif, hiding the call stack. [Error handling docs](https://oclif.io/docs/error_handling) have a few things to try out. Ideally, errors are handled the way they are currently with an option you can add to the command that will display the call stack when needed. 

Learned that seeing the call stack is shown if you run the command with `./bin/dev.js`. I don't know if it's possible to run that once the command is packaged or not. Maybe that's something I can work into the command at some point. 

## Consequences

See [ADR 006: Logging](./006-logging.md)

## Decision

- Implement logging levels and stdout before moving forward on fixes and features
- Use `dev.js` for development