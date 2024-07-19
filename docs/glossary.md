# Glossary

[Technology is hard because naming](https://martinfowler.com/bliki/TwoHardThings.html). A former colleague of mine once, very accurately, threw up his hands in frustration and told our team we have a naming problem. I think I was the main person naming things so I took that feedback to heart and did my best to help clean up the problem. 

Since then, I've been struck over and over by how much harder it is to build, describe, and maintain an application or system if the naming conventions are not agreed-upon and used consistently. I see it more of a "best effort" thing than a perfection thing. 

As such, this document is my attempt to standardize naming as much as possible within this project. 

- **3rd Party Service** - The source of personal data in whatever format it provides, e.g. "Google" or "GitHub" or "Strava". This is often shortened to "service" when the distinction is clear.
- **Input Handler** - The specific contract written to obtain data from a **3rd Party Service**. Each **Input Handler** will map to a single source provided by the service, typically an API endpoint or import file.
- **Input Data** - The personal data itself, stored in it's raw format from the source.
- **Input Source Types** - The method by which the **Input Data** is provided by the **3rd Party Service**. The types that PDPL currently handles:
	- **API** - Data provided via individual HTTP requests ([currently supported](https://github.com/PersonalDataPipeline/pdpl-cli/tree/main/src/apis))
	- **Import** - Data provided via import file located locally to PDPL or obtained via HTTP request ([currently supported](https://github.com/PersonalDataPipeline/pdpl-cli/tree/main/src/imports))
- **Output Handler** - The specific contract written to write processed data to another service, a local file, or a remote file ([currently supported](https://github.com/PersonalDataPipeline/pdpl-cli/tree/main/src/outputs))