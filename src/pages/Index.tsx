import React, { useState, useRef } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { IndiaMap, type IndiaMapRef } from '@/components/IndiaMap';
import { IndiaDistrictsMap, type IndiaDistrictsMapRef } from '@/components/IndiaDistrictsMap';
import { ExportOptions } from '@/components/ExportOptions';
import { ColorMapChooser, type ColorScale, type ColorBarSettings } from '@/components/ColorMapChooser';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StateMapData {
  state: string;
  value: number;
}

interface DistrictMapData {
  state: string;
  district: string;
  value: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>('states');
  
  // States tab state
  const [stateMapData, setStateMapData] = useState<StateMapData[]>([]);
  const [stateColorScale, setStateColorScale] = useState<ColorScale>('spectral');
  const [stateInvertColors, setStateInvertColors] = useState(false);
  const [stateHideNames, setStateHideNames] = useState(false);
  const [stateHideValues, setStateHideValues] = useState(false);
  const [stateDataTitle, setStateDataTitle] = useState<string>('');
  const [stateColorBarSettings, setStateColorBarSettings] = useState<ColorBarSettings>({
    isDiscrete: false,
    binCount: 5,
    customBoundaries: [],
    useCustomBoundaries: false
  });
  
  // Districts tab state
  const [districtMapData, setDistrictMapData] = useState<DistrictMapData[]>([]);
  const [districtColorScale, setDistrictColorScale] = useState<ColorScale>('spectral');
  const [districtInvertColors, setDistrictInvertColors] = useState(false);
  const [districtDataTitle, setDistrictDataTitle] = useState<string>('');
  const [showStateBoundaries, setShowStateBoundaries] = useState(true);
  const [districtColorBarSettings, setDistrictColorBarSettings] = useState<ColorBarSettings>({
    isDiscrete: false,
    binCount: 5,
    customBoundaries: [],
    useCustomBoundaries: false
  });
  
  const stateMapRef = useRef<IndiaMapRef>(null);
  const districtMapRef = useRef<IndiaDistrictsMapRef>(null);

  // No automatic data loading - map starts empty

  const handleStateDataLoad = (data: StateMapData[], title?: string) => {
    setStateMapData(data);
    setStateDataTitle(title || '');
  };

  const handleDistrictDataLoad = (data: DistrictMapData[], title?: string) => {
    setDistrictMapData(data);
    setDistrictDataTitle(title || '');
  };

  const handleExportPNG = () => {
    if (activeTab === 'states') {
      stateMapRef.current?.exportPNG();
    } else {
      districtMapRef.current?.exportPNG();
    }
  };

  const handleExportSVG = () => {
    if (activeTab === 'states') {
      stateMapRef.current?.exportSVG();
    } else {
      districtMapRef.current?.exportSVG();
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'states') {
      stateMapRef.current?.exportPDF();
    } else {
      districtMapRef.current?.exportPDF();
    }
  };

  const handleDownloadCSVTemplate = () => {
    if (activeTab === 'states') {
      stateMapRef.current?.downloadCSVTemplate();
    } else {
      districtMapRef.current?.downloadCSVTemplate();
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">BharatViz - Fast choropleths for India</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="states">States</TabsTrigger>
            <TabsTrigger value="districts">Districts</TabsTrigger>
          </TabsList>
          
          <div className={`space-y-6 ${activeTab === 'states' ? 'block' : 'hidden'}`}>
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 order-2 lg:order-2">
                <IndiaMap ref={stateMapRef} data={stateMapData} colorScale={stateColorScale} 
                  invertColors={stateInvertColors}
                  hideStateNames={stateHideNames}
                  hideValues={stateHideValues}
                  dataTitle={stateDataTitle}
                  colorBarSettings={stateColorBarSettings}
                />
                <div className="mt-6 flex justify-center">
                  <ExportOptions 
                    onExportPNG={handleExportPNG}
                    onExportSVG={handleExportSVG}
                    onExportPDF={handleExportPDF}
                    disabled={stateMapData.length === 0}
                  />
                </div>
              </div>
              
              <div className="lg:col-span-1 order-1 lg:order-1">
                <FileUpload onDataLoad={handleStateDataLoad} mode="states" />
                <div className="space-y-4 mt-6">
                  <ColorMapChooser 
                    selectedScale={stateColorScale}
                    onScaleChange={setStateColorScale}
                    invertColors={stateInvertColors}
                    onInvertColorsChange={setStateInvertColors}
                    hideStateNames={stateHideNames}
                    hideValues={stateHideValues}
                    onHideStateNamesChange={setStateHideNames}
                    onHideValuesChange={setStateHideValues}
                    colorBarSettings={stateColorBarSettings}
                    onColorBarSettingsChange={setStateColorBarSettings}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`space-y-6 ${activeTab === 'districts' ? 'block' : 'hidden'}`}>
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 order-2 lg:order-2">
                <IndiaDistrictsMap ref={districtMapRef} data={districtMapData} colorScale={districtColorScale} 
                  invertColors={districtInvertColors}
                  dataTitle={districtDataTitle}
                  showStateBoundaries={showStateBoundaries}
                  colorBarSettings={districtColorBarSettings}
                />
                <div className="mt-6 flex justify-center">
                  <ExportOptions 
                    onExportPNG={handleExportPNG}
                    onExportSVG={handleExportSVG}
                    onExportPDF={handleExportPDF}
                    disabled={districtMapData.length === 0}
                  />
                </div>
              </div>
              
              <div className="lg:col-span-1 order-1 lg:order-1">
                <FileUpload onDataLoad={handleDistrictDataLoad} mode="districts" />
                <div className="space-y-4 mt-6">
                  <ColorMapChooser 
                    selectedScale={districtColorScale}
                    onScaleChange={setDistrictColorScale}
                    invertColors={districtInvertColors}
                    onInvertColorsChange={setDistrictInvertColors}
                    showStateBoundaries={showStateBoundaries}
                    onShowStateBoundariesChange={setShowStateBoundaries}
                    colorBarSettings={districtColorBarSettings}
                    onColorBarSettingsChange={setDistrictColorBarSettings}
                  />
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
      <footer className="w-full text-center text-xs text-muted-foreground mt-8 mb-2">
        © 2025 Saket Choudhary | <a href="http://saketlab.in/" target="_blank" rel="noopener noreferrer" className="underline">Saket Lab</a>
      </footer>
    </div>
  );
};

export default Index;
