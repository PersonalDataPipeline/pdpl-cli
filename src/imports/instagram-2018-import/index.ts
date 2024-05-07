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

interface InstagramMediaImportData {
  photos: InstagramMedia[];
  videos: InstagramMedia[];
  direct: InstagramMedia[];
}

interface InstagramCommentImportData {
  media_comments: string[][];
  live_comments?: string[][];
}

interface InstagramCommentTransformed {
  created: string;
  comment: string;
  user: string;
}

////
/// Exports
//

const importFiles = [
  {
    getImportPath: () => "media.json",
    getDirName: () => "media",
    parseDayFromEntity: (entity: object | []) => {
      return (entity as InstagramMedia).taken_at.split("T")[0];
    },
    parsingStrategy: (): "json" => "json",
    transformParsedData: (data: object): object[] => {
      return [
        ...(data as InstagramMediaImportData).photos.map((entity) => ({
          type: "photo",
          ...entity,
        })),
        ...(data as InstagramMediaImportData).videos.map((entity) => ({
          type: "video",
          ...entity,
        })),
        ...(data as InstagramMediaImportData).direct.map((entity) => ({
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
  {
    getImportPath: () => "comments.json",
    getDirName: () => "comments",
    parseDayFromEntity: (entity: object | []) => {
      return (entity as InstagramCommentTransformed).created.split("T")[0];
    },
    parsingStrategy: (): "json" => "json",
    transformParsedData: (data: object): string[][] => {
      let transformed = [...(data as InstagramCommentImportData).media_comments];

      if ("live_comments" in data && data.live_comments) {
        transformed = [...transformed, ...(data.live_comments as string[][])];
      }
      return transformed;
    },
    transformEntity: (entity: object | []): InstagramCommentTransformed => ({
      created: (entity as string[])[0],
      comment: (entity as string[])[1],
      user: (entity as string[])[2],
    }),
  },
];

const importHandler: ImportHandler = {
  importFiles,
};

export default importHandler;
