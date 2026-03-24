import * as React from 'react'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: (string | MultiSelectOption)[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

function normalize(opt: string | MultiSelectOption): MultiSelectOption {
  return typeof opt === 'string' ? { value: opt, label: opt } : opt
}

export function MultiSelect({ options, value, onChange, placeholder = 'Selecione...', className }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const normalized = React.useMemo(() => options.map(normalize), [options])
  const labelMap = React.useMemo(() => new Map(normalized.map((o) => [o.value, o.label])), [normalized])

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val])
  }

  const remove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== val))
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          !value.length && 'text-muted-foreground',
        )}
      >
        <span className="flex flex-wrap gap-1 overflow-hidden">
          {value.length === 0 && placeholder}
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {labelMap.get(v) ?? v}
              <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={(e) => remove(v, e)} />
            </span>
          ))}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {normalized.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma opção</p>
          )}
          {normalized.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                'flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                value.includes(opt.value) && 'bg-accent text-accent-foreground font-medium',
              )}
            >
              <span
                className={cn(
                  'mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary',
                  value.includes(opt.value) ? 'bg-primary text-primary-foreground' : 'opacity-50',
                )}
              >
                {value.includes(opt.value) && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
