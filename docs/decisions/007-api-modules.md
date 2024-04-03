# API contract modules and contribution

## Status

`DRAFT`

## Context

- API contracts should be easy to add with as little boilerplate as possible. 
- The process to write, test, and submit new contracts should be clear and straightforward with excellent docs.
- A class that extends a single base class feels like a good structure but I want it to be as idiomatic as possible and OOP in JS is controversial.
- I want TS to handle as much of the heavy lifting as possible in terms of finding potential problems and defects. 

## Consequences

- Facilitating API contract contributions from the community is absolutely essential to the success of this project.
- PR CI processes running TS, eslint, and tests should give us a high degree of confidence that the contract being added will work as expected. 

## Decision

> What is the change that we're proposing and/or doing?

## Implementation

> How did the implementation of this decision go? What lessons were learned?

## Follow-up

> Optional: what are the reasons why this decision worked or why it needed to be changed?