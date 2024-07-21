# Reddit API handler

**Version:** 1

## Getting started

This API requires you to create an application that can be used to generate access tokens that will authorize calls to the API. 

1. Go [here](https://www.reddit.com/prefs/apps/) and create a new application 
2. Select "script" for the type and use `http://localhost:8888` as the callback URL
3. Create the application and add the client ID (random string of characters at the top) and the client secret (labelled **secret**) to your `.env` file:

```bash
# .env
REDDIT_AUTHORIZE_CLIENT_ID="Shorter string of random characters"
REDDIT_AUTHORIZE_CLIENT_SECRET="Longer string of random characters"
```

4. Start the local server:

```bash
$ node dist/apis/reddit/get-token.js
```

5. Go to [localhost:8888](http://localhost:8888) in a browser. Click the link and follow the instructions to get a refresh token with the correct scopes. If there is a problem with the process, check any displayed error messages or the Node console for how to proceed.

## Notes on data returned

For [listing endpoints](https://www.reddit.com/dev/api/oauth#listings) like comments and submitted, there are a number of fields that are filtered out because they are either fuzzed (intensionally return changing data) or change rapidly. See the `transformResponseData` method in the [API handler](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/src/apis/reddit/index.ts) to see what fields are removed.

## Resources

- [Reddit API documentation](https://www.reddit.com/dev/api/)
- [Archived (but still valid) Reddit API authorization docs](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [Comment on Reddit API authorization](https://www.reddit.com/r/redditdev/comments/dx0hbo/ill_admit_it_im_stupid_how_do_i_do_the_oauth2/f7ndkui/)
