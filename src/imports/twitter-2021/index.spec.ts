import { ImportFileHandler, ImportHandler } from "../../utils/types.js";

const { default: importHandler } = (await import(`./index.js`)) as {
  default: ImportHandler;
};

const mockTweet = {
  entities: {
    hashtags: [],
    symbols: [],
    user_mentions: [],
    urls: [],
  },
  display_text_range: ["0", "47"],
  favorite_count: "0",
  id_str: "774082753",
  truncated: false,
  retweet_count: "0",
  id: "774082753",
  created_at: "Wed Mar 19 20:18:45 +0000 2008",
  favorited: false,
  full_text: "Full text of the tweet",
  lang: "en",
};

const tweetFile = [{ tweet: mockTweet }];

describe("Module: Twitter 2021 import handler", () => {
  beforeAll(() => {
    const genDate = new Date(2024, 0, 11, 0, 0, 0, 0);
    vi.useFakeTimers();
    vi.setSystemTime(genDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("Import File: tweet.js", () => {
    let fileHandler: ImportFileHandler;
    beforeEach(() => {
      fileHandler = importHandler.importFiles
        .filter((handler) => handler.getImportPath() === "data/tweet.js")
        .at(0)!;
    });

    it("saves to the correct directory", () => {
      expect(fileHandler.getDirName()).toEqual("tweets");
    });

    it("gets the date from the tweet", () => {
      expect(fileHandler.parseDayFromEntity(mockTweet)).toEqual("2008-03-19");
    });

    it("transforms the tweet", () => {
      expect(fileHandler.transformEntity!(tweetFile[0])).toEqual(mockTweet);
    });

    it("transforms the file content when necessary", () => {
      expect(
        fileHandler.transformFileContents!(
          `window.YTD.tweet.part0 =${JSON.stringify(tweetFile)}`
        )
      ).toEqual(JSON.stringify(tweetFile));
    });
  });
});
