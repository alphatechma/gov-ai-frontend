import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Pick a container the browser can actually record. Chrome/Firefox/Edge give us
 * webm/opus; Safari only records mp4/aac. Evolution transcodes both to
 * ogg/opus before sending, so either is fine on the wire.
 */
const CANDIDATE_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
]

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return CANDIDATE_TYPES.find(t => MediaRecorder.isTypeSupported(t))
}

export interface RecordedAudio {
  blob: Blob
  url: string
  seconds: number
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [recorded, setRecorded] = useState<RecordedAudio | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** Set when the user cancels, so onstop discards instead of publishing. */
  const discardRef = useRef(false)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Gravação de áudio não é suportada neste navegador.')
      return
    }

    const mimeType = pickMimeType()
    if (!mimeType) {
      setError('Nenhum formato de áudio suportado por este navegador.')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      // NotAllowedError (denied) and NotFoundError (no mic) land here alike.
      setError('Permissão de microfone negada ou microfone não encontrado.')
      return
    }

    // Drop any take the user recorded but never sent.
    setRecorded(prev => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })

    streamRef.current = stream
    chunksRef.current = []
    discardRef.current = false

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      stopTracks()
      setIsRecording(false)

      if (discardRef.current) {
        chunksRef.current = []
        return
      }

      const blob = new Blob(chunksRef.current, { type: mimeType })
      chunksRef.current = []
      if (blob.size === 0) return

      setSeconds(elapsed => {
        setRecorded({ blob, url: URL.createObjectURL(blob), seconds: elapsed })
        return elapsed
      })
    }

    recorder.start()
    setSeconds(0)
    setIsRecording(true)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }, [stopTracks])

  /** Stop and keep the take, so it can be previewed and then sent. */
  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      discardRef.current = false
      recorderRef.current.stop()
    }
  }, [])

  /** Stop and throw the take away. */
  const cancel = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      discardRef.current = true
      recorderRef.current.stop()
    } else {
      stopTracks()
      setIsRecording(false)
    }
    setSeconds(0)
    setRecorded(prev => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [stopTracks])

  /** Drop the pending take once it has been sent. */
  const reset = useCallback(() => {
    setSeconds(0)
    setRecorded(prev => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        discardRef.current = true
        recorderRef.current.stop()
      }
      stopTracks()
    }
  }, [stopTracks])

  return { isRecording, seconds, recorded, error, start, stop, cancel, reset, clearError: () => setError(null) }
}

/** 78 → "1:18" */
export function formatDuration(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
