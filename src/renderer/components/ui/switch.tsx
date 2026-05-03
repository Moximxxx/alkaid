import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
    }

    return (
      <div className="relative inline-flex h-6 w-11 items-center">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "h-5 w-9 cursor-pointer rounded-full bg-input transition-colors peer-checked:bg-primary",
            className
          )}
        />
        <div className="absolute left-0.5 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
      </div>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
