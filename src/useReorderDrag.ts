import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Manages vertical drag-to-reorder gesture for timezone strips.
 * Owns the wrapper ref (returned for App to attach to its container div),
 * all reorder state, and caches strip rects at drag-start to avoid
 * layout thrashing on every pointermove event.
 */
export function useReorderDrag(setTzs: Dispatch<SetStateAction<string[]>>) {
  const [reorderDraggedIndex, setReorderDraggedIndex] = useState<number | null>(null);
  const [reorderLineTop, setReorderLineTop] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const reorderRef = useRef<{ draggedIndex: number; insertIndex: number } | null>(null);
  const cachedRectsRef = useRef<DOMRect[] | null>(null);

  const updateReorderLine = useCallback((pointerY: number) => {
    const wrapper = wrapperRef.current;
    const reorderState = reorderRef.current;
    if (!wrapper || !reorderState) return;

    const stripRects = cachedRectsRef.current;
    if (!stripRects || stripRects.length === 0) return;

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
    cachedRectsRef.current = null;
    setReorderDraggedIndex(null);
    setReorderLineTop(null);
  }, [setTzs]);

  const handleReorderStart = useCallback((index: number, pointerY: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    reorderRef.current = { draggedIndex: index, insertIndex: index };
    setReorderDraggedIndex(index);

    // Cache strip rects at drag start to avoid layout queries on every move event
    const strips = Array.from(wrapper.querySelectorAll<HTMLElement>(".TZStrip"));
    cachedRectsRef.current = strips.map(s => s.getBoundingClientRect());

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

  return { reorderDraggedIndex, reorderLineTop, handleReorderStart, wrapperRef };
}
