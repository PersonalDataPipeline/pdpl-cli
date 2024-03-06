# Configuration

- `outputDir`: A direct path to where gathered data should be saved. 
- `compressJson`: Boolean to save the gathered data as compressed (`true`) or pretty-printed (`false`). Default is `true`.
- `timezone`: IANA timezone indicator used for calculating dates used when gathering data. The timezone will not be checked by the service so an invalid timezone setting will default to GMT. Note that UTC is used in logs and filenames. 