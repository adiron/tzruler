/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS } from "./constants";

export interface TZRulerSettings {
  hourSize: number;
  hourDivisions: number;
  aheadBehind: boolean;
  snapTo: number | null;
  /** Auto-reset timeout in seconds. 0 = never. */
  autoReset: number;
}

type TZRulerSettingsContextValue = [
  settings: TZRulerSettings,
  setSettings: React.Dispatch<React.SetStateAction<TZRulerSettings>>
]

const SettingsContext = createContext<TZRulerSettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const loadSettings = (): TZRulerSettings => {
    try {
      const stored = localStorage.getItem('settings');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<TZRulerSettings>;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  };

  const [settings, setSettingsInternal] = useState<TZRulerSettings>(loadSettings);

  const setSettings: React.Dispatch<React.SetStateAction<TZRulerSettings>> = (value) => {
    setSettingsInternal((prev) => {
      const newSettings = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  return (
    <SettingsContext.Provider value={[settings, setSettings]}>
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
