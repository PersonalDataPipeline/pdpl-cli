# Pocket API handler

**Version:** 3

## Getting started

This API requires an access token which is retrieved using a browser-based consent flow. In order to get this process started the first time, you'll need to authorize the local application for the Pocket API.

First, [create an application](https://getpocket.com/developer/apps/new) with **Retrieve** permissions. Use the information shown to add the following [environment variables](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/docs/configuration.md#environment-variables):

- `POCKET_CONSUMER_KEY` set to the application's Consumer Key

Next, start the authorization process:

```bash
~ pdpl api:authorize pocket
```

Click the link that appears in the terminal and follow the instructions to get an access token. If there is a problem with the process, check any displayed error messages or the terminal for how to proceed. 

The refresh token returned will be saved automatically to an environment variable named `POCKET_ACCESS_TOKEN`.

## Resources

- [Strava API v3 reference](https://developers.strava.com/docs/reference/)
- [Pocket API authorization](https://getpocket.com/developer/docs/authentication)
