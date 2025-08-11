/** Width of a single hour in pixels **/
export const HOUR_SIZE = 80;
export const MS_PER_PIXEL = ((60 * 60 * 1000) / HOUR_SIZE)
/** Every single timezone supported on the current machine **/
export const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone');

/** Fraction of the screen's width in which the line indicating the current time will be placed **/
export const LINE_POSITION = 0.5;

/** How many divisions does an hour have? **/
export const HOUR_DIVISIONS = 4;

export const OVERLAP_FACTOR = 1.8;

export const SNAP_BACK_DURATION = 250;
