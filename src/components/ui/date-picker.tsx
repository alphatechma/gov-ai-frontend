import * as React from 'react'
import { format, parse, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calendar } from './calendar'

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
  placeholder = 'Selecione uma data',
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    const date = parse(value, 'yyyy-MM-dd', new Date())
    return isValid(date) ? date : undefined
  }, [value])

  function handleSelect(date: Date) {
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const displayValue = selectedDate
    ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            !displayValue && 'text-muted-foreground',
            className,
          )}
        >
          <span>{displayValue || placeholder}</span>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <Calendar
          selected={selectedDate}
          onSelect={handleSelect}
          onCancel={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

DatePicker.displayName = 'DatePicker'

export { DatePicker }
export type { DatePickerProps }
