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

export const runDateUtc = (): StartDateObject => {
  const isoString = runStartStatic.toISOString();
  return {
    time: runStartStatic.getTime(),
    date: isoString.split("T")[0],
    dateTime: isoString,
    fileName: isoString.replace(":", "-").replace(".", "-"),
  };
};

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
