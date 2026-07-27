/**
 * CrickPro Design System — Premium Color Palette
 * 
 * Inspired by:
 * • Apple Human Interface Guidelines (neutral, titanium)
 * • Tesla minimal dashboard (dark slate, subtle accents)
 * • Linear.app (clean, purposeful colors)
 * • Nothing Phone (transparency, glass aesthetics)
 */
/** @type {const} */
const themeColors = {
  // Primary — Emerald Green Accent
  primary: { light: '#059669', dark: '#10B981' },
  
  // Background — Deep Near-Black Dark Emerald
  background: { light: '#F4F6F5', dark: '#08120E' },
  
  // Surface — Layered Dark Emerald Elevated Card Surfaces
  surface: { light: '#FFFFFF', dark: '#11201A' },
  
  // Foreground — Off-white primary typography
  foreground: { light: '#111827', dark: '#F9FAFB' },
  
  // Muted — Secondary gray typography
  muted: { light: '#6B7280', dark: '#9CA3AF' },
  
  // Border — Thin translucent emerald/white borders
  border: { light: 'rgba(0,0,0,0.08)', dark: 'rgba(255,255,255,0.10)' },
  
  // Success — Vivid Emerald Green
  success: { light: '#059669', dark: '#10B981' },
  
  // Warning — Warm Amber
  warning: { light: '#D97706', dark: '#F59E0B' },
  
  // Error / Wicket — Vibrant Red
  error: { light: '#DC2626', dark: '#EF4444' },
  
  // Glass — Translucent frosted surfaces
  glass: { light: 'rgba(255,255,255,0.85)', dark: 'rgba(17,32,26,0.75)' },
  glassBorder: { light: 'rgba(0,0,0,0.08)', dark: 'rgba(16,185,129,0.20)' },
  glassHighlight: { light: 'rgba(255,255,255,0.95)', dark: 'rgba(255,255,255,0.12)' },
  
  // Accent — Emerald Glow Accent
  accent: { light: '#10B981', dark: '#34D399' },
};

module.exports = { themeColors };
