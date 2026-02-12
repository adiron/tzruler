import { useEffect, useRef, useState, } from "react";
import { useSettings } from "./SettingsContext";
import "./SettingsMenu.scss";
import RadioButtons from "./RadioButtons";

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
        <span>Timeline Scale</span>
        <RadioButtons<number>
          options={[
            { value: 60, label: "Micro" },
            { value: 80, label: "Standard (default)" },
            { value: 120, label: "Big" },
            { value: 160, label: "Macro" },
          ]}
          value={settings.hourSize}
          onChange={v => setSettings(s => ({ ...s, hourSize: v }))}
        />
      </div>
      <div className="SettingsMenu__item">
        <span>Snapping</span>
        <RadioButtons<number | null>
          options={[
            { value: null, label: "No snapping" },
            { value: 15, label: "15 minutes (default)" },
            { value: 30, label: "30 minutes" },
            { value: 60, label: "1 hour" },
          ]}
          value={settings.snapTo}
          onChange={v => setSettings(s => ({ ...s, snapTo: v }))}
        />
      </div>
      <div className="SettingsMenu__item">
        <label>
          <input
            type="checkbox"
            onChange={e => setSettings(s => ({ ...s, aheadBehind: e.target.checked }))}
            checked={settings.aheadBehind}
            style={{marginRight: "8px"}}
          />
          Show Ahead/Behind Range
        </label>
      </div>
    </div>
  </div>
}
