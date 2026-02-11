import { useCallback, useEffect, useLayoutEffect, useRef, useState, } from 'react'
import { Temporal } from 'temporal-polyfill'
import TZStrip from './TZStrip'
import "./App.css";
import { SNAP_BACK_DURATION } from './constants'
import { useTime } from './TimeContext'
import AddTZ from './AddTZ'
import { easeInOutCubic } from './ease'
import { useSettings } from './SettingsContext'
import { TopBar } from './TopBar'
import { numberToPaddedString } from './utils'


function App() {
  const [{ hourSize, snapTo }] = useSettings();
  const [tzs, setTzs] = useState<string[]>([])
  const [focusTime, setFocusTime] = useState<number | null>();

  const msPerPixel = (60 * 60 * 1000) / hourSize;

  // Utility function to snap timestamp to specified minute intervals
  // Checks ALL displayed timezones and snaps to nearest point where ANY timezone shows a round time
  const snapTime = useCallback((timestamp: number): number => {
    if (!snapTo || snapTo === 0 || tzs.length === 0) return timestamp;

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

  const isDraggingRef = useRef(false);
  const mousePosRef = useRef<[number, number] | null>(null);
  const dragStartTimeRef = useRef<number | null>(null); // Store time when drag starts
  const dragStartPosRef = useRef<number | null>(null); // Store mouse X position when drag starts

  const animateFocusTimeBack = () => {
    if (focusTime == null) return;

    const start = performance.now();
    const from = focusTime;
    const to = currentTime;

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
  };

  useLayoutEffect(() => {
    if (tzs.length === 0) {
      const storage: string | undefined = localStorage.tzs
      if (!storage) {
        // Both tzs and storage are empty => fresh first use!
        const initial = [Intl.DateTimeFormat().resolvedOptions().timeZone]
        localStorage.tzs = JSON.stringify(initial)
        return setTzs(initial);
      }

      // Load values from storage as there are existing values:
      return setTzs(JSON.parse(storage));
    }

    // If tzs.length !== 0, it can be assumed that tzs has been altered.
    localStorage.tzs = JSON.stringify(tzs);

  }, [tzs])

  useEffect(() => {

    const handleChange = (currentX: number) => {
      if (dragStartPosRef.current === null || dragStartTimeRef.current === null) return;

      // Calculate offset from where the drag started
      const pixelOffset = dragStartPosRef.current - currentX;
      const newTime = dragStartTimeRef.current + (pixelOffset * msPerPixel);

      // Apply snapping to the final calculated time
      setFocusTime(snapTime(Math.round(newTime)));
    }

    const mouse = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleChange(e.clientX);
      mousePosRef.current = [e.clientX, e.clientY];
    };

    const touch = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      handleChange(e.touches[0].clientX);
      mousePosRef.current = [e.touches[0].clientX, e.touches[0].clientY];
    };

    const end = () => {
      mousePosRef.current = null;
      isDraggingRef.current = false;
      dragStartPosRef.current = null;
      dragStartTimeRef.current = null;
    }

    window.addEventListener("mousemove", mouse);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", touch);
    window.addEventListener("touchstart", touch);
    window.addEventListener("touchend", end);

    return () => {
      window.removeEventListener("mousemove", mouse);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", touch);
      window.removeEventListener("touchstart", touch);
      window.removeEventListener("touchend", end);
    }
  }, [msPerPixel, snapTime]);

  const handleAddTz = useCallback((tz: string) => {
    setTzs((tzs) => [...tzs, tz])
  }, [])

  function handleWheelX(e: number) {
    setFocusTime(
      snapTime(Math.round((focusTime || currentTime) + (e * msPerPixel)))
    )
  }

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
      >
        {tzs.map(
          (e, i) => <TZStrip
            isDirty={!!focusTime}
            tz={e}
            referenceTZ={tzs[0]}
            key={i}
            only={tzs.length === 1}
            onReset={animateFocusTimeBack}
            onRemove={() => setTzs(tzs.filter((t) => t !== e))}
            focusTime={focusTime || currentTime}
            onWheelX={handleWheelX}
            onDragStart={(pos) => {
              isDraggingRef.current = true;
              mousePosRef.current = pos;
              dragStartPosRef.current = pos[0]; // Store initial X position
              dragStartTimeRef.current = focusTime || currentTime; // Store initial time
              if (!focusTime) setFocusTime(currentTime);
            }}
          />
        )}
        <AddTZ onAdd={handleAddTz} currentTzs={tzs} />
      </div>
    </>
  )
}

export default App
