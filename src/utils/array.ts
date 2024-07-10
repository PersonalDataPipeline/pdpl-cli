export const arrayMissingValue = (haystack: string[], needles: string[]): string => {
  const haystackSet = new Set(haystack);
  for (const needle of needles) {
    if (!haystackSet.has(needle)) {
      return needle;
    }
  }
  return "";
};
