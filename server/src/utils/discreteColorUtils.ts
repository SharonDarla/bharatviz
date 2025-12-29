import * as d3 from 'd3';
import { ColorScale } from '../types/index.js';

export interface ColorBarSettings {
  isDiscrete?: boolean;
  mode?: 'continuous' | 'discrete';
  binCount: number;
  useCustomBoundaries?: boolean;
  customBoundaries: number[];
}

/**
 * Gets the D3 color interpolator for a color scale
 */
export function getD3ColorInterpolator(scale: ColorScale) {
  const interpolators: Record<ColorScale, (t: number) => string> = {
    aqi: (t: number) => d3.interpolateBlues(t),
    blues: d3.interpolateBlues,
    greens: d3.interpolateGreens,
    reds: d3.interpolateReds,
    oranges: d3.interpolateOranges,
    purples: d3.interpolatePurples,
    pinks: d3.interpolatePuRd,
    viridis: d3.interpolateViridis,
    plasma: d3.interpolatePlasma,
    inferno: d3.interpolateInferno,
    magma: d3.interpolateMagma,
    rdylbu: d3.interpolateRdYlBu,
    rdylgn: d3.interpolateRdYlGn,
    spectral: (t: number) => d3.interpolateSpectral(1 - t), // Inverted so blue=low, red=high
    brbg: d3.interpolateBrBG,
    piyg: d3.interpolatePiYG,
    puor: d3.interpolatePuOr
  };

  return interpolators[scale] || d3.interpolateBlues;
}

export function getAQIColor(value: number): string {
  if (value <= 50) return '#10b981';
  if (value <= 100) return '#84cc16';
  if (value <= 200) return '#eab308';
  if (value <= 300) return '#f97316';
  if (value <= 400) return '#ef4444';
  return '#991b1b';
}

/**
 * Gets a color for a value using continuous scaling
 */
export function getColorForValue(
  value: number | undefined,
  values: number[],
  colorScale: ColorScale,
  invertColors: boolean = false
): string {
  if (value === undefined) return 'white';

  if (isNaN(value)) {
    return '#d1d5db';
  }

  if (values.length === 0) {
    return 'white';
  }

  if (colorScale === 'aqi') {
    return invertColors ? getD3ColorInterpolator(colorScale)(1 - (value / 500)) : getAQIColor(value);
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    return getD3ColorInterpolator(colorScale)(0.5);
  }

  let normalizedValue = (value - minValue) / (maxValue - minValue);
  if (invertColors) {
    normalizedValue = 1 - normalizedValue;
  }

  return getD3ColorInterpolator(colorScale)(normalizedValue);
}
