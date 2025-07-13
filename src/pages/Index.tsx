import React, { useState, useRef } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { IndiaMap, type IndiaMapRef } from '@/components/IndiaMap';
import { ColorLegend } from '@/components/ColorLegend';
import { ExportOptions } from '@/components/ExportOptions';

interface MapData {
  state: string;
  value: number;
}

const Index = () => {
  const [mapData, setMapData] = useState<MapData[]>([]);
  const mapRef = useRef<IndiaMapRef>(null);

  const handleDataLoad = (data: MapData[]) => {
    setMapData(data);
  };

  const handleExportPNG = () => {
    mapRef.current?.exportPNG();
  };

  const handleExportSVG = () => {
    mapRef.current?.exportSVG();
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
            {mapData.length > 0 && (
              <div className="space-y-4 mt-6">
                <ColorLegend data={mapData} />
                <ExportOptions 
                  onExportPNG={handleExportPNG}
                  onExportSVG={handleExportSVG}
                  disabled={mapData.length === 0}
                />
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            {mapData.length > 0 ? (
              <IndiaMap ref={mapRef} data={mapData} />
            ) : (
              <div className="bg-card p-12 rounded-lg border-dashed border-2 text-center">
                <p className="text-muted-foreground">Upload a CSV/TSV file to see the visualization</p>
                <p className="text-sm text-muted-foreground mt-2">
                  File should contain 'state' and 'value' columns
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
