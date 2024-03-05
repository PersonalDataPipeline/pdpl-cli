# Handling API pagination

## Status

`DRAFT`

## Context

Pagination is handled differently by all the different APIs but there are shared methods:

- Some use a `next` token to indicate where the results in the set you asked for picks back it. This is handy but when we're trying to parse the data into discreet days, we might split those days and not have a way to stitch them back together. 
- Some use basic pagination (page number and per page indicator) with an indication that there are more results; some don't say whether there are more or not.

We're currently handling data in a per-day way. API calls are parsed into days and stored as such. This means that each API endpoint run should be able to return **discreet and complete days**. We don't have a way to merge incoming data with existing data to create a complete day. We also don't (currently) have a way to make multiple calls to a certain endpoint to do that work for us.

APIs, of course, do not go out of their way to make this easy on us. On Oura's heart rate API, you're only allowed to request a 30 day range. Then, within this range, results are paginated using a next token. 

A few options to handle this ...

---

**Option 1:** Respect the next token pagination and figure out how to stitch results together.

- ℹ️ **Note:** Don't want to read/merge already saved data with new data; want to pull complete results if we think what we have is incomplete
- ✅ **Pro:** The "get next page" logic could work for per page as well with slight modification
- ❌ **Con:** Potentially a lot of logic to get this working just right
- ❌ **Con:** Not all APIs use next tokens so limited impact for the work to get this right

Logic could look like this for next tokens:

```js
// Make the API call
// Figure out oldest date in the list and set those results aside
// If there is a next token
	// Make the request
	// Merge records with oldest date into the rest
	// Toss the others
	// Start next run AT oldest date + 1
// Else these is not a next token
	// Toss the results with the oldest date
	// Start next run AT oldest date
```

---

**Option 2:** Write our own pagination based on date.

- ✅ **Pro:** Potentially reusable, allowing us to manage pagination on our own instead of always learning a new system
- ❌ **Con:** No guarantee that we can get a full day in a single API call

---
## Consequences

- Pagination has a potentially huge impact on data completeness
- Pagination settings for API endpoints could change in the future
- Lots of work to implement and lots of work to re-do it another way
	- Could just have many different strategies around, though ...

## Decision

`TBD`
