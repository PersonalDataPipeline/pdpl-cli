require("dotenv").config();
const http = require("http");
const crypto = require("crypto");
const axios = require("axios");

const { authorizeUrl, tokenUrl } = require("./index.js");

const {
  STRAVA_AUTHORIZE_CLIENT_ID,
  STRAVA_AUTHORIZE_CLIENT_SECRET,
  STRAVA_LOCAL_SERVER_PORT,
} = process.env;

const localServerPort = STRAVA_LOCAL_SERVER_PORT
  ? parseInt(STRAVA_LOCAL_SERVER_PORT, 10)
  : 8888;

const responseHeaders = {
  "Content-Type": "text/html",
  "Cache-Control": "no-cache",
};

let authorizeState = "";

http
  .createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
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
      if (stateParam !== authorizeState) {
        console.log("Param:" + stateParam);
        console.log("Stored:" + authorizeState);
        response.writeHead(400, responseHeaders);
        response.write("State parameter mis-match.");
        response.write('<br><a href="/">Try again</a>');
        return response.end();
      }

      authorizeState = "";
      let tokenResponse;

      try {
        tokenResponse = await axios.post(tokenUrl, {
          client_id: STRAVA_AUTHORIZE_CLIENT_ID,
          client_secret: STRAVA_AUTHORIZE_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: codeParam,
        });
      } catch (tokenError) {
        response.writeHead(400, responseHeaders);
        response.write(`Error exchanging code for token: ${error.message}\n`);
        response.write(JSON.stringify(error.data));
        response.write('<br><a href="/">Try again</a>');
        return response.end();
      }

      response.writeHead(200, responseHeaders);
      response.write(
        `Refresh token for <strong>${tokenResponse.data.athlete.username}</strong>:`
      );
      response.write(`<br><br><code>${tokenResponse.data.refresh_token}</code>`);
      return response.end();
    }

    const authorizeUrlInstance = new URL(authorizeUrlInstance);
    authorizeUrlInstance.searchParams.append(
      "client_id",
      STRAVA_AUTHORIZE_CLIENT_ID
    );
    authorizeUrlInstance.searchParams.append(
      "redirect_uri",
      `http://localhost:${localServerPort}`
    );
    authorizeUrlInstance.searchParams.append("approval_prompt", "auto");
    authorizeUrlInstance.searchParams.append("response_type", "code");
    authorizeUrlInstance.searchParams.append(
      "scope",
      "read_all,profile:read_all,activity:read_all"
    );

    authorizeState = crypto.randomBytes(16).toString("hex");
    authorizeUrlInstance.searchParams.append("state", authorizeState);

    response.writeHead(200, responseHeaders);
    response.write(
      `<a href="${authorizeUrlInstance.toString()}">Click to authorize</a>`
    );
    response.end();
  })
  .listen(localServerPort);
