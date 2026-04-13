import * as React from 'react'
import { getDaysInMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'

/* ─── Scroll Column ─── */

interface ColumnProps {
  items: { value: number; label: string }[]
  selected: number
  onChange: (value: number) => void
  className?: string
}

const ITEM_H = 36
const VISIBLE = 5
const CENTER = Math.floor(VISIBLE / 2) // index 2 = center row

function ScrollColumn({ items, selected, onChange, className }: ColumnProps) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const suppressSnap = React.useRef(false)
  const snapTimer = React.useRef<ReturnType<typeof setTimeout>>()

  const selectedIdx = items.findIndex(i => i.value === selected)

  // scroll to selected on mount (instant) and on external change (smooth)
  const didMount = React.useRef(false)
  React.useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const top = selectedIdx * ITEM_H
    if (!didMount.current) {
      el.scrollTop = top
      didMount.current = true
    } else if (!suppressSnap.current) {
      el.scrollTo({ top, behavior: 'smooth' })
    }
  }, [selectedIdx])

  function snap() {
    if (snapTimer.current) clearTimeout(snapTimer.current)
    snapTimer.current = setTimeout(() => {
      const el = listRef.current
      if (!el) return
      const idx = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
      if (items[clamped] && items[clamped].value !== selected) {
        suppressSnap.current = true
        onChange(items[clamped].value)
        requestAnimationFrame(() => { suppressSnap.current = false })
      }
    }, 100)
  }

  function nudge(dir: -1 | 1) {
    const next = selectedIdx + dir
    if (next < 0 || next >= items.length) return
    onChange(items[next].value)
  }

  function handleClick(idx: number) {
    suppressSnap.current = true
    onChange(items[idx].value)
    const el = listRef.current
    if (el) el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
    requestAnimationFrame(() => { suppressSnap.current = false })
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Arrow up */}
      <button
        type="button"
        onClick={() => nudge(-1)}
        className="flex h-6 w-full items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        tabIndex={-1}
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      {/* Scrollable list */}
      <div className="relative w-full" style={{ height: VISIBLE * ITEM_H }}>
        {/* Center highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 rounded-md bg-primary/10 border border-primary/20"
          style={{ top: CENTER * ITEM_H, height: ITEM_H }}
        />

        <div
          ref={listRef}
          onScroll={snap}
          className="h-full overflow-y-auto scrollbar-hide"
          style={{ paddingTop: CENTER * ITEM_H, paddingBottom: CENTER * ITEM_H }}
        >
          {items.map((item, idx) => {
            const isActive = item.value === selected
            return (
              <div
                key={item.value}
                onClick={() => handleClick(idx)}
                className={cn(
                  'flex cursor-pointer select-none items-center justify-center transition-all',
                  isActive
                    ? 'text-foreground font-semibold text-base'
                    : 'text-muted-foreground/50 text-sm hover:text-muted-foreground/80',
                )}
                style={{ height: ITEM_H }}
              >
                {item.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Arrow down */}
      <button
        type="button"
        onClick={() => nudge(1)}
        className="flex h-6 w-full items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        tabIndex={-1}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ─── Main Calendar (Picker) ─── */

interface CalendarProps {
  selected?: Date
  onSelect: (date: Date) => void
  onCancel?: () => void
  className?: string
}

const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function Calendar({ selected, onSelect, onCancel, className }: CalendarProps) {
  const now = new Date()
  const [day, setDay] = React.useState(selected?.getDate() ?? now.getDate())
  const [month, setMonth] = React.useState(selected?.getMonth() ?? now.getMonth())
  const [year, setYear] = React.useState(selected?.getFullYear() ?? now.getFullYear())

  const maxDay = getDaysInMonth(new Date(year, month))
  const clampedDay = Math.min(day, maxDay)

  React.useEffect(() => {
    if (day > maxDay) setDay(maxDay)
  }, [month, year, day, maxDay])

  const dayItems = Array.from({ length: maxDay }, (_, i) => ({
    value: i + 1,
    label: String(i + 1).padStart(2, '0'),
  }))

  const monthItems = MONTHS_SHORT.map((label, i) => ({ value: i, label }))

  const currentYear = now.getFullYear()
  const yearItems = Array.from({ length: 121 }, (_, i) => {
    const y = currentYear - 100 + i
    return { value: y, label: String(y) }
  })

  function handleConfirm() {
    onSelect(new Date(year, month, clampedDay))
  }

  const headerText = `${clampedDay} de ${MONTHS_FULL[month]} de ${year}`

  return (
    <div className={cn('w-[290px]', className)}>
      {/* Header */}
      <div className="mb-2 pb-2 border-b">
        <p className="text-sm font-medium text-foreground">{headerText}</p>
      </div>

      {/* Column labels */}
      <div className="flex gap-2 mb-1">
        <span className="flex-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Dia</span>
        <span className="flex-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Mês</span>
        <span className="flex-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">Ano</span>
      </div>

      {/* Columns */}
      <div className="flex gap-2">
        <ScrollColumn items={dayItems} selected={clampedDay} onChange={setDay} className="flex-1" />
        <ScrollColumn items={monthItems} selected={month} onChange={setMonth} className="flex-1" />
        <ScrollColumn items={yearItems} selected={year} onChange={setYear} className="flex-1" />
      </div>

      {/* Actions */}
      <div className="mt-2 flex justify-end gap-1 pt-2 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }
export type { CalendarProps }
