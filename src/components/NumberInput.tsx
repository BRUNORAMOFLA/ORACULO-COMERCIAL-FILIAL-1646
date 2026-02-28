
import React, { useState, useEffect } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  plain?: boolean;
  percent?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  label,
  plain = false,
  percent = false
}) => {
  const [displayValue, setDisplayValue] = useState("");

  // Format number to BR string (dots for thousands) or plain string or percent
  const format = (num: number | string) => {
    const clean = String(num).replace(/\D/g, "");
    if (!clean) return "";
    
    if (percent) {
      if (clean.length === 1) {
        return clean + ",0";
      }
      const formatted = (Number(clean) / 10).toFixed(1);
      return formatted.replace(".", ",");
    }

    if (plain) return clean;
    return Number(clean).toLocaleString('pt-BR');
  };

  // Update display value when prop value changes (e.g. on load or reset)
  useEffect(() => {
    // For percent, if value is 1.1, we want it to show "1,1"
    // The internal value is stored as a number (e.g. 1.1)
    // But the formatting logic expects a numeric string that represents the value multiplied by 10 if it has decimals?
    // User said: 1 -> 1,0; 11 -> 1,1; 191 -> 19,1
    // This means the input "11" results in 1.1.
    // So if value is 1.1, we should format it.
    if (percent && value !== undefined) {
      const val = Math.round(value * 10);
      setDisplayValue(format(val));
    } else {
      setDisplayValue(format(value || ""));
    }
  }, [value, percent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    
    // Remove leading zeros
    const cleanValue = rawValue.replace(/^0+/, "");
    
    if (cleanValue === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    if (percent) {
      const numericValue = cleanValue.length === 1 ? parseInt(cleanValue, 10) : parseInt(cleanValue, 10) / 10;
      setDisplayValue(format(cleanValue));
      onChange(numericValue);
    } else {
      const numericValue = parseInt(cleanValue, 10);
      setDisplayValue(format(numericValue));
      onChange(numericValue);
    }
  };

  return (
    <div className="space-y-1 w-full">
      {label && <label className="text-[9px] font-bold uppercase text-zinc-400 block">{label}</label>}
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full p-2 text-sm border rounded-lg bg-zinc-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${className}`}
      />
    </div>
  );
};
