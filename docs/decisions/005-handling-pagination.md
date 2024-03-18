# Handling API pagination

## Status

`RE-OPENED`

## Context

Pagination is handled differently by all the different APIs but there are shared methods:

- Some use a `next` token to indicate where the results in the set you asked for picks back it. This is handy but when we're trying to parse the data into discreet days, we might split those days and not have a way to stitch them back together. 
- Some use basic pagination (page number and per page indicator) with an indication that there are more results; some don't say whether there are more or not.

We're currently handling data in a per-day way. API calls are parsed into days and stored as such. This means that each API endpoint run should be able to return **discreet and complete days**. We don't have a way to merge incoming data with existing data to create a complete day. We also don't (currently) have a way to make multiple calls to a certain endpoint to do that work for us.

APIs, of course, do not go out of their way to make this easy on us. On Oura's heart rate API, you're only allowed to request a 30 day range. Then, within this range, results are paginated using a next token. 

A few options to handle this ...

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

**Option 2:** Write our own pagination based on date.

- ✅ **Pro:** Potentially reusable, allowing us to manage pagination on our own instead of always learning a new system
- ❌ **Con:** No guarantee that we can get a full day in a single API call

## Consequences

- Pagination has a huge impact on data completeness
- Pagination settings for API endpoints could change in the future
- Lots of work to implement and lots of work to re-do it another way if a clever system needs to be re-written after there are many APIs in place.

## Decision

I'm going to write my own pagination based on date. I think trying to make a system based around every API's pagination system is going to be more work than always thinking about dates. 

## Follow-up

One of my assumptions for option 2 (can't get a full day's worth of data in a single call) came true pretty quickly so we're going to need to support next tokens as well. This support means that we'll need to have logic that allows for N number of HTTP calls based on decisions made by the endpoint handler. Notes on this:

- This data all needs to be merged together before the day processing and secondary endpoints are called. 
- This should not have any effect on the next historic params, as far as I can tell initially. 
- We also need to determine how to handle any errors we encounter by way of the next historic run's parameters.
- The final data parsing should not change at all, just getting and merging data using next tokens. 




