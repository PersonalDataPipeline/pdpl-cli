const { existsSync, readFileSync, readdirSync } = require("fs");
const { parse } = require("csv-parse/sync");
const getConfig = require("./src/utils/config");

const importsSupported = readdirSync("src/imports");

const importName = process.argv[2];
const importType = process.argv[3];
const importFile = process.argv[4];

if (!importName) {
  console.log(`❌ No import name included`);
  process.exit();
}

if (!importsSupported.includes(importName)) {
  console.log(`❌ Unsupported iport "${importName}"`);
  process.exit();
}

const importHandler = require(`./src/imports/${importName}/index.js`);
const allImportTypes = Object.keys(importHandler.importTypes);

if (!importType && !allImportTypes.includes(importType)) {
  console.log(
    `❌ Unsupported import type "${importType}" for import "${importName}"`
  );
  process.exit();
}

if (!importFile || !existsSync(importFile)) {
  console.log(`❌ Import file "${importFile}" not found`);
  process.exit();
}

const fileContents = readFileSync(importFile, "utf8");

(async () => {
  const orders = await parse(fileContents, { columns: true, bom: true });
  const dailyData = {};

  for (const order of orders) {
    if ("Cancelled" === order["Order Status"]) {
      continue;
    }

    for (const label in order) {
      if (["Not Available", "Not Applicable"].includes(order[label])) {
        delete order[label];
      }
    }

    const day = order["Order Date"].split("T")[0];
    if (!dailyData[day]) {
      dailyData[day] = [];
    }

    dailyData[day].push(order);
  }

  console.log(dailyData);
})();
