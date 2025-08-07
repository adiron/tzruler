import './TopBar.css'
import { Temporal } from 'temporal-polyfill';
import { numberToPaddedString } from './utils';

export function TopBar() {
    const time = Temporal.Instant.fromEpochMilliseconds(Date.now()).toZonedDateTimeISO("UTC");
    return <div className="TopBar">
        <div className="TopBar__logo">tzruler</div>

        <div className="TopBar__time">
            <div>
                {time.year}-{numberToPaddedString(time.month)}-{numberToPaddedString(time.day)}
            </div>
            <div>
                {numberToPaddedString(time.hour)}:{numberToPaddedString(time.minute)}:{numberToPaddedString(time.second)}
            </div>
        </div>

    </div>;
}

