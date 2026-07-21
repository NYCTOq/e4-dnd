export function clampStepValue(value: number, min: number, max: number, delta: number) {
  const safe = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, safe + delta));
}

type Props = {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function NumberStepper({ value, min, max, label, onChange, disabled = false }: Props) {
  return (
    <div className="number-stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="number-stepper-button"
        aria-label={`${label} azalt`}
        disabled={disabled || value <= min}
        onClick={() => onChange(clampStepValue(value, min, max, -1))}
      >
        −
      </button>
      <output className="number-stepper-value" aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </output>
      <button
        type="button"
        className="number-stepper-button"
        aria-label={`${label} artır`}
        disabled={disabled || value >= max}
        onClick={() => onChange(clampStepValue(value, min, max, 1))}
      >
        +
      </button>
    </div>
  );
}
