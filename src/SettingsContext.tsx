/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";

interface TZRulerSettings {
  hourSize: number;
  hourDivisions: number;
}

type TZRulerSettingsContextValue = [ 
  settings: TZRulerSettings,
  setSettings: React.Dispatch<React.SetStateAction<TZRulerSettings>>
]

const defaultSettings: TZRulerSettings = {
  hourSize: 80,
  hourDivisions: 4,
};

const SettingsContext = createContext<TZRulerSettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TZRulerSettings>(defaultSettings);

  return (
    <SettingsContext.Provider value={[ settings, setSettings ]}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): TZRulerSettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useTZRulerSettings must be used within a TZRulerSettingsProvider");
  }
  return context;
}
