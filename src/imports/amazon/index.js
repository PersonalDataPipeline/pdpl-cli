const path = require("path");

const apiName = "amazon";

const apiDirName = (importType) => path.join(apiName, importType);

module.exports = {
  importTypes: {
    "Retail.OrderHistory": {
      getDirName: () => apiDirName("retail--order-history"),
      transformEntity: (entity) => {
        if ("Cancelled" === entity["Order Status"]) {
          return null;
        }
    
        for (const label in entity) {
          if (["Not Available", "Not Applicable"].includes(entity[label])) {
            delete entity[label];
          }
        }
    
        entity.day = entity["Order Date"].split("T")[0];
        return entity;
      }
    },
  },
};
