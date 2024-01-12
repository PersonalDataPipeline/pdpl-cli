const { getFormattedDate } = require("../../utils/date");

module.exports = {
  getApiBaseUrl: () => "https://api.ouraring.com/v2/",
  getApiAuthHeaders: () => ({
    Authorization: `Bearer ${process.env.OURA_AUTH_TOKEN}`
  }),
  endpoints: {
    "usercollection/workout": {
      method: "get",
      getParams: () => ({
        start_date: getFormattedDate(-30),
        end_date: getFormattedDate(),
      }),
      successHandler: (responseData) => {
        const { data } = responseData;
        console.log(JSON.stringify(data, null, 2));
      },
      errorHandler: (error) => {
        console.log("❌ Error in handler:");
        console.log(error.message);
        console.log(JSON.stringify(error.data || {}));
      }
    }
  }
}