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
};

