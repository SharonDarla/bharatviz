import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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
  dataTitle?: string;
}

export interface IndiaMapRef {
  exportPNG: () => void;
  exportSVG: () => void;
  exportPDF: () => void;
  downloadCSVTemplate: () => void;
}

export const IndiaMap = forwardRef<IndiaMapRef, IndiaMapProps>(({ data, colorScale = 'spectral', hideStateNames = false, hideValues = false, dataTitle = '' }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<any>(null);

  // Legend state
  const [legendPosition, setLegendPosition] = useState<{ x: number; y: number }>({ x: 220, y: 565 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [legendTitle, setLegendTitle] = useState(dataTitle || 'Values (edit me) %');
  const [legendMin, setLegendMin] = useState('');
  const [legendMax, setLegendMax] = useState('');
  
  // Main title state
  const [editingMainTitle, setEditingMainTitle] = useState(false);
  const [mainTitle, setMainTitle] = useState('BharatViz (editable title)');
  
  const isMobile = useIsMobile();

  // Update legend position when mobile state changes
  useEffect(() => {
    setLegendPosition(isMobile ? { x: 100, y: 240 } : { x: 220, y: 565 });
  }, [isMobile]);

  // Update legend title when dataTitle changes
  useEffect(() => {
    if (dataTitle) {
      setLegendTitle(dataTitle);
    }
  }, [dataTitle]);

  const exportPNG = () => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // High DPI settings for 300 DPI output
    const dpiScale = 300 / 96; // 300 DPI vs standard 96 DPI
    const originalWidth = isMobile ? 350 : 800;
    const originalHeight = isMobile ? 280 : 600;
    
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
            a.download = 'bharatviz.png';
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
    a.download = 'bharatviz.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper function to fix legend gradient in cloned SVG by replacing with solid color rectangles
  const fixLegendGradient = (svgClone: SVGSVGElement) => {
    if (data.length === 0) return;
    
    // Get the appropriate D3 color interpolator
    const getColorInterpolator = (scale: ColorScale) => {
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
        spectral: (t: number) => d3.interpolateSpectral(1 - t),
        brbg: d3.interpolateBrBG,
        piyg: d3.interpolatePiYG,
        puor: d3.interpolatePuOr
      };
      return interpolators[scale] || d3.interpolateBlues;
    };
    
    // Calculate color scale values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const colorInterpolator = getColorInterpolator(colorScale);
    const colorScaleFunction = d3.scaleSequential(colorInterpolator)
      .domain([minValue, maxValue]);
    
    // Find the legend rectangle that uses the gradient
    const legendRect = svgClone.querySelector('rect[fill*="legend-gradient"]');
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
          const color = colorScaleFunction(value);
          
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
    const gradients = svgClone.querySelectorAll('#legend-gradient');
    gradients.forEach(gradient => gradient.remove());
  };

  const exportPDF = async () => {
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
      const svgWidth = isMobile ? 350 : 800;
      const svgHeight = isMobile ? 280 : 600;
      
      // Clone the SVG to avoid modifying the original
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
      
      // Ensure the cloned SVG has proper attributes for full capture
      svgClone.setAttribute('width', svgWidth.toString());
      svgClone.setAttribute('height', svgHeight.toString());
      svgClone.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
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
      });
      
      // Fix the legend gradient to match the selected color scale
      fixLegendGradient(svgClone);
      
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
      
      console.log('PDF Export Debug:', {
        svgWidth, svgHeight,
        svgWidthMm, svgHeightMm,
        availableWidth, availableHeight,
        scale, finalWidth, finalHeight,
        x, y
      });
      
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
      pdf.save('bharatviz.pdf');
      
    } catch (error) {
      console.error('Error generating vector PDF:', error);
      
      // Fallback to raster PDF if vector conversion fails
      console.log('Falling back to raster PDF export...');
      try {
        await exportFallbackPDF();
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError);
        console.log('Trying html2canvas fallback...');
        try {
          await exportHtml2CanvasPDF();
        } catch (html2canvasError) {
          console.error('html2canvas fallback also failed:', html2canvasError);
          alert('Failed to export PDF. Please try using SVG export instead.');
        }
      }
    }
  };

  // Fallback raster PDF export method
  const exportFallbackPDF = async () => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    
    // Create a clean SVG clone for raster export
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    const svgWidth = isMobile ? 350 : 800;
    const svgHeight = isMobile ? 280 : 600;
    
    // Ensure proper dimensions and viewBox
    svgClone.setAttribute('width', svgWidth.toString());
    svgClone.setAttribute('height', svgHeight.toString());
    svgClone.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svgClone.removeAttribute('class');
    
    // Force all elements to be visible and properly positioned
    const allElements = svgClone.querySelectorAll('*');
    allElements.forEach(el => {
      const element = el as SVGElement;
      element.style.visibility = 'visible';
      element.style.display = 'block';
      // Ensure text elements are properly rendered
      if (element.tagName === 'text') {
        element.setAttribute('font-family', 'Arial, sans-serif');
      }
    });
    
    // Fix the legend gradient to match the selected color scale
    fixLegendGradient(svgClone);
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise<void>(async (resolve, reject) => {
      img.onload = async () => {
        try {
          // Dynamically import jsPDF for fallback
          const { default: jsPDF } = await import('jspdf');
          
          // Use very high resolution for crisp output
          const dpiScale = 8; // 8x resolution for maximum quality
          canvas.width = svgWidth * dpiScale;
          canvas.height = svgHeight * dpiScale;
          
          if (ctx) {
            // Set high quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.scale(dpiScale, dpiScale);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, svgWidth, svgHeight);
            ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            
            const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'mm',
              format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15; // 15mm margin
            
            const availableWidth = pdfWidth - (2 * margin);
            const availableHeight = pdfHeight - (2 * margin);
            
            const imgAspectRatio = svgWidth / svgHeight;
            const availableAspectRatio = availableWidth / availableHeight;
            
            let imgWidth, imgHeight;
            if (imgAspectRatio > availableAspectRatio) {
              imgWidth = availableWidth;
              imgHeight = availableWidth / imgAspectRatio;
            } else {
              imgHeight = availableHeight;
              imgWidth = availableHeight * imgAspectRatio;
            }
            
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;
            
            console.log('Fallback PDF Debug:', {
              svgWidth, svgHeight,
              canvasWidth: canvas.width,
              canvasHeight: canvas.height,
              pdfWidth, pdfHeight,
              availableWidth, availableHeight,
              imgWidth, imgHeight,
              x, y,
              dpiScale
            });
            
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save('bharatviz.pdf');
            resolve();
          } else {
            reject(new Error('Could not get canvas context'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = url;
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  };

  // Final fallback using html2canvas for maximum compatibility
  const exportHtml2CanvasPDF = async () => {
    if (!svgRef.current) return;
    
    try {
      // Dynamically import libraries
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      
      // Use html2canvas to render the SVG element
      const canvas = await html2canvas(svgRef.current, {
        backgroundColor: '#ffffff',
        scale: 4, // High resolution
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: isMobile ? 350 : 800,
        height: isMobile ? 280 : 600,
        onclone: (clonedDoc) => {
          // Ensure all elements are visible in the clone
          const clonedSvg = clonedDoc.querySelector('svg');
          if (clonedSvg) {
            const allElements = clonedSvg.querySelectorAll('*');
            allElements.forEach(el => {
              const element = el as SVGElement;
              element.style.visibility = 'visible';
              element.style.display = 'block';
            });
            
            // Fix the legend gradient to match the selected color scale
            fixLegendGradient(clonedSvg);
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // 15mm margin
      
      const availableWidth = pdfWidth - (2 * margin);
      const availableHeight = pdfHeight - (2 * margin);
      
      const imgAspectRatio = canvas.width / canvas.height;
      const availableAspectRatio = availableWidth / availableHeight;
      
      let imgWidth, imgHeight;
      if (imgAspectRatio > availableAspectRatio) {
        imgWidth = availableWidth;
        imgHeight = availableWidth / imgAspectRatio;
      } else {
        imgHeight = availableHeight;
        imgWidth = availableHeight * imgAspectRatio;
      }
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      console.log('html2canvas PDF Debug:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        pdfWidth, pdfHeight,
        availableWidth, availableHeight,
        imgWidth, imgHeight,
        x, y
      });
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save('bharatviz.pdf');
      
    } catch (error) {
      console.error('html2canvas PDF export failed:', error);
      throw error;
    }
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
    exportPDF,
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

    const width = isMobile ? 350 : 800;
    const height = isMobile ? 280 : 600;
    const margin = { top: isMobile ? 50 : 70, right: 20, bottom: 40, left: 20 };

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
        pinks: d3.interpolatePuRd,
        viridis: d3.interpolateViridis,
        plasma: d3.interpolatePlasma,
        inferno: d3.interpolateInferno,
        magma: d3.interpolateMagma,
        rdylbu: d3.interpolateRdYlBu,
        rdylgn: d3.interpolateRdYlGn,
        spectral: (t: number) => d3.interpolateSpectral(1 - t),
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
        // If no data, show all states as white
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
      'west bengal': 'WBengal',
      'tamil nadu': 'TN',
      'jammu & kashmir': 'J&K',  // Fixed: matches GeoJSON "Jammu & Kashmir"
      'telangana': 'Telangana',   // Added: matches GeoJSON "Telangana"
      'dadra and nagar haveli': 'D&NH',
      'daman and diu': 'D&D',
      'andaman and nicobar islands': 'A&N Islands',
      'rajasthan': 'Rajasthan',
      'karnataka': 'KA',
      'chandigarh': 'CH'
    };

    // Add text labels
    g.selectAll("text")
      .data(mapData.features)
      .enter()
      .append("text")
      .attr("transform", (d: any) => {
        const stateName = (d.properties.state_name || d.properties.NAME_1 || d.properties.name || d.properties.ST_NM)?.toLowerCase().trim();
        const centroid = path.centroid(d);
        
        // Special positioning for states with external labels
        const externalLabelStates = ['goa', 'kerala', 'dnhdd', 'nagaland', 'tripura', 'mizoram', 'lakshadweep', 'manipur', 'jharkhand', 'sikkim', 'andhra pradesh', 'karnataka', 'west bengal', 'delhi', 'chandigarh', 'puducherry'];
        if (externalLabelStates.includes(stateName)) {
          // Position labels with specific adjustments for each state
          const bounds = path.bounds(d);
          let posX, posY;
          
          if (stateName === 'goa') {
            posX = bounds[0][0] - (isMobile ? 20 : 30); // Move Goa text more to the left
            posY = (bounds[0][1] + bounds[1][1]) / 2; // Vertical center
          } else if (stateName === 'dnhdd') {
            posX = bounds[0][0] + (isMobile ? 2 : 5); // Move DNHDD text further to the right
            posY = (bounds[0][1] + bounds[1][1]) / 2; // Vertical center
          } else if (stateName === 'kerala') {
            posX = bounds[0][0] - (isMobile ? 12 : 16); // Move Kerala text slightly to the right
            posY = (bounds[0][1] + bounds[1][1]) / 2; // Vertical center
          } else if (stateName === 'nagaland') {
            posX = bounds[1][0] + (isMobile ? 5 : 8); // Move Nagaland text slightly more left
            posY = (bounds[0][1] + bounds[1][1]) / 2; // Vertical center
          } else if (stateName === 'tripura') {
            posX = bounds[0][0] - (isMobile ? 5 : 10); // Move Tripura text slightly right
            posY = bounds[1][1] + (isMobile ? 5 : 8); // Move slightly above previous position
          } else if (stateName === 'mizoram') {
            posX = (bounds[0][0] + bounds[1][0]) / 2; // Horizontal center
            posY = bounds[1][1] + (isMobile ? 5 : 8); // Move Mizoram slightly up
          } else if (stateName === 'lakshadweep') {
            posX = (bounds[0][0] + bounds[1][0]) / 2 - (isMobile ? 10 : 15); // Move slightly left from center
            posY = bounds[0][1] - (isMobile ? 10 : 15); // Move above the state
          } else if (stateName === 'manipur') {
            posX = bounds[1][0] + (isMobile ? 3 : 5); // Move Manipur text slightly more left
            posY = (bounds[0][1] + bounds[1][1]) / 2; // Vertical center
          } else if (stateName === 'west bengal') {
            posX = (bounds[0][0] + bounds[1][0]) / 2 - (isMobile ? 3 : 5); // Horizontal center - slightly left
            posY = (bounds[0][1] + bounds[1][1]) / 2 + (isMobile ? 20 : 25); // Below Jharkhand, same vertical approach
          } else if (stateName === 'jharkhand') {
            posX = (bounds[0][0] + bounds[1][0]) / 2 - (isMobile ? 5 : 8); // Move Jharkhand text slightly right
            posY = (bounds[0][1] + bounds[1][1]) / 2; // Vertical center
          } else if (stateName === 'sikkim') {
            posX = (bounds[0][0] + bounds[1][0]) / 2; // Horizontal center
            posY = bounds[0][1] - (isMobile ? 10 : 15); // Move Sikkim text above the state
          } else if (stateName === 'andhra pradesh') {
            posX = (bounds[0][0] + bounds[1][0]) / 2 - (isMobile ? 20 : 30); // Move Andhra text left
            posY = (bounds[0][1] + bounds[1][1]) / 2 + (isMobile ? 15 : 20); // Move Andhra text down
          } else if (stateName === 'karnataka') {
            posX = (bounds[0][0] + bounds[1][0]) / 2 - (isMobile ? 8 : 12); // Move Karnataka text very slightly left
            posY = (bounds[0][1] + bounds[1][1]) / 2 + (isMobile ? 3 : 5); // Move Karnataka text slightly down
          } else if (stateName === 'delhi') {
            posX = (bounds[0][0] + bounds[1][0]) / 2 + (isMobile ? 10 : 15); // Move Delhi text very slightly right
            posY = (bounds[0][1] + bounds[1][1]) / 2; // Vertical center
          } else if (stateName === 'chandigarh') {
            posX = (bounds[0][0] + bounds[1][0]) / 2 + (isMobile ? 6 : 9); // Move Chandigarh text more right (northeast)
            posY = (bounds[0][1] + bounds[1][1]) / 2 - (isMobile ? 6 : 9); // Move Chandigarh text more up (northeast)
          } else if (stateName === 'puducherry') {
            posX = (bounds[0][0] + bounds[1][0]) / 2 + (isMobile ? 12 : 18); // Puducherry move more right
            posY = (bounds[0][1] + bounds[1][1]) / 2 + (isMobile ? 18 : 26); // Puducherry move slightly more down
          } else {
            // Default positioning for other external label states
            posX = bounds[0][0] - (isMobile ? 15 : 20);
            posY = (bounds[0][1] + bounds[1][1]) / 2;
          }
          
          return `translate(${posX}, ${posY})`;
        }
        
        return `translate(${centroid[0]}, ${centroid[1]})`;
      })
      .attr("text-anchor", (d: any) => {
        const stateName = (d.properties.state_name || d.properties.NAME_1 || d.properties.name || d.properties.ST_NM)?.toLowerCase().trim();
        const externalLabelStates = ['goa', 'kerala', 'dnhdd', 'nagaland', 'tripura', 'mizoram', 'lakshadweep', 'manipur', 'jharkhand', 'sikkim', 'andhra pradesh', 'karnataka', 'west bengal', 'delhi', 'chandigarh', 'puducherry'];
        if (externalLabelStates.includes(stateName)) {
          // Special text anchoring for different positions
          if (stateName === 'mizoram' || stateName === 'lakshadweep' || stateName === 'jharkhand' || stateName === 'sikkim' || stateName === 'andhra pradesh' || stateName === 'karnataka' || stateName === 'west bengal' || stateName === 'delhi' || stateName === 'chandigarh') {
            return "middle"; // Center-aligned for below/above positioning and centered states
          }
          return "start"; // Left-aligned for most external labels
        }
        return "middle";
      })
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
          let fontSize = Math.sqrt(area) / (isMobile ? 16 : 12);
          fontSize = Math.max(isMobile ? 5 : 7, Math.min(isMobile ? 10 : 14, fontSize));
          
          // Special handling for smaller states - reduce text size
          const smallerStates = ['delhi', 'chandigarh', 'sikkim', 'tripura', 'manipur', 'mizoram', 'nagaland', 'meghalaya', 'puducherry', 'lakshadweep'];
          if (smallerStates.includes(stateName)) {
            fontSize = Math.max(isMobile ? 4 : 6, fontSize * 0.7);
          }
          
          // External label states use smaller font size and black color
          const externalLabelStates = ['goa', 'kerala', 'dnhdd', 'nagaland', 'tripura', 'mizoram', 'lakshadweep', 'manipur', 'jharkhand', 'sikkim', 'andhra pradesh', 'karnataka', 'west bengal', 'delhi', 'chandigarh', 'puducherry'];
          let textColor, valueColor;
          if (externalLabelStates.includes(stateName)) {
            // Special font sizes for specific states
            if (stateName === 'west bengal' || stateName === 'jharkhand') {
              fontSize = isMobile ? 5 : 7; // Smaller size for W Bengal and Jharkhand
            } else if (stateName === 'delhi') {
              fontSize = isMobile ? 4 : 6; // Even smaller size for Delhi
            } else if (stateName === 'chandigarh') {
              fontSize = isMobile ? 3 : 5; // Even smaller size for Chandigarh
            } else if (stateName === 'himachal pradesh') {
              fontSize = isMobile ? 4 : 6; // Smaller size for Himachal Pradesh
            } else if (stateName === 'puducherry') {
              fontSize = isMobile ? 5 : 7; // Increased size for Puducherry
            } else if (stateName === 'dnhdd') {
              fontSize = isMobile ? 5 : 7; // Smaller size for DNHDD
            } else if (stateName === 'karnataka') {
              fontSize = isMobile ? 5 : 8; // Slightly larger size for Karnataka (KA)
            } else if (stateName === 'mizoram' || stateName === 'tripura') {
              fontSize = isMobile ? 5 : 7; // Smaller size for Mizoram and Tripura
            } else if (stateName === 'nagaland' || stateName === 'manipur') {
              fontSize = isMobile ? 5 : 7; // Smaller size for Nagaland and Manipur
            } else {
              fontSize = isMobile ? 6 : 9; // Standard size for other external labels
            }
            textColor = "#000000"; // Black text for white background
            valueColor = "#000000";
          } else {
            if (stateName === 'rajasthan') {
              fontSize = Math.max(8, fontSize * 0.7);
            } else if (stateName === 'west bengal') {
              fontSize = isMobile ? 5 : 7; // Smaller size for W Bengal
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
            textColor = isColorDark(backgroundColor) ? "#ffffff" : "#1f2937";
            valueColor = textColor;
          }
          
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
        pinks: d3.interpolatePuRd,
        viridis: d3.interpolateViridis,
        plasma: d3.interpolatePlasma,
        inferno: d3.interpolateInferno,
        magma: d3.interpolateMagma,
        rdylbu: d3.interpolateRdYlBu,
        rdylgn: d3.interpolateRdYlGn,
        spectral: (t: number) => d3.interpolateSpectral(1 - t),
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
        width={isMobile ? 350 : 800}
        height={isMobile ? 280 : 600}
        style={{ userSelect: 'none' }}
        viewBox={isMobile ? "0 0 350 280" : "0 0 800 600"}
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
              width={isMobile ? 150 : 200}
              height={15}
              fill="url(#legend-gradient)"
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
                style={{ fontFamily: 'system-ui', fontSize: isMobile ? 10 : 12, fontWeight: 500, fill: '#374151', cursor: 'pointer' }}
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
                style={{ fontFamily: 'system-ui', fontSize: isMobile ? 10 : 12, fontWeight: 500, fill: '#374151', cursor: 'pointer' }}
                onDoubleClick={e => { e.stopPropagation(); setEditingMax(true); }}
              >
                {legendMax}
              </text>
            )}
            {/* Title */}
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
                style={{ fontFamily: 'system-ui', fontSize: isMobile ? 11 : 13, fontWeight: 600, fill: '#374151', cursor: 'pointer' }}
                onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true); }}
              >
                {legendTitle}
              </text>
            )}
          </g>
        )}
        
        {/* Main Title */}
        <g className="main-title-container">
          {editingMainTitle ? (
            <foreignObject x={isMobile ? 75 : 160} y={isMobile ? 15 : 25} width={isMobile ? 200 : 300} height={40}>
              <input
                type="text"
                value={mainTitle}
                autoFocus
                style={{ 
                  width: isMobile ? 198 : 298, 
                  fontSize: isMobile ? 16 : 20, 
                  fontWeight: 700, 
                  textAlign: 'center',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
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
              x={isMobile ? 175 : 310}
              y={isMobile ? 35 : 50}
              textAnchor="middle"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif', 
                fontSize: isMobile ? 16 : 20, 
                fontWeight: 700, 
                fill: '#1f2937', 
                cursor: 'pointer'
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
      </svg>
    </div>
  );
});
