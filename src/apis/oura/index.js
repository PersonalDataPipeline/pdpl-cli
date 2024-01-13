const { getFormattedDate } = require("../../utils/date");

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
  return [dailyData, {
    total: items.length,
    days: Object.keys(dailyData).length,
  }];
}

module.exports = {
  getApiBaseUrl: () => "https://api.ouraring.com/v2/",
  getApiAuthHeaders: () => ({
    Authorization: `Bearer ${process.env.OURA_AUTH_TOKEN}`
  }),
  endpoints: {
    "usercollection/workout": {
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler
    },
    "usercollection/sleep": {
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler
    },
    "usercollection/daily_stress": {
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler
    },
    "usercollection/daily_readiness": {
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler
    },
    "usercollection/daily_activity": {
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler
    },
    "usercollection/daily_spo2": {
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler
    }
  }
}