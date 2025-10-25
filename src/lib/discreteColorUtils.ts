import * as d3 from 'd3';
import { ColorScale, ColorBarSettings } from '@/components/ColorMapChooser';

export interface DiscreteColorInfo {
  binIndex: number;
  color: string;
  minValue: number;
  maxValue: number;
  displayMinValue: number;
  displayMaxValue: number;
  isFirstBin: boolean;
  isLastBin: boolean;
}

/**
 * Analyzes data to determine appropriate precision for boundary gaps
 */
function analyzeDataPrecision(values: number[]): {
  isInteger: boolean;
  minGap: number;
  precision: number;
} {
  if (values.length === 0) {
    return { isInteger: true, minGap: 1, precision: 0 };
  }

  // Check if all values are integers
  const isInteger = values.every(v => Number.isInteger(v));
  
  if (isInteger) {
    // For integer data, use 1 as the minimum gap
    return { isInteger: true, minGap: 1, precision: 0 };
  }

  // For decimal data, use a simple approach
  // Find the maximum number of decimal places in the data
  let maxDecimalPlaces = 0;
  for (const value of values) {
    const str = value.toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex !== -1) {
      maxDecimalPlaces = Math.max(maxDecimalPlaces, str.length - decimalIndex - 1);
    }
  }
  
  // Use a gap that's appropriate for the decimal precision
  // If data has 1 decimal place (like 25.0), use 0.1
  // If data has 2 decimal places (like 25.50), use 0.01
  const minGap = Math.pow(10, -maxDecimalPlaces);
  
  return { 
    isInteger: false, 
    minGap, 
    precision: maxDecimalPlaces
  };
}

/**
 * Creates discrete bins based on color bar settings and data
 */
export function createDiscreteBins(
  values: number[],
  colorBarSettings: ColorBarSettings
): { boundaries: number[]; binCount: number; dataAnalysis: ReturnType<typeof analyzeDataPrecision> } {
  if (values.length === 0) {
    return { 
      boundaries: [0, 1], 
      binCount: 1, 
      dataAnalysis: { isInteger: true, minGap: 1, precision: 0 }
    };
  }

  const dataAnalysis = analyzeDataPrecision(values);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (colorBarSettings.useCustomBoundaries && colorBarSettings.customBoundaries.length >= 2) {
    // Use custom boundaries, but ensure they cover the data range
    const sortedBoundaries = [...colorBarSettings.customBoundaries].sort((a, b) => a - b);
    
    // Extend boundaries if necessary to cover data range
    if (sortedBoundaries[0] > minValue) {
      sortedBoundaries.unshift(minValue);
    }
    if (sortedBoundaries[sortedBoundaries.length - 1] < maxValue) {
      sortedBoundaries.push(maxValue);
    }
    
    return {
      boundaries: sortedBoundaries,
      binCount: sortedBoundaries.length - 1,
      dataAnalysis
    };
  }

  // Create equal-width bins
  const binCount = colorBarSettings.binCount;
  const boundaries: number[] = [];
  
  for (let i = 0; i <= binCount; i++) {
    boundaries.push(minValue + (i / binCount) * (maxValue - minValue));
  }
  
  return { boundaries, binCount, dataAnalysis };
}

/**
 * Gets the discrete color info for a value with smart boundary handling
 */
export function getDiscreteColorInfo(
  value: number,
  boundaries: number[],
  colorScale: ColorScale,
  invertColors: boolean = false,
  dataAnalysis?: ReturnType<typeof analyzeDataPrecision>
): DiscreteColorInfo {
  // Find which bin the value falls into
  let binIndex = 0;
  for (let i = 1; i < boundaries.length; i++) {
    if (value <= boundaries[i]) {
      binIndex = i - 1;
      break;
    }
  }
  
  // Handle edge case where value equals max boundary
  if (binIndex === boundaries.length - 1) {
    binIndex = boundaries.length - 2;
  }
  
  const binCount = boundaries.length - 1;
  
  // Calculate color based on bin center
  let t = (binIndex + 0.5) / binCount;
  if (invertColors) {
    t = 1 - t;
  }
  
  const color = getD3ColorInterpolator(colorScale)(t);
  
  const minValue = boundaries[binIndex];
  const maxValue = boundaries[binIndex + 1];
  const isFirstBin = binIndex === 0;
  const isLastBin = binIndex === boundaries.length - 2;
  
  // Calculate display values for non-overlapping ranges
  let displayMinValue = minValue;
  let displayMaxValue = maxValue;
  
  if (dataAnalysis && !isFirstBin) {
    // For all bins except the first, adjust the min to be non-overlapping
    if (dataAnalysis.isInteger) {
      displayMinValue = minValue + 1;
    } else {
      displayMinValue = minValue + dataAnalysis.minGap;
    }
  }
  
  return {
    binIndex,
    color,
    minValue,
    maxValue,
    displayMinValue,
    displayMaxValue,
    isFirstBin,
    isLastBin
  };
}

/**
 * Gets a color for a value using discrete or continuous scaling
 */
export function getColorForValue(
  value: number | undefined,
  values: number[],
  colorScale: ColorScale,
  invertColors: boolean = false,
  colorBarSettings?: ColorBarSettings
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
  
  // Use discrete scaling if enabled
  if (colorBarSettings?.isDiscrete) {
    const { boundaries, dataAnalysis } = createDiscreteBins(values, colorBarSettings);
    const colorInfo = getDiscreteColorInfo(value, boundaries, colorScale, invertColors, dataAnalysis);
    return colorInfo.color;
  }
  
  // Continuous scaling (default)
  let normalizedValue = (value - minValue) / (maxValue - minValue);
  if (invertColors) {
    normalizedValue = 1 - normalizedValue;
  }
  
  return getD3ColorInterpolator(colorScale)(normalizedValue);
}

/**
 * Gets the D3 color interpolator for a color scale
 */
export function getD3ColorInterpolator(scale: ColorScale) {
  const interpolators = {
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
 * Gets legend stops for discrete color bars
 */
export function getDiscreteLegendStops(
  values: number[],
  colorScale: ColorScale,
  invertColors: boolean,
  colorBarSettings: ColorBarSettings
): Array<{ offset: string; color: string; value: number }> {
  if (!colorBarSettings.isDiscrete) {
    // Return continuous stops
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const stops = [];
    const numStops = 10;
    
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = minValue + t * (maxValue - minValue);
      const colorT = invertColors ? 1 - t : t;
      const color = getD3ColorInterpolator(colorScale)(colorT);
      stops.push({
        offset: `${t * 100}%`,
        color,
        value
      });
    }
    
    return stops;
  }
  
  // Return discrete stops
  const { boundaries, binCount, dataAnalysis } = createDiscreteBins(values, colorBarSettings);
  const stops = [];
  
  for (let i = 0; i < binCount; i++) {
    let t = (i + 0.5) / binCount;
    if (invertColors) {
      t = 1 - t;
    }
    
    const color = getD3ColorInterpolator(colorScale)(t);
    const startOffset = (i / binCount) * 100;
    const endOffset = ((i + 1) / binCount) * 100;
    
    // Add start stop
    // Calculate display boundaries for non-overlapping ranges
    let displayMin = boundaries[i];
    let displayMax = boundaries[i + 1];
    
    if (i > 0) { // Not the first bin
      if (dataAnalysis.isInteger) {
        displayMin = boundaries[i] + 1;
      } else {
        displayMin = boundaries[i] + dataAnalysis.minGap;
      }
    }
    
    stops.push({
      offset: `${startOffset}%`,
      color,
      value: displayMin
    });
    
    // Add end stop with same color (creates flat bins)
    stops.push({
      offset: `${endOffset}%`,
      color,
      value: displayMax
    });
  }
  
  return stops;
}