# Strava API handler

**Version:** 3

## Getting started

This API requires a [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) and username stored in the environment like this:

```bash
# .env
GITHUB_PERSONAL_ACCESS_TOKEN="Replace with the access token created"
GITHUB_USERNAME="Replace login name"
```

The documentation above links to a fine-grained access token, which is recommended in general for better security. That said, you can use a classic token, which gives wider access and can be set to never expire.

## Resources

- [GitHub API authentication](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api)
- [GitHub API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28)
