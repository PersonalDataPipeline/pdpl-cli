import { getFormattedDate } from "./date-time.js";
import { padLeftZero } from "./string.js";

////
/// Types
//

export interface PipelineTransforms {
  trim: (string: string) => string;
  toStandardDate: (string: string) => string;
  toStandardTime: (string: string) => string;
  toUpperCase: (string: string) => string;
  camelCaseToSpaces: (string: string) => string;
  secondsToTimeString: (seconds: number) => string;
  metersToMiles: (meters: number) => number;
  metersToFeet: (meters: number) => number;
  metersPerSecondToMph: (meters: number) => number;
}

////
/// Exports
//

const trim = (string: string) => (string ? string.trim() : "");

const toUpperCase = (string: string) => string.toUpperCase();

const toStandardDate = (dateString: string) => {
  const date = new Date(dateString);
  if (!dateString || date.toString() === "Invalid Date") {
    return "";
  }
  return getFormattedDate(0, date);
};

const toStandardTime = (dateString: string) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);
  let hh = date.getHours();
  let ampm = "AM";
  if (hh === 0) {
    hh = 12;
  } else if (hh > 12) {
    hh = hh - 12;
    ampm = "PM";
  }
  const mm = date.getMinutes() + 1;
  return `${hh}:${padLeftZero(mm)} ${ampm}`;
};

const camelCaseToSpaces = (camelCase: string) => {
  return camelCase.replace(/([A-Z])/g, " $1").trim();
};

const secondsToTimeString = (seconds: number | bigint) => {
  const hoursDecimal = Number(seconds) / 60 / 60;
  const hoursWhole = Math.floor(hoursDecimal);
  const hoursRemainder = hoursDecimal - hoursWhole;

  const minutesDecimal = hoursRemainder * 60;
  const minutesWhole = Math.trunc(minutesDecimal);
  const minutesFraction = minutesDecimal - minutesWhole;
  return `${padLeftZero(hoursWhole)}:${padLeftZero(minutesWhole)}:${padLeftZero(Math.round(minutesFraction * 60))}`;
};

const metersToMiles = (meters: number) => {
  return Math.round((meters / 1609.34) * 100) / 100;
};

const metersToFeet = (meters: number) => {
  return Math.round(meters * 3.281 * 100) / 100;
};

const metersPerSecondToMph = (mps: number) => {
  return Math.round(mps * 2.237 * 100) / 100;
};

const defaultExport: PipelineTransforms = {
  trim,
  toStandardDate,
  toStandardTime,
  toUpperCase,
  camelCaseToSpaces,
  secondsToTimeString,
  metersToMiles,
  metersToFeet,
  metersPerSecondToMph,
};

export default defaultExport;
