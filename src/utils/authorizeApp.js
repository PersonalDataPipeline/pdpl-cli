require("dotenv").config();
const crypto = require("crypto");
const axios = require("axios");
const { envWrite } = require("./fs");

const { AUTHORIZE_APP_SERVER_PORT, AUTHORIZE_APP_SERVER_HTTPS_PORT } = process.env;

const serverPort = AUTHORIZE_APP_SERVER_PORT
  ? parseInt(AUTHORIZE_APP_SERVER_PORT, 10)
  : 8888;

const baseUrl = AUTHORIZE_APP_SERVER_HTTPS_PORT
  ? `https://localhost:${AUTHORIZE_APP_SERVER_HTTPS_PORT}`
  : `http://localhost:${serverPort}`;

const responseHeaders = {
  "Content-Type": "text/html",
  "Cache-Control": "no-cache",
};

let authorizeState = "";

module.exports = {
  serverPort,
  serverCallback: (options) => {
    return async (request, response) => {
      const requestUrl = new URL(baseUrl + request.url);
      const errorParam = requestUrl.searchParams.get("error");

      if (errorParam) {
        response.writeHead(401);
        response.write("Error returned from authorization server:\n");
        response.write(errorParam);
        response.write("\n" + requestUrl.searchParams.get("error_description"));
        return response.end();
      }

      const codeParam = requestUrl.searchParams.get("code");
      const stateParam = requestUrl.searchParams.get("state");

      if (codeParam) {
        if (options.checkState === true && stateParam !== authorizeState) {
          authorizeState = "";
          response.writeHead(400, responseHeaders);
          response.write(
            `<p>State parameter mis-match.</p>` + `<p><a href="/">Try again</a></p>`
          );
          return response.end();
        }
        authorizeState = "";

        let tokenResponse;
        try {
          tokenResponse = await axios.post(options.tokenEndpoint, {
            client_id: options.clientId,
            client_secret: options.clientSecret,
            grant_type: "authorization_code",
            redirect_uri: baseUrl,
            code: codeParam,
          });
        } catch (tokenError) {
          response.writeHead(tokenError.response.status, responseHeaders);
          response.write(
            `<p>Error exchanging code for token: ${tokenError.message}</p>` +
              `<pre>${JSON.stringify(tokenError.response.data)}</pre>` +
              `<p><a href="/">Try again</a></p>`
          );
          return response.end();
        }

        response.writeHead(200, responseHeaders);
        envWrite(
          options.refreshTokenEnvKey,
          tokenResponse.data.refresh_token,
          options.refreshToken
        );
        response.write(`${options.refreshTokenEnvKey} written to .env.`);
        return response.end();
      }

      const authorizeUrl = new URL(options.authorizeEndpoint);
      authorizeUrl.searchParams.append("client_id", options.clientId);
      authorizeUrl.searchParams.append("redirect_uri", baseUrl);
      authorizeUrl.searchParams.append("approval_prompt", "auto");
      authorizeUrl.searchParams.append("response_type", "code");
      authorizeUrl.searchParams.append("scope", options.scope);

      authorizeState = crypto.randomBytes(16).toString("hex");
      authorizeUrl.searchParams.append("state", authorizeState);

      response.writeHead(200, responseHeaders);
      if (options.refreshToken) {
        response.write(
          `<p><code>${options.refreshTokenEnvKey}</code> already exists. ` +
            `Re-authorizing will replace the existing token.</p>`
        );
      }
      response.write(
        `<p><a href="${authorizeUrl.toString()}">Click to authorize</a></p>`
      );
      response.end();
    };
  },
};
