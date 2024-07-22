# Google

1. Create a project - https://developers.google.com/workspace/guides/create-project
2. Enable the APIs - https://support.google.com/googleapi/answer/6158841?hl=en
3. Create a service account for the project and a key - https://developers.google.com/identity/protocols/oauth2/service-account#creatinganaccount
  - Role: Basic > Viewer
  - Make a note of the Client ID

> Your new public/private key pair is generated and downloaded to your machine; it serves as the only copy of the private key. You are responsible for storing it securely. If you lose this key pair, you will need to generate a new one.

4. Delegate domain-wide authority - https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority
  - Client ID (in the credentials file and Service Account Details > Unique ID)
  - Scope for Calendar: `https://www.googleapis.com/auth/calendar`

5. Add the following [environment variables](https://github.com/PersonalDataPipeline/pdpl-cli/blob/main/docs/configuration.md#environment-variables):

- `GOOGLE_KEYS_FILE_PATH` set to `/path/to/credentials/file.json`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` set to the email address generated above, something like `service-name@service-name-123456.iam.gserviceaccount.com`
- `GOOGLE_USER_EMAIL` set to your Google email address, like `user@domain.com`

## Resources

- [Event list request](https://developers.google.com/calendar/api/v3/reference/events/list)
- [Event data shape](https://developers.google.com/calendar/api/v3/reference/events#resource)
- [Server-to-server auth](https://developers.google.com/identity/protocols/oauth2/service-account)