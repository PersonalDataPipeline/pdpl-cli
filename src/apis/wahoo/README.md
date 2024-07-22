# Wahoo API handler

**Version:** 1

## Getting started

Create an application using [the information here](https://developers.wahooligan.com/cloud#documentation). You can apply to make your application considered "production" to increase the rate limits but it should be fine to keep it in development mode. Use the information shown to add the following [environment variables](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/docs/configuration.md#environment-variables):

- `WAHOO_AUTHORIZE_CLIENT_ID` set to the API application Client ID
- `WAHOO_AUTHORIZE_CLIENT_SECRET` set to the API application Client Secret

Next, start the HTTPS proxy and local server for authorization:

```bash
# First run:
~ npm run caddy
# ... then, in a separate terminal window or tab:
~ pdpl api:authorize wahoo
```

Click the link that appears in the terminal and follow the instructions to get an access token. If there is a problem with the process, check any displayed error messages or the terminal for how to proceed. The refresh token returned will be saved automatically to an environment variable named `WAHOO_REFRESH_TOKEN`. This token will include `workouts_read`, `plans_read`, `power_zones_read`, and `offline_data user_read` scopes.

## Resources

- [Wahoo API reference](https://cloud-api.wahooligan.com/#introduction)
