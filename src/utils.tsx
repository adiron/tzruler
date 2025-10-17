export function numberToPaddedString(n: number, len: number = 2) {
    return n.toFixed(0).padStart(len, "0");
}


export function formatTzName(tzName: string) {
  return tzName.replaceAll("_", " ");
}


export function instantToHHMM(t: {hour: number, minute: number}) {
 return `${numberToPaddedString(t.hour)}:${numberToPaddedString(t.minute)}`
}

// tzOffset is assumed to be a fraction. e.g. 3.5 => +03:30
export function formatTzOffset(tzOffset: number) {
  const hours = Math.abs(tzOffset < 0 ? Math.ceil(tzOffset) : Math.floor(tzOffset));
  const minutes = (Math.abs(tzOffset) - hours) * 60;
  return (tzOffset < 0 ? "-" : "+") +
    numberToPaddedString(hours, 2) +
    ":" +
    numberToPaddedString(minutes, 2);
}

export function splitTZComponents(tz_: string) {
  const [head, ...tail] = formatTzName(tz_).split("/").reverse();
  return [tail.reverse().join(" / "), head]
}

