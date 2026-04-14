import * as React from 'react'
import { format, parse, isValid } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calendar } from './calendar'
import { Input } from './input'

interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function DatePicker({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    const date = parse(value, 'yyyy-MM-dd', new Date())
    return isValid(date) ? date : undefined
  }, [value])

  const [inputValue, setInputValue] = React.useState('')

  React.useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, 'dd/MM/yyyy'))
    } else {
      setInputValue('')
    }
  }, [selectedDate])

  function handleSelect(date: Date) {
    onChange(format(date, 'yyyy-MM-dd'))
    setInputValue(format(date, 'dd/MM/yyyy'))
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 8) val = val.substring(0, 8)
    
    if (val.length > 4) {
      val = `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4)}`
    } else if (val.length > 2) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`
    }
    
    setInputValue(val)
    
    if (val.length === 10) {
      const date = parse(val, 'dd/MM/yyyy', new Date())
      if (isValid(date)) {
        onChange(format(date, 'yyyy-MM-dd'))
      }
    } else if (val.length === 0) {
      onChange('')
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        disabled={disabled}
        className="w-full pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="absolute inset-y-0 right-0 p-3 flex items-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <Calendar
            selected={selectedDate}
            onSelect={handleSelect}
            onCancel={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

DatePicker.displayName = 'DatePicker'

export { DatePicker }
export type { DatePickerProps }
