"use client";

import { useEffect, useRef, useState } from "react";

interface CustomDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  addable?: boolean;
  onAdd?: (value: string) => void;
}

export default function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Seleccionar",
  addable = false,
  onAdd,
}: CustomDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const displayOptions = options.includes(value)
    ? options
    : [value, ...options];
  const isSelected = (opt: string) => opt === value;
  const displayValue = value || placeholder;

  const handleSelect = (opt: string) => {
    setNewValue("");
    setAdding(false);
    setOpen(false);
    onChange(opt);
  };

  const handleAdd = () => {
    const v = newValue.trim();
    if (!v) return;
    setNewValue("");
    setAdding(false);
    setOpen(false);
    onChange(v);
    onAdd?.(v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <label className="mb-1 block text-[10px] tracking-wider uppercase font-bold text-slate-500">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs text-slate-300 py-2 px-3 bg-slate-900/80 border border-slate-800 rounded-lg"
      >
        <span className="min-w-0 truncate">{displayValue}</span>
        <i
          className={`fa-solid fa-chevron-down text-[10px] ${open ? "text-amber-400" : "text-slate-500"}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-0.5">
          {displayOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`w-full text-xs px-2.5 py-1.5 rounded-md hover:bg-amber-500/10 transition-colors cursor-pointer flex items-center justify-between ${
                isSelected(opt)
                  ? "text-amber-400 bg-amber-500/5"
                  : "text-slate-400"
              }`}
            >
              {opt}
              {isSelected(opt) && (
                <span className="text-[10px] font-semibold">✓</span>
              )}
            </button>
          ))}

          {addable && (
            <>
              <div className="border-t border-slate-800/60 mt-1 pt-1" />
              {adding ? (
                <div className="flex gap-1.5 mt-1">
                  <input
                    autoFocus
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape") setAdding(false);
                    }}
                    placeholder="Nuevo valor..."
                    className="flex-1 min-w-0 text-xs bg-slate-900/50 border border-slate-800 rounded-md px-2.5 py-1 text-white placeholder-slate-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="text-xs text-amber-400 font-medium px-2.5 py-1.5 rounded-md hover:bg-amber-500/10"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    className="text-xs text-slate-500 px-2.5 py-1.5 rounded-md hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="text-xs text-amber-400 font-medium bg-amber-500/5 hover:bg-amber-500/10 w-full px-2.5 py-1.5 rounded-md flex items-center gap-2 cursor-pointer transition-all duration-150"
                >
                  <i
                    className="fa-solid fa-plus text-[10px]"
                    aria-hidden="true"
                  />
                  Agregar nuevo dato
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
