import { useMemo } from "react";
import { ALL_TIMEZONES } from "./constants";
import { formatTzName } from "./utils";

interface AddTZParams {
  onAdd: (tz: string) => void;
  currentTzs: string[];
}

export default function AddTZ({ currentTzs, onAdd }: AddTZParams) {
  const availableTzs = useMemo(() => ALL_TIMEZONES.filter(e => !currentTzs.includes(e)), [currentTzs])
  
  return <select onChange={(e) => onAdd(e.target.value)}>
  {
    availableTzs.map(tz => <option value={tz}>{formatTzName(tz)}</option>)
  }
  </select>
}
