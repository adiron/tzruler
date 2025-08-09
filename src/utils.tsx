export function numberToPaddedString(n: number, len: number = 2) {
    return n.toFixed(0).padStart(len, "0");
}


export function formatTzName(tzName: string) {
  return tzName.replaceAll("_", " ");
}


export function instantToHHMM(t: {hour: number, minute: number}) {
 return `${numberToPaddedString(t.hour)}:${numberToPaddedString(t.minute)}`
}
