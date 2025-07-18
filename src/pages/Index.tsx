import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { IndiaMap, type IndiaMapRef } from '@/components/IndiaMap';
import { ExportOptions } from '@/components/ExportOptions';
import { ColorMapChooser, type ColorScale } from '@/components/ColorMapChooser';

interface MapData {
  state: string;
  value: number;
}

// Empty data - just outline map with J&K and Ladakh included
const emptyMapData: MapData[] = [];

const Index = () => {
  const [mapData, setMapData] = useState<MapData[]>([]);
  const [selectedColorScale, setSelectedColorScale] = useState<ColorScale>('spectral');
  const [hideStateNames, setHideStateNames] = useState(true);
  const [hideValues, setHideValues] = useState(false);
  const mapRef = useRef<IndiaMapRef>(null);

  useEffect(() => {
    setMapData(emptyMapData);
  }, []);

  const handleDataLoad = (data: MapData[]) => {
    setMapData(data);
  };

  const handleExportPNG = () => {
    mapRef.current?.exportPNG();
  };

  const handleExportSVG = () => {
    mapRef.current?.exportSVG();
  };

  const handleDownloadCSVTemplate = () => {
    mapRef.current?.downloadCSVTemplate();
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">BharatViz - Fast chloropeths for India</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">Upload data to visualize state-wide distributions on India map</p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 order-2 lg:order-2">
            <IndiaMap ref={mapRef} data={mapData} colorScale={selectedColorScale} 
              hideStateNames={hideStateNames}
              hideValues={hideValues}
            />
          </div>
          
          <div className="lg:col-span-1 order-1 lg:order-1">
            <FileUpload onDataLoad={handleDataLoad} />
            <div className="space-y-4 mt-6">
              <ColorMapChooser 
                selectedScale={selectedColorScale}
                onScaleChange={setSelectedColorScale}
                hideStateNames={hideStateNames}
                hideValues={hideValues}
                onHideStateNamesChange={setHideStateNames}
                onHideValuesChange={checked => setHideValues(checked)}
              />
              <ExportOptions 
                onExportPNG={handleExportPNG}
                onExportSVG={handleExportSVG}
                disabled={mapData.length === 0}
              />
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full text-center text-xs text-muted-foreground mt-8 mb-2">
        © 2025 Saket Choudhary | <a href="http://saketlab.in/" target="_blank" rel="noopener noreferrer" className="underline">Saket Lab</a>
      </footer>
    </div>
  );
};

export default Index;
