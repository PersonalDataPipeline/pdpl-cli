# Adding new API modules

API modules are added to allow this service to call endpoints and download data on a regular basis. The API module needs to support two types of runs:

- **Standard** runs, which are designed to run about daily and add the latest data to the archive
- **Historic** runs, which are designed to run only occasionally and download all available data from an endpoint 

The steps to add a new API module are as follows:

1. Create a new directory in `src/apis` with the API machine name in lowercase
2. Create an `index.ts` file using the following template:

```typescript
import { ONE_QUATER_IN_SEC } from "../../utils/date-time.js";
import { ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "../../utils/types.js";

const { API_ACCESS_TOKEN = "" } = process.env;

////
/// Exports
//

const getApiName = () => "template";
const getApiBaseUrl = () => "https://api.service.com/";
const getApiAuthHeaders = (): object => {
	if (!API_ACCESS_TOKEN) {
		console.log(
			"❌ No API access token stored. See README for more information."
		);
		process.exit(1);
	}
	
	return {
		Authorization: `Bearer ${API_ACCESS_TOKEN}`,
	};
};

const getHistoricDelay = () => ONE_QUATER_IN_SEC;
const endpointsPrimary: ApiPrimaryEndpoint[] = [];
const endpointsSecondary: ApiSecondaryEndpoint[] = [];

export {
	getApiName,
	getApiBaseUrl,
	getApiAuthHeaders,
	getHistoricDelay,
	endpointsPrimary,
	endpointsSecondary,
};
```

3. Update `getApiName()` and `getApiBaseUrl()` with the correct information.
4. Update `getApiAuthHeaders()` to gather and check the correct credentials.
5. Add an endpoint to `endpointsPrimary` using the following template:

```typescript
const endpointsPrimary: ApiPrimaryEndpoint[] = [;
	{
		getEndpoint: () => "Path after getApiBaseUrl()",
		getDirName: () => "Directory name",
		getParams: () => ({}), // URL parameters to use for a standard run
		getDelay: () => ONE_DAY_IN_SEC, // Delay between standard runs
		parseDayFromEntity: (entity: object) => entity.day, // If the entities returned from the endpoint should be grouped by day, return the day in YYYY-MM-DD format based on the entity data.
		transformResponseData: (response: AxiosResponse | MockAxiosResponse, existingData?: object | []) => existingData.length, // (Optional) Should the default response data be transformed before processing?
	},
]
```

6. Run `node ./dist/scripts/curl.js your-api-name` and make sure the command finishes with a valid curl command.
7. Run the curl command and make sure that the correct data comes back 
8. For endpoints that have historical entries, implement the following methods for the endpoint:

```typescript
const endpointsPrimary: ApiPrimaryEndpoint[] = [;
	{
		// ... other methods
		getHistoricDelay: () => HALF_HOUR_IN_SEC, // Delay between historic runs
		getHistoricParams: (params?: object): object => ({}) // URL parameters to use on historic runs. Should generate initial params when nothing is passed in and next parameters from previous ones.
		shouldHistoricContinue: (responseData: object | [], params: object): boolean => true // Decides if another historic run should happen; if this is not implmented then the default will be false if there was no data returned
	},
]
```

9. Run `node ./dist/scripts/historic.js your-api-name` to add the historic entry to the queue. Make sure this entry is accurate.
10. Run `node ./dist/scripts/get.js your-api-name` and check the run logs to make sure everything works
11. Add new endpoints following the steps above