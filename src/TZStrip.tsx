import { useRef, useState, useLayoutEffect } from 'react';
import { Temporal } from 'temporal-polyfill';
import { formatTzName, numberToPaddedString } from './utils';

export interface TZStripParams {
  tz: string;
  onRemove: () => void;
}

export function TZStrip({ tz, onRemove }: TZStripParams) {
    const zoned = Temporal.Instant.fromEpochMilliseconds(Date.now()).toZonedDateTimeISO(tz);
    const offsetNs = zoned.offsetNanoseconds;
    const offsetHours = offsetNs / 1e+9 / 60 / 60;

    const rulerRef = useRef<HTMLDivElement>(null);
    const [rulerWidth, setRulerWidth] = useState(0);

    useLayoutEffect(() => {
        function measure() {
            if (rulerRef.current === null) {
                return;
            }
            setRulerWidth(rulerRef.current.getBoundingClientRect().width);
        }

        measure();
        window.addEventListener("resize", measure);

        return () => window.removeEventListener("resize", measure);
    }, []);

    return <div className="TZStrip">
        <div className="TZStrip__info">
            {formatTzName(tz)}: {numberToPaddedString(zoned.hour)}:{numberToPaddedString(zoned.minute)} ({offsetHours})
            <button onClick={onRemove}>Remove</button>
        </div>
        <div className="TZStrip__ruler" ref={rulerRef}>
            {/* The bar with all the ticks */}
            {rulerWidth}
        </div>
    </div>;
}

