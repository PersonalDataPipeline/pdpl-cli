# Replacing processed content

## Discussion

https://github.com/PersonalDataPipeline/pdpl-cli/discussions/9

## Status

`DRAFT`

## Context

When content is appended to a document, like in the case of the [Obsidian daily note output](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/src/outputs/obsidian/index.ts#L47), subsequent processing runs need to identify the previous content and replace/update it. Currently, this works by appending a `#pdpl` tag to each line on output and filtering those lines out when processing happens. 

```
**Google Calendar events** #pdpl
- Doctor appointment at 2:00 PM #pdpl
- Call Bob at 11:30 AM #pdpl
- Staff meeting at 10:00 AM #pdpl
```

This is problematic for a couple of reasons:

- All handlers using the same tag means the first processor will remove all lines and only add it's own lines. If the processor errors out, those lines are removed until the next run.
- Per-line tags is limiting in terms of what it can do (paragraphs, etc)
- Output is cluttered/ugly

## Consequences

> What becomes easier or more difficult to do because of this change?

## Options

**Option 1**

Keep the per-line tags but switch to pre-handler tags.

```
**Google Calendar events** #pdpl-personal-crm
- Doctor appointment at 2:00 PM #pdpl-personal-crm
- Call Bob at 11:30 AM #pdpl-personal-crm
- Staff meeting at 10:00 AM #pdpl-personal-crm
```

**Option 2**

HTML comments 

```
<!-- START:pdpl-personal-crm -->
**Google Calendar events**
- Doctor appointment at 2:00 PM
- Call Bob at 11:30 AM
- Staff meeting at 10:00 AM
<!-- END:pdpl-personal-crm -->
```

## Decision

> What is the change that we're proposing and/or doing?

## Follow-up

> Optional: what are the reasons why this decision worked or why it needed to be changed?