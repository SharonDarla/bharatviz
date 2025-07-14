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
  const [selectedColorScale, setSelectedColorScale] = useState<ColorScale>('blues');
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">India Data Visualization</h1>
          <p className="text-xl text-muted-foreground">Upload data to visualize state-wise distributions on India map</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <FileUpload onDataLoad={handleDataLoad} />
            <div className="space-y-4 mt-6">
              <ColorMapChooser 
                selectedScale={selectedColorScale}
                onScaleChange={setSelectedColorScale}
              />
              <ExportOptions 
                onExportPNG={handleExportPNG}
                onExportSVG={handleExportSVG}
                disabled={mapData.length === 0}
              />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <IndiaMap ref={mapRef} data={mapData} colorScale={selectedColorScale} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
