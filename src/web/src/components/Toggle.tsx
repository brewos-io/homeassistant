import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex items-center h-6 w-11 shrink-0 rounded-full transition-colors duration-200 border",
          checked
            ? "bg-accent border-accent"
            : "bg-theme-muted/20 border-theme-muted/40"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full shadow-md transform transition-transform duration-200",
            checked
              ? "translate-x-[1.375rem] bg-white"
              : "translate-x-1 bg-theme-secondary dark:bg-gray-300"
          )}
        />
      </button>
      {label && (
        <span className="text-sm font-medium text-theme-secondary">
          {label}
        </span>
      )}
    </label>
  );
}
