"use client";

import { useState } from "react";
import { Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface DurationSelectorProps {
  value: number;
  onChange: (duration: number) => void;
  className?: string;
}

const PRESET_DURATIONS = [
  { value: 1, label: "1 day" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
] as const;

export function DurationSelector({
  value,
  onChange,
  className,
}: DurationSelectorProps) {
  const [customValue, setCustomValue] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const isCustom = !PRESET_DURATIONS.some((preset) => preset.value === value);

  const handlePresetChange = (presetValue: number) => {
    setCustomError(null);
    setCustomValue("");
    onChange(presetValue);
  };

  const handleCustomSelect = () => {
    // When custom is selected, default to 1 if no valid custom value
    if (customValue && isValidDuration(customValue)) {
      onChange(Number(customValue));
    } else {
      onChange(1);
      setCustomValue("1");
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomValue(inputValue);

    if (!inputValue) {
      setCustomError(null);
      return;
    }

    if (isValidDuration(inputValue)) {
      setCustomError(null);
      onChange(Number(inputValue));
    } else {
      setCustomError("Duration must be a positive number between 1 and 365 days");
    }
  };

  const isValidDuration = (val: string): boolean => {
    const num = Number(val);
    return (
      !isNaN(num) &&
      Number.isInteger(num) &&
      num > 0 &&
      num <= 365
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-base font-semibold">
        How long is this task/habit?
      </Label>

      <div
        role="radiogroup"
        aria-label="Select task duration"
        aria-describedby={customError ? "duration-error" : undefined}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
      >
        {PRESET_DURATIONS.map((preset) => (
          <label
            key={preset.value}
            className={cn(
              "relative flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
              "hover:border-gray-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
              value === preset.value
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700"
            )}
          >
            <input
              type="radio"
              name="duration"
              value={preset.value}
              checked={value === preset.value}
              onChange={() => handlePresetChange(preset.value)}
              className="sr-only"
              aria-label={preset.label}
            />
            <span>{preset.label}</span>
            {value === preset.value && (
              <Check
                className="absolute right-2 top-2 h-4 w-4 text-blue-600"
                aria-hidden="true"
              />
            )}
          </label>
        ))}

        {/* Custom Option */}
        <label
          className={cn(
            "relative flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
            "hover:border-gray-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
            isCustom
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-300 bg-white text-gray-700"
          )}
        >
          <input
            type="radio"
            name="duration"
            value="custom"
            checked={isCustom}
            onChange={handleCustomSelect}
            className="sr-only"
            aria-label="Custom"
          />
          <span>Custom</span>
          {isCustom && (
            <Check
              className="absolute right-2 top-2 h-4 w-4 text-blue-600"
              aria-hidden="true"
            />
          )}
        </label>
      </div>

      {/* Custom Input Field */}
      {isCustom && (
        <div className="space-y-2 pl-1">
          <Label htmlFor="custom-duration" className="text-sm font-medium">
            Enter custom duration (days)
          </Label>
          <input
            id="custom-duration"
            type="number"
            min="1"
            max="365"
            step="1"
            value={customValue}
            onChange={handleCustomInputChange}
            placeholder="e.g., 14"
            aria-invalid={!!customError}
            aria-describedby={customError ? "duration-error" : undefined}
            className={cn(
              "block w-full max-w-[200px] rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              customError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300"
            )}
          />
        </div>
      )}

      {/* Error Message */}
      {customError && (
        <p
          id="duration-error"
          role="alert"
          className="text-sm font-medium text-red-600"
        >
          {customError}
        </p>
      )}
    </div>
  );
}
