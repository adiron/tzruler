import "./RadioButtons.scss";

interface RadioButtonsProps<T> {
  options: { value: T, label: string }[],
  value: T,
  onChange: (v: T) => void;
}
export default function RadioButtons<T>({ options, value, onChange }: RadioButtonsProps<T>) {
  return <div
    className="RadioButtons"
  >
    {options.map(option => (
      <label
        className="RadioButtons__label"
        key={option.value + ""}
      >
        <input
          className="RadioButtons__radio"
          type="radio"
          checked={option.value === value}
          onChange={() => onChange(option.value)}
        />
        {option.label}
      </label>
    ))}
  </div>
}
