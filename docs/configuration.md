# Configuration

This service has a number of non-secret configuration values that are used to change its behavior. [Defaults are listed here](https://github.com/PersonalDataPipeline/data-getter/blob/main/src/utils/config.ts#L40) and can be overridden with a `get.config.mjs` file in the `$HOME/.pdpl` directory on the machine that's running the service. It should follow the [ESM export pattern](https://nodejs.org/api/esm.html#introduction) and look something like this:

```js
export default {
	timezone: "America/Los_Angeles",
	outputDir: "/path/to/data/output",
	debugOutputDir: "/path/to/debug-data/output",
	debugCompressJson: false,
	originDate: "1985-03-22",
}
```

- `timezone`: [IANA timezone identifier](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) used for calculating dates used when gathering data. The timezone will not be checked by the service so an invalid timezone setting will default to GMT. Note that UTC is always used in logs and filenames. 
- `outputDir`: A direct path to where gathered data should be saved. If this is not valid, the script will exit with an error.
- `originDate`: The date used as the earliest date for gathered data. Data received that is older than this date will be ignored.
- `filesOutputDir`: Direct path to the directory where files will be saved. If it does not exist it will be created. Defaults to `_files` in `outputDir`.
- `saveEmptyLogs`: Boolean to allow runs without log entries to be saved. If this is `true`, all runs will generate a log file in their respective directories. If this is `false`, only runs that call out to APIs will save logs.
- `logLevel`: Accepts the values "debug", "info", "warn", "success", and "error". Values here are listed in the order of more logging to less logging. The "debug" level could contain sensitive information (not credentials) so this should not be used in production.
- `apis`: Object with properties that correspond to valid API names (folders in `src/apis` [here](https://github.com/PersonalDataPipeline/pdpl-get/tree/main/src/apis)) to indicate what APIs should be run. Values are either `true` to run all endpoints or an array of strings to indicate what endpoints should be run. An API must be ready (configured properly) and indicated here to be able to pull. Run `pdpl-get api:list` to see all possible APIs and whether they are ready or not. Run `pdpl-get api:info API_NAME` to see all possible endpoints for a specific API.
- `imports`: Similar to `apis`, this is simply an array of strings indicating imports that are valid to run. 
- `compressJson`: Boolean to save the gathered data as compressed (`true`) or pretty-printed (`false`). Default is `true`.

**Debugging options**

- `debugOutputDir`: Direct path to a directory where the data should be output. Run the script with `DEBUG_OUTPUT=true`  in an environment variable (see below for more information) to save data to a different directory when troubleshooting.
- `debugCompressJson`: Boolean to indicate whether JSON should be compressed when `DEBUG_OUTPUT=true`  is set in an environment variable. 
- `debugSaveMocks`: Save raw JSON from the API to a mock file. This can also be set using the `DEBUG_SAVE_MOCKS` environment variable, explained below.
## Environment variables

There are a few environment variables that can be used when running the script or in a `.env` file in the root of the project. 

- `DEBUG_OUTPUT`: Output data to the `debugOutputDir` path explained above and use `debugCompressJson` to determine JSON compression.
- `DEBUG_SAVE_MOCKS`: Save raw JSON from the API to a mock file.
- `DEBUG_ALL`: Run the script with all the options above.
- `PATH_TO_CONFIG`: Direct path to a configuration file to use (see above for options and format).
- `PATH_TO_ENV`: Direct path to a file to use for environment variables.
- `EXPORT_DB_PATH`: Populate this with a direct path to a directory to export the resulting DB to CSV.
