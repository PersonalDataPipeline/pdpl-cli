import * as http from "http";
import crypto from "crypto";
import axios, { AxiosResponse } from "axios";
import { config } from "dotenv";
config();

import { envWrite } from "./fs.js";
import { isObjectWithKeys } from "./object.js";

////
/// Helpers
//

export interface AuthorizeServerConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  refreshTokenEnvKey: string;
  scope: string;
  authorizeEndpoint: string;
  tokenEndpoint: string;
  checkState?: boolean;
  basicAuth?: boolean;
  authorizeParams?: {
    [key: string]: string;
  };
}

////
/// Helpers
//

const { AUTHORIZE_APP_SERVER_PORT, AUTHORIZE_APP_SERVER_HTTPS_PORT } = process.env;

////
/// Exports
//

export const serverPort = AUTHORIZE_APP_SERVER_PORT
  ? parseInt(AUTHORIZE_APP_SERVER_PORT, 10)
  : 8888;

export const serverCallback = (options: AuthorizeServerConfig) => {
  const baseUrl = AUTHORIZE_APP_SERVER_HTTPS_PORT
    ? `https://localhost:${AUTHORIZE_APP_SERVER_HTTPS_PORT}`
    : `http://localhost:${serverPort}`;

  const responseHeaders = {
    "Content-Type": "text/html",
    "Cache-Control": "no-cache",
  };

  let authorizeState = "";

  return async (request: http.IncomingMessage, response: http.ServerResponse) => {
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

      try {
        const tokenData: { [key: string]: string } = {
          grant_type: "authorization_code",
          redirect_uri: baseUrl,
          code: codeParam,
        };

        const tokenHeaders: { [key: string]: string } = {};

        if (options.basicAuth) {
          const authString = `${options.clientId}:${options.clientSecret}`;
          tokenHeaders["Authorization"] =
            `Basic ${Buffer.from(authString).toString("base64")}`;
        } else {
          tokenData["client_id"] = options.clientId;
          tokenData["client_secret"] = options.clientSecret;
        }

        const tokenResponse = await axios.post(
          options.tokenEndpoint,
          tokenData,
          tokenHeaders
        );

        envWrite(
          options.refreshTokenEnvKey,
          tokenResponse.data.refresh_token,
          options.refreshToken
        );
        response.writeHead(200, responseHeaders);
        response.write(`${options.refreshTokenEnvKey} written to .env.`);
        return response.end();
      } catch (tokenError: any) {
        response.writeHead(
          (tokenError.response as AxiosResponse).status,
          responseHeaders
        );
        response.write(
          `<p>Error exchanging code for token: ${tokenError.message}</p>` +
            `<pre>${JSON.stringify((tokenError.response as AxiosResponse).data)}</pre>` +
            `<p><a href="/">Try again</a></p>`
        );
        return response.end();
      }
    }

    const authorizeUrl = new URL(options.authorizeEndpoint);
    authorizeUrl.searchParams.append("client_id", options.clientId);
    authorizeUrl.searchParams.append("redirect_uri", baseUrl);
    authorizeUrl.searchParams.append("approval_prompt", "auto");
    authorizeUrl.searchParams.append("response_type", "code");
    authorizeUrl.searchParams.append("scope", options.scope);

    if (isObjectWithKeys(options.authorizeParams)) {
      for (const param in options.authorizeParams) {
        authorizeUrl.searchParams.append(param, options.authorizeParams[param]);
      }
    }

    authorizeState = crypto.randomBytes(16).toString("hex");
    authorizeUrl.searchParams.append("state", authorizeState);

    response.writeHead(200, responseHeaders);
    if (options.refreshToken) {
      response.write(
        `<p><code>${options.refreshTokenEnvKey}</code> already exists. ` +
          `Re-authorizing will replace the existing token.</p>`
      );
    }
    response.write(`<p><a href="${authorizeUrl.toString()}">Click to authorize</a></p>`);
    return response.end();
  };
};
