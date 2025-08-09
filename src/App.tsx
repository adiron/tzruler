import { useEffect, useState, } from 'react'
import './TZStrip.css'
import { TopBar } from './TopBar'
import { TZStrip } from './TZStrip'
import { MS_PER_PIXEL } from './constants'
import { useTime } from './TimeContext'


function App() {
  const [tzs, setTzs] = useState<string[]>(["Europe/Amsterdam", "Asia/Jerusalem", "America/New_York", "Asia/Kolkata"])
  const [focusTime, setFocusTime] = useState<number | null>();

  const currentTime = useTime();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleChange = (prev:number, next:number) => {
      // Offset in pixels:
      const sub = prev - next;
      setFocusTime(
        Math.round((focusTime || currentTime) + (sub * MS_PER_PIXEL))
      )
    }
    const mouse = (e: MouseEvent) => {
      if (!isDragging || !mousePos) return;
      const pos: [number,number] = [e.clientX, e.clientY];
      handleChange(mousePos[0], pos[0]);
      setMousePos(pos);
    };
    const touch = (e: TouchEvent) => {
      if (!isDragging || !mousePos) return;
      const pos: [number,number] = [e.touches[0].clientX, e.touches[0].clientY];
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
      Math.round((focusTime || currentTime) + (e * MS_PER_PIXEL))
    )
  }

  return (
    <>
      <TopBar />
      {tzs.map(
        (e, i) => <TZStrip
          isDirty={!!focusTime}
          tz={e}
          key={i}
          only={tzs.length === 1}
          onReset={() => setFocusTime(null)}
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
    </>
  )
}

export default App
