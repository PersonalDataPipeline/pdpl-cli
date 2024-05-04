import path from "path";
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

interface AmazonDigitalEntity {
  OrderDate: string;
}

interface AmazonBorrowedEntity {
  LoanCreationDate: string;
}

////
/// Exports
//

const importFiles = [
  {
    getImportPath: () => path.join("Retail.OrderHistory.1", "Retail.OrderHistory.1.csv"),
    getDirName: () => "retail--order-history",
    parseDayFromEntity: (entity: object) => {
      return (entity as AmazonProductEntity)["Order Date"].split("T")[0];
    },
    parsingStrategy: (): "csv" => "csv",
  },
  {
    getImportPath: () => path.join("Digital-Ordering.1", "Digital Items.csv"),
    getDirName: () => "digital--ordering-items",
    parseDayFromEntity: (entity: object) => {
      return (entity as AmazonDigitalEntity).OrderDate;
    },
    parsingStrategy: (): "csv" => "csv",
  },
  {
    getImportPath: () => path.join("Digital.Borrows.1", "Digital.Borrows.1.csv"),
    getDirName: () => "digital--borrows",
    parseDayFromEntity: (entity: object) => {
      return (entity as AmazonBorrowedEntity).LoanCreationDate;
    },
    parsingStrategy: (): "csv" => "csv",
  },
];

const importHandler: ImportHandler = {
  importFiles,
};

export default importHandler;
