import { useState } from "react";

export interface RangeOption{
  label: string;
  value: number | string;
};

interface Props {
  value: number | string;
  options: RangeOption[];
  onChange: (val: any) => void;
}

export function RangeSelect ({ value, options, onChange }: Props) {
const [isOpen, setIsOpen] = useState(false);

const currentOption = options.find(i => i.value === value)?.label || options[0]?.label || 'Select';

const handleSelect = (item: RangeOption) => {
  setIsOpen(false);
  onChange(item.value);
};

return (
  <div className="relative inline-block text-left">
    {/* Trigger Button */}
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="bg-[#CDEE6E] hover:bg-[#bfe05e] text-black text-xs px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 cursor-pointer min-w-[100px] justify-between"
    >
      {currentOption}
      <span className={`text-[10px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
        ▼
      </span>
    </button>

    {/* Dropdown Menu */}
    {isOpen && (
      <>
        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-green-50 hover:text-green-700 cursor-pointer
                ${opt.value === value ? "bg-green-50 text-green-800" : "text-gray-600"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </>
    )}
  </div>
);}
