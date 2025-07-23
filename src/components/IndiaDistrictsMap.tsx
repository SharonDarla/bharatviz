import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import * as d3 from 'd3';
import { scaleSequential } from 'd3-scale';
import { interpolateSpectral, interpolateViridis, interpolateWarm, interpolateCool, interpolatePlasma, interpolateInferno, interpolateMagma, interpolateTurbo, interpolateRdYlBu, interpolateBrBG, interpolatePRGn, interpolatePiYG, interpolateRdBu, interpolateRdGy, interpolatePuOr, interpolateSpectral as interpolateSpectralReversed } from 'd3-scale-chromatic';
import { extent } from 'd3-array';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { type ColorScale } from './ColorMapChooser';

interface DistrictMapData {
  district: string;
  value: number;
}

interface IndiaDistrictsMapProps {
  data: DistrictMapData[];
  colorScale: ColorScale;
  invertColors: boolean;
  hideStateNames: boolean;
  hideValues: boolean;
  dataTitle: string;
}

export interface IndiaDistrictsMapRef {
  exportPNG: () => void;
  exportSVG: () => void;
  exportPDF: () => void;
  downloadCSVTemplate: () => void;
}

interface GeoJSONFeature {
  type: string;
  properties: {
    state_name: string;
    district_name: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface Bounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

const colorScales: Record<ColorScale, (t: number) => string> = {
  spectral: interpolateSpectral,
  viridis: interpolateViridis,
  warm: interpolateWarm,
  cool: interpolateCool,
  plasma: interpolatePlasma,
  inferno: interpolateInferno,
  magma: interpolateMagma,
  turbo: interpolateTurbo,
  rdylbu: interpolateRdYlBu,
  brbg: interpolateBrBG,
  prgn: interpolatePRGn,
  piyg: interpolatePiYG,
  rdbu: interpolateRdBu,
  rdgy: interpolateRdGy,
  puor: interpolatePuOr,
  spectral_r: interpolateSpectralReversed,
};

export const IndiaDistrictsMap = forwardRef<IndiaDistrictsMapRef, IndiaDistrictsMapProps>(({
  data,
  colorScale,
  invertColors,
  hideStateNames,
  hideValues,
  dataTitle
}, ref) => {
  const [geojsonData, setGeojsonData] = useState<{ features: GeoJSONFeature[] } | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<{ district: string; state: string; value?: number } | null>(null);
  const [editingMainTitle, setEditingMainTitle] = useState(false);
  const [mainTitle, setMainTitle] = useState('BharatViz (double click to edit)');
  
  // Legend state
  const [legendPosition, setLegendPosition] = useState<{ x: number; y: number }>({ x: 220, y: 615 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [legendTitle, setLegendTitle] = useState(dataTitle || 'Values (edit me)');
  const [legendMin, setLegendMin] = useState('');
  const [legendMax, setLegendMax] = useState('');
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Update legend position when mobile state changes
  useEffect(() => {
    setLegendPosition(isMobile ? { x: 70, y: 300 } : { x: 240, y: 640 });
  }, [isMobile]);

  // Update legend title when dataTitle changes
  useEffect(() => {
    if (dataTitle) {
      setLegendTitle(dataTitle);
    }
  }, [dataTitle]);

  // Update legend values when data changes
  useEffect(() => {
    if (data.length > 0) {
      const values = data.map(d => d.value).filter(v => !isNaN(v));
      const minValue = values.length > 0 ? Math.min(...values) : 0;
      const maxValue = values.length > 0 ? Math.max(...values) : 1;
      setLegendMin(minValue.toFixed(1));
      setLegendMax(maxValue.toFixed(1));
    } else {
      setLegendMin('0.0');
      setLegendMax('1.0');
    }
  }, [data]);

  useEffect(() => {
    fetch('/India_LGD_Districts_simplified.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setGeojsonData(data);
        calculateBounds(data);
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });
  }, []);

  const calculateBounds = (data: { features: GeoJSONFeature[] }) => {
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    const processCoordinates = (coords: number[] | number[][]) => {
      if (Array.isArray(coords[0])) {
        (coords as number[][]).forEach(processCoordinates);
      } else {
        const [lng, lat] = coords as number[];
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
    };

    data.features.forEach((feature) => {
      if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          (polygon as number[][][]).forEach(ring => {
            processCoordinates(ring);
          });
        });
      } else if (feature.geometry.type === 'Polygon') {
        (feature.geometry.coordinates as number[][][]).forEach(ring => {
          processCoordinates(ring);
        });
      }
    });

    setBounds({ minLng, maxLng, minLat, maxLat });
  };

  // D3 gradient for legend
  useEffect(() => {
    
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    // Always remove existing gradient first
    svg.selectAll('#districts-legend-gradient').remove();
    
    // If no data, don't create gradient
    if (data.length === 0) {
      return;
    }
    
    let defs = svg.select('defs');
    if (defs.empty()) defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'districts-legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');
    
    // Color scale
    const values = data.map(d => d.value).filter(v => !isNaN(v));
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 1;
    const getColorInterpolator = (scale: ColorScale) => {
      const baseInterpolator = colorScales[scale] || colorScales.spectral;
      return invertColors ? (t: number) => baseInterpolator(1 - t) : baseInterpolator;
    };
    const colorScaleFunction = scaleSequential(getColorInterpolator(colorScale))
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
  }, [colorScale, invertColors, data]);

  const projectCoordinate = (lng: number, lat: number, width = 560, height = 630): [number, number] => {
    if (!bounds) return [0, 0];
    
    const geoWidth = bounds.maxLng - bounds.minLng;
    const geoHeight = bounds.maxLat - bounds.minLat;
    const geoAspectRatio = geoWidth / geoHeight;
    
    const canvasAspectRatio = width / height;
    
    let projectionWidth = width;
    let projectionHeight = height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (geoAspectRatio > canvasAspectRatio) {
      projectionHeight = width / geoAspectRatio;
      offsetY = (height - projectionHeight) / 2;
    } else {
      projectionWidth = height * geoAspectRatio;
      offsetX = (width - projectionWidth) / 2;
    }
    
    const x = ((lng - bounds.minLng) / geoWidth) * projectionWidth + offsetX;
    const y = ((bounds.maxLat - lat) / geoHeight) * projectionHeight + offsetY;
    
    return [x, y];
  };

  const convertCoordinatesToPath = (coordinates: number[][][] | number[][][][], width = 560, height = 630, yOffset = 0): string => {
    if (!coordinates || !Array.isArray(coordinates)) return '';
    
    const convertRing = (ring: number[][]) => {
      return ring.map(coord => {
        const [lng, lat] = coord;
        const [x, y] = projectCoordinate(lng, lat, width, height);
        return `${x},${y + yOffset}`;
      }).join(' L ');
    };

    if (coordinates[0] && Array.isArray(coordinates[0][0]) && Array.isArray((coordinates[0][0] as number[][])[0])) {
      // MultiPolygon
      return (coordinates as number[][][][]).map(polygon => {
        return polygon.map(ring => {
          const pathData = convertRing(ring);
          return `M ${pathData} Z`;
        }).join(' ');
      }).join(' ');
    } else if (coordinates[0] && Array.isArray(coordinates[0][0])) {
      // Polygon
      return (coordinates as number[][][]).map(ring => {
        const pathData = convertRing(ring);
        return `M ${pathData} Z`;
      }).join(' ');
    }
    
    return '';
  };

  const getColorForValue = (value: number | undefined, dataExtent: [number, number] | undefined): string => {
    if (value === undefined || !dataExtent) return 'white';
    
    if (isNaN(value)) {
      return '#d1d5db'; // Light gray for NaN/NA values
    }
    
    const [minVal, maxVal] = dataExtent;
    if (minVal === maxVal) return colorScales[colorScale](0.5);
    
    let normalizedValue = (value - minVal) / (maxVal - minVal);
    if (invertColors) normalizedValue = 1 - normalizedValue;
    
    return colorScales[colorScale](normalizedValue);
  };

  const handleDistrictHover = (feature: GeoJSONFeature) => {
    const { district_name, state_name } = feature.properties;
    const districtData = data.find(d => d.district === district_name);
    setHoveredDistrict({ 
      district: district_name, 
      state: state_name,
      value: districtData?.value
    });
  };

  const handleDistrictLeave = () => {
    setHoveredDistrict(null);
  };

  // Drag handlers for legend
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

  const handleLegendMouseMove = (e: MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    setLegendPosition({
      x: e.clientX - svgRect.left - dragOffset.x,
      y: e.clientY - svgRect.top - dragOffset.y
    });
  };

  const handleLegendMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleLegendMouseMove);
      document.addEventListener('mouseup', handleLegendMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleLegendMouseMove);
        document.removeEventListener('mouseup', handleLegendMouseUp);
      };
    }
  }, [dragging, dragOffset]);

  // Fix legend gradient for PDF export
  const fixDistrictsLegendGradient = (svgClone: SVGSVGElement) => {
    if (data.length === 0) return;
    
    // Get the available color scales from the component
    const colorScales = {
      spectral: (t: number) => d3.interpolateSpectral(1 - t), 
      rdylbu: d3.interpolateRdYlBu,
      rdylgn: d3.interpolateRdYlGn,
      brbg: d3.interpolateBrBG,
      piyg: d3.interpolatePiYG,
      puor: d3.interpolatePuOr,
      blues: d3.interpolateBlues,
      greens: d3.interpolateGreens,
      reds: d3.interpolateReds,
      oranges: d3.interpolateOranges,
      purples: d3.interpolatePurples,
      pinks: d3.interpolatePuRd,
      viridis: d3.interpolateViridis,
      plasma: d3.interpolatePlasma,
      inferno: d3.interpolateInferno,
      magma: d3.interpolateMagma
    };

    const getColorForValue = (value: number | undefined, dataExtent: [number, number] | undefined): string => {
      if (value === undefined || !dataExtent || isNaN(value)) return '#d1d5db';
      
      const [minVal, maxVal] = dataExtent;
      if (minVal === maxVal) return colorScales[colorScale](0.5);
      
      let normalizedValue = (value - minVal) / (maxVal - minVal);
      if (invertColors) normalizedValue = 1 - normalizedValue;
      
      return colorScales[colorScale](normalizedValue);
    };
    
    // Calculate color scale values
    const values = data.map(d => d.value).filter(v => !isNaN(v));
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 1;
    
    // Find the legend rectangle that uses the gradient
    const legendRect = svgClone.querySelector('rect[fill*="districts-legend-gradient"]');
    if (legendRect) {
      // Get the rect's position and dimensions
      const x = parseFloat(legendRect.getAttribute('x') || '0');
      const y = parseFloat(legendRect.getAttribute('y') || '0');
      const width = parseFloat(legendRect.getAttribute('width') || '200');
      const height = parseFloat(legendRect.getAttribute('height') || '15');
      const stroke = legendRect.getAttribute('stroke');
      const strokeWidth = legendRect.getAttribute('stroke-width');
      const rx = legendRect.getAttribute('rx');
      
      // Get parent element
      const parent = legendRect.parentElement;
      if (parent) {
        // Remove the original gradient rect
        legendRect.remove();
        
        // Create multiple small rectangles with solid colors
        const numSegments = 50; // More segments for smoother gradient
        const segmentWidth = width / numSegments;
        
        for (let i = 0; i < numSegments; i++) {
          const t = i / (numSegments - 1);
          const value = minValue + t * (maxValue - minValue);
          const color = getColorForValue(value, [minValue, maxValue]);
          
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', (x + i * segmentWidth).toString());
          rect.setAttribute('y', y.toString());
          rect.setAttribute('width', segmentWidth.toString());
          rect.setAttribute('height', height.toString());
          rect.setAttribute('fill', color);
          
          // Add stroke only to first and last segment to maintain border
          if (i === 0 || i === numSegments - 1) {
            if (stroke) rect.setAttribute('stroke', stroke);
            if (strokeWidth) rect.setAttribute('stroke-width', strokeWidth);
          }
          
          // Add border radius to first and last segments
          if (rx && (i === 0 || i === numSegments - 1)) {
            rect.setAttribute('rx', rx);
          }
          
          parent.appendChild(rect);
        }
      }
    }
    
    // Also remove any gradient definitions that are no longer needed
    const gradients = svgClone.querySelectorAll('#districts-legend-gradient');
    gradients.forEach(gradient => gradient.remove());
  };

  // Fallback PDF export method
  const exportDistrictsFallbackPDF = async () => {
    if (!containerRef.current) return;
    
    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    
    // Get PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate margins and available space
    const pdfMargin = 15; // 15mm margin
    const availableWidth = pdfWidth - (2 * pdfMargin);
    const availableHeight = pdfHeight - (2 * pdfMargin);
    
    // Calculate aspect ratio preserving dimensions
    const canvasAspectRatio = canvas.width / canvas.height;
    let imgWidth = availableWidth;
    let imgHeight = availableWidth / canvasAspectRatio;
    
    // If height exceeds available space, scale by height instead
    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = availableHeight * canvasAspectRatio;
    }
    
    // Center the image
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;
    
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`bharatviz-districts-${Date.now()}.pdf`);
  };

  useImperativeHandle(ref, () => ({
    exportPNG: async () => {
      if (!containerRef.current) return;
      
      try {
        const canvas = await html2canvas(containerRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `bharatviz-districts-${Date.now()}.png`);
          }
        });
      } catch (error) {
        console.error('Error exporting PNG:', error);
      }
    },
    exportSVG: () => {
      if (!svgRef.current) return;
      
      const svgElement = svgRef.current.cloneNode(true) as SVGElement;
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Ensure consistent font handling
      const allElements = svgElement.querySelectorAll('*');
      allElements.forEach(el => {
        const element = el as SVGElement;
        if (element.tagName === 'text') {
          element.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
        }
      });
      
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      saveAs(blob, `bharatviz-districts-${Date.now()}.svg`);
    },
    exportPDF: async () => {
      if (!svgRef.current) return;
      
      try {
        // Dynamically import PDF libraries
        const [{ default: jsPDF }, { svg2pdf }] = await Promise.all([
          import('jspdf'),
          import('svg2pdf.js')
        ]);
        
        // Create PDF document
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Get the actual SVG dimensions
        const svgWidth = isMobile ? 245 : 560;
        const svgHeight = isMobile ? 330 : 730;
        
        // Clone the SVG to avoid modifying the original
        const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
        
        // Ensure the cloned SVG has proper attributes for full capture
        svgClone.setAttribute('width', svgWidth.toString());
        svgClone.setAttribute('height', svgHeight.toString());
        svgClone.setAttribute('viewBox', `${isMobile ? '0 0 245 330' : '0 0 560 730'}`);
        svgClone.style.width = `${svgWidth}px`;
        svgClone.style.height = `${svgHeight}px`;
        
        // Remove any CSS classes that might interfere with export
        svgClone.removeAttribute('class');
        
        // Force all elements to be visible and properly positioned
        const allElements = svgClone.querySelectorAll('*');
        allElements.forEach(el => {
          const element = el as SVGElement;
          element.style.visibility = 'visible';
          element.style.display = 'block';
          // Ensure text elements are properly rendered with consistent font
          if (element.tagName === 'text') {
            element.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
          }
        });
        
        // Fix the legend gradient to match the selected color scale
        fixDistrictsLegendGradient(svgClone);
        
        // Calculate PDF margins and available space
        const pdfMargin = 15; // 15mm margin
        const availableWidth = pdfWidth - (2 * pdfMargin);
        const availableHeight = pdfHeight - (2 * pdfMargin);
        
        // Convert SVG dimensions to mm (1px = 0.264583mm at 96dpi)
        const svgWidthMm = svgWidth * 0.264583;
        const svgHeightMm = svgHeight * 0.264583;
        
        // Calculate scale to fit entire SVG in PDF
        const scaleX = availableWidth / svgWidthMm;
        const scaleY = availableHeight / svgHeightMm;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate final dimensions and position
        const finalWidth = svgWidthMm * scale;
        const finalHeight = svgHeightMm * scale;
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;
        
        // Use svg2pdf.js for true vector conversion
        await svg2pdf(svgClone, pdf, {
          xOffset: x,
          yOffset: y,
          scale: scale,
          preserveAspectRatio: 'xMidYMid meet',
          width: finalWidth,
          height: finalHeight
        });
        
        // Save the PDF
        pdf.save(`bharatviz-districts-${Date.now()}.pdf`);
        
      } catch (error) {
        console.error('Error generating vector PDF:', error);
        
        // Fallback to raster PDF if vector conversion fails
        try {
          await exportDistrictsFallbackPDF();
        } catch (fallbackError) {
          console.error('Fallback PDF generation also failed:', fallbackError);
          alert('Failed to export PDF. Please try using SVG export instead.');
        }
      }
    },
    downloadCSVTemplate: () => {
      const template = `district,value
Nicobars,10
North And Middle Andaman,20
South Andaman,30
Anantapur,40
Chittoor,50`;
      
      const blob = new Blob([template], { type: 'text/csv' });
      saveAs(blob, 'districts-template.csv');
    }
  }));

  if (!geojsonData || !bounds) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading districts map...</div>
      </Card>
    );
  }

  const dataExtent = data.length > 0 ? extent(data, d => d.value) as [number, number] : undefined;

  return (
    <Card ref={containerRef} className="w-full p-4">
      <div className="space-y-4">        
        <div className="flex justify-center">
          <div className="relative ml-8 mt-10">
            <svg
              ref={svgRef}
              width={isMobile ? "245" : "560"}
              height={isMobile ? "330" : "730"}
              viewBox={isMobile ? "0 0 245 330" : "0 0 560 730"}
              className="border border-border rounded bg-background max-w-full h-auto"
            >
              {geojsonData.features.map((feature, index) => {
                const mapWidth = isMobile ? 245 : 560;
                const mapHeight = isMobile ? 280 : 630;
                const path = convertCoordinatesToPath(feature.geometry.coordinates, mapWidth, mapHeight, isMobile ? 35 : 35);
                const districtData = data.find(d => d.district === feature.properties.district_name);
                const fillColor = getColorForValue(districtData?.value, dataExtent);
                const isHovered = hoveredDistrict && 
                  hoveredDistrict.district === feature.properties.district_name;
                
                return (
                  <path
                    key={index}
                    d={path}
                    fill={fillColor}
                    stroke="#374151"
                    strokeWidth={isHovered ? "1.5" : "0.3"}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => handleDistrictHover(feature)}
                    onMouseLeave={handleDistrictLeave}
                  >
                    <title>
                      {feature.properties.district_name}, {feature.properties.state_name}
                      {districtData?.value !== undefined ? `: ${districtData.value}` : ''}
                    </title>
                  </path>
                );
              })}
              
              {/* Main Title */}
              <g className="main-title-container">
                {editingMainTitle ? (
                  <foreignObject x={isMobile ? -50 : 10} y={isMobile ? 10 : 15} width={isMobile ? 200 : 300} height={40}>
                    <input
                      type="text"
                      value={mainTitle}
                      autoFocus
                      style={{ 
                        width: isMobile ? 198 : 298, 
                        fontSize: isMobile ? 16 : 20, 
                        fontWeight: 700, 
                        textAlign: 'center',
                        border: '2px solid #3b82f6',
                        borderRadius: '4px',
                        outline: 'none',
                        padding: '4px 8px',
                        backgroundColor: 'white'
                      }}
                      onChange={e => setMainTitle(e.target.value)}
                      onBlur={() => setEditingMainTitle(false)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setEditingMainTitle(false);
                        }
                      }}
                    />
                  </foreignObject>
                ) : (
                  <text
                    x={isMobile ? 22 : 180}
                    y={isMobile ? 30 : 35}
                    textAnchor="middle"
                    style={{ 
                      fontFamily: 'Arial, Helvetica, sans-serif', 
                      fontSize: isMobile ? 16 : 20, 
                      fontWeight: 700, 
                      fill: '#1f2937', 
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onDoubleClick={e => { 
                      e.stopPropagation(); 
                      setEditingMainTitle(true); 
                    }}
                  >
                    {mainTitle}
                  </text>
                )}
              </g>

              {/* Legend */}
              {data.length > 0 && (
                <g
                  className="legend-container"
                  transform={`translate(${legendPosition.x}, ${legendPosition.y})`}
                  onMouseDown={handleLegendMouseDown}
                  style={{ cursor: dragging ? 'grabbing' : 'grab' }}
                >
                  <rect
                    width={isMobile ? 150 : 200}
                    height={15}
                    fill="url(#districts-legend-gradient)"
                    stroke="#374151"
                    strokeWidth={0.5}
                    rx={3}
                  />
                  {/* Min value */}
                  {editingMin ? (
                    <foreignObject x={-10} y={18} width={isMobile ? 30 : 40} height={30}>
                      <input
                        type="text"
                        value={legendMin}
                        autoFocus
                        style={{ width: isMobile ? 28 : 38, fontSize: isMobile ? 10 : 12 }}
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
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: isMobile ? 10 : 12, fontWeight: 500, fill: '#374151', cursor: 'pointer' }}
                      onDoubleClick={e => { e.stopPropagation(); setEditingMin(true); }}
                    >
                      {legendMin}
                    </text>
                  )}
                  {/* Max value */}
                  {editingMax ? (
                    <foreignObject x={isMobile ? 120 : 170} y={18} width={isMobile ? 30 : 40} height={30}>
                      <input
                        type="text"
                        value={legendMax}
                        autoFocus
                        style={{ width: isMobile ? 28 : 38, fontSize: isMobile ? 10 : 12 }}
                        onChange={e => setLegendMax(e.target.value)}
                        onBlur={() => setEditingMax(false)}
                        onKeyDown={e => e.key === 'Enter' && setEditingMax(false)}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={isMobile ? 150 : 200}
                      y={30}
                      textAnchor="end"
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: isMobile ? 10 : 12, fontWeight: 500, fill: '#374151', cursor: 'pointer' }}
                      onDoubleClick={e => { e.stopPropagation(); setEditingMax(true); }}
                    >
                      {legendMax}
                    </text>
                  )}
                  {/* Legend Title */}
                  {editingTitle ? (
                    <foreignObject x={isMobile ? 40 : 60} y={-25} width={isMobile ? 70 : 90} height={30}>
                      <input
                        type="text"
                        value={legendTitle}
                        autoFocus
                        style={{ width: isMobile ? 68 : 88, fontSize: isMobile ? 11 : 13, fontWeight: 600, textAlign: 'center' }}
                        onChange={e => setLegendTitle(e.target.value)}
                        onBlur={() => setEditingTitle(false)}
                        onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={isMobile ? 75 : 100}
                      y={-5}
                      textAnchor="middle"
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: isMobile ? 11 : 13, fontWeight: 600, fill: '#374151', cursor: 'pointer' }}
                      onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}
                    >
                      {legendTitle}
                    </text>
                  )}
                </g>
              )}
            </svg>

            {hoveredDistrict && (
              <div className="absolute top-4 right-2 bg-popover text-popover-foreground px-3 py-2 rounded-md text-sm pointer-events-none border shadow-md">
                <div className="font-medium">{hoveredDistrict.district}</div>
                <div className="text-xs text-muted-foreground">{hoveredDistrict.state}</div>
                {hoveredDistrict.value !== undefined && (
                  <div className="text-xs">{hoveredDistrict.value}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

IndiaDistrictsMap.displayName = 'IndiaDistrictsMap';