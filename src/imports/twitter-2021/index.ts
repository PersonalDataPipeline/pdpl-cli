import path from "path";
import { ImportHandler } from "../../utils/types.js";
import { getFormattedDate } from "../../utils/date-time.js";

////
/// Types
//

interface TweetEntity {
  id: string;
  created_at: string;
}

////
/// Helpers
//

const BASE_FOLDER = "data";

////
/// Exports
//

const importFiles = [
  {
    getImportPath: () => path.join(BASE_FOLDER, "tweet.js"),
    getDirName: () => "tweets",
    parsingStrategy: (): "json" => "json",
    parseDayFromEntity: (entity: object) => {
      const cratedDate = new Date((entity as TweetEntity).created_at);
      return getFormattedDate(0, cratedDate);
    },
    transformEntity: (entity: object): object => (entity as { tweet: object }).tweet,
    transformFileContents: (content: string) =>
      content.replace("window.YTD.tweet.part0 =", ""),
  },
];

const importHandler: ImportHandler = {
  importFiles,
};

export default importHandler;
