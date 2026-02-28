
import React, { useState, useEffect } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  plain?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  label,
  plain = false
}) => {
  const [displayValue, setDisplayValue] = useState("");

  // Format number to BR string (dots for thousands) or plain string
  const format = (num: number | string) => {
    const clean = String(num).replace(/\D/g, "");
    if (!clean) return "";
    if (plain) return clean;
    return Number(clean).toLocaleString('pt-BR');
  };

  // Update display value when prop value changes (e.g. on load or reset)
  useEffect(() => {
    setDisplayValue(format(value || ""));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    
    // Remove leading zeros
    const cleanValue = rawValue.replace(/^0+/, "");
    
    if (cleanValue === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    const numericValue = parseInt(cleanValue, 10);
    setDisplayValue(format(numericValue));
    onChange(numericValue);
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
        className={`w-full p-2 text-sm border rounded-lg bg-zinc-50 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all ${className}`}
      />
    </div>
  );
};
