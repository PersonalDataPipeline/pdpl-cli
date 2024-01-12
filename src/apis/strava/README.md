# Strava API handler

**Version:** 3

This API requires an access token which is retrieved using a rotating refresh token. In order to get this process started the first time, you'll need to authorize the local application for the Strava API.

First, create a Strava application using [the steps in section B here](https://developers.strava.com/docs/getting-started/#account). Use the information shown to add the following to the `.env` file here:

```bash
# .env
STRAVA_AUTHORIZE_CLIENT_ID="Replace with API application Client ID"
STRAVA_AUTHORIZE_CLIENT_SECRET="Replace with API application Client Secret"
STRAVA_LOCAL_SERVER_PORT="If needed, default is 8888"
```

Next, start the local server:

```bash
$ node src/apis/strava/getRefreshToken.js
```

... and go to [localhost:8888](http://localhost:8888) in a browser. Click the link and follow the instructions to get a refresh token with the correct scopes. If there is a problem with the process, check any displayed error messages or the Node console for how to proceed. 

Once you have a refresh token displying in your browser, save it in the `.env` file:

```bash
# .env
STRAVA_REFRESH_TOKEN="Replace with refresh token returned"
```

You're now ready to go!