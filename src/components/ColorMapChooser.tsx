import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type DataType, type CategoryColorMapping } from '@/lib/categoricalUtils';
import { CategoryColorPicker } from './CategoryColorPicker';

export type ColorScale = 'aqi' | 'blues' | 'greens' | 'reds' | 'oranges' | 'purples' | 'pinks' | 'viridis' | 'plasma' | 'inferno' | 'magma' | 'rdylbu' | 'rdylgn' | 'spectral' | 'brbg' | 'piyg' | 'puor';

export interface ColorBarSettings {
  isDiscrete: boolean;
  binCount: number;
  customBoundaries: number[];
  useCustomBoundaries: boolean;
}

interface ColorMapChooserProps {
  selectedScale: ColorScale;
  onScaleChange: (scale: ColorScale) => void;
  invertColors: boolean;
  onInvertColorsChange: (invert: boolean) => void;
  hideStateNames?: boolean;
  hideValues?: boolean;
  onHideStateNamesChange?: (hide: boolean) => void;
  onHideValuesChange?: (hide: boolean) => void;
  showStateBoundaries?: boolean;
  onShowStateBoundariesChange?: (show: boolean) => void;
  hideDistrictNames?: boolean;
  onHideDistrictNamesChange?: (hide: boolean) => void;
  hideDistrictValues?: boolean;
  onHideDistrictValuesChange?: (hide: boolean) => void;
  colorBarSettings?: ColorBarSettings;
  onColorBarSettingsChange?: (settings: ColorBarSettings) => void;
  dataType?: DataType;
  categories?: string[];
  categoryColors?: CategoryColorMapping;
  onCategoryColorChange?: (category: string, color: string) => void;
}

const colorScales: { [key: string]: { name: string; type: 'sequential' | 'diverging' } } = {
  // Sequential scales
  aqi: { name: 'AQI (Air Quality Index)', type: 'sequential' },
  blues: { name: 'Blues', type: 'sequential' },
  greens: { name: 'Greens', type: 'sequential' },
  reds: { name: 'Reds', type: 'sequential' },
  oranges: { name: 'Oranges', type: 'sequential' },
  purples: { name: 'Purples', type: 'sequential' },
  pinks: { name: 'Pinks', type: 'sequential' },
  viridis: { name: 'Viridis', type: 'sequential' },
  plasma: { name: 'Plasma', type: 'sequential' },
  inferno: { name: 'Inferno', type: 'sequential' },
  magma: { name: 'Magma', type: 'sequential' },

  // Diverging scales
  rdylbu: { name: 'Red-Yellow-Blue', type: 'diverging' },
  rdylgn: { name: 'Red-Yellow-Green', type: 'diverging' },
  spectral: { name: 'Spectral', type: 'diverging' },
  brbg: { name: 'Brown-Blue-Green', type: 'diverging' },
  piyg: { name: 'Pink-Yellow-Green', type: 'diverging' },
  puor: { name: 'Purple-Orange', type: 'diverging' },
};

export const ColorMapChooser: React.FC<ColorMapChooserProps> = ({ selectedScale, onScaleChange, invertColors, onInvertColorsChange, hideStateNames, hideValues, onHideStateNamesChange, onHideValuesChange, showStateBoundaries, onShowStateBoundariesChange, hideDistrictNames, onHideDistrictNamesChange, hideDistrictValues, onHideDistrictValuesChange, colorBarSettings, onColorBarSettingsChange, dataType = 'numerical', categories = [], categoryColors = {}, onCategoryColorChange }) => {
  const sequentialScales = Object.entries(colorScales).filter(([_, scale]) => scale.type === 'sequential');
  const divergingScales = Object.entries(colorScales).filter(([_, scale]) => scale.type === 'diverging');

  // Local state for custom boundaries input to prevent re-rendering map while typing
  const [boundariesInput, setBoundariesInput] = useState<string>('');
  const [boundariesError, setBoundariesError] = useState<string>('');

  // Sync local state with prop changes
  useEffect(() => {
    if (colorBarSettings?.customBoundaries) {
      const newValue = colorBarSettings.customBoundaries.join(',');
      setBoundariesInput(newValue);
    }
  }, [colorBarSettings?.customBoundaries]);

  const applyCustomBoundaries = (inputValue: string) => {
    setBoundariesError('');

    const boundaries = inputValue
      .split(',')
      .map(b => parseFloat(b.trim()))
      .filter(b => !isNaN(b));

    if (boundaries.length < 2) {
      setBoundariesError('Please enter at least 2 breakpoints');
      return;
    }

    const sorted = [...boundaries].sort((a, b) => a - b);

    // Check for duplicates
    const hasDuplicates = sorted.some((val, idx) => idx > 0 && val === sorted[idx - 1]);
    if (hasDuplicates) {
      setBoundariesError('Breakpoints must be unique');
      return;
    }

    if (colorBarSettings && onColorBarSettingsChange) {
      onColorBarSettingsChange({
        ...colorBarSettings,
        customBoundaries: sorted
      });
    }
  };

  const handleBoundariesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustomBoundaries(boundariesInput);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {dataType === 'categorical' ? (
          <div className="text-center py-2">
            <Label className="text-sm font-medium text-blue-600">
              Categorical data detected
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Use category colors below to customize
            </p>
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="colorScale" className="text-sm font-medium">
                Choose Color Scale
              </Label>
              <Select value={selectedScale} onValueChange={onScaleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a color scale" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                    Sequential
                  </div>
                  {sequentialScales.map(([key, scale]) => (
                    <SelectItem key={key} value={key}>
                      {scale.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase mt-2">
                    Diverging
                  </div>
                  {divergingScales.map(([key, scale]) => (
                    <SelectItem key={key} value={key}>
                      {scale.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2 h-4 rounded flex overflow-hidden">
                {getPreviewColors(selectedScale, invertColors, colorBarSettings).map((color, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{
                      backgroundColor: color,
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Discrete/Continuous Toggle - only show for numerical data */}
        {dataType === 'numerical' && colorBarSettings && onColorBarSettingsChange && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Color Bar Type</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="colorBarType"
                    checked={!colorBarSettings.isDiscrete}
                    onChange={() => onColorBarSettingsChange({ ...colorBarSettings, isDiscrete: false })}
                    className="w-4 h-4"
                  />
                  Continuous
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="colorBarType"
                    checked={colorBarSettings.isDiscrete}
                    onChange={() => onColorBarSettingsChange({ ...colorBarSettings, isDiscrete: true })}
                    className="w-4 h-4"
                  />
                  Discrete
                </label>
              </div>
              
              {/* Discrete Options */}
              {colorBarSettings.isDiscrete && (
                <div className="space-y-3 pl-4 border-l-2 border-muted">
                  <div>
                    <Label htmlFor="binCount" className="text-xs font-medium text-muted-foreground">
                      Number of Bins
                    </Label>
                    <Input
                      id="binCount"
                      type="number"
                      min="2"
                      max="20"
                      value={colorBarSettings.binCount}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 5;
                        onColorBarSettingsChange({ ...colorBarSettings, binCount: Math.max(2, Math.min(20, count)) });
                      }}
                      className="w-20 h-8 text-xs"
                      disabled={colorBarSettings.useCustomBoundaries}
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={colorBarSettings.useCustomBoundaries}
                        onChange={(e) => {
                          onColorBarSettingsChange({ 
                            ...colorBarSettings, 
                            useCustomBoundaries: e.target.checked,
                            customBoundaries: e.target.checked && colorBarSettings.customBoundaries.length === 0 
                              ? [0, 25, 50, 75, 100] 
                              : colorBarSettings.customBoundaries
                          });
                        }}
                        className="w-3 h-3"
                      />
                      Custom boundaries
                    </label>
                    
                    {colorBarSettings.useCustomBoundaries && (
                      <div className="mt-2 space-y-1">
                        <Input
                          placeholder="e.g., 0,25,50,75,100"
                          value={boundariesInput}
                          onChange={(e) => setBoundariesInput(e.target.value)}
                          onBlur={() => applyCustomBoundaries(boundariesInput)}
                          onKeyDown={handleBoundariesKeyDown}
                          className={`text-xs h-8 ${boundariesError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        />
                        {boundariesError ? (
                          <p className="text-xs text-red-500">
                            {boundariesError}
                          </p>
                        ) : (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p className="font-medium">📍 Enter breakpoints (not ranges)</p>
                            <p>• Type values separated by commas</p>
                            <p>• Press Enter or click outside to apply</p>
                            <p>• Example: 0,25,50,75,100 creates ranges:</p>
                            <p className="pl-3">0-25, 25.01-50, 50.01-75, 75-100</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}
      </CardContent>
      <div className="flex flex-col gap-2 px-6 pb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={invertColors}
            onChange={e => onInvertColorsChange(e.target.checked)}
          />
          Invert colors
        </label>
        {hideStateNames !== undefined && onHideStateNamesChange && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideStateNames}
              onChange={e => onHideStateNamesChange(e.target.checked)}
            />
            Hide state names
          </label>
        )}
        {hideValues !== undefined && onHideValuesChange && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideValues}
              onChange={e => onHideValuesChange(e.target.checked)}
            />
            Hide values
          </label>
        )}
        {showStateBoundaries !== undefined && onShowStateBoundariesChange && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showStateBoundaries}
              onChange={e => onShowStateBoundariesChange(e.target.checked)}
            />
            Show state boundaries
          </label>
        )}
        {hideDistrictNames !== undefined && onHideDistrictNamesChange && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideDistrictNames}
              onChange={e => onHideDistrictNamesChange(e.target.checked)}
            />
            Hide district names
          </label>
        )}
        {hideDistrictValues !== undefined && onHideDistrictValuesChange && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideDistrictValues}
              onChange={e => onHideDistrictValuesChange(e.target.checked)}
            />
            Hide district values
          </label>
        )}
      </div>
      {dataType === 'categorical' && onCategoryColorChange && (
        <div className="px-6 pb-4">
          <CategoryColorPicker
            categories={categories}
            colorMapping={categoryColors}
            onColorChange={onCategoryColorChange}
          />
        </div>
      )}
    </Card>
  );
};

function getAQIColor(value: number): string {
  if (value <= 50) return '#10b981';
  if (value <= 100) return '#84cc16';
  if (value <= 200) return '#eab308';
  if (value <= 300) return '#f97316';
  if (value <= 400) return '#ef4444';
  return '#991b1b';
}

function getPreviewColor(scale: ColorScale, t: number): string {
  if (scale === 'aqi') {
    const value = t * 500;
    return getAQIColor(value);
  }

  // This is a simplified preview - in practice, you'd use the actual D3 color scales
  const colors: { [key in ColorScale]: string[] } = {
    aqi: ['#10b981', '#10b981', '#84cc16', '#84cc16', '#eab308', '#eab308', '#f97316', '#ef4444', '#991b1b'],
    blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
    purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
    pinks: ['#f7f4f9', '#e7dae7', '#d5bad6', '#cf92c6', '#dd63ae', '#e22f88', '#c9135c', '#990340', '#67001f'],
    viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
    plasma: ['#0d0887', '#4b0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d03c', '#fcffa4'],
    inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#fcffa4'],
    magma: ['#000004', '#1c1044', '#4f127b', '#812581', '#b5367a', '#e55964', '#fb8861', '#fec287', '#fcfdbf'],
    rdylbu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'],
    rdylgn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'],
    spectral: ['#5e4fa2', '#66c2a5', '#abdda4', '#e6f598', '#fee08b', '#fdae61', '#f46d43', '#d53e4f', '#9e0142'],
    brbg: ['#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e'],
    piyg: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221'],
    puor: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#d8daeb', '#b2abd2', '#8073ac', '#542788']
  };

  const colorArray = colors[scale];
  const index = Math.floor(t * (colorArray.length - 1));
  return colorArray[index] || colorArray[0];
}

// Helper function to get preview colors based on discrete/continuous settings
function getPreviewColors(scale: ColorScale, invertColors: boolean, colorBarSettings?: ColorBarSettings): string[] {
  const previewCount = 10;
  
  if (!colorBarSettings || !colorBarSettings.isDiscrete) {
    // Continuous mode - show smooth gradient
    return [...Array(previewCount)].map((_, i) => {
      const t = invertColors ? 1 - (i / (previewCount - 1)) : i / (previewCount - 1);
      return getPreviewColor(scale, t);
    });
  }
  
  // Discrete mode
  let binCount = colorBarSettings.binCount;
  
  if (colorBarSettings.useCustomBoundaries && colorBarSettings.customBoundaries.length >= 2) {
    binCount = colorBarSettings.customBoundaries.length - 1;
  }
  
  const colors: string[] = [];
  
  for (let bin = 0; bin < binCount; bin++) {
    const t = invertColors ? 1 - ((bin + 0.5) / binCount) : (bin + 0.5) / binCount;
    const color = getPreviewColor(scale, t);
    
    // Each bin takes proportional space in the preview
    const segmentsPerBin = Math.ceil(previewCount / binCount);
    for (let j = 0; j < segmentsPerBin && colors.length < previewCount; j++) {
      colors.push(color);
    }
  }
  
  // Fill remaining if needed
  while (colors.length < previewCount) {
    colors.push(colors[colors.length - 1]);
  }
  
  return colors.slice(0, previewCount);
}