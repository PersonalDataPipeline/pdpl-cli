# Wahoo API handler

**Version:** 1

## Getting started

This API requires an access token which is retrieved using a rotating refresh token. In order to get this process started the first time, you'll need to authorize the local application for the Wahoo API.

First, create an application using [the information here](https://developers.wahooligan.com/cloud#documentation). You can apply to make your application considered "production" to increase the rate limits but, as long as you're careful with how your calls are made, it's not required.

Use the information shown for your application to add the following to the `.env` file:

```bash
# .env
WAHOO_AUTHORIZE_CLIENT_ID="Replace with API application Client ID"
WAHOO_AUTHORIZE_CLIENT_SECRET="Replace with API application Client Secret"

AUTHORIZE_APP_SERVER_PORT="If needed, default is 8888"
AUTHORIZE_APP_SERVER_HTTPS_PORT="Default is 8889"
```

Next, start the HTTPS proxy and local server:

```bash
# First run:
$ npm run caddy
# ... then, in a separate terminal window or tab:
$ node dist/apis/wahoo/getRefreshToken.js
```

... and go to [localhost:8889](https://localhost:8889) in a browser. Click the link and follow the instructions to get a refresh token with the correct scopes. If there is a problem with the process, check any displayed error messages or the Node console for how to proceed.

The refresh token returned will be saved automatically in your `.env` file like the following:

```bash
# .env
WAHOO_REFRESH_TOKEN="Replace with refresh token returned"
```

This token will include `workouts_read`, `plans_read`, `power_zones_read`, and `offline_data user_read` scopes.

## Resources

- [Wahoo API reference](https://cloud-api.wahooligan.com/#introduction)
