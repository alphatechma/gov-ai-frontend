import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  value: string | null
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
  accept?: string
  maxSizeKB?: number
  label?: string
  className?: string
}

export function ImageUpload({
  value,
  onUpload,
  onRemove,
  accept = 'image/*',
  maxSizeKB = 2048,
  label,
  className = '',
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    if (file.size > maxSizeKB * 1024) {
      setError(`Arquivo muito grande. Max: ${maxSizeKB}KB`)
      return
    }
    setLoading(true)
    try {
      await onUpload(file)
    } catch {
      setError('Erro ao enviar arquivo')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium">{label}</label>}

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt=""
            className="h-24 w-24 rounded-lg border object-contain bg-muted p-1"
          />
          {onRemove && (
            <button
              type="button"
              onClick={async () => {
                setLoading(true)
                try {
                  await onRemove()
                } finally {
                  setLoading(false)
                }
              }}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/80 cursor-pointer"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex h-24 w-full max-w-xs cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <span className="text-xs">Arrastar ou clicar</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {!value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Enviar
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
