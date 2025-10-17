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
  // This array is formmated as [offset: number, name: string]
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
    () => {
      const tzByRegion: Record<string, [number, string][]> = {};
      availableTzs
        // Filter out timezones that do not match filter
        .filter(t => t[1].toLocaleLowerCase().indexOf(filter.toLocaleLowerCase()) !== -1)
        .forEach(tz => {
          const tzPath = tz[1].split("/")[0];

          if (tzByRegion[tzPath]) {
            tzByRegion[tzPath].push(tz)
          } else {
            tzByRegion[tzPath] = [tz]
          }
        });

      return Object.keys(tzByRegion).sort()
        .map(region => (
          <div>
            <h1>{region}</h1>
            <div className="AddTZ__list">
              {tzByRegion[region]
                .map(([offset, tz]) => (
                  <div>
                    <div
                      role="button"
                      className="AddTZ__menuItem"
                      key={tz}
                      onClick={() => { setOpen(false); onAdd(tz); }}
                    >
                      <span className="AddTZ__menuItemOffset">
                        {formatTzOffset(offset)}
                      </span>
                      {' '}
                      {(() => {
                        const formatted = formatTzName(tz)
                        return formatted.split("/").slice(1).join("/");
                      })()}
                    </div>
                  </div>)
                )}
            </div>
          </div>
        ))
    }
    , [availableTzs, onAdd, filter])

  return <div className="AddTZ">

    <button onClick={() => { setOpen(o => !o); setFilter("") }}>
      + add timezone
    </button>
    <div
      className={
        "AddTZ__menu "
        + (open ? "AddTZ__menu--open" : "")
      }
    >
      {
        open && <>
          <input
            placeholder="Filter timezones…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {menuItems}
        </>
      }
    </div>
  </div>
}
