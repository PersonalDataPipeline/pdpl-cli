export const padLeftZero = (string: number) => {
  return `${string}`.length === 1 ? `0${string}` : `${string}`;
};
