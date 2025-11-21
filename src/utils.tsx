export function numberToPaddedString(n: number, len: number = 2) {
  return n.toFixed(0).padStart(len, "0");
}


export function formatTzName(tzName: string) {
  return tzName.replaceAll("_", " ");
}


export function instantToHHMM(t: { hour: number, minute: number }) {
  return `${numberToPaddedString(t.hour)}:${numberToPaddedString(t.minute)}`
}

// tzOffset is assumed to be a fraction. e.g. 3.5 => +03:30
export function formatTzOffset(tzOffset: number) {
  const sign = tzOffset < 0 ? "-" : "+";
  const absOffset = Math.abs(tzOffset);
  const hours = Math.trunc(absOffset);
  const minutes = (absOffset - hours) * 60;
  return `${sign}${numberToPaddedString(hours, 2)}:${numberToPaddedString(minutes, 2)}`;
}

export function splitTZComponents(tz_: string) {
  const [head, ...tail] = formatTzName(tz_).split("/").reverse();
  return [tail.reverse().join(" / "), head]
}

