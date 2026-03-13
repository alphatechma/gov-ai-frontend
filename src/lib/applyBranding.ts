import type { BrandingState } from '@/stores/brandingStore'

type BrandingData = Partial<Pick<
  BrandingState,
  'primaryColor' | 'primaryColorDark' | 'faviconUrl' | 'sidebarColor' | 'headerColor' | 'fontFamily' | 'borderRadius'
>>

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
    else if (max === gn) h = ((bn - rn) / d + 2) / 6
    else h = ((rn - gn) / d + 4) / 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let rn = 0, gn = 0, bn = 0
  if (h < 60) { rn = c; gn = x }
  else if (h < 120) { rn = x; gn = c }
  else if (h < 180) { gn = c; bn = x }
  else if (h < 240) { gn = x; bn = c }
  else if (h < 300) { rn = x; bn = c }
  else { rn = c; bn = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(rn)}${toHex(gn)}${toHex(bn)}`
}

export function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function contrastForeground(hex: string) {
  return luminance(hex) > 0.5 ? '#000000' : '#ffffff'
}

// ─── Palette generation from hue ───

const PALETTE_KEYS = [
  'background', 'foreground', 'card', 'card-foreground',
  'popover', 'popover-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'border', 'input', 'sidebar', 'sidebar-foreground',
  'sidebar-accent', 'sidebar-border',
] as const

function generatePalette(hue: number, isDark: boolean): Record<string, string> {
  if (isDark) {
    return {
      'background': hslToHex(hue, 14, 8),
      'foreground': hslToHex(hue, 8, 93),
      'card': hslToHex(hue, 14, 12),
      'card-foreground': hslToHex(hue, 8, 93),
      'popover': hslToHex(hue, 14, 12),
      'popover-foreground': hslToHex(hue, 8, 93),
      'secondary': hslToHex(hue, 12, 16),
      'secondary-foreground': hslToHex(hue, 8, 95),
      'muted': hslToHex(hue, 12, 16),
      'muted-foreground': hslToHex(hue, 8, 62),
      'accent': hslToHex(hue, 12, 16),
      'accent-foreground': hslToHex(hue, 8, 95),
      'border': hslToHex(hue, 12, 21),
      'input': hslToHex(hue, 12, 21),
      'sidebar': hslToHex(hue, 16, 6),
      'sidebar-foreground': hslToHex(hue, 8, 82),
      'sidebar-accent': hslToHex(hue, 12, 16),
      'sidebar-border': hslToHex(hue, 12, 21),
    }
  }
  return {
    'background': hslToHex(hue, 30, 99),
    'foreground': hslToHex(hue, 12, 5),
    'card': hslToHex(hue, 30, 99),
    'card-foreground': hslToHex(hue, 12, 5),
    'popover': hslToHex(hue, 30, 99),
    'popover-foreground': hslToHex(hue, 12, 5),
    'secondary': hslToHex(hue, 18, 95),
    'secondary-foreground': hslToHex(hue, 12, 10),
    'muted': hslToHex(hue, 18, 95),
    'muted-foreground': hslToHex(hue, 8, 42),
    'accent': hslToHex(hue, 18, 95),
    'accent-foreground': hslToHex(hue, 12, 10),
    'border': hslToHex(hue, 16, 89),
    'input': hslToHex(hue, 16, 89),
    'sidebar': hslToHex(hue, 32, 97),
    'sidebar-foreground': hslToHex(hue, 8, 25),
    'sidebar-accent': hslToHex(hue, 16, 89),
    'sidebar-border': hslToHex(hue, 16, 89),
  }
}

function applyPalette(root: CSSStyleDeclaration, palette: Record<string, string>) {
  for (const [key, value] of Object.entries(palette)) {
    root.setProperty(`--color-${key}`, value)
  }
}

function clearPalette(root: CSSStyleDeclaration) {
  for (const key of PALETTE_KEYS) {
    root.removeProperty(`--color-${key}`)
  }
}

// ─── Config maps ───

const FONT_MAP: Record<string, string> = {
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  poppins: "'Poppins', system-ui, -apple-system, sans-serif",
  nunito: "'Nunito', system-ui, -apple-system, sans-serif",
  'open-sans': "'Open Sans', system-ui, -apple-system, sans-serif",
}

const RADIUS_MAP: Record<string, { sm: string; md: string; lg: string; xl: string }> = {
  reto: { sm: '0', md: '0', lg: '0', xl: '0' },
  suave: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem' },
  arredondado: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
}

// ─── Main apply function ───

export function applyBranding(branding: BrandingData) {
  const root = document.documentElement.style
  const isDark = document.documentElement.classList.contains('dark')

  // Primary accent color
  const color = isDark ? (branding.primaryColorDark || branding.primaryColor) : branding.primaryColor

  if (color) {
    root.setProperty('--color-primary', color)
    root.setProperty('--color-ring', color)
    root.setProperty('--color-primary-foreground', contrastForeground(color))
  } else {
    root.removeProperty('--color-primary')
    root.removeProperty('--color-ring')
    root.removeProperty('--color-primary-foreground')
  }

  // Full palette tint — when a non-default theme is active (indicated by sidebarColor being set)
  if (branding.primaryColor && branding.sidebarColor) {
    const { r, g, b } = hexToRgb(branding.primaryColor)
    const { h } = rgbToHsl(r, g, b)
    const palette = generatePalette(h, isDark)
    applyPalette(root, palette)
  } else {
    clearPalette(root)
  }

  // Header color override (on top of palette)
  if (branding.headerColor) {
    const headerBg = isDark
      ? hslToHex(rgbToHsl(...Object.values(hexToRgb(branding.headerColor)) as [number, number, number]).h, 14, 8)
      : branding.headerColor
    root.setProperty('--color-header', headerBg)
    root.setProperty('--color-header-foreground', contrastForeground(headerBg))
  } else {
    root.removeProperty('--color-header')
    root.removeProperty('--color-header-foreground')
  }

  // Font family
  if (branding.fontFamily && FONT_MAP[branding.fontFamily]) {
    document.documentElement.style.setProperty('--font-family', FONT_MAP[branding.fontFamily])
    document.body.style.fontFamily = FONT_MAP[branding.fontFamily]
  } else {
    root.removeProperty('--font-family')
    document.body.style.fontFamily = ''
  }

  // Border radius
  if (branding.borderRadius && RADIUS_MAP[branding.borderRadius]) {
    const r = RADIUS_MAP[branding.borderRadius]
    root.setProperty('--radius-sm', r.sm)
    root.setProperty('--radius-md', r.md)
    root.setProperty('--radius-lg', r.lg)
    root.setProperty('--radius-xl', r.xl)
  } else {
    root.removeProperty('--radius-sm')
    root.removeProperty('--radius-md')
    root.removeProperty('--radius-lg')
    root.removeProperty('--radius-xl')
  }

}

export function clearBranding() {
  const root = document.documentElement.style
  root.removeProperty('--color-primary')
  root.removeProperty('--color-ring')
  root.removeProperty('--color-primary-foreground')
  root.removeProperty('--color-header')
  root.removeProperty('--color-header-foreground')
  root.removeProperty('--font-family')
  root.removeProperty('--radius-sm')
  root.removeProperty('--radius-md')
  root.removeProperty('--radius-lg')
  root.removeProperty('--radius-xl')
  clearPalette(root)
  document.body.style.fontFamily = ''
}
