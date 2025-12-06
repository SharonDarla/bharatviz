import React, { useState } from 'react';
import { type CategoryColorMapping } from './categoricalUtils';

interface CategoricalLegendProps {
  categories: string[];
  categoryColors: CategoryColorMapping;
  legendPosition: { x: number; y: number };
  isMobile: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  dragging: boolean;
  legendTitle: string;
  editingTitle: boolean;
  setEditingTitle: (editing: boolean) => void;
  setLegendTitle: (title: string) => void;
}

export const CategoricalLegend: React.FC<CategoricalLegendProps> = ({
  categories,
  categoryColors,
  legendPosition,
  isMobile,
  onMouseDown,
  dragging,
  legendTitle,
  editingTitle,
  setEditingTitle,
  setLegendTitle,
}) => {
  const [localTitle, setLocalTitle] = useState(legendTitle);

  const handleTitleSubmit = () => {
    setLegendTitle(localTitle);
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setLocalTitle(legendTitle);
      setEditingTitle(false);
    }
  };

  const maxCategoriesToShow = isMobile ? 8 : 12;
  const visibleCategories = categories.slice(0, maxCategoriesToShow);
  const hasMore = categories.length > maxCategoriesToShow;

  const rectWidth = isMobile ? 15 : 20;
  const rectHeight = isMobile ? 15 : 20;
  const fontSize = isMobile ? 10 : 12;
  const lineHeight = isMobile ? 20 : 25;
  const legendWidth = isMobile ? 140 : 180;
  const legendHeight = visibleCategories.length * lineHeight + (hasMore ? lineHeight : 0) + 40;

  return (
    <g
      className="legend-container"
      transform={`translate(${legendPosition.x}, ${legendPosition.y})`}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      {/* Background */}
      <rect
        x="0"
        y="0"
        width={legendWidth}
        height={legendHeight}
        fill="white"
        stroke="#ccc"
        strokeWidth="1"
        rx="4"
        opacity="0.95"
        onMouseDown={onMouseDown}
      />

      {/* Title */}
      {editingTitle ? (
        <foreignObject x="5" y="5" width={legendWidth - 10} height="25">
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            style={{
              width: '100%',
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              border: '1px solid #3b82f6',
              borderRadius: '2px',
              padding: '2px 4px',
              outline: 'none',
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={legendWidth / 2}
          y="18"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="bold"
          fill="#333"
          style={{ cursor: 'text', userSelect: 'none' }}
          onDoubleClick={() => {
            setLocalTitle(legendTitle);
            setEditingTitle(true);
          }}
          onMouseDown={onMouseDown}
        >
          {legendTitle}
        </text>
      )}

      {/* Categories */}
      {visibleCategories.map((category, i) => (
        <g key={category} transform={`translate(10, ${35 + i * lineHeight})`}>
          {/* Color box */}
          <rect
            x="0"
            y="0"
            width={rectWidth}
            height={rectHeight}
            fill={categoryColors[category] || '#cccccc'}
            stroke="#666"
            strokeWidth="1"
            rx="2"
          />
          {/* Category label */}
          <text
            x={rectWidth + 6}
            y={rectHeight / 2 + 1}
            fontSize={fontSize}
            fill="#333"
            dominantBaseline="middle"
            style={{ userSelect: 'none' }}
          >
            {category.length > 18 ? `${category.substring(0, 15)}...` : category}
          </text>
        </g>
      ))}

      {/* Show "... and N more" if there are more categories */}
      {hasMore && (
        <text
          x={legendWidth / 2}
          y={35 + visibleCategories.length * lineHeight + 12}
          textAnchor="middle"
          fontSize={fontSize - 1}
          fill="#666"
          fontStyle="italic"
          style={{ userSelect: 'none' }}
        >
          ... and {categories.length - maxCategoriesToShow} more
        </text>
      )}
    </g>
  );
};
