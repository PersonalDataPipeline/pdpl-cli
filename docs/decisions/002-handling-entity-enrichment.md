# Handling entity enrichment

## Status

`ACCEPTED`

## Context

Some API endpoints, like Strava activities, give a list of entities with incomplete information. These entities need additional endpoints to be called in order to download the complete data for that entity. Sometimes this data is a more complete record that should replace the original summary entity. Sometimes that data is additional data that should be stored in relation to the original entity.

The current system works by allowing for a list of zero or more enrichment functions that make the additional HTTP calls and modify the entity as needed. But this proving to be a little more complicated than originally expected:

- The new entities are much larger, making storage and comparison harder
- The system of saving the summary entities, then saving again with additional data, along with duplicate checking, is complicated and prone to issues
- These transactions no longer atomic and requires a sequence to be completed in order to have complete data
- The entities stored are a different shape from the API schema
- 3-deep `for` loop is a bad look

The nice parts of the current system are:

- All entity data is in one place, likely making queries easier
- Getting data for the current batch of entities is easy because we already have a distinct list
- A bit less storage space by not storing duplicate data

## Consequences

- Output data format needs to stay as stable as possible, long term
- Non-atomic transactions allow for incomplete entities with no record of the issue
- Solving this needs to account for future API endpoints that may have similar functionality

## Decision

This system should be more atomic and error-resilient by making and saving calls for the enrichment data as separate files. This means the whole "enrichment" process needs to be re-thought and sooner rather than later so I can move forward with the rest of the system on stable data output. 

The main problem to solve here is how to generate a list of complete entities and provide those to future endpoint calls. The "enrichment" relies on existing entities for an identifier so it has to be a two-stage process. 

I think the answer here is two separate groups of endpoints: primary for the main entities and secondary for the ones that rely on the primary ones. Secondary can be typed to extend the primary ones and add an indicator of which is their primary endpoint. This would allow all the calls to be atomic and failed calls to be easily re-queued and ran. All primary calls run, then secondary to ensure that the data we need is present.

## Outcome

- Much cleaner code in the handlers and `get` script