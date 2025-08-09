import './TopBar.css'
import { Temporal } from 'temporal-polyfill';
import { instantToHHMM, numberToPaddedString } from './utils';
import { useTime } from './TimeContext';

export function TopBar() {
  const time = useTime();
  const utcTime = Temporal.Instant.fromEpochMilliseconds(time).toZonedDateTimeISO("UTC");
  return <div className="TopBar">
    <div className="TopBar__logo">
      tzruler
      <a className="TopBar__credit" href="https://adiron.me/" target="_blank">adi ron me fecit</a>
    </div>

    <div className="TopBar__time">
      <div>
        {utcTime.year}-{numberToPaddedString(utcTime.month)}-{numberToPaddedString(utcTime.day)}
      </div>
      <div>
        {instantToHHMM(utcTime)}
      </div>
    </div>

  </div>;
}

