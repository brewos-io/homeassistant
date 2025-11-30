import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, unit, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-500">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              'input',
              unit && 'pr-12',
              error && 'border-red-400 focus:border-red-500',
              className
            )}
            {...props}
          />
          {unit && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-coffee-400">
              {unit}
            </span>
          )}
        </div>
        {hint && !error && (
          <p className="text-xs text-coffee-400">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

