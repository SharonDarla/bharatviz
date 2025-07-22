/**
 * Color utility functions for BharatViz
 */

export function parseColorToRGB(color: string): { r: number; g: number; b: number } {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }
  
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
  }
  
  return { r: 0, g: 0, b: 0 };
}

export function isColorDark(color: string): boolean {
  const { r, g, b } = parseColorToRGB(color);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}