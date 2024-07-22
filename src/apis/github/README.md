# GitHub API handler

**Version:** 3

## Getting started

To get GitHub API data, add the following [environment variables](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/docs/configuration.md#environment-variables):

- `GITHUB_PERSONAL_ACCESS_TOKEN` set a valid [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token).
- `GITHUB_USERNAME` set to your GitHub user name

The documentation above links to a fine-grained access token, which is recommended in general for better security. That said, you can use a classic token, which gives wider access and can be set to never expire.

## Resources

- [GitHub API authentication](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api)
- [GitHub API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28)
