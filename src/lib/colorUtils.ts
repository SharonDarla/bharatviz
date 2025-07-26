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

export function roundToSignificantDigits(num: number, digits: number = 2): string {
  if (num === 0) return '0';
  
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const factor = Math.pow(10, digits - 1 - magnitude);
  const rounded = Math.round(num * factor) / factor;
  
  // Format to avoid scientific notation for small numbers
  if (magnitude >= -4 && magnitude < digits) {
    return rounded.toString();
  }
  
  return rounded.toPrecision(digits);
}