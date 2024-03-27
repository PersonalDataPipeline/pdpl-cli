import * as http from "http";
import { config } from "dotenv";
config();

import { authorizeEndpoint, tokenEndpoint } from "./index.js";
import { serverPort } from "../../utils/authorize-app.js";
import axios, { AxiosResponse } from "axios";
import { envWrite } from "../../utils/fs.js";

const { POCKET_CONSUMER_KEY = "", POCKET_ACCESS_TOKEN = "" } = process.env;

if (!POCKET_CONSUMER_KEY) {
  console.log("❌ No Pocket consumer key stored. See README for more information.");
  process.exit(1);
}

const responseHeaders = {
  "Content-Type": "text/html",
  "Cache-Control": "no-cache",
};

const requestConfig = {
  headers: {
    "Content-Type": "application/json; charset=UTF-8",
    "X-Accept": "application/json",
  },
};

let requestToken = "";

/* eslint-disable  @typescript-eslint/no-misused-promises */
http
  .createServer(async (request: http.IncomingMessage, response: http.ServerResponse) => {
    const baseUrl = `http://localhost:${serverPort}`;
    const requestUrl = new URL(baseUrl + request.url);

    // Step 2: Obtain request token and redirect
    if (requestUrl.pathname === "/request-token") {
      try {
        const requestResponse = await axios.post(
          "https://getpocket.com/v3/oauth/request",
          {
            consumer_key: POCKET_CONSUMER_KEY,
            redirect_uri: baseUrl,
          },
          requestConfig
        );

        requestToken = (requestResponse as { data: { code: string } }).data.code;

        const authorizeUrl = new URL(authorizeEndpoint);
        authorizeUrl.searchParams.append("request_token", requestToken);
        authorizeUrl.searchParams.append("redirect_uri", baseUrl + "/authorized");

        response.writeHead(200, responseHeaders);
        response.write(
          `<p><a href="${authorizeUrl.toString()}">Click to authorize</a></p>`
        );
        return response.end();
      } catch (tokenError: any) {
        response.writeHead(
          (tokenError.response as AxiosResponse).status,
          responseHeaders
        );
        response.write(
          `<p>Error obtaining request token: ${tokenError.message}</p>` +
            `<pre>${JSON.stringify((tokenError.response as AxiosResponse).data)}</pre>` +
            `<p><a href="/">Try again</a></p>`
        );
        return response.end();
      }
    }

    if (requestUrl.pathname === "/authorized") {
      if (!requestToken) {
        response.writeHead(400);
        response.write(`<p>No request token found</p>`);
        response.write(`<p><a href="/request-token">Obtain request token</a></p>`);
        return response.end();
      }

      try {
        const tokenResponse = await axios.post(
          tokenEndpoint,
          {
            consumer_key: POCKET_CONSUMER_KEY,
            code: requestToken,
          },
          requestConfig
        );
        response.writeHead(200, responseHeaders);
        envWrite(
          "POCKET_ACCESS_TOKEN",
          tokenResponse.data.access_token,
          POCKET_ACCESS_TOKEN
        );
        response.write(`POCKET_ACCESS_TOKEN written to .env.`);
        return response.end();
      } catch (tokenError: any) {
        response.writeHead(
          (tokenError.response as AxiosResponse).status,
          responseHeaders
        );
        response.write(
          `<p>Error obtaining access token: ${tokenError.message}</p>` +
            `<pre>${JSON.stringify((tokenError.response as AxiosResponse).data)}</pre>` +
            `<p><a href="/">Try again</a></p>`
        );
        return response.end();
      }
    }

    response.writeHead(200, responseHeaders);

    if (POCKET_ACCESS_TOKEN) {
      response.write(
        `<p><code>POCKET_ACCESS_TOKEN</code> already exists. ` +
          `Re-authorizing will replace the existing token.</p>`
      );
    }

    response.write(`<p><a href="/request-token">Obtain request token</a></p>`);
    return response.end();
  })
  .listen(serverPort);
