import type { Icon } from '@phosphor-icons/react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: Icon;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  name,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="seg">
      {options.map((option) => {
        const Icon = option.icon;

        return (
          <label key={option.value} className="seg-opt">
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {Icon ? <Icon size={15} /> : null}
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
