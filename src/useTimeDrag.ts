import { useCallback, useEffect, useRef } from 'react';
import type { TouchMode } from './constants';

const TOUCH_AXIS_LOCK_THRESHOLD = 8;

/**
 * Manages horizontal drag-to-scrub gesture on the timeline strips.
 * Accepts refs to the shared time state so App can keep those refs for
 * other callbacks (animateFocusTimeBack, handleWheelX) without duplication.
 */
export function useTimeDrag(
  currentTimeRef: { current: number },
  focusTimeRef: { current: number | null },
  msPerPixelRef: { current: number },
  snapTimeRef: { current: (t: number) => number },
  setFocusTime: (t: number | null) => void,
) {
  const isDraggingRef = useRef(false);
  const mousePosRef = useRef<[number, number] | null>(null);
  const dragStartTimeRef = useRef<number | null>(null);
  const dragStartPosRef = useRef<number | null>(null);
  const dragPointerTypeRef = useRef<'mouse' | 'touch' | null>(null);
  const touchModeRef = useRef<TouchMode>(null);
  const touchStartRef = useRef<[number, number] | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Intentionally one-time listener registration; handlers read latest values from refs.
    const beginDrag = (startPos: [number, number], startTime: number) => {
      isDraggingRef.current = true;
      dragStartPosRef.current = startPos[0];
      dragStartTimeRef.current = startTime;
      mousePosRef.current = startPos;
      if (!focusTimeRef.current) setFocusTime(currentTimeRef.current);
    };

    const handleChange = (currentX: number) => {
      if (dragStartPosRef.current === null || dragStartTimeRef.current === null) return;
      const pixelOffset = dragStartPosRef.current - currentX;
      const newTime = dragStartTimeRef.current + (pixelOffset * msPerPixelRef.current);
      setFocusTime(snapTimeRef.current(Math.round(newTime)));
    };

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
        if (absDx < TOUCH_AXIS_LOCK_THRESHOLD && absDy < TOUCH_AXIS_LOCK_THRESHOLD) {
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
    };

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
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { handleStripDragStart };
}
