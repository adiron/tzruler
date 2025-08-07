import { useEffect, useState } from 'react'
import './TZStrip.css'
import { TopBar } from './TopBar'
import { TZStrip } from './TZStrip'

function App() {
  const [tzs, setTzs] = useState<string[]>(["Europe/Amsterdam", "Asia/Jerusalem", "America/New_York", "Asia/Kolkata"])
  const [focusTime, setFocusTime] = useState<number|null>();
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const f = () => {
      setCurrentTime(Date.now());
    }
    const i = setInterval(f, 500);
    return () => { clearInterval(i) }
  })

  return (
    <>
      <TopBar />
      {tzs.map(
        (e,i) => <TZStrip 
          isDirty={!!focusTime}
          tz={e} 
          key={i} 
          onRemove={() => setTzs(tzs.filter((t) => t !== e))} 
          focusTime={focusTime || currentTime}
        />
      )}
    </>
  )
}

export default App
