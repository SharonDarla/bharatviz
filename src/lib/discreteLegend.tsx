import React from 'react';
import { ColorBarSettings, ColorScale } from '@/components/ColorMapChooser';
import { createDiscreteBins, getD3ColorInterpolator } from '@/lib/discreteColorUtils';
import { formatLegendValue } from '@/lib/colorUtils';

interface DiscreteLegendProps {
  data: number[];
  colorScale: ColorScale;
  invertColors: boolean;
  colorBarSettings: ColorBarSettings;
  legendPosition: { x: number; y: number };
  isMobile: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  dragging: boolean;
  // Legend editing props
  legendTitle: string;
  editingTitle: boolean;
  setEditingTitle: (editing: boolean) => void;
  setLegendTitle: (title: string) => void;
}

export const DiscreteLegend: React.FC<DiscreteLegendProps> = ({
  data,
  colorScale,
  invertColors,
  colorBarSettings,
  legendPosition,
  isMobile,
  onMouseDown,
  dragging,
  legendTitle,
  editingTitle,
  setEditingTitle,
  setLegendTitle
}) => {
  if (!colorBarSettings.isDiscrete) {
    return null; // Use standard continuous legend
  }

  const values = data.filter(v => !isNaN(v) && isFinite(v));
  if (values.length === 0) {
    return null;
  }

  const { boundaries, binCount, dataAnalysis } = createDiscreteBins(values, colorBarSettings);
  const colorInterpolator = getD3ColorInterpolator(colorScale);

  const rectWidth = isMobile ? 24 : 32;  // Much more square-shaped
  const rectHeight = isMobile ? 20 : 28;  // Slightly taller for better proportion
  const totalHeight = binCount * (rectHeight + 4) - 4; // 4px spacing between rectangles

  return (
    <g
      className="discrete-legend-container"
      transform={`translate(${legendPosition.x}, ${legendPosition.y})`}
      onMouseDown={onMouseDown}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      {/* Legend Title */}
      {editingTitle ? (
        <foreignObject 
          x={rectWidth / 2 - (isMobile ? 35 : 45)} 
          y={-25} 
          width={isMobile ? 70 : 90} 
          height={30}
        >
          <input
            type="text"
            value={legendTitle}
            autoFocus
            style={{ 
              width: isMobile ? 68 : 88, 
              fontSize: isMobile ? 11 : 13, 
              fontWeight: 600, 
              textAlign: 'center' 
            }}
            onChange={e => setLegendTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
          />
        </foreignObject>
      ) : (
        <text
          x={rectWidth / 2}
          y={-5}
          textAnchor="middle"
          style={{ 
            fontFamily: 'Arial, Helvetica, sans-serif', 
            fontSize: isMobile ? 11 : 13, 
            fontWeight: 600, 
            fill: '#374151', 
            cursor: 'pointer' 
          }}
          onDoubleClick={e => { 
            e.stopPropagation(); 
            setEditingTitle(true); 
          }}
        >
          {legendTitle}
        </text>
      )}

      {/* Discrete Color Rectangles */}
      {Array.from({ length: binCount }, (_, i) => {
        // Keep rectangles in same order regardless of color inversion
        const binIndex = i;
        
        // Only invert the color calculation, not the rectangle position
        let t = (binIndex + 0.5) / binCount;
        if (invertColors) {
          t = 1 - t;
        }
        
        const color = colorInterpolator(t);
        const yPosition = i * (rectHeight + 4); // Fixed spacing
        const minValue = boundaries[binIndex];
        const maxValue = boundaries[binIndex + 1];
        const isFirstBin = binIndex === 0;
        const isLastBin = binIndex === binCount - 1;
        
        // Calculate display values for non-overlapping ranges
        let displayMinValue = minValue;
        const displayMaxValue = maxValue;
        
        if (!isFirstBin) {
          // For all bins except the first, adjust the min to be non-overlapping
          if (dataAnalysis.isInteger) {
            displayMinValue = minValue + 1;
          } else {
            displayMinValue = minValue + dataAnalysis.minGap;
          }
        }
        
        
        // Format the range text using the new formatter
        const minText = formatLegendValue(displayMinValue);
        const maxText = formatLegendValue(displayMaxValue);
        
        let rangeText: string;
        if (displayMinValue === displayMaxValue) {
          rangeText = minText;
        } else if (isLastBin) {
          // Last bin shows "≥ minValue" or "minValue+" depending on preference
          rangeText = `${minText}+`;
        } else {
          rangeText = `${minText} - ${maxText}`;
        }
        
        
        return (
          <g key={i}>
            {/* Color rectangle */}
            <rect
              x={0}
              y={yPosition}
              width={rectWidth}
              height={rectHeight}
              fill={color}
              stroke="#374151"
              strokeWidth={0.5}
              rx={2}
            />
            
            {/* Range text */}
            <text
              x={rectWidth + 6}
              y={yPosition + rectHeight / 2}
              dominantBaseline="middle"
              style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: isMobile ? 10 : 12,
                fontWeight: 500,
                fill: '#374151'
              }}
            >
              {rangeText}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// Helper function to calculate discrete legend dimensions
export function getDiscreteLegendDimensions(
  binCount: number,
  isMobile: boolean = false
): { width: number; height: number } {
  const rectWidth = isMobile ? 24 : 32;
  const rectHeight = isMobile ? 20 : 28;
  const textWidth = isMobile ? 80 : 120; // More space for range text
  const totalHeight = binCount * (rectHeight + 4) - 4;
  
  return {
    width: rectWidth + textWidth + 6, // 6px padding for text
    height: totalHeight
  };
}