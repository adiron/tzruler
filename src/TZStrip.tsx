import { useRef, useState, useLayoutEffect, useMemo, useCallback, type WheelEvent } from 'react';
import { Temporal } from 'temporal-polyfill';
import { formatTzName, numberToPaddedString } from './utils';
import { HOUR_SIZE, LINE_POSITION } from './constants';
import { StripHour } from './StripHour';

export interface TZStripParams {
  tz: string;
  onRemove: () => void;
  onWheelX: (arg0: number) => void;
  onDragStart: (arg0: [number,number]) => void;
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

export function TZStrip({ tz, focusTime, onRemove, onWheelX, onDragStart }: TZStripParams) {
  const zonedFocusTime = Temporal.Instant.fromEpochMilliseconds(focusTime).toZonedDateTimeISO(tz);
  // The TZ offset in hours as fractions (e.g. -8.0, +4.5 etc.)
  const offsetHours = zonedFocusTime.offsetNanoseconds / 1e+9 / 60 / 60;

  const rulerRef = useRef<HTMLDivElement>(null);
  const [rulerWidth, setRulerWidth] = useState(0);

  const centerTimePos = useMemo(() => rulerWidth * LINE_POSITION, [rulerWidth])
  // Raw time in the view, in hours.
  const hoursInView = useMemo(() => rulerWidth / HOUR_SIZE, [rulerWidth]);

  // The leftmost timestamp in epoch time in THE VIEW
  // TODO - fix this code so that it will work for LINE_POSITION != 0.5
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
  // TODO - fix this code so that it will work for LINE_POSITION != 0.5
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
      {formatTzName(tz)}: {numberToPaddedString(zonedFocusTime.hour)}:{numberToPaddedString(zonedFocusTime.minute)} ({offsetHours})
      <button onClick={onRemove}>Remove</button>
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
          left: `${centerTimePos}px`,
        }}
      >
        <div className="TZStrip__currentTimeText">
          {numberToPaddedString(zonedFocusTime.hour)}:{numberToPaddedString(zonedFocusTime.minute)}
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

