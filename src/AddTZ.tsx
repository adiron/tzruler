import { useMemo, useState } from "react";
import { ALL_TIMEZONES } from "./constants";
import { formatTzName, formatTzOffset } from "./utils";
import { Temporal } from "temporal-polyfill";
import "./AddTZ.scss";

interface AddTZParams {
  onAdd: (tz: string) => void;
  currentTzs: string[];
}

export default function AddTZ({ currentTzs, onAdd }: AddTZParams) {
  const [open, setOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('');
  const availableTzs = useMemo<[number, string][]>(() => {
    const now = Date.now();
    return ALL_TIMEZONES
      .filter(e => !currentTzs.includes(e))
      .map<[number, string]>(tz => {
        const zonedTime = Temporal.Instant.fromEpochMilliseconds(now).toZonedDateTimeISO(tz);
        return [zonedTime.offsetNanoseconds / 1e9 / 60 / 60, tz];
      })
      .sort((a, b) => a[0] - b[0])
  }, [currentTzs]
  )

  const menuItems = useMemo(
    () => availableTzs
      .filter(t => t[1].toLocaleLowerCase().indexOf(filter.toLocaleLowerCase()) !== -1)
      .map(([offset, tz]) => (
        <button
          className="AddTZ__menuItem"
          key={tz}
          onClick={() => { setOpen(false); onAdd(tz) }}
        >
          {formatTzOffset(offset)} {formatTzName(tz)}
        </button>)), [availableTzs, onAdd, filter])

  return <div className="AddTZ">
    <button onClick={() => { setOpen(o => !o); setFilter("") }}>
      + add timezone
    </button>

    <div className="AddTZ__menu">
      {open && <input
        placeholder="Filter timezones…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      }
      {
        open && menuItems
      }
    </div>
  </div>
}
