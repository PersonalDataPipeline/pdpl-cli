# Handling multiple accounts

## Status

`DRAFT`

## Discussion



## Context

For services like social networks and email, it's common to have multiple accounts. The API getting functionality does not have a way to pull from multiple accounts and treating the new data as different rather than changed. This is a functionality that the PDPL CLI should provide, rather than writing it one-off in each service. The solution here needs to account for ease of getting and ease of processing.

## Consequences

> What becomes easier or more difficult to do because of this change?

## Options

Possible options:

- "Instances" of the service in question, resulting in separate data folders with account indicators
- Account indicators in the raw JSON file name
- Create a single JSON file containing multiple accounts (requiring multiple API calls)

## Decision

> What is the change that we're proposing and/or doing?

## Follow-up

> Optional: what are the reasons why this decision worked or why it needed to be changed?