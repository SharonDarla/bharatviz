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
}

export interface IndiaMapRef {
  exportPNG: () => void;
  exportSVG: () => void;
  downloadCSVTemplate: () => void;
}

export const IndiaMap = forwardRef<IndiaMapRef, IndiaMapProps>(({ data, colorScale = 'blues' }, ref) => {
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
    svg.selectAll("defs").remove();

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
          
          // Dynamic font sizing based on area
          let fontSize = Math.sqrt(area) / 12;
          fontSize = Math.max(7, Math.min(14, fontSize));
          
          // Special handling for Rajasthan to reduce font size
          if (stateName === 'rajasthan') {
            fontSize = Math.max(8, fontSize * 0.7);
          }
          
          // Get the background color for this state
          const backgroundColor = colorScaleFunction ? colorScaleFunction(value) : "#e5e7eb";
          
          // Calculate if background is dark (helper function)
          const isColorDark = (color: string) => {
            // Convert hex to RGB
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
          };
          
          // Choose text color based on background darkness
          const textColor = isColorDark(backgroundColor) ? "#ffffff" : "#1f2937";
          const valueColor = textColor; // Same color for both state name and percentage
          
          // Get abbreviated name
          const displayName = stateAbbreviations[stateName] || originalName;
          
          // Add state name
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", "-0.4em")
            .style("font-size", `${fontSize}px`)
            .style("font-weight", "600")
            .style("fill", textColor)
            .text(displayName);
          
          // Add value
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", "1.3em")
            .style("font-size", `${fontSize * 0.85}px`)
            .style("font-weight", "700")
            .style("fill", valueColor)
            .text(`${value.toFixed(1)}%`);
        }
      });

    // Legend will be handled by separate effect

  }, [mapData, data, colorScale]);

  // Separate effect for legend management
  useEffect(() => {
    if (!mapData || !svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

    // Remove existing legend
    svg.selectAll(".legend-container").remove();

    // Create color scale
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

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
      return interpolators[colorScale] || d3.interpolateBlues;
    };

    const colorScaleFunction = d3.scaleSequential(getColorInterpolator(colorScale))
      .domain([minValue, maxValue]);

    const legendWidth = 200;
    const legendHeight = 15;
    // Move legend further to the left and down more
    const legendX = (width - margin.left - margin.right - legendWidth) / 2 - 40;
    // Move legend slightly further down
    const legendY = height - margin.top - margin.bottom + 25;

    // Create legend group
    const legendGroup = svg.append("g")
      .attr("class", "legend-container")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    // Create gradient for legend
    let legendGradient = svg.select("#legend-gradient");
    if (legendGradient.empty()) {
      const defs = svg.selectAll("defs").empty() ? svg.append("defs") : svg.select("defs");
      legendGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");
    } else {
      legendGradient.selectAll("stop").remove();
    }

    // Add color stops to gradient
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = minValue + t * (maxValue - minValue);
      const color = colorScaleFunction(value);

      legendGradient.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", color);
    }

    // Add legend rectangle
    legendGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .style("stroke", "#374151")
      .style("stroke-width", 0.5);

    // Add legend labels
    legendGroup.append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "start")
      .style("font-family", "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", "#374151")
      .text(minValue.toFixed(1));

    legendGroup.append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 15)
      .attr("text-anchor", "end")
      .style("font-family", "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", "#374151")
      .text(maxValue.toFixed(1));

    // Add legend title
    legendGroup.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-family", "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Values (%)");

  }, [mapData, data, colorScale]);


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
      <svg ref={svgRef} className="max-w-full h-auto border rounded-lg"></svg>
      
    </div>
  );
});
