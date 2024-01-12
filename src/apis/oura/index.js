module.exports = {
  getApiBaseUrl: () => "https://cloud.ouraring.com/v2/",
  getApiAuthHeaders: () => ({
    Authorization: `Bearer ${process.env.OURA_AUTH_TOKEN}`
  }),
}