import 'react';
import { HOUR_DIVISIONS, HOUR_SIZE } from './constants';

interface StripHourParams {
  additional: string | null,
  epochToPixels: (arg0: number) => number,
  text: string,
  time: number,
}

export function StripHour({ additional, epochToPixels, text, time }: StripHourParams) {
  return <div
    className={"TZStrip__hourMark " + (additional ? " TZStrip__hourMark--withAdditional" : "")}
    key={`${text}-${additional}`}
    style={{ left: `${epochToPixels(time)}px` }}
  >
    {additional && <div className="TZStrip__hourMarkAdditional">{additional}</div>}
    <div
      className="TZStrip__hourMarkText"
    >{text}</div>

    {
      Array.from({ length: HOUR_DIVISIONS - 1 }, (_, i) => i + 1)
        .map(i => (
          <div
            key={i}
            className="TZStrip__hourMarkDivision"
            style={{
              transform: `translateX(${(HOUR_SIZE / HOUR_DIVISIONS) * i}px)`
            }}
          />
        ))
    }
  </div>
}
