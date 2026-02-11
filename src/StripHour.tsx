import 'react';
import './StripHour.scss';
import { useSettings } from './SettingsContext';

interface StripHourParams {
  additional: string | null,
  additionalDifferentYear: boolean,
  epochToPixels: (arg0: number) => number,
  text: string,
  time: number,
}

export function StripHour({ additional, additionalDifferentYear, epochToPixels, text, time }: StripHourParams) {
  const [ {hourDivisions, hourSize} ] = useSettings();

  return <div
    className={
      "StripHour__hourMark"
      + (additional ? " StripHour__hourMark--withAdditional" : "")
      + (additionalDifferentYear ? " StripHour__hourMark--differentYear" : "")
    }
    key={`${text}-${additional}`}
    style={{ left: `${epochToPixels(time)}px` }}
  >
    {additional && (
      <div
        className={"StripHour__hourMarkAdditional" + (additionalDifferentYear ? " StripHour__hourMarkAdditional--differentYear" : "")}
      >
        {additional}
      </div>
    )}
    <div
      className="StripHour__hourMarkText"
    >{text}</div>

    {
      Array.from({ length: hourDivisions - 1 }, (_, i) => i + 1)
        .map(i => (
          <div
            key={i}
            className="StripHour__hourMarkDivision"
            style={{
              transform: `translateX(${(hourSize / hourDivisions) * i}px)`
            }}
          />
        ))
    }
  </div>
}
