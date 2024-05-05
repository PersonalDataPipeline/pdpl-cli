import path from "path";

import { ImportHandler } from "../../utils/types.js";
import getConfig from "../../utils/config.js";
import { copyFile, pathExists } from "../../utils/fs.js";
import runLogger from "../../utils/logger.js";

////
/// Types
//

interface InstagramMedia {
  taken_at: string;
  path: string;
  type?: string;
  location?: string;
  caption?: string;
}

interface InstagramImportData {
  photos: InstagramMedia[];
  videos: InstagramMedia[];
  direct: InstagramMedia[];
}

////
/// Exports
//

const importFiles = [
  {
    getImportPath: () => "media.json",
    getDirName: () => "media",
    parseDayFromEntity: (entity: object) => {
      return (entity as InstagramMedia).taken_at.split("T")[0];
    },
    parsingStrategy: (): "json" => "json",
    transformParsedData: (data: object): object[] => {
      return [
        ...(data as InstagramImportData).photos.map((entity) => ({
          type: "photo",
          ...entity,
        })),
        ...(data as InstagramImportData).videos.map((entity) => ({
          type: "video",
          ...entity,
        })),
        ...(data as InstagramImportData).direct.map((entity) => ({
          type: "direct",
          ...entity,
        })),
      ];
    },
    handleEntityFiles: (entity: object, importPath: string) => {
      if (!(entity as InstagramMedia).path) {
        return;
      }
      const relativePath = (entity as InstagramMedia).path;
      const source = path.join(importPath, relativePath);

      if (!pathExists(source)) {
        runLogger.info({
          message: `File ${relativePath} was not found in the import`,
        });
        return;
      }

      const destination = path.join(
        getConfig().filesOutputDir,
        "instagram-2018-import",
        relativePath
      );

      copyFile(source, destination);
    },
  },
];

const importHandler: ImportHandler = {
  importFiles,
};

export default importHandler;
