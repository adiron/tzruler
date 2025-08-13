import { Temporal } from 'temporal-polyfill';
import { instantToHHMM, numberToPaddedString } from './utils';
import { useTime } from './TimeContext';

export default function TopBarTime() {
  const time = useTime();
  const utcTime = Temporal.Instant.fromEpochMilliseconds(time).toZonedDateTimeISO("UTC");
  return <div className="TopBar__time">
    <div>
      {utcTime.year}-{numberToPaddedString(utcTime.month)}-{numberToPaddedString(utcTime.day)}
    </div>
    <div>
      {instantToHHMM(utcTime)}
    </div>
  </div>
}
