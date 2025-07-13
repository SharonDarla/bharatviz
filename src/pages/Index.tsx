import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { IndiaMap } from '@/components/IndiaMap';
import { ColorLegend } from '@/components/ColorLegend';

interface MapData {
  state: string;
  value: number;
}

const Index = () => {
  const [mapData, setMapData] = useState<MapData[]>([]);

  const handleDataLoad = (data: MapData[]) => {
    setMapData(data);
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
              <div className="mt-6">
                <ColorLegend data={mapData} />
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            {mapData.length > 0 ? (
              <IndiaMap data={mapData} />
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
