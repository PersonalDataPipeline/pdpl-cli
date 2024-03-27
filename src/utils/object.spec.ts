import { isNotEmptyObject } from "./object.js";

describe("Object utilities", () => {
  beforeEach(() => {});
  describe("Function: isNotEmptyObject", () => {
    it("checks if it exists", () => {
      expect(isNotEmptyObject(null)).toEqual(false);
      expect(isNotEmptyObject(undefined)).toEqual(false);
      expect(isNotEmptyObject(false)).toEqual(false);
    });

    it("checks the type", () => {
      expect(isNotEmptyObject([])).toEqual(false);
      expect(isNotEmptyObject("hi")).toEqual(false);
      expect(isNotEmptyObject(1)).toEqual(false);
      expect(isNotEmptyObject(true)).toEqual(false);
    });

    it("checks an empty object", () => {
      expect(isNotEmptyObject({})).toEqual(false);
    });

    it("checks a non-empty object", () => {
      expect(isNotEmptyObject({ a: false })).toEqual(true);
    });
  });
});
