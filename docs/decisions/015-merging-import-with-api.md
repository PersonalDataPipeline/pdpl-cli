# Merging imported data with API data

## Status

`DRAFT`

## Discussion

https://github.com/PersonalDataPipeline/pdpl-cli/discussions/10

## Context

Services often provide two different ways to extract your personal data:

- Via API, providing near-real-time access
- Via export file, providing a snapshot in time

The whole philosophy behind this tool is to import, archive, and give access to your own personal data regardless of the method that was used to gather it. The first item is great for incremental updates while the latter is best for historic data. The latter, because of data privacy laws, also typically includes much more data than the former.

What we want to accomplish here is to allow the two existing input source types to provide data to the same "model" or "object" that can be used at the same time. This would allow data collected via API and via import file to be used at the same time during processing while keeping the input data files separate for archival, reporting, and troubleshooting reasons.

One thing to note ... making PDPL more aware of the data structure of the incoming data makes the 3rd party service contracts necessarily harder to maintain. 

## Consequences

> What becomes easier or more difficult to do because of this change?

## Options

**Option 1**

One way to do this would be merging APIs and imports into one module when the data is expected to be the same entities. The main named module could export handlers for APIs and/or files that share top-level data and utilities

## Decision

> What is the change that we're proposing and/or doing?

## Follow-up

> Optional: what are the reasons why this decision worked or why it needed to be changed?