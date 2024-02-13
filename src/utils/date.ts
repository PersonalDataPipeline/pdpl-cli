import { padLeftZero } from "./string.js";

export const getFormattedDate = (adjustDays = 0, date = new Date()) => {
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

export const getFormattedTime = (date = new Date()) => {
  const hh = date.getHours();
  const mm = date.getMinutes();
  const ss = date.getSeconds();
  const tz = date.getTimezoneOffset() / -60;
  return `${padLeftZero(hh)}:${padLeftZero(mm)}:${padLeftZero(ss)}GMT${tz}`;
};

export const fileNameDateTime = () => {
  const date = new Date();
  return `${getFormattedDate(0, date)}T${getFormattedTime(date).replaceAll(":", "-")}`;
};
