import { ImportHandler } from "../../utils/types.js";

////
/// Exports
//

const importFiles = [
  {
    getDirName: () => "contacts",
    parsingStrategy: (): "vcf" => "vcf",
  },
];

const importHandler: ImportHandler = {
  importFiles,
};

export default importHandler;
