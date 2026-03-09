import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

interface HeatmapLayerProps {
  points: [number, number, number][]
  options?: Record<string, unknown>
}

export function HeatmapLayer({ points, options }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) return

    const heat = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.2: '#2563eb',
        0.4: '#06b6d4',
        0.6: '#22c55e',
        0.8: '#eab308',
        1.0: '#ef4444',
      },
      ...options,
    })

    heat.addTo(map)
    return () => { map.removeLayer(heat) }
  }, [map, points, options])

  return null
}
