# Storage API modules

## Status

`DRAFT`

## Context

API Getter is built parse raw data from API or files into structured JSON, then store them somewhere. This is the job of the `fs` util and, currently, it only saves to the local file system. This works fine in many cases but will need to expand to include cloud services like S3, Google Drive, Dropbox, and others. In addition to supporting specific services, we'll also need to allow for contributed modules as well. The DX and contribution process needs to be clear and idiomatic so we don't create unnecessary difficulty.

Currently, all file operations that need to be replicated to cloud services are contained in the `fs` utility. API Getter does have some local file system utilization and this probably needs to be abstracted a bit further.

## Consequences

> What becomes easier or more difficult to do because of this change?

## Decision

- Use [Hygen](https://www.hygen.io) to generate initial file

## Implementation

> How did the implementation of this decision go? What lessons were learned?

## Follow-up

> Optional: what are the reasons why this decision worked or why it needed to be changed?