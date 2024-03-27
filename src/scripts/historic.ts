import path from "path";

import { config as dotenvConfig } from "dotenv";

import { readDirectory, __dirname } from "../utils/fs.js";
import Queue from "../utils/queue.class.js";
import { ApiHandler, ApiHistoricEndpoint } from "../utils/types.js";
import { getEpochNow } from "../utils/date-time.js";

dotenvConfig({ path: path.join(__dirname, "..", "..", ".env") });

const apiName = process.argv[2];
if (!apiName) {
  console.log(`❌ No API name included`);
  process.exit();
}

const apisSupported = readDirectory("./src/apis");
if (!apisSupported.includes(apiName)) {
  console.log(`❌ Unsupported API "${apiName}"`);
  process.exit();
}

const apiHandler = (await import(`../apis/${apiName}/index.js`)) as ApiHandler;
const queueInstance = new Queue(apiHandler);
for (const endpointHandler of apiHandler.endpointsPrimary) {
  const endpointName = endpointHandler.getEndpoint();
  const hasHistoric = queueInstance.hasHistoricEntryFor(endpointName);
  if (hasHistoric) {
    console.log(`🤖 Found historic entry for ${endpointName}`);
  } else if (endpointHandler.isHistoric()) {
    console.log(`🤖 Adding initial historic entry for ${endpointName}`);
    queueInstance.addEntry({
      endpoint: endpointName,
      runAfter: getEpochNow(),
      historic: true,
      params: (endpointHandler as ApiHistoricEndpoint).getHistoricParams(),
    });
  } else {
    console.log(`🤖 No historic entry needed for ${endpointName}`);
  }
}
