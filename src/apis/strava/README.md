# Strava API handler

**Version:** 3

## Getting started

This API requires an access token which is retrieved using a rotating refresh token. In order to get this process started the first time, you'll need to authorize the local application for the Strava API.

First, create a Strava application using [the steps in section B here](https://developers.strava.com/docs/getting-started/#account). Use the information shown to add the following to the `.env` file here:

```bash
# .env
STRAVA_AUTHORIZE_CLIENT_ID="Replace with API application Client ID"
STRAVA_AUTHORIZE_CLIENT_SECRET="Replace with API application Client Secret"
AUTHORIZE_APP_SERVER_PORT="If needed, default is 8888"
```

Next, start the local server:

```bash
$ node dist/apis/strava/getRefreshToken.js
```

... and go to [localhost:8888](http://localhost:8888) in a browser. Click the link and follow the instructions to get a refresh token with the correct scopes. If there is a problem with the process, check any displayed error messages or the Node console for how to proceed.

The refresh token returned will be saved automatically in your `.env` file like the following:

```bash
# .env
STRAVA_REFRESH_TOKEN="Replace with refresh token returned"
```

This token will include `read_all`, `profile:read_all`, and `activity:read_all` scopes.

## Resources

- [Strava API v3 reference](https://developers.strava.com/docs/reference/)
- [Strava API authorization](https://developers.strava.com/docs/authentication/)
