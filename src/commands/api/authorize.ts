import * as http from "http";
import crypto from "crypto";

import { ApiHandler } from "../../utils/types.js";
import { ApiBaseCommand, apiNameArg } from "./_base.js";
import { isObjectWithKeys } from "../../utils/object.js";
import { envWrite } from "../../utils/fs.js";
import axios, { AxiosResponse } from "axios";
import { Flags } from "@oclif/core";

////
/// Helpers
//

const { AUTHORIZE_APP_SERVER_PORT, AUTHORIZE_APP_SERVER_HTTPS_PORT } = process.env;

////
/// Types
//

export interface AuthorizeServerConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  refreshTokenEnvKey: string;
  scope: string;
  authorizeEndpoint: string;
  tokenEndpoint: string;
  formDataForToken?: boolean;
  checkState?: boolean;
  basicAuth?: boolean;
  authorizeParams?: {
    [key: string]: string;
  };
}

////
/// Exports
//

export const serverPort = AUTHORIZE_APP_SERVER_PORT
  ? parseInt(AUTHORIZE_APP_SERVER_PORT, 10)
  : 8888;

export const baseUrl = AUTHORIZE_APP_SERVER_HTTPS_PORT
  ? `https://localhost:${AUTHORIZE_APP_SERVER_HTTPS_PORT}`
  : `http://localhost:${serverPort}`;

export default class ApiAuthorize extends ApiBaseCommand<typeof ApiAuthorize> {
  static override summary = "Authorize for an API";
  static override examples = ["<%= config.bin %> <%= command.id %> API_NAME"];

  static override args = {
    ...apiNameArg,
  };

  static override flags = {
    "stop-at": Flags.string({
      summary: "Stop at a certain stage of the authorization process",
      description: `Accepts "authorize" or "callback" or "exchange"`,
    }),
  };

  public override async run(): Promise<void> {
    const { apiName } = this.args;
    const { "stop-at": stopAt = "" } = this.flags;

    const { default: apiHandler } = (await import(`../../apis/${apiName}/index.js`)) as {
      default: ApiHandler;
    };

    if (!apiHandler.getAuthorizeConfig) {
      throw new Error(`API "${apiName}" does not need to be authorized.`);
    }

    const options = apiHandler.getAuthorizeConfig();

    let authorizeState = crypto.randomBytes(16).toString("hex");

    const authorizeUrl = new URL(options.authorizeEndpoint);
    authorizeUrl.searchParams.append("client_id", options.clientId);
    authorizeUrl.searchParams.append("redirect_uri", baseUrl);
    authorizeUrl.searchParams.append("approval_prompt", "auto");
    authorizeUrl.searchParams.append("response_type", "code");
    authorizeUrl.searchParams.append("scope", options.scope);
    authorizeUrl.searchParams.append("state", authorizeState);

    if (isObjectWithKeys(options.authorizeParams)) {
      for (const param in options.authorizeParams) {
        authorizeUrl.searchParams.append(param, options.authorizeParams[param]);
      }
    }

    if (options.refreshToken) {
      console.log(
        `${options.refreshTokenEnvKey} already exists. ` +
          `Re-authorizing will replace the existing token.`
      );
    }

    console.log("Follow this URL to authorize:");
    console.log(authorizeUrl.toString());

    if (stopAt === "authorize") {
      process.exit(0);
    }

    /* eslint-disable @typescript-eslint/no-misused-promises */
    http
      .createServer(async (request: http.IncomingMessage) => {
        const requestUrl = new URL(baseUrl + request.url);
        const errorParam = requestUrl.searchParams.get("error");

        if (errorParam) {
          console.log(`Error returned from authorization server: ${errorParam}`);
          const errorDesc = requestUrl.searchParams.get("error_description");
          if (errorDesc) {
            console.log(`Description: ${errorDesc}`);
          }
          process.exit(1);
        }

        const codeParam = requestUrl.searchParams.get("code");
        const stateParam = requestUrl.searchParams.get("state");

        if (codeParam) {
          console.log("Auth code returned from authorization server:");
          if (options.checkState === true && stateParam !== authorizeState) {
            authorizeState = "";
            console.log("State parameter mis-match.");
            process.exit(1);
          }

          authorizeState = "";

          try {
            let tokenData: { [key: string]: string } | string = {
              grant_type: "authorization_code",
              redirect_uri: baseUrl,
              code: codeParam,
            };

            if (stopAt === "callback") {
              console.log({
                ...tokenData,
                state: stateParam,
              });
              process.exit(0);
            }

            const tokenHeaders: { [key: string]: string } = {};

            if (options.basicAuth) {
              const authString = `${encodeURI(options.clientId)}:${encodeURI(options.clientSecret)}`;
              tokenHeaders["Authorization"] =
                `Basic ${Buffer.from(authString).toString("base64")}`;
            } else {
              tokenData["client_id"] = options.clientId;
              tokenData["client_secret"] = options.clientSecret;
            }

            if (options.formDataForToken) {
              const formTokenData: string[] = [];
              for (const datum in tokenData) {
                formTokenData.push(`${datum}=${tokenData[datum]}`);
              }
              tokenData = formTokenData.join("&");
              tokenHeaders["Content-Type"] = "application/x-www-form-urlencoded";
            }

            const tokenResponse = await axios.post(options.tokenEndpoint, tokenData, {
              headers: tokenHeaders,
            });

            envWrite(
              options.refreshTokenEnvKey,
              tokenResponse.data.refresh_token,
              options.refreshToken
            );

            console.log(`${options.refreshTokenEnvKey} written to .env.`);
            process.exit(0);
          } catch (tokenError: any) {
            console.log(`Error exchanging code for token: ${tokenError.message}`);
            console.log(
              `${JSON.stringify((tokenError.response as AxiosResponse).data, null, 2)}`
            );
            process.exit(1);
          }
        }
      })
      .listen(serverPort);
  }
}
