import { padLeftZero } from "./string.js";

////
/// Types
//

interface StartDateObject {
  time: number;
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

export const adjustDateByDays = (adjustDays: number, date = new Date()) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + adjustDays);
  return newDate;
};

export const runDateUtc = (): StartDateObject => {
  const isoString = runStartStatic.toISOString();
  return {
    time: runStartStatic.getTime(),
    date: isoString.split("T")[0],
    dateTime: isoString,
    fileName: isoString.replace(":", "-").replace(".", "-"),
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
