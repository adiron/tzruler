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
  const TOUCH_AXIS_LOCK_THRESHOLD = 8;
  const STRIP_TIME_GRANULARITY_MS = 60 * 1000;
  const [{ hourSize, snapTo }] = useSettings();
  const [tzs, setTzs] = useState<string[]>([])
  const [focusTime, setFocusTime] = useState<number | null>();
  const [reorderDraggedIndex, setReorderDraggedIndex] = useState<number | null>(null);
  const [reorderLineTop, setReorderLineTop] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reorderRef = useRef<{ draggedIndex: number; insertIndex: number } | null>(null);

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

  const isDraggingRef = useRef(false);
  const mousePosRef = useRef<[number, number] | null>(null);
  const dragStartTimeRef = useRef<number | null>(null); // Store time when drag starts
  const dragStartPosRef = useRef<number | null>(null); // Store mouse X position when drag starts
  const dragPointerTypeRef = useRef<'mouse' | 'touch' | null>(null);
  const touchModeRef = useRef<'pending' | 'page' | 'strip' | null>(null);
  const touchStartRef = useRef<[number, number] | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);

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
    // Intentionally one-time listener registration; handlers read latest values from refs above.
    const beginDrag = (startPos: [number, number], startTime: number) => {
      isDraggingRef.current = true;
      dragStartPosRef.current = startPos[0];
      dragStartTimeRef.current = startTime;
      mousePosRef.current = startPos;
      if (!focusTimeRef.current) setFocusTime(currentTimeRef.current);
    };

    const handleChange = (currentX: number) => {
      if (dragStartPosRef.current === null || dragStartTimeRef.current === null) return;

      // Calculate offset from where the drag started
      const pixelOffset = dragStartPosRef.current - currentX;
      const newTime = dragStartTimeRef.current + (pixelOffset * msPerPixelRef.current);

      // Apply snapping to the final calculated time
      setFocusTime(snapTimeRef.current(Math.round(newTime)));
    }

    const mouse = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleChange(e.clientX);
      mousePosRef.current = [e.clientX, e.clientY];
    };

    const touch = (e: TouchEvent) => {
      if (dragPointerTypeRef.current !== 'touch') return;
      if (e.touches.length === 0) return;
      const touchPoint = e.touches[0];

      if (touchModeRef.current === 'pending' && touchStartRef.current !== null) {
        const [startX, startY] = touchStartRef.current;
        const dx = touchPoint.clientX - startX;
        const dy = touchPoint.clientY - startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (
          absDx < TOUCH_AXIS_LOCK_THRESHOLD &&
          absDy < TOUCH_AXIS_LOCK_THRESHOLD
        ) {
          return;
        }

        if (absDx > absDy) {
          touchModeRef.current = 'strip';
        } else {
          touchModeRef.current = 'page';
        }

        if (touchModeRef.current === 'page') {
          isDraggingRef.current = false;
          dragStartPosRef.current = null;
          dragStartTimeRef.current = null;
          dragPointerTypeRef.current = null;
          touchStartRef.current = null;
          touchStartTimeRef.current = null;
          return;
        }

        if (touchStartTimeRef.current !== null) {
          beginDrag([startX, startY], touchStartTimeRef.current);
        }
      }

      if (touchModeRef.current !== 'strip' || !isDraggingRef.current) return;
      e.preventDefault();
      handleChange(e.touches[0].clientX);
      mousePosRef.current = [e.touches[0].clientX, e.touches[0].clientY];
    };

    const end = () => {
      mousePosRef.current = null;
      isDraggingRef.current = false;
      dragStartPosRef.current = null;
      dragStartTimeRef.current = null;
      dragPointerTypeRef.current = null;
      touchModeRef.current = null;
      touchStartRef.current = null;
      touchStartTimeRef.current = null;
    }

    window.addEventListener("mousemove", mouse);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", touch, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);

    return () => {
      window.removeEventListener("mousemove", mouse);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", touch);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    }
  }, []);

  const handleAddTz = useCallback((tz: string) => {
    setTzs((tzs) => [...tzs, tz])
  }, [])

  const updateReorderLine = useCallback((pointerY: number) => {
    const wrapper = wrapperRef.current;
    const reorderState = reorderRef.current;
    if (!wrapper || !reorderState) return;

    const strips = Array.from(wrapper.querySelectorAll<HTMLElement>(".TZStrip"));
    if (strips.length === 0) return;

    const stripRects = strips.map((strip) => strip.getBoundingClientRect());
    let insertIndex = stripRects.findIndex((rect) => pointerY < rect.top + rect.height / 2);
    if (insertIndex === -1) {
      insertIndex = stripRects.length;
    }

    const indicatorY = insertIndex === stripRects.length
      ? stripRects[stripRects.length - 1].bottom
      : stripRects[insertIndex].top;

    reorderState.insertIndex = insertIndex;
    setReorderLineTop(indicatorY - wrapper.getBoundingClientRect().top);
  }, []);

  const finishReorderDrag = useCallback(() => {
    const reorderState = reorderRef.current;
    if (!reorderState) return;

    const { draggedIndex, insertIndex } = reorderState;
    setTzs((prev) => {
      if (prev.length === 0) return prev;
      if (draggedIndex < 0 || draggedIndex >= prev.length) return prev;

      let targetIndex = insertIndex;
      if (targetIndex > draggedIndex) {
        targetIndex -= 1;
      }

      targetIndex = Math.max(0, Math.min(targetIndex, prev.length - 1));
      if (targetIndex === draggedIndex) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    reorderRef.current = null;
    setReorderDraggedIndex(null);
    setReorderLineTop(null);
  }, []);

  const startReorderDrag = useCallback((index: number, pointerY: number) => {
    reorderRef.current = { draggedIndex: index, insertIndex: index };
    setReorderDraggedIndex(index);
    updateReorderLine(pointerY);
  }, [updateReorderLine]);

  useEffect(() => {
    if (reorderDraggedIndex === null) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!reorderRef.current) return;
      updateReorderLine(e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!reorderRef.current) return;
      updateReorderLine(e.touches[0].clientY);
      e.preventDefault();
    };

    const onPointerEnd = () => finishReorderDrag();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onPointerEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onPointerEnd);
    window.addEventListener("touchcancel", onPointerEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onPointerEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onPointerEnd);
      window.removeEventListener("touchcancel", onPointerEnd);
    };
  }, [finishReorderDrag, reorderDraggedIndex, updateReorderLine]);

  const handleWheelX = useCallback((e: number) => {
    const baseTime = focusTimeRef.current || currentTimeRef.current;
    setFocusTime(
      snapTimeRef.current(Math.round(baseTime + (e * msPerPixelRef.current)))
    )
  }, []);

  const handleStripDragStart = useCallback((pos: [number, number], pointerType: 'mouse' | 'touch') => {
    const startTime = focusTimeRef.current || currentTimeRef.current;
    dragPointerTypeRef.current = pointerType;

    if (pointerType === 'mouse') {
      isDraggingRef.current = true;
      mousePosRef.current = pos;
      dragStartPosRef.current = pos[0];
      dragStartTimeRef.current = startTime;
      if (!focusTimeRef.current) setFocusTime(currentTimeRef.current);
      return;
    }

    touchModeRef.current = 'pending';
    touchStartRef.current = pos;
    touchStartTimeRef.current = startTime;
    isDraggingRef.current = false;
    dragStartPosRef.current = null;
    dragStartTimeRef.current = null;
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
            onReorderDragStart={(pos) => startReorderDrag(i, pos[1])}
            onDragStart={handleStripDragStart}
          />
        )}
        <AddTZ onAdd={handleAddTz} currentTzs={tzs} />
      </div>
    </>
  )
}

export default App
