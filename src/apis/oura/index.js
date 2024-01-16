const path = require("path");
const { getFormattedDate } = require("../../utils/date");

const apiName = "oura";

const defaultParams = {
  start_date: getFormattedDate(-30),
  end_date: getFormattedDate(),
};

const defaultSuccessHandler = (responseData) => {
  const dailyData = {};
  const items = responseData.data.data;
  items.forEach((item) => {
    if (!dailyData[item.day]) {
      dailyData[item.day] = [];
    }
    dailyData[item.day].push(item);
  });
  return [
    dailyData,
    {
      total: items.length,
      days: Object.keys(dailyData).length,
    },
  ];
};

const apiDirName = (endpoint) => path.join(apiName, endpoint);

module.exports = {
  getApiBaseUrl: () => "https://api.ouraring.com/v2/",
  getApiAuthHeaders: () => ({
    Authorization: `Bearer ${process.env.OURA_AUTH_TOKEN}`,
  }),
  endpoints: {
    "usercollection/workout": {
      getDirName: () => apiDirName("user--workouts"),
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler,
    },
    "usercollection/sleep": {
      getDirName: () => apiDirName("user--sleep"),
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler,
    },
    "usercollection/daily_stress": {
      getDirName: () => apiDirName("user--daily-stress"),
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler,
    },
    "usercollection/daily_readiness": {
      getDirName: () => apiDirName("user--daily-readiness"),
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler,
    },
    "usercollection/daily_activity": {
      getDirName: () => apiDirName("user--daily-activity"),
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler,
    },
    "usercollection/daily_spo2": {
      getDirName: () => apiDirName("user--daily-spo2"),
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler,
    },
    "usercollection/sleep_time": {
      getDirName: () => apiDirName("user--sleep-time"),
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler,
    },
    "usercollection/heartrate": {
      getDirName: () => apiDirName("user--heartrate"),
      getParams: () => ({
        // Date/time returned from the API is always UTC,
        // even is a different timezone is indicated.
        start_datetime: getFormattedDate(-5) + "T00:00:00-08:00",
        end_datetime: getFormattedDate(-1) + "T23:59:59-08:00",
      }),
      successHandler: (responseData) => {
        const dailyData = {};
        const items = responseData.data.data;

        items.forEach((item) => {
          item.day = getFormattedDate(0, new Date(item.timestamp));
          if (!dailyData[item.day]) {
            dailyData[item.day] = [];
          }
          dailyData[item.day].push(item);
        });

        return [
          dailyData,
          {
            total: items.length,
            days: Object.keys(dailyData).length,
          },
        ];
      },
    },
  },
};
