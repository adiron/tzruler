/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const TimeContext = createContext<number | null>(null);

export function TimeProvider({ children }: { children: ReactNode }) {
  const [time, setTime] = useState<number>(Date.now());

  useEffect(() => {
    const id = setInterval(() => setTime(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <TimeContext.Provider value={time}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime(): number {
  const time = useContext(TimeContext);
  if (!time) {
    throw new Error("useTime must be used within a TimeProvider");
  }
  return time;
}
