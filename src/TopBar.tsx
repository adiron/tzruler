import './TopBar.scss'
import SettingsMenu from './SettingsMenu';
import { TimeProvider } from './TimeContext';
import TopBarTime from './TopBarTime';

export function TopBar() {
  return <div className="TopBar">
    <div className="TopBar__logo">
      tzruler
      <a className="TopBar__credit" href="https://adiron.me/" target="_blank">adi ron me fecit</a>
    </div>

    <TimeProvider>
      <TopBarTime />
    </TimeProvider>

    <SettingsMenu />

  </div>;
}

