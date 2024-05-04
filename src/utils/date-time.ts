import { padLeftZero } from "./string.js";

////
/// Types
//

interface StartDateObject {
  seconds: number;
  date: string;
  dateTime: string;
  fileName: string;
}

////
/// Helpers
//

const runStartStatic = new Date();

////
/// Exports
//

export const QUARTER_HOUR_IN_SEC = 60 * 15;
export const HALF_HOUR_IN_SEC = 60 * 30;
export const ONE_HOUR_IN_SEC = 60 * 60;
export const ONE_DAY_IN_SEC = 24 * ONE_HOUR_IN_SEC;
export const ONE_DAY_IN_MS = ONE_DAY_IN_SEC * 1000;
export const ONE_WEEK_IN_SEC = ONE_DAY_IN_SEC * 7;
export const ONE_MONTH_IN_SEC = ONE_DAY_IN_SEC * 30;
export const QUARTER_YEAR_IN_SEC = ONE_DAY_IN_SEC * 91.25;
export const ONE_YEAR_IN_SEC = ONE_DAY_IN_SEC * 365;

export const adjustDateByDays = (adjustDays: number, date = new Date()) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + adjustDays);
  return newDate;
};

export const runDateUtc = (): StartDateObject => {
  const isoString = runStartStatic.toISOString();
  return {
    seconds: getEpochNow(runStartStatic),
    date: isoString.split("T")[0],
    dateTime: isoString,
    fileName: isoString.replaceAll(":", "-").replace(".", "-"),
  };
};

export const getFormattedDate = (adjustDays: number = 0, date: Date = new Date()) => {
  if (adjustDays) {
    date = adjustDateByDays(adjustDays, date);
  }
  const yyyy = date.getFullYear();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  return `${yyyy}-${padLeftZero(mm)}-${padLeftZero(dd)}`;
};

export const getFormattedTime = (date: Date = new Date()) => {
  const hh = date.getHours();
  const mm = date.getMinutes() + 1;
  const ss = date.getSeconds();
  return `${padLeftZero(hh)}:${padLeftZero(mm)}:${padLeftZero(ss)}`;
};

export const getEpochNow = (nowDate = new Date()) => Math.floor(nowDate.getTime() / 1000);
