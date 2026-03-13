import { Input } from '@/components/ui/input'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

const PRESETS = [
  '#1a56db', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#ef4444', '#f59e0b', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#374151',
]

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value || '#1a56db'}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-md border border-input p-0.5"
          />
        </div>
        <Input
          value={value || ''}
          onChange={(e) => {
            const v = e.target.value
            if (v === '' || /^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
          }}
          placeholder="#1a56db"
          className="w-28 font-mono text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="h-6 w-6 rounded-md border border-border transition-transform hover:scale-110 cursor-pointer"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}
