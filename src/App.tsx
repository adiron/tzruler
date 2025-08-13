import { useEffect, useState, } from 'react'
import { TZStrip } from './TZStrip'
import { SNAP_BACK_DURATION } from './constants'
import { useTime } from './TimeContext'
import AddTZ from './AddTZ'
import { easeInOutCubic } from './ease'
import { useSettings } from './SettingsContext'


function App() {
  const [{hourSize}] = useSettings();
  const [tzs, setTzs] = useState<string[]>(["Europe/Amsterdam", "Asia/Jerusalem", "America/New_York", "Asia/Kolkata"])
  const [focusTime, setFocusTime] = useState<number | null>();

  const msPerPixel = (60 * 60 * 1000) / hourSize

  const currentTime = useTime();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

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
        setFocusTime(null); // finally clear to signal "no focus"
      }
    };

    requestAnimationFrame(step);
  };

  useEffect(() => {
    const handleChange = (prev: number, next: number) => {
      // Offset in pixels:
      const sub = prev - next;
      setFocusTime(focusTime =>
        Math.round((focusTime || Date.now()) + (sub * msPerPixel))
      )
    }
    const mouse = (e: MouseEvent) => {
      if (!isDragging || !mousePos) return;
      const pos: [number, number] = [e.clientX, e.clientY];
      handleChange(mousePos[0], pos[0]);
      setMousePos(pos);
    };
    const touch = (e: TouchEvent) => {
      if (!isDragging || !mousePos) return;
      const pos: [number, number] = [e.touches[0].clientX, e.touches[0].clientY];
      handleChange(mousePos[0], pos[0]);
      setMousePos(pos);
    };
    const end = () => {
      setMousePos(null);
      setIsDragging(false);
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
  });

  function handleWheelX(e: number) {
    setFocusTime(
      Math.round((focusTime || currentTime) + (e * msPerPixel))
    )
  }

  return (
    <>
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
            setIsDragging(true);
            setMousePos(pos);
            if (!focusTime) setFocusTime(currentTime);
          }}
        />
      )}
      <AddTZ onAdd={(tz) => setTzs([...tzs, tz])} currentTzs={tzs} />
    </>
  )
}

export default App
