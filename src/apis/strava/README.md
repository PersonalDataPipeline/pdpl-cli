# Strava API handler

**Version:** 3

## Getting started

This API requires an access token which is retrieved using a rotating refresh token. In order to get this process started the first time, you'll need to authorize the local application for the Strava API.

First, create an application using [the steps in section B here](https://developers.strava.com/docs/getting-started/#account). Use the information shown to add the following [environment variables](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/docs/configuration.md#environment-variables):

- `STRAVA_AUTHORIZE_CLIENT_ID` set to the API application Client ID"
- `STRAVA_AUTHORIZE_CLIENT_SECRET` set to the API application Client Secret"

Next, start the authorization process:

```bash
~ pdpl api:authorize strava
```

Click the link that appears in the terminal and follow the instructions to get an access token. If there is a problem with the process, check any displayed error messages or the terminal for how to proceed. The refresh token returned will be saved automatically to an environment variable named `STRAVA_REFRESH_TOKEN`. This token will include `read_all`, `profile:read_all`, and `activity:read_all` scopes.

## Resources

- [Strava API v3 reference](https://developers.strava.com/docs/reference/)
- [Strava API authorization](https://developers.strava.com/docs/authentication/)
