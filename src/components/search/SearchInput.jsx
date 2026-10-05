import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

/**
 * Shared reusable SearchInput component for Ingress Within self-help launch.
 *
 * Supports:
 * - Controlled or uncontrolled value
 * - Configurable debounce (default 300ms)
 * - Clear button (accessible with keyboard)
 * - Loading indicator
 * - Accessible ARIA labels and roles
 * - Optional result count indicator
 * - Escape key behavior to clear
 */
export default function SearchInput({
  value: controlledValue,
  defaultValue = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  debounceMs = 300,
  isLoading = false,
  resultCount = null,
  ariaLabel = 'Search',
  className = '',
  inputClassName = '',
  autoFocus = false,
  id = 'search-input',
  disabled = false,
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(isControlled ? controlledValue : defaultValue);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal value if controlled
  useEffect(() => {
    if (isControlled) {
      setInternalValue(controlledValue || '');
    }
  }, [controlledValue, isControlled]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const triggerChange = (newVal) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onChange) onChange(newVal);
      if (onSearch) onSearch(newVal);
    }, debounceMs);
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    if (!isControlled) {
      setInternalValue(newVal);
    }
    triggerChange(newVal);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (!isControlled) {
      setInternalValue('');
    }
    if (onChange) onChange('');
    if (onSearch) onSearch('');
    if (onClear) onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && internalValue) {
      e.preventDefault();
      handleClear();
    }
  };

  const currentVal = isControlled ? controlledValue : internalValue;

  const sizeClasses = {
    sm: 'py-1.5 pl-8 pr-8 text-xs',
    md: 'py-2.5 pl-10 pr-9 text-xs sm:text-sm',
    lg: 'py-3.5 pl-11 pr-10 text-sm sm:text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <label htmlFor={id} className="sr-only">
        {ariaLabel}
      </label>

      {/* Leading Search Icon or Loading Spinner */}
      <div className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-mid/60 flex items-center justify-center">
        {isLoading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin text-accent" />
        ) : (
          <Search size={iconSizes[size]} />
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="search"
        role="searchbox"
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        disabled={disabled}
        value={currentVal || ''}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-xl bg-warm-paper/70 border border-primary/15 text-primary placeholder:text-mid/50 focus:outline-none focus:border-accent/60 focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${inputClassName}`}
      />

      {/* Trailing actions: result count badge or clear button */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {resultCount !== null && currentVal && (
          <span className="text-[10px] font-mono font-medium text-mid/70 px-1.5 py-0.5 rounded bg-primary/5 hidden sm:inline-block">
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
          </span>
        )}

        {Boolean(currentVal) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="p-1 rounded-full text-mid/60 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={iconSizes[size] - 2} />
          </button>
        )}
      </div>
    </div>
  );
}
