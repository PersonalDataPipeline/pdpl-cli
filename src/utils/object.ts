export const isNotEmptyObject = (inspect: object) => {
  return typeof inspect === "object" && Object.keys(inspect).length === 0;
};
