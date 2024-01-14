const { padLeftZero } = require("./string");

const getFormattedDate = (adjustDays = 0) => {
  let date = new Date();
  if (adjustDays) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + adjustDays);
    date = newDate;
  }
  const yyyy = date.getFullYear();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  return `${yyyy}-${padLeftZero(mm)}-${padLeftZero(dd)}`;
};

const fileSafeDateTime = () => (new Date()).toISOString().split(".")[0].replaceAll(":", "-");

module.exports = {
  getFormattedDate,
  fileSafeDateTime
}