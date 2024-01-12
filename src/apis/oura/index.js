module.exports = {
  getApiBaseUrl: () => "https://cloud.ouraring.com/v2/",
  getApiAuthHeaders: () => ({
    Authorization: `Bearer ${`${apiName.toUpperCase()}_AUTH_TOKEN`}`
  }),
}