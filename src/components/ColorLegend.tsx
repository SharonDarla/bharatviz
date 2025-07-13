import React from 'react';
import * as d3 from 'd3';

interface ColorLegendProps {
  data: Array<{ state: string; value: number }>;
}

export const ColorLegend: React.FC<ColorLegendProps> = ({ data }) => {
  if (data.length === 0) return null;

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([minValue, maxValue]);

  const legendSteps = 5;
  const legendData = Array.from({ length: legendSteps }, (_, i) => {
    const value = minValue + (maxValue - minValue) * (i / (legendSteps - 1));
    return { value, color: colorScale(value) };
  });

  return (
    <div className="bg-card p-4 rounded-lg border">
      <h3 className="text-sm font-medium mb-3">Legend</h3>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-muted-foreground">{minValue.toFixed(1)}</span>
        <div className="flex">
          {legendData.map((item, index) => (
            <div
              key={index}
              className="w-8 h-4"
              style={{ backgroundColor: item.color }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{maxValue.toFixed(1)}</span>
      </div>
    </div>
  );
};