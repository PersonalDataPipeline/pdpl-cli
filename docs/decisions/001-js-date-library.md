# Use native JS Date or npm library

## Status

`ACCEPTED`

## Context

Working with the JS date library is not a lot of fun and full of gotchas. There are two popular JS date libraries I looked at:

- [date-fns](https://date-fns.org)
- [day.js](https://github.com/iamkun/dayjs)

## Decision

I'm going to stick with the native library because:

- I know the library and its pitfalls fairly well
- Other libraries just have a different API to learn
- The [Temporal API](https://tc39.es/proposal-temporal/docs/) is on its way

## Consequences

TBD