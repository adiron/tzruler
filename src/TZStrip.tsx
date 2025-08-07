import { useRef, useState, useLayoutEffect, useMemo, useCallback } from 'react';
import { Temporal } from 'temporal-polyfill';
import { formatTzName, numberToPaddedString } from './utils';
import { HOUR_SIZE, LINE_POSITION } from './constants';

export interface TZStripParams {
  tz: string;
  onRemove: () => void;
  focusTime: number;
  isDirty: boolean;
}

function generateMarks(left: number, right: number, tz: string) {
  const hours = [];

  let epoch = left;

  while (epoch < right) {
    const t = Temporal.Instant.fromEpochMilliseconds(epoch)
      .add({ hours: 1 })
      .toZonedDateTimeISO(tz)
    hours.push({
      time: t.toInstant().epochMilliseconds,
      text: `${numberToPaddedString(t.hour)}:${numberToPaddedString(t.minute)}`,
      additional: t.hour === 0 ? `${t.toLocaleString('en-US', { month: 'short' })} ${t.day}` : null
    })
    epoch = t.toInstant().epochMilliseconds;
  }

  return hours;
}

export function TZStrip({ tz, focusTime, onRemove }: TZStripParams) {
  const zonedFocusTime = Temporal.Instant.fromEpochMilliseconds(focusTime).toZonedDateTimeISO(tz);
  // The TZ offset in hours as fractions (e.g. -8.0, +4.5 etc.)
  const offsetHours = zonedFocusTime.offsetNanoseconds / 1e+9 / 60 / 60;

  const rulerRef = useRef<HTMLDivElement>(null);
  const [rulerWidth, setRulerWidth] = useState(0);

  const centerTimePos = useMemo(() => rulerWidth * LINE_POSITION, [rulerWidth])
  // Raw time in the view, in hours.
  const hoursInView = useMemo(() => rulerWidth / HOUR_SIZE, [rulerWidth]);

  // The leftmost timestamp in epoch time in THE VIEW
  const leftTimeStamp = focusTime - (hoursInView / 2) * 60 * 60 * 1000;

  const leftTimeStampOverflow = Temporal
    .Instant
    .fromEpochMilliseconds(leftTimeStamp)
    .toZonedDateTimeISO(tz)
    .with({ minute: 0, second: 0, millisecond: 0 })
    // This is -2 on purpose
    .add({ hours: -2 })
    .toInstant()
    .epochMilliseconds;

  // The rightmost timestamp in epoch time in THE VIEW
  const rightTimeStamp = focusTime + (hoursInView / 2) * 60 * 60 * 1000;
  const rightTimeStampOverflow = Temporal
    .Instant
    .fromEpochMilliseconds(rightTimeStamp)
    .toZonedDateTimeISO(tz)
    .with({ minute: 0, second: 0, millisecond: 0 })
    .add({ hours: 1 })
    .toInstant()
    .epochMilliseconds;


  const hourMarks = useMemo(
    () => generateMarks(leftTimeStampOverflow, rightTimeStampOverflow, tz),
    [leftTimeStampOverflow, rightTimeStampOverflow, tz]
  );

  const epochToPixels = useCallback((epochMs: number) => {
    const range = rightTimeStamp - leftTimeStamp;
    const offset = epochMs - leftTimeStamp;
    return (offset / range) * rulerWidth;
  }, [leftTimeStamp, rightTimeStamp, rulerWidth]);

  useLayoutEffect(() => {
    function measure() {
      if (rulerRef.current === null) {
        return;
      }
      setRulerWidth(rulerRef.current.getBoundingClientRect().width);
    }

    measure();
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, []);

  return <div className="TZStrip">
    <div className="TZStrip__info">
      {formatTzName(tz)}: {numberToPaddedString(zonedFocusTime.hour)}:{numberToPaddedString(zonedFocusTime.minute)} ({offsetHours})
      <button onClick={onRemove}>Remove</button>
    </div>
    <div className="TZStrip__ruler" ref={rulerRef}>
      {/* The bar with all the ticks */}
      <div
        className="TZStrip__currentTimeBar"
        style={{
          left: `${centerTimePos}px`,
        }}
      >
        <div className="TZStrip__currentTimeText">
          {numberToPaddedString(zonedFocusTime.hour)}:{numberToPaddedString(zonedFocusTime.minute)}
        </div>
      </div>

      {hourMarks.map((m) => {
        return <div
          className={"TZStrip__hourMark " + (m.additional ? " TZStrip__hourMark--withAdditional" : "")}
          key={`${m.text}-${m.additional}`}
          style={{ left: `${epochToPixels(m.time)}px` }}
        >
          {m.additional && <div className="TZStrip__hourMarkAdditional">{m.additional}</div>}
          <div
            className="TZStrip__hourMarkText"
          >{m.text}</div>
        </div>
      })}

    </div>
  </div>;
}

