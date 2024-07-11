# Type transformations

## Status

`DRAFT`

## Discussion

https://github.com/PersonalDataPipeline/pdpl-cli/discussions/1

## Context

When data is imported, the type is determined automatically by DuckDB. During the course of the data pipeline processing, it's common to need to change from, say, an array (list, in DuckDB parlance) of strings to a single strings (like `string.join(", ")`). This can be done in-place in DuckDB:

```sql
ALTER TABLE data_source 
ALTER names
	SET DATA TYPE VARCHAR USING concat(i, ', ', j);
```

This requires the output type to be known so it can be used in the query. It also relies on [built-in functions](https://duckdb.org/docs/sql/functions/overview) to do the transformation, which means that user-created functions would not be allowed. 

We can also do it in a few moves:

```sql
ALTER TABLE data_source ADD COLUMN temp VARCHAR
UPDATE TABLE data_source SET temp = "new value"
ALTER TABLE data_source DROP COLUMN original
ALTER TABLE data_source RENAME temp TO original
```
## Consequences

- DX is of the utmost importance here. We want things to be clear in how they function and hide as much of the implementation as possible.
- There could be some performance implications of how this comes together but those are the lowest priority.

## Options

**Option 1**

Using built-in functions as described above. Kind of out immediately because we need custom transform functions.

**Option 2**

Maintain a hard-coded map of transformation functions to types, possibly including from types as well. The type is determined once when the function is added:

```ts
const transformationTypes = {
	// Function name as the key
	// Item 0 is from type, item 1 is to type
	"joinArray": [ "VARCHAR[]", "VARCHAR" ]
}
```

**Option 3**

Transformation pipeline items declare the output type explicitly:

```yml
pipeline:
  - field: 'array_of_strings'
    transform:
      - 'joinArray'
	toType: 'string' 
```

## Decision

> What is the change that we're proposing and/or doing?

## Follow-up

> Optional: what are the reasons why this decision worked or why it needed to be changed?