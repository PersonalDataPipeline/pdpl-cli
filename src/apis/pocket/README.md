# Pocket API handler

**Version:** 3

## Getting started

This API requires an access token which is retrieved using a browser-based consent flow. In order to get this process started the first time, you'll need to authorize the local application for the Pocket API.

First, [create an application](https://getpocket.com/developer/apps/new) with **Retrieve** permissions. Use the information shown to add the following to the `.env` file here:

```bash
# .env
POCKET_CONSUMER_KEY="Replace with the application's Consumer Key"
AUTHORIZE_APP_SERVER_PORT="If needed, default is 8888"
```

Next, start the local server:

```bash
$ node dist/apis/pocket/get-token.js
```

... and go to [localhost:8888](http://localhost:8888) in a browser. Click the links and follow the instructions to get an access token. If there is a problem with the process, check any displayed error messages or the Node console for how to proceed.

The refresh token returned will be saved automatically in your `.env` file like the following:

```bash
# .env
POCKET_ACCESS_TOKEN="Replaced with refresh token returned"
```

## Resources

- [Strava API v3 reference](https://developers.strava.com/docs/reference/)
- [Pocket API authorization](https://getpocket.com/developer/docs/authentication)
