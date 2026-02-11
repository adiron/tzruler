import { useRef } from 'react';
import './TopBar.scss'
import SettingsMenu from './SettingsMenu';
import TopBarTime from './TopBarTime';

type TopBarProps = {
  selectedDate: string;
  onNavigateToDate: (date: string) => void;
};

export function TopBar({ selectedDate, onNavigateToDate }: TopBarProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  };

  return <div className="TopBar">
    <div className="TopBar__logo">
      tzruler
      <a className="TopBar__credit" href="https://github.com/adiron/tzruler" target="_blank">source</a>
    </div>

    <TopBarTime />

    <div className="TopBar__jumpDate">
      <button className="TopBar__jumpDateButton" onClick={openDatePicker}>
        jump
      </button>
      <input
        ref={dateInputRef}
        className="TopBar__jumpDateInput TopBar__jumpDateInput--hidden"
        type="date"
        value={selectedDate}
        onChange={(e) => onNavigateToDate(e.target.value)}
        aria-label="Jump to date"
      />
    </div>

    <SettingsMenu />

  </div>;
}
