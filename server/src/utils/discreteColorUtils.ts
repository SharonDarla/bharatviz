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
    return '#d1d5db'; // Light gray for NaN/NA values
  }

  if (values.length === 0) {
    return 'white';
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    return getD3ColorInterpolator(colorScale)(0.5);
  }

  // Continuous scaling
  let normalizedValue = (value - minValue) / (maxValue - minValue);
  if (invertColors) {
    normalizedValue = 1 - normalizedValue;
  }

  return getD3ColorInterpolator(colorScale)(normalizedValue);
}
