# Configuration

Configuration file:

- `outputDir`: A direct path to where gathered data should be saved. 
- `compressJson`: Boolean to save the gathered data as compressed (`true`) or pretty-printed (`false`). Default is `true`.
- `timezone`: IANA timezone indicator used for calculating dates used when gathering data. The timezone will not be checked by the service so an invalid timezone setting will default to GMT. Note that UTC is used in logs and filenames. 
- `originDate`: The date used as the earliest date for gathered data. Data received that's older than this date will be ignored.
- `debugUseMocks`: Used for testing data processing against pre-generated mock data. If there are no mocks for a certain call, the processing will fail.
- `debugLogOutput`: Output logging in the service to the console.
