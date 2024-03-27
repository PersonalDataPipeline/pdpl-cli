export const isNotEmptyObject = (inspect: unknown) => {
  if (!inspect || typeof inspect !== "object") {
    return false;
  }
  return Object.keys(inspect).length > 0;
};
