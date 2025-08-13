/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS } from "./constants";

export interface TZRulerSettings {
  hourSize: number;
  hourDivisions: number;
  aheadBehind: boolean;
}

type TZRulerSettingsContextValue = [ 
  settings: TZRulerSettings,
  setSettings: React.Dispatch<React.SetStateAction<TZRulerSettings>>
]

const SettingsContext = createContext<TZRulerSettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TZRulerSettings>(DEFAULT_SETTINGS);

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
