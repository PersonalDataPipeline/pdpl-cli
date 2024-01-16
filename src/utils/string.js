const padLeftZero = (string) => {
  return `${string}`.length === 1 ? `0${string}` : `${string}`;
};

module.exports = {
  padLeftZero,
};
