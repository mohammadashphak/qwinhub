"use client";

import React, { useMemo } from "react";

interface DateTimePickerProps {
  value: string; // expects a datetime-local string: YYYY-MM-DDTHH:mm (24h)
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
}

// Utilities
function splitDateTime(val: string): { date: string; time24: string } {
  if (!val) return { date: "", time24: "" };
  const [d, t] = val.split("T");
  return { date: d || "", time24: (t || "").slice(0, 5) };
}

function to12h(time24: string): { hour: string; minute: string; ampm: "AM" | "PM" } {
  if (!time24) return { hour: "", minute: "", ampm: "AM" };
  const [hStr, mStr] = time24.split(":");
  let h = Number(hStr);
  const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return { hour: String(h), minute: mStr.padStart(2, "0"), ampm };
}

function to24h(hour12: string, minute: string, ampm: "AM" | "PM"): string {
  if (!hour12) return "";
  let h = Number(hour12);
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const hh = String(h).padStart(2, "0");
  const mm = String(Number(minute) || 0).padStart(2, "0");
  return `${hh}:${mm}`;
}

function combine(date: string, time24: string): string {
  if (!date) return "";
  const t = time24 || "00:00";
  return `${date}T${t}`;
}

export default function DateTimePicker({ value, onChange, placeholder = "Pick date & time", disabled, ariaInvalid }: DateTimePickerProps) {
  const parts = useMemo(() => splitDateTime(value), [value]);
  const t12 = useMemo(() => to12h(parts.time24), [parts.time24]);

  const borderClass = ariaInvalid ? "border-red-500" : "border-input";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${disabled ? "opacity-60" : ""}`}>
      <input
        type="date"
        value={parts.date}
        onChange={(e) => onChange(combine(e.target.value, parts.time24))}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        placeholder={placeholder}
        className={`px-3 py-2 rounded-md border bg-white ${borderClass}`}
      />

      {/* Time: hour (1-12), minute (00-59), AM/PM */}
      <select
        value={t12.hour}
        onChange={(e) => {
          const newTime24 = to24h(e.target.value, t12.minute || "00", t12.ampm);
          onChange(combine(parts.date, newTime24));
        }}
        disabled={disabled}
        className={`px-2 py-2 rounded-md border bg-white ${borderClass}`}
        aria-label="Hour"
      >
        <option value="" disabled>
          HH
        </option>
        {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <input
        type="number"
        min={0}
        max={59}
        value={t12.minute}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9]/g, "");
          const num = Math.min(59, Math.max(0, Number(v || 0)));
          const mm = String(num).padStart(2, "0");
          const newTime24 = to24h(t12.hour || "12", mm, t12.ampm);
          onChange(combine(parts.date, newTime24));
        }}
        disabled={disabled}
        className={`w-16 px-2 py-2 rounded-md border bg-white ${borderClass}`}
        aria-label="Minute"
        placeholder="MM"
      />

      <select
        value={t12.ampm}
        onChange={(e) => {
          const val = (e.target.value as "AM" | "PM") || "AM";
          const newTime24 = to24h(t12.hour || "12", t12.minute || "00", val);
          onChange(combine(parts.date, newTime24));
        }}
        disabled={disabled}
        className={`px-2 py-2 rounded-md border bg-white ${borderClass}`}
        aria-label="AM/PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
