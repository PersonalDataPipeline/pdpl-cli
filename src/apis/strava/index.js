module.exports = {
  getApiBaseUrl: () => "https://www.strava.com/api/v3/",
  getApiAuthHeaders: () => ({
    Authorization: `Bearer ${`${apiName.toUpperCase()}_AUTH_TOKEN`}`
  }),
}