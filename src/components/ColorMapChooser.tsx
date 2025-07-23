import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ColorScale = 'blues' | 'greens' | 'reds' | 'oranges' | 'purples' | 'pinks' | 'viridis' | 'plasma' | 'inferno' | 'magma' | 'rdylbu' | 'rdylgn' | 'spectral' | 'brbg' | 'piyg' | 'puor';

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
}

const colorScales: { [key: string]: { name: string; type: 'sequential' | 'diverging' } } = {
  // Sequential scales
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

export const ColorMapChooser: React.FC<ColorMapChooserProps> = ({ selectedScale, onScaleChange, invertColors, onInvertColorsChange, hideStateNames, hideValues, onHideStateNamesChange, onHideValuesChange, showStateBoundaries, onShowStateBoundariesChange }) => {
  const sequentialScales = Object.entries(colorScales).filter(([_, scale]) => scale.type === 'sequential');
  const divergingScales = Object.entries(colorScales).filter(([_, scale]) => scale.type === 'diverging');

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
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
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: getPreviewColor(selectedScale, invertColors ? 1 - (i / 9) : i / 9),
                }}
              />
            ))}
          </div>
        </div>
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
      </div>
    </Card>
  );
};

// Helper function to get preview colors
function getPreviewColor(scale: ColorScale, t: number): string {
  // This is a simplified preview - in practice, you'd use the actual D3 color scales
  const colors: { [key in ColorScale]: string[] } = {
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