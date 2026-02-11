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
  snapTo: 15,
};


export const TIMEZONE_ALIASES: [string[], string[]][] = [
  [["CET", "CEST"], ["Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Amsterdam", "Europe/Brussels", "Europe/Vienna", "Europe/Warsaw", "Europe/Stockholm", "Europe/Oslo", "Europe/Copenhagen"]],
  [["EST", "EDT", "ET", "Eastern Time", "US/Eastern", "Eastern", "New York", "NYC", "Boston", "Philadelphia", "Washington DC", "Miami", "Atlanta"], ["America/New_York", "America/Toronto", "America/Detroit", "America/Montreal", "America/Indianapolis", "America/Indiana/Indianapolis", "America/Louisville", "America/Kentucky/Louisville", "America/Kentucky/Monticello"]],
  [["CST", "CDT", "CT", "Central Time", "US/Central", "Central", "Chicago", "Dallas", "Houston", "Minneapolis", "New Orleans"], ["America/Chicago", "America/Mexico_City", "America/Winnipeg", "America/Regina", "America/Indiana/Knox", "America/Knox_IN", "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/North_Dakota/Beulah"]],
  [["MST", "MDT", "MT", "Mountain Time", "US/Mountain", "Mountain", "Denver", "Salt Lake City", "Boise", "Phoenix", "Arizona"], ["America/Denver", "America/Edmonton", "America/Boise", "America/Phoenix", "America/Shiprock"]],
  [["PST", "PDT", "PT", "Pacific Time", "US/Pacific", "Pacific", "Los Angeles", "LA", "San Francisco", "Seattle", "Las Vegas", "San Diego"], ["America/Los_Angeles", "America/Vancouver", "America/Tijuana"]],
  [["AKST", "AKDT", "AKT", "Alaska", "US/Alaska", "Anchorage", "Juneau"], ["America/Anchorage", "America/Juneau", "America/Sitka", "America/Metlakatla", "America/Nome", "America/Yakutat"]],
  [["HST", "HAST", "Hawaii", "Hawaiian Time", "US/Hawaii", "Honolulu"], ["Pacific/Honolulu"]],
  [["AST", "Atlantic Time", "Puerto Rico", "San Juan"], ["America/Puerto_Rico", "America/St_Thomas"]],
  [["GMT", "BST", "UK"], ["Europe/London", "Europe/Dublin", "Europe/Lisbon"]],
  [["UTC"], ["Etc/UTC", "Universal"]],
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
  [["IST"], ["Asia/Kolkata", "Asia/Colombo"]]
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
