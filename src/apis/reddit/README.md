# Reddit API handler

**Version:** 1

## Getting started

This API requires you to create an application that can be used to generate access tokens that will authorize calls to the API. 

Go [here](https://www.reddit.com/prefs/apps/) and create a new application. Select "script" for the type and use `http://localhost:8888` as the callback URL. Create the application and add the client ID and the client secret as [environment variables](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/docs/configuration.md#environment-variables):

- `REDDIT_AUTHORIZE_CLIENT_ID` set to the shorter random string of characters at the top of the page
- `REDDIT_AUTHORIZE_CLIENT_SECRET` set to the longer shorter random string of characters labelled **secret**

Next, start the authorization process:

```bash
~ pdpl api:authorize reddit
```

Click the link that appears in the terminal and follow the instructions to get an access token. If there is a problem with the process, check any displayed error messages or the terminal for how to proceed. The refresh token returned will be saved automatically to an environment variable named `REDDIT_REFRESH_TOKEN`.

## Notes on data returned

For [listing endpoints](https://www.reddit.com/dev/api/oauth#listings) like comments and submitted, there are a number of fields that are filtered out because they are either fuzzed (intensionally return changing data) or change rapidly. See the `transformResponseData` method in the [API handler](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/src/apis/reddit/index.ts) to see what fields are removed.

## Resources

- [Reddit API documentation](https://www.reddit.com/dev/api/)
- [Archived (but still valid) Reddit API authorization docs](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Comment on Reddit API authorization](https://www.reddit.com/r/redditdev/comments/dx0hbo/ill_admit_it_im_stupid_how_do_i_do_the_oauth2/f7ndkui/)
