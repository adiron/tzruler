import { useEffect, useRef, useState, } from "react";
import { useSettings } from "./SettingsContext";
import "./SettingsMenu.scss";

export default function SettingsMenu() {
  const [settings, setSettings] = useSettings();
  const [open, setOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current) return;

      if (e.target instanceof Node &&
        !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    }
  }, []);

  return <div
    className="SettingsMenu"
    ref={containerRef}
  >
    <button
      className={"SettingsMenu__button" + (open ? " SettingsMenu__button--open" : "")}
      onClick={() => setOpen(!open)}
    >
      settings
    </button>
    <div
      className={"SettingsMenu__menu" + (open ? " SettingsMenu__menu--open" : "")}
    >
      <div className="SettingsMenu__item">
        <span>Pixels per hour</span>
        <input
          onChange={e => setSettings(s => ({ ...s, hourSize: parseInt(e.target.value) }))}
          value={settings.hourSize}
        />
      </div>
      <div className="SettingsMenu__item">
        <span>Show ahead/behind areas vs. 1st timezone</span>
        <input
          type="checkbox"
          onChange={e => setSettings(s => ({ ...s, aheadBehind: e.target.checked }))}
          checked={settings.aheadBehind}
        />
      </div>
      <div className="SettingsMenu__item">
        <span>Snap to</span>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          {[
            { value: undefined, label: 'None' },
            { value: 10, label: '10 minutes' },
            { value: 15, label: '15 minutes' },
            { value: 30, label: '30 minutes' }
          ].map(option => (
            <label key={option.value ?? 'none'} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="radio"
                name="snapTo"
                checked={!settings.snapTo ? option.value === undefined : settings.snapTo === option.value}
                onChange={() => setSettings(s => ({ ...s, snapTo: option.value }))}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  </div>
}
