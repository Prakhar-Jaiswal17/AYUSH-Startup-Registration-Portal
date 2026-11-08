import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) {
  const [localValue, setLocalValue] = useState(value || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange && onChange(newVal);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B756F]" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#202A25] placeholder-[#6B756F]/60 focus:outline-none focus:ring-2 focus:ring-[#145A43]/20 focus:border-[#145A43] transition-colors"
      />
    </div>
  );
}
