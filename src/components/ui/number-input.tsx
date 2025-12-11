import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Input } from "./input"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value = 0, onValueChange, min, max, step = 1, ...props }, ref) => {
    const handleIncrement = () => {
      const newValue = value + step
      if (max === undefined || newValue <= max) {
        onValueChange?.(newValue)
      }
    }

    const handleDecrement = () => {
      const newValue = value - step
      if (min === undefined || newValue >= min) {
        onValueChange?.(newValue)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value) || 0
      if ((min === undefined || newValue >= min) && (max === undefined || newValue <= max)) {
        onValueChange?.(newValue)
      }
    }

    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Input
          ref={ref}
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-20 text-center"
          {...props}
        />
        <div className="flex flex-col">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-6 rounded-none rounded-t-sm"
            onClick={handleIncrement}
            disabled={max !== undefined && value >= max}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-4 w-6 rounded-none rounded-b-sm"
            onClick={handleDecrement}
            disabled={min !== undefined && value <= min}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
