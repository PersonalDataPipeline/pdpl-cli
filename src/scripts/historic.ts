import { config } from "dotenv";
config();

import { readDirectory } from "../utils/fs.js";
import Queue from "../utils/queue.class.js";
import { ApiHandler } from "../utils/types.js";

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

const queueInstance = new Queue(apiName);
const apiHandler = (await import(`../apis/${apiName}/index.js`)) as ApiHandler;
for (const endpointHandler of apiHandler.endpointsPrimary) {
  const endpointName = endpointHandler.getEndpoint();
  const hasHistoric = queueInstance.hasHistoricEntryFor(endpointName);
  if (hasHistoric) {
    console.log(`🤖 Found historic entry for ${endpointName}`);
  } else if (typeof endpointHandler.getHistoricParams === "function") {
    console.log(`🤖 Adding initial historic entry for ${endpointName}`);
    queueInstance.addEntry({
      endpoint: endpointName,
      runAfter: Math.floor(Date.now() / 1000),
      historic: true,
      params: endpointHandler.getHistoricParams(),
    });
  } else {
    console.log(`🤖 No historic entry needed for ${endpointName}`);
  }
}
