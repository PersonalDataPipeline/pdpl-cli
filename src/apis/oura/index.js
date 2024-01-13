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
        const dailyData = {};
        const workouts = responseData.data.data;
        workouts.forEach((workout) => {
          if (!dailyData[workout.day]) {
            dailyData[workout.day] = [];
          }
          dailyData[workout.day].push(workout);
        });
        return [dailyData, {
          total: workouts.length,
          days: Object.keys(dailyData).length,
        }];
      },
      errorHandler: (error) => {
        console.log(JSON.stringify(error.data || {}));
      }
    }
  }
}