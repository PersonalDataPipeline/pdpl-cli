export const padLeftZero = (string: number) => {
  return `${string}`.length === 1 ? `0${string}` : `${string}`;
};

export const makeBasicAuth = (clientId: string, clientSecret: string) => {
  const authString = `${encodeURI(clientId)}:${encodeURI(clientSecret)}`;
  return Buffer.from(authString).toString("base64");
};
