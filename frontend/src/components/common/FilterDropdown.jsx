import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const dropdownVariants = {
  hidden: { opacity: 0, y: -4, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export default function FilterDropdown({
  label,
  options = [],
  value,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : label;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange && onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#202A25] hover:border-[#145A43]/30 focus:outline-none focus:ring-2 focus:ring-[#145A43]/20 transition-colors"
      >
        <span className={selectedOption ? 'text-[#202A25]' : 'text-[#6B756F]'}>
          {displayText}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-[#6B756F]" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-0 mt-1 w-full min-w-[180px] bg-white rounded-lg border border-[#E5E7EB] shadow-lg z-20 py-1 overflow-hidden"
          >
            {options.map((option) => (
              <li key={option.value}>
                <button
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    option.value === value
                      ? 'bg-[#145A43]/5 text-[#145A43] font-medium'
                      : 'text-[#202A25] hover:bg-[#F7F9F6]'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
