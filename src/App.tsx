import { useCallback, useEffect, useLayoutEffect, useRef, useState, } from 'react'
import { Temporal } from 'temporal-polyfill'
import TZStrip from './TZStrip'
import "./App.css";
import { SNAP_BACK_DURATION, LS_KEY_TZS } from './constants'
import { useTime } from './TimeContext'
import AddTZ from './AddTZ'
import { easeInOutCubic } from './ease'
import { useSettings } from './SettingsContext'
import { TopBar } from './TopBar'
import { numberToPaddedString } from './utils'
import { useTimeDrag } from './useTimeDrag'
import { useReorderDrag } from './useReorderDrag'

const STRIP_TIME_GRANULARITY_MS = 60 * 1000;

function App() {
  const [{ hourSize, snapTo }] = useSettings();
  const [tzs, setTzs] = useState<string[]>([])
  const [focusTime, setFocusTime] = useState<number | null>();

  const msPerPixel = (60 * 60 * 1000) / hourSize;

  // Utility function to snap timestamp to specified minute intervals
  // Checks ALL displayed timezones and snaps to nearest point where ANY timezone shows a round time
  const snapTime = useCallback((timestamp: number): number => {
    if (snapTo == null || snapTo === 0 || tzs.length === 0) return timestamp;

    // Calculate snap candidates from all timezones
    const candidates = tzs.flatMap(tz => {
      // Convert to this timezone's local time
      const zoned = Temporal.Instant.fromEpochMilliseconds(timestamp).toZonedDateTimeISO(tz);

      // Get total minutes since start of day
      const totalMinutes = zoned.hour * 60 + zoned.minute;

      // Calculate both floor and ceil snap points and convert back to epoch milliseconds
      return [Math.floor, Math.ceil].map(fn => {
        const snappedMinutes = fn(totalMinutes / snapTo) * snapTo;
        const snappedHour = Math.floor(snappedMinutes / 60);
        const snappedMinute = snappedMinutes % 60;

        return zoned.with({
          hour: snappedHour,
          minute: snappedMinute,
          second: 0,
          millisecond: 0
        }).toInstant().epochMilliseconds;
      });
    });

    // Find the candidate closest to the original timestamp
    return candidates.reduce((best, candidate) =>
      Math.abs(timestamp - candidate) < Math.abs(timestamp - best) ? candidate : best
    );
  }, [snapTo, tzs]);

  const currentTime = useTime();
  const currentTimeRef = useRef(currentTime);
  const focusTimeRef = useRef<number | null>(null);
  const msPerPixelRef = useRef(msPerPixel);
  const snapTimeRef = useRef(snapTime);

  useEffect(() => {
    // Keep fast-moving drag inputs in refs so global pointer listeners can stay attached once.
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    focusTimeRef.current = focusTime ?? null;
  }, [focusTime]);

  useEffect(() => {
    msPerPixelRef.current = msPerPixel;
  }, [msPerPixel]);

  useEffect(() => {
    snapTimeRef.current = snapTime;
  }, [snapTime]);

  const { handleStripDragStart } = useTimeDrag(
    currentTimeRef, focusTimeRef, msPerPixelRef, snapTimeRef, setFocusTime
  );

  const { reorderDraggedIndex, reorderLineTop, handleReorderStart, wrapperRef } = useReorderDrag(setTzs);

  const animateFocusTimeBack = useCallback(() => {
    const from = focusTimeRef.current;
    if (from == null) return;

    const start = performance.now();
    const to = currentTimeRef.current;

    const step = (now: number) => {
      const t = Math.min((now - start) / SNAP_BACK_DURATION, 1);
      const eased = easeInOutCubic(t);
      const newTime = from + (to - from) * eased;

      setFocusTime(newTime);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setFocusTime(null);
      }
    };

    requestAnimationFrame(step);
  }, []);

  useLayoutEffect(() => {
    if (tzs.length === 0) {
      const storage = localStorage.getItem(LS_KEY_TZS);
      if (!storage) {
        // Both tzs and storage are empty => fresh first use!
        const initial = [Intl.DateTimeFormat().resolvedOptions().timeZone]
        localStorage.setItem(LS_KEY_TZS, JSON.stringify(initial));
        return setTzs(initial);
      }

      // Load values from storage as there are existing values:
      return setTzs(JSON.parse(storage));
    }

    // If tzs.length !== 0, it can be assumed that tzs has been altered.
    localStorage.setItem(LS_KEY_TZS, JSON.stringify(tzs));

  }, [tzs])

  const handleAddTz = useCallback((tz: string) => {
    setTzs((tzs) => [...tzs, tz])
  }, [])

  const handleWheelX = useCallback((e: number) => {
    const baseTime = focusTimeRef.current || currentTimeRef.current;
    setFocusTime(
      snapTimeRef.current(Math.round(baseTime + (e * msPerPixelRef.current)))
    )
  }, []);

  const handleRemoveTz = useCallback((tz: string) => {
    setTzs((prev) => prev.filter((t) => t !== tz));
  }, []);

  const stripFocusTime = focusTime ?? Math.round(currentTime / STRIP_TIME_GRANULARITY_MS) * STRIP_TIME_GRANULARITY_MS;

  const navigateToDate = useCallback((date: string) => {
    if (!date) return;

    const [year, month, day] = date.split("-").map(Number);
    const startOfDayUtc = Temporal.ZonedDateTime.from({
      timeZone: "UTC",
      year,
      month,
      day,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    }).toInstant().epochMilliseconds;

    setFocusTime(snapTime(startOfDayUtc));
  }, [snapTime]);

  const navDateTime = Temporal.Instant
    .fromEpochMilliseconds(Math.round(focusTime || currentTime))
    .toZonedDateTimeISO("UTC");
  const selectedDate = `${navDateTime.year}-${numberToPaddedString(navDateTime.month)}-${numberToPaddedString(navDateTime.day)}`;

  return (
    <>
      <TopBar
        selectedDate={selectedDate}
        onNavigateToDate={navigateToDate}
      />
      <div
        className="App__wrapper"
        ref={wrapperRef}
      >
        {reorderLineTop !== null && (
          <div
            className="App__reorderLine"
            style={{ top: `${reorderLineTop}px` }}
          />
        )}
        {tzs.map(
          (e, i) => <TZStrip
            isDirty={!!focusTime}
            tz={e}
            referenceTZ={tzs[0]}
            key={e}
            only={tzs.length === 1}
            isReorderDragging={reorderDraggedIndex === i}
            onReset={animateFocusTimeBack}
            onRemove={() => handleRemoveTz(e)}
            focusTime={stripFocusTime}
            onWheelX={handleWheelX}
            onReorderDragStart={(pos) => handleReorderStart(i, pos[1])}
            onDragStart={handleStripDragStart}
          />
        )}
        <AddTZ onAdd={handleAddTz} currentTzs={tzs} />
      </div>
    </>
  )
}

export default App
