import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { ColorScale } from './ColorMapChooser';

interface MapData {
  state: string;
  value: number;
}

interface IndiaMapProps {
  data: MapData[];
  colorScale?: ColorScale;
  hideStateNames?: boolean;
  hideValues?: boolean;
}

export interface IndiaMapRef {
  exportPNG: () => void;
  exportSVG: () => void;
  downloadCSVTemplate: () => void;
}

export const IndiaMap = forwardRef<IndiaMapRef, IndiaMapProps>(({ data, colorScale = 'blues', hideStateNames = false, hideValues = false }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<any>(null);

  // Legend state
  const [legendPosition, setLegendPosition] = useState<{ x: number; y: number }>({ x: 180, y: 565 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [legendTitle, setLegendTitle] = useState('Values (%)');
  const [legendMin, setLegendMin] = useState('');
  const [legendMax, setLegendMax] = useState('');

  const exportPNG = () => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // High DPI settings for 300 DPI output
    const dpiScale = 300 / 96; // 300 DPI vs standard 96 DPI
    const originalWidth = 800;
    const originalHeight = 600;
    
    canvas.width = originalWidth * dpiScale;
    canvas.height = originalHeight * dpiScale;
    
    img.onload = () => {
      if (ctx) {
        // Scale the context to match the DPI
        ctx.scale(dpiScale, dpiScale);
        
        // Fill background with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, originalWidth, originalHeight);
        
        // Draw the image at original size (context scaling handles the DPI)
        ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'india-map.png';
            a.click();
            URL.revokeObjectURL(url);
          }
        });
      }
    };
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  const exportSVG = () => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'india-map.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSVTemplate = () => {
    const stateNames = [
      'A & N Islands',
      'Andhra Pradesh', 
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chandigarh',
      'Chhattisgarh',
      'Delhi',
      'DNHDD',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jammu & Kashmir',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Ladakh',
      'Lakshadweep',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Puducherry',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal'
    ];

    const csvContent = 'state,value\n' + stateNames.map(state => `${state},NA`).join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(csvBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'india-states-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(ref, () => ({
    exportPNG,
    exportSVG,
    downloadCSVTemplate,
  }));

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const response = await fetch('/india_map_states.geojson');
        if (!response.ok) {
          throw new Error(`Failed to load map data: ${response.status} ${response.statusText}`);
        }
        
        const geoData = await response.json();
        setMapData(geoData);
      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

    loadMapData();
  }, []);

  useEffect(() => {
    if (!mapData || !svgRef.current) return;
    
    // Check if mapData has features property
    if (!mapData.features || !Array.isArray(mapData.features)) {
      console.error('Invalid GeoJSON data: missing features array');
      return;
    }

    const svg = d3.select(svgRef.current);
    
    // Only remove map content, not legend
    svg.selectAll(".map-content").remove();

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

    svg.attr("width", width).attr("height", height);

    // Create projection
    const projection = d3.geoMercator()
      .fitSize([width - margin.left - margin.right, height - margin.top - margin.bottom], mapData);

    const path = d3.geoPath().projection(projection);

    // Create data map for quick lookup (normalize state names for better matching)
    const dataMap = new Map(data.map(d => [d.state.toLowerCase().trim(), d.value]));

    // Get the appropriate D3 color interpolator
    const getColorInterpolator = (scale: ColorScale) => {
      const interpolators = {
        blues: d3.interpolateBlues,
        greens: d3.interpolateGreens,
        reds: d3.interpolateReds,
        oranges: d3.interpolateOranges,
        purples: d3.interpolatePurples,
        viridis: d3.interpolateViridis,
        plasma: d3.interpolatePlasma,
        inferno: d3.interpolateInferno,
        magma: d3.interpolateMagma,
        rdylbu: d3.interpolateRdYlBu,
        rdylgn: d3.interpolateRdYlGn,
        spectral: d3.interpolateSpectral,
        brbg: d3.interpolateBrBG,
        piyg: d3.interpolatePiYG,
        puor: d3.interpolatePuOr
      };
      return interpolators[scale] || d3.interpolateBlues;
    };

    // Create color scale only if we have data
    let colorScaleFunction;
    if (data.length > 0) {
      const values = data.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      
      // Check if it's a diverging scale
      const divergingScales = ['rdylbu', 'rdylgn', 'spectral', 'brbg', 'piyg', 'puor'];
      const isDiverging = divergingScales.includes(colorScale);
      
      if (isDiverging) {
        // For diverging scales, use the full range with center at midpoint
        const midpoint = (minValue + maxValue) / 2;
        colorScaleFunction = d3.scaleSequential(getColorInterpolator(colorScale))
          .domain([minValue, maxValue]);
      } else {
        // For sequential scales, use normal domain
        colorScaleFunction = d3.scaleSequential(getColorInterpolator(colorScale))
          .domain([minValue, maxValue]);
      }
    }

    const g = svg.append("g")
      .attr("class", "map-content")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw states
    g.selectAll("path")
      .data(mapData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", (d: any) => {
        // If no data, show all states as white/transparent
        if (data.length === 0) {
          return "#ffffff";
        }
        
        // Try different possible field names for state
        const stateName = (d.properties.state_name || d.properties.NAME_1 || d.properties.name || d.properties.ST_NM)?.toLowerCase().trim();
        const value = dataMap.get(stateName);
        return value !== undefined && colorScaleFunction ? colorScaleFunction(value) : "#e5e7eb";
      })
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer");

    // State name abbreviations
    const stateAbbreviations: { [key: string]: string } = {
      'andhra pradesh': 'Andhra',
      'arunachal pradesh': 'Arunachal',
      'himachal pradesh': 'Himachal',
      'madhya pradesh': 'MP',
      'uttar pradesh': 'UP',
      'west bengal': 'W Bengal',
      'tamil nadu': 'TN',
      'jammu & kashmir': 'J&K',  // Fixed: matches GeoJSON "Jammu & Kashmir"
      'telangana': 'Telangana',   // Added: matches GeoJSON "Telangana"
      'dadra and nagar haveli': 'D&NH',
      'daman and diu': 'D&D',
      'andaman and nicobar islands': 'A&N Islands',
      'rajasthan': 'Rajasthan'
    };

    // Add text labels
    g.selectAll("text")
      .data(mapData.features)
      .enter()
      .append("text")
      .attr("transform", (d: any) => {
        const centroid = path.centroid(d);
        return `translate(${centroid[0]}, ${centroid[1]})`;
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-family", "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif")
      .style("font-weight", "600")
      .style("pointer-events", "none")
      .each(function(d: any) {
        const text = d3.select(this);
        const stateName = (d.properties.state_name || d.properties.NAME_1 || d.properties.name || d.properties.ST_NM)?.toLowerCase().trim();
        const value = dataMap.get(stateName);
        const originalName = d.properties.state_name || d.properties.NAME_1 || d.properties.name || d.properties.ST_NM;
        
        // Only show labels if we have data
        if (data.length > 0 && value !== undefined && originalName) {
          // Calculate appropriate font size based on path bounds
          const bounds = path.bounds(d);
          const width = bounds[1][0] - bounds[0][0];
          const height = bounds[1][1] - bounds[0][1];
          const area = width * height;
          let fontSize = Math.sqrt(area) / 12;
          fontSize = Math.max(7, Math.min(14, fontSize));
          if (stateName === 'rajasthan') {
            fontSize = Math.max(8, fontSize * 0.7);
          }
          const backgroundColor = colorScaleFunction ? colorScaleFunction(value) : "#e5e7eb";
          // Robust color parsing for luminance
          function parseColorToRGB(color: string): {r: number, g: number, b: number} | null {
            // Hex format
            if (color.startsWith('#')) {
              let hex = color.slice(1);
              if (hex.length === 3) {
                hex = hex.split('').map(x => x + x).join('');
              }
              if (hex.length === 6) {
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return { r, g, b };
              }
            }
            // rgb() format
            const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            if (rgbMatch) {
              return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
            }
            // rgba() format
            const rgbaMatch = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
            if (rgbaMatch) {
              return { r: +rgbaMatch[1], g: +rgbaMatch[2], b: +rgbaMatch[3] };
            }
            return null;
          }
          function isColorDark(color: string) {
            const rgb = parseColorToRGB(color);
            if (!rgb) return false; // fallback to dark text
            const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
            return luminance < 0.5;
          }
          // End robust color parsing
          const textColor = isColorDark(backgroundColor) ? "#ffffff" : "#1f2937";
          const valueColor = textColor;
          const displayName = stateAbbreviations[stateName] || originalName;
          if (!hideStateNames) {
            // Add state name
            text.append("tspan")
              .attr("x", 0)
              .attr("dy", "-0.4em")
              .style("font-size", `${fontSize}px`)
              .style("font-weight", "600")
              .style("fill", textColor)
              .text(displayName);
          }
          if (!hideValues && !hideStateNames) {
            // Add value
            text.append("tspan")
              .attr("x", 0)
              .attr("dy", "1.3em")
              .style("font-size", `${fontSize * 0.85}px`)
              .style("font-weight", "700")
              .style("fill", valueColor)
              .text(`${value.toFixed(1)}%`);
          } else if (hideStateNames && !hideValues) {
            // Only value, centered vertically
            text.append("tspan")
              .attr("x", 0)
              .attr("dy", "0.4em")
              .style("font-size", `${fontSize * 0.95}px`)
              .style("font-weight", "700")
              .style("fill", valueColor)
              .text(`${value.toFixed(1)}%`);
          }
        }
      });

    // Legend will be handled by separate effect

  }, [mapData, data, colorScale, hideStateNames, hideValues]);

  // Legend values from data
  useEffect(() => {
    if (data.length > 0) {
      const values = data.map(d => d.value);
      setLegendMin(Math.min(...values).toFixed(1));
      setLegendMax(Math.max(...values).toFixed(1));
    } else {
      setLegendMin('0.0');
      setLegendMax('1.0');
    }
  }, [data]);

  // D3 gradient for legend
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    // Remove existing gradient
    svg.selectAll('#legend-gradient').remove();
    let defs = svg.select('defs');
    if (defs.empty()) defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');
    // Color scale
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const getColorInterpolator = (scale: ColorScale) => {
      const interpolators = {
        blues: d3.interpolateBlues,
        greens: d3.interpolateGreens,
        reds: d3.interpolateReds,
        oranges: d3.interpolateOranges,
        purples: d3.interpolatePurples,
        viridis: d3.interpolateViridis,
        plasma: d3.interpolatePlasma,
        inferno: d3.interpolateInferno,
        magma: d3.interpolateMagma,
        rdylbu: d3.interpolateRdYlBu,
        rdylgn: d3.interpolateRdYlGn,
        spectral: d3.interpolateSpectral,
        brbg: d3.interpolateBrBG,
        piyg: d3.interpolatePiYG,
        puor: d3.interpolatePuOr
      };
      return interpolators[scale] || d3.interpolateBlues;
    };
    const colorScaleFunction = d3.scaleSequential(getColorInterpolator(colorScale))
      .domain([minValue, maxValue]);
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = minValue + t * (maxValue - minValue);
      const color = colorScaleFunction(value);
      gradient.append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', color);
    }
  }, [colorScale, data]);

  // Drag handlers
  const handleLegendMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      setDragOffset({
        x: e.clientX - (svgRect.left + legendPosition.x),
        y: e.clientY - (svgRect.top + legendPosition.y)
      });
    }
  };
  const handleLegendMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      setLegendPosition({
        x: e.clientX - svgRect.left - dragOffset.x,
        y: e.clientY - svgRect.top - dragOffset.y
      });
    }
  };
  const handleLegendMouseUp = () => setDragging(false);

  // Attach global mousemove/mouseup for drag
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => handleLegendMouseMove(e as any);
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, dragOffset]);

  if (!mapData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center relative">
      <svg
        ref={svgRef}
        className="max-w-full h-auto border rounded-lg"
        width={800}
        height={600}
        style={{ userSelect: 'none' }}
      >
        {/* Legend overlay (React) */}
        {data.length > 0 && (
          <g
            className="legend-container"
            transform={`translate(${legendPosition.x}, ${legendPosition.y})`}
            onMouseDown={handleLegendMouseDown}
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <rect
              width={200}
              height={15}
              fill="url(#legend-gradient)"
              stroke="#374151"
              strokeWidth={0.5}
              rx={3}
            />
            {/* Min value */}
            {editingMin ? (
              <foreignObject x={-10} y={18} width={40} height={30}>
                <input
                  type="text"
                  value={legendMin}
                  autoFocus
                  style={{ width: 38, fontSize: 12 }}
                  onChange={e => setLegendMin(e.target.value)}
                  onBlur={() => setEditingMin(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingMin(false)}
                />
              </foreignObject>
            ) : (
              <text
                x={0}
                y={30}
                textAnchor="start"
                style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 500, fill: '#374151', cursor: 'pointer' }}
                onDoubleClick={e => { e.stopPropagation(); setEditingMin(true); }}
              >
                {legendMin}
              </text>
            )}
            {/* Max value */}
            {editingMax ? (
              <foreignObject x={170} y={18} width={40} height={30}>
                <input
                  type="text"
                  value={legendMax}
                  autoFocus
                  style={{ width: 38, fontSize: 12 }}
                  onChange={e => setLegendMax(e.target.value)}
                  onBlur={() => setEditingMax(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingMax(false)}
                />
              </foreignObject>
            ) : (
              <text
                x={200}
                y={30}
                textAnchor="end"
                style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 500, fill: '#374151', cursor: 'pointer' }}
                onDoubleClick={e => { e.stopPropagation(); setEditingMax(true); }}
              >
                {legendMax}
              </text>
            )}
            {/* Title */}
            {editingTitle ? (
              <foreignObject x={60} y={-25} width={90} height={30}>
                <input
                  type="text"
                  value={legendTitle}
                  autoFocus
                  style={{ width: 88, fontSize: 13, fontWeight: 600, textAlign: 'center' }}
                  onChange={e => setLegendTitle(e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                />
              </foreignObject>
            ) : (
              <text
                x={100}
                y={-5}
                textAnchor="middle"
                style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, fill: '#374151', cursor: 'pointer' }}
                onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}
              >
                {legendTitle}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
});
