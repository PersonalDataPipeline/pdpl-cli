import { isObjectWithKeys } from "./object.js";

describe("Object utilities", () => {
  beforeEach(() => {});
  describe("Function: isNotEmptyObject", () => {
    it("checks if it exists", () => {
      expect(isObjectWithKeys(null)).toEqual(false);
      expect(isObjectWithKeys(undefined)).toEqual(false);
      expect(isObjectWithKeys(false)).toEqual(false);
    });

    it("checks the type", () => {
      expect(isObjectWithKeys([])).toEqual(false);
      expect(isObjectWithKeys("hi")).toEqual(false);
      expect(isObjectWithKeys(1)).toEqual(false);
      expect(isObjectWithKeys(true)).toEqual(false);
    });

    it("checks an empty object", () => {
      expect(isObjectWithKeys({})).toEqual(false);
    });

    it("checks a non-empty object", () => {
      expect(isObjectWithKeys({ a: false })).toEqual(true);
    });
  });
});
