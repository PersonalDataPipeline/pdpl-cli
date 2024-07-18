# Recipe storage

## Status

`DRAFT`

## Discussion



## Context

Recipes are currently written in YAML format, parsed to JSON, validated, and ran against a corpus of data. Currently, these recipes are stored in the PDPL repo ([GitHub link](https://github.com/PersonalDataPipeline/pdpl-cli/tree/main/recipes)), which works fine for now but will become difficult to manage when there are 100, 1000, or more recipes.

Recipe storage needs to do the following:

- Allow anyone to write, contribute, and read recipes
- Run validation on new/proposed recipes (like tests/formatting run in a CI context)
- Be accessible to the PDPL CLI running in various contexts

## Consequences

> What becomes easier or more difficult to do because of this change?

## Options

**Option 1**

> Description

**Option 2**

> Description

## Decision

> What is the change that we're proposing and/or doing?

## Follow-up

> Optional: what are the reasons why this decision worked or why it needed to be changed?