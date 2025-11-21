import type { TZRulerSettings } from "./SettingsContext";

/** Every single timezone supported on the current machine **/
export const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone');

/** Fraction of the screen's width in which the line indicating the current time will be placed **/
export const LINE_POSITION = 0.5;

export const OVERLAP_HIDE_THRESHOLD = 100;

export const SNAP_BACK_DURATION = 250;

export const DEFAULT_SETTINGS: TZRulerSettings = {
  /** Width of a single hour in pixels **/
  hourSize: 80,
  /** How many lines in a single hour (default every 15m) **/
  hourDivisions: 4,
  /** Ahead-behind lines **/
  aheadBehind: false,
  /** Snap-to interval in minutes (15 = snap to :00, :15, :30, :45) **/
  snapTo: undefined,
};


export const TIMEZONE_ALIASES: [string[], string[]][] = [
  [["CET", "CEST"], ["Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Amsterdam", "Europe/Brussels", "Europe/Vienna", "Europe/Warsaw", "Europe/Stockholm", "Europe/Oslo", "Europe/Copenhagen"]],
  [["EST", "EDT", "Eastern Time"], ["America/New_York", "America/Toronto", "America/Detroit", "America/Montreal", "America/Indianapolis"]],
  [["PST", "PDT", "Pacific Time"], ["America/Los_Angeles", "America/Vancouver", "America/Tijuana"]],
  [["CST", "CDT", "Central Time"], ["America/Chicago", "America/Mexico_City", "America/Winnipeg", "America/Regina"]],
  [["MST", "MDT", "Mountain Time"], ["America/Denver", "America/Edmonton", "America/Phoenix"]],
  [["GMT", "BST", "UK"], ["Europe/London", "Europe/Dublin", "Europe/Lisbon"]],
  [["UTC"], ["Etc/UTC", "Universal"]],
  [["IST"], ["Asia/Kolkata", "Asia/Colombo"]],
  [["JST"], ["Asia/Tokyo"]],
  [["AEST", "AEDT"], ["Australia/Sydney", "Australia/Melbourne", "Australia/Hobart", "Australia/Canberra"]],
  [["AEST"], ["Australia/Brisbane"]], // Brisbane no DST
  [["ACST"], ["Australia/Darwin"]],
  [["ACST", "ACDT"], ["Australia/Adelaide"]],
  [["AWST"], ["Australia/Perth"]],
  [["NZST", "NZDT"], ["Pacific/Auckland"]],
  [["SGT"], ["Asia/Singapore"]],
  [["HKT"], ["Asia/Hong_Kong"]],
  [["KST"], ["Asia/Seoul"]],
];

/**
 * Returns a map of timezone -> aliases[]
 * Only includes timezones that are present in the provided allTimezones list.
 */
export function getAliasesByTimezone(): Record<string, string[]> {
  const aliasesByTz: Record<string, string[]> = {};

  TIMEZONE_ALIASES.forEach(([aliases, timezones]) => {
    timezones.forEach(tz => {
      // We populate all aliases. If the timezone doesn't exist on the system, 
      // it simply won't be queried by the UI which iterates over availableTzs.
      if (!aliasesByTz[tz]) {
        aliasesByTz[tz] = [];
      }
      // Add unique aliases
      aliases.forEach(alias => {
        if (!aliasesByTz[tz].includes(alias)) {
          aliasesByTz[tz].push(alias);
        }
      });
    });
  });

  return aliasesByTz;
}
