import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';

interface MapData {
  state: string;
  value: number;
}

interface IndiaMapProps {
  data: MapData[];
}

export interface IndiaMapRef {
  exportPNG: () => void;
  exportSVG: () => void;
}

export const IndiaMap = forwardRef<IndiaMapRef, IndiaMapProps>(({ data }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<any>(null);

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
            a.download = 'india-map-300dpi.png';
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

  useImperativeHandle(ref, () => ({
    exportPNG,
    exportSVG,
  }));

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const response = await fetch('/india_map_states.geojson');
        if (!response.ok) {
          throw new Error('Failed to load map data');
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

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

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

    // Create color scale only if we have data
    let colorScale;
    if (data.length > 0) {
      const values = data.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([minValue, maxValue]);
    }

    const g = svg.append("g")
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
        return value !== undefined && colorScale ? colorScale(value) : "#e5e7eb";
      })
      .attr("stroke", "#374151")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer");

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
      .attr("dy", "0.35em")
      .style("font-family", "Arial, sans-serif")
      .style("font-weight", "600")
      .style("fill", "#1f2937")
      .style("pointer-events", "none")
      .each(function(d: any) {
        const text = d3.select(this);
        const stateName = (d.properties.state_name || d.properties.NAME_1 || d.properties.name || d.properties.ST_NM)?.toLowerCase().trim();
        const value = dataMap.get(stateName);
        const displayName = d.properties.state_name || d.properties.NAME_1 || d.properties.name || d.properties.ST_NM;
        
        // Only show labels if we have data
        if (data.length > 0 && value !== undefined && displayName) {
          // Calculate appropriate font size based on path bounds
          const bounds = path.bounds(d);
          const width = bounds[1][0] - bounds[0][0];
          const height = bounds[1][1] - bounds[0][1];
          const fontSize = Math.min(width, height) / 8;
          const clampedFontSize = Math.max(8, Math.min(12, fontSize));
          
          // Add state name
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", "-0.3em")
            .style("font-size", `${clampedFontSize}px`)
            .text(displayName.length > 12 ? displayName.substring(0, 10) + "..." : displayName);
          
          // Add value
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", "1.2em")
            .style("font-size", `${clampedFontSize * 0.9}px`)
            .style("font-weight", "700")
            .text(`${value.toFixed(1)}%`);
        }
      });

  }, [mapData, data]);

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
    <div className="w-full flex justify-center">
      <svg ref={svgRef} className="max-w-full h-auto border rounded-lg"></svg>
    </div>
  );
});