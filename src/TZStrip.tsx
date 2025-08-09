import { useRef, useState, useLayoutEffect, useMemo, useCallback, type WheelEvent } from 'react';
import { Temporal } from 'temporal-polyfill';
import { formatTzName, formatTzOffset, instantToHHMM, } from './utils';
import { HOUR_SIZE, LINE_POSITION, MS_PER_PIXEL, OVERLAP_PROTECTION } from './constants';
import { StripHour } from './StripHour';
import { useTime } from './TimeContext';

export interface TZStripParams {
  tz: string;
  onRemove: () => void;
  onWheelX: (arg0: number) => void;
  onDragStart: (arg0: [number, number]) => void;
  onReset: () => void;
  focusTime: number;
  isDirty: boolean;
  only: boolean;
}

function splitTZComponents(tz_: string) {
  const [head, ...tail] = formatTzName(tz_).split("/").reverse();
  return [tail.reverse().join(" / "), head]
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
      text: instantToHHMM(t),
      additional: t.hour === 0 ? `${t.toLocaleString('en-US', { month: 'short' })} ${t.day}` : null
    })
    epoch = t.toInstant().epochMilliseconds;
  }

  return hours;
}

export function TZStrip({ tz, focusTime, onRemove, onWheelX, onDragStart, only, isDirty, onReset }: TZStripParams) {
  const currentTime = useTime();
  const zonedCurrentTime = Temporal.Instant.fromEpochMilliseconds(currentTime).toZonedDateTimeISO(tz);
  const zonedFocusTime = Temporal.Instant.fromEpochMilliseconds(Math.round(focusTime)).toZonedDateTimeISO(tz);
  // The TZ offset in hours as fractions (e.g. -8.0, +4.5 etc.)
  const offsetHours = zonedFocusTime.offsetNanoseconds / 1e+9 / 60 / 60;

  const rulerRef = useRef<HTMLDivElement>(null);
  const [rulerWidth, setRulerWidth] = useState(0);

  // Raw time in the view, in hours.
  const hoursInView = useMemo(() => rulerWidth / HOUR_SIZE, [rulerWidth]);

  // The leftmost timestamp in epoch time in THE VIEW
  // TODO - fix this code so that it will work for LINE_POSITION != 0.5
  const leftTimeStamp = Math.round(focusTime) - (hoursInView / 2) * 60 * 60 * 1000;

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
  // TODO - fix this code so that it will work for LINE_POSITION != 0.5
  const rightTimeStamp = Math.round(focusTime) + (hoursInView / 2) * 60 * 60 * 1000;
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

  const [tzPath, tzName] = splitTZComponents(tz);

  const handleWheelEvent = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      if (e.deltaX !== 0) {
        onWheelX(e.deltaX);
      }
    },
    [onWheelX]
  );

  return <div
    className="TZStrip"
    onWheel={e => handleWheelEvent(e)}
  >
    <div className="TZStrip__info">
      <div className="TZStrip__tzInfoContainer">
        <div className="TZStrip__tzPath">{tzPath}</div>
        <div className="TZStrip__tzName">{tzName}</div>
        <div className="TZStrip__tzOffset">{formatTzOffset(offsetHours)}</div>
      </div>
      {!only && <button
        onClick={onRemove}
        className="TZStrip__remove"
      >
        remove
      </button>
      }
    </div>
    <div
      className="TZStrip__ruler"
      ref={rulerRef}
      onMouseDown={(e) => onDragStart([e.clientX, e.clientY])}
      onTouchStart={(e) => onDragStart([e.touches[0].clientX, e.touches[0].clientY])}
    >
      {/* The bar with all the ticks */}
      <div
        className="TZStrip__currentTimeBar"
        style={{
          left: `${epochToPixels(currentTime)}px`,
        }}
      >
        <div className={"TZStrip__currentTimeText" + (isDirty && Math.abs(focusTime - currentTime) < (OVERLAP_PROTECTION * MS_PER_PIXEL) ? " TZStrip__currentTimeText--hidden" : "") + (isDirty ? " TZStrip__currentTimeText--dirty" : "")}>
          {instantToHHMM(zonedCurrentTime)}
        </div>
      </div>

      <div
        className={"TZStrip__focusTimeBar" + (isDirty ? "" : " TZStrip__focusTimeBar--hidden")}
        style={{
          left: `${epochToPixels(focusTime)}px`,
        }}
      >
        <div className="TZStrip__focusTimeText">
          {instantToHHMM(zonedFocusTime)}
          <button
            onClick={onReset}
            className="TZStrip__focusTimeReset"
          >
            reset
          </button>
        </div>
      </div>

      {hourMarks.map((m) => <StripHour
        epochToPixels={epochToPixels}
        additional={m.additional}
        time={m.time}
        text={m.text}
      />)}

    </div>
  </div>;
}

