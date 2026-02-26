import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_TIMEZONES, ALIASES_BY_TIMEZONE, NANOS_PER_SECOND } from "./constants";
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
  const input = useRef<HTMLInputElement>(null);

  const aliasesByTz = ALIASES_BY_TIMEZONE;

  // This array is formmated as [offset: number, name: string]
  const availableTzs = useMemo<[number, string][]>(() => {
    const now = Date.now();
    return ALL_TIMEZONES
      .filter(e => !currentTzs.includes(e))
      .map<[number, string]>(tz => {
        const zonedTime = Temporal.Instant.fromEpochMilliseconds(now).toZonedDateTimeISO(tz);
        return [zonedTime.offsetNanoseconds / NANOS_PER_SECOND / 60 / 60, tz];
      })
      .sort((a, b) => a[0] - b[0])
  }, [currentTzs]
  )

  useEffect(() => {
    if (open && input.current !== null) {
      input.current.focus();
    }
  }, [open])

  useEffect(() => {
    const keyEvent = (e: { key: string }) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", keyEvent)
    return () => {
      document.removeEventListener("keydown", keyEvent)
    }
  }, [setOpen]);

  const menuItems = useMemo(
    () => {
      const tzByRegion: Record<string, [number, string][]> = {};

      // Normalize filter: keep only alphanumeric characters
      const normalizedFilter = filter.toLowerCase().replace(/[^a-z0-9]/g, '');

      availableTzs
        // Filter out timezones that do not match filter
        .filter(t => {
          if (!normalizedFilter) return true;

          const tzName = t[1];
          // Normalize tz name: keep only alphanumeric characters
          // "America/New_York" -> "americanewyork"
          // "Europe/Paris" -> "europeparis"
          const normalizedTz = tzName.toLowerCase().replace(/[^a-z0-9]/g, '');

          if (normalizedTz.includes(normalizedFilter)) return true;

          const aliases = aliasesByTz[tzName];
          if (aliases) {
            return aliases.some(alias =>
              alias.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedFilter)
            );
          }

          return false;
        })
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
          <div key={region}>
            <h1 className="AddTZ__regionTitle">{region}</h1>
            <div className="AddTZ__list">
              {tzByRegion[region]
                .map(([offset, tz]) => (
                  <div
                    key={tz}
                    role="button"
                    className="AddTZ__menuItem"
                    onClick={() => { setOpen(false); onAdd(tz); }}
                  >
                    <span className="AddTZ__menuItemOffset">
                      {formatTzOffset(offset)}
                    </span>
                    {' '}
                    {formatTzName(tz).split("/").slice(1).join("/")}
                  </div>
                ))}
            </div>
          </div>
        ))
    }
    , [availableTzs, onAdd, filter, aliasesByTz])

  return <div className="AddTZ">

    <button className="AddTZ__button" onClick={() => { setOpen(o => !o); setFilter("") }}>
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
          <button
            className="AddTZ__back"
            onClick={() => setOpen(false)}
          >
            &larr; back
          </button>
          <input
            ref={input}
            placeholder="Filter timezones…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="AddTZ__input"
          />
          {menuItems}
        </>
      }
    </div>
  </div>
}
