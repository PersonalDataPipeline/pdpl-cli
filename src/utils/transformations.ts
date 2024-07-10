////
/// Types
//

import { padLeftZero } from "./string.js";

export interface PipelineTransforms {
  trim: (string: string) => string;
  toStandardDate: (string: string) => string;
  toStandardTime: (string: string) => string;
  toUpperCase: (string: string) => string;
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
  const yyyy = date.getFullYear();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  return `${yyyy}-${padLeftZero(mm)}-${padLeftZero(dd)}`;
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

const defaultExport: PipelineTransforms = {
  trim,
  toStandardDate,
  toStandardTime,
  toUpperCase,
};

export default defaultExport;
