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

export const importTypes = {
  "Retail.OrderHistory": {
    getDirName: () => "retail--order-history",
    transformEntity: (entity: AmazonProductEntity) => {
      if ("Cancelled" === entity["Order Status"]) {
        return null;
      }

      for (const label in entity) {
        if (
          entity[label] === "Not Available" ||
          entity[label] === "Not Applicable"
        ) {
          delete entity[label];
        }
      }

      entity.day = entity["Order Date"].split("T")[0] || "";
      return entity;
    },
  },
};
