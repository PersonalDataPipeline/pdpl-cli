import { ImportHandler } from "../../utils/types.js";

////
/// Types
//

interface AmazonProductEntity {
  "day": string;
  "Order Status": string;
  "Order Date": string;
  [key: string]: string;
}

////
/// Exports
//

const importFiles = [
  {
    getImportPath: () => "Retail.OrderHistory.1/Retail.OrderHistory.1.csv",
    getDirName: () => "retail--order-history",
    parseDayFromEntity: (entity: object) => {
      return (entity as AmazonProductEntity)["Order Date"].split("T")[0];
    },
    transformEntity: (entity: object) => {
      const { "Order Status": orderStatus } = entity as AmazonProductEntity;

      if ("Cancelled" === orderStatus) {
        return null;
      }

      return entity;
    },
  },
];

const importHandler: ImportHandler = {
  importFiles,
};

export default importHandler;
