import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Papa from 'papaparse';
import { FileUpload } from '@/components/FileUpload';
import { IndiaMap, type IndiaMapRef } from '@/components/IndiaMap';
import { IndiaDistrictsMap, type IndiaDistrictsMapRef } from '@/components/IndiaDistrictsMap';
import { ExportOptions } from '@/components/ExportOptions';
import { ColorMapChooser, type ColorScale, type ColorBarSettings } from '@/components/ColorMapChooser';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DEFAULT_DISTRICT_MAP_TYPE, getDistrictMapConfig, getDistrictMapTypesList } from '@/lib/districtMapConfig';
import { getUniqueStatesFromGeoJSON } from '@/lib/stateUtils';
import { loadStateGistMapping, getAvailableStates, getStateGeoJSONUrl, type StateGistMapping } from '@/lib/stateGistMapping';
import Credits from '@/components/Credits';
import MCPDocs from '@/components/MCPDocs';
import { DistrictStats } from '@/components/DistrictStats';
import { Github, Moon, Sun } from 'lucide-react';
import { type DataType, type CategoryColorMapping, detectDataType, getUniqueCategories, generateDefaultCategoryColors } from '@/lib/categoricalUtils';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { buildDynamicContext } from '@/lib/chat/contextBuilder';
import { DATA_FILES, MAP_DIMENSIONS } from '@/lib/constants';
import type { DynamicChatContext, DataPoint } from '@/lib/chat/types';

interface StateMapData {
  state: string;
  value: number | string;
}

interface DistrictMapData {
  state: string;
  district: string;
  value: number | string;
}

interface NAInfo {
  states?: string[];
  districts?: Array<{ state: string; district: string }>;
  count: number;
}

interface MultiYearSeries {
  key: string;
  title: string;
  data: StateMapData[];
  naInfo?: NAInfo;
}

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = (pathname: string): string => {
    const path = pathname.slice(1);
    const validTabs = ['states', 'districts', 'regions', 'state-districts', 'district-stats', 'help', 'credits', 'mcp'];
    return validTabs.includes(path) ? path : 'states';
  };

  const [activeTab, setActiveTab] = useState<string>(getTabFromPath(location.pathname));

  const [stateMapData, setStateMapData] = useState<StateMapData[]>([]);
  const [stateMultiYearSeries, setStateMultiYearSeries] = useState<MultiYearSeries[]>([]);
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
  const [stateDataType, setStateDataType] = useState<DataType>('numerical');
  const [stateCategoryColors, setStateCategoryColors] = useState<CategoryColorMapping>({});
  const [stateNAInfo, setStateNAInfo] = useState<NAInfo | undefined>(undefined);

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
  const [districtDataType, setDistrictDataType] = useState<DataType>('numerical');
  const [districtCategoryColors, setDistrictCategoryColors] = useState<CategoryColorMapping>({});
  const [selectedDistrictMapType, setSelectedDistrictMapType] = useState<string>(DEFAULT_DISTRICT_MAP_TYPE);
  const [districtNAInfo, setDistrictNAInfo] = useState<NAInfo | undefined>(undefined);

  const [stateDistrictMapData, setStateDistrictMapData] = useState<DistrictMapData[]>([]);
  const [stateDistrictColorScale, setStateDistrictColorScale] = useState<ColorScale>('spectral');
  const [stateDistrictInvertColors, setStateDistrictInvertColors] = useState(false);
  const [stateDistrictDataTitle, setStateDistrictDataTitle] = useState<string>('');
  const [stateDistrictColorBarSettings, setStateDistrictColorBarSettings] = useState<ColorBarSettings>({
    isDiscrete: false,
    binCount: 5,
    customBoundaries: [],
    useCustomBoundaries: false
  });
  const [stateDistrictDataType, setStateDistrictDataType] = useState<DataType>('numerical');
  const [stateDistrictCategoryColors, setStateDistrictCategoryColors] = useState<CategoryColorMapping>({});
  const [selectedStateMapType, setSelectedStateMapType] = useState<string>(DEFAULT_DISTRICT_MAP_TYPE);
  const [selectedStateForMap, setSelectedStateForMap] = useState<string>('Maharashtra');
  const [stateDistrictHideNames, setStateDistrictHideNames] = useState(false);
  const [stateDistrictHideValues, setStateDistrictHideValues] = useState(false);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [stateGistMapping, setStateGistMapping] = useState<StateGistMapping | null>(null);
  const [stateSearchQuery, setStateSearchQuery] = useState<string>('');
  const [stateDistrictNAInfo, setStateDistrictNAInfo] = useState<NAInfo | undefined>(undefined);

  const [darkMode, setDarkMode] = useState(false);

  const [chatContext, setChatContext] = useState<DynamicChatContext | null>(null);
  const prevContextRef = useRef<{
    tab: string;
    mapType: string;
    selectedState?: string;
  } | null>(null);

  const stateMapRef = useRef<IndiaMapRef>(null);
  const stateMultiYearMapRefs = useRef<Map<string, IndiaMapRef>>(new Map());
  const districtMapRef = useRef<IndiaDistrictsMapRef>(null);
  const stateDistrictMapRef = useRef<IndiaDistrictsMapRef>(null);

  const hasReadInitialUrl = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tabFromPath = getTabFromPath(location.pathname);
    if (tabFromPath !== activeTab) {
      setActiveTab(tabFromPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Read URL parameters on initial mount for States tab
  useEffect(() => {
    if (hasReadInitialUrl.current.has('states')) return;
    if (activeTab !== 'states') return;

    const params = new URLSearchParams(location.search);

    const colorScale = params.get('colorScale') as ColorScale;
    if (colorScale) setStateColorScale(colorScale);

    const invertColors = params.get('invertColors');
    if (invertColors) setStateInvertColors(invertColors === 'true');

    const hideNames = params.get('hideNames');
    if (hideNames) setStateHideNames(hideNames === 'true');

    const hideValues = params.get('hideValues');
    if (hideValues) setStateHideValues(hideValues === 'true');

    hasReadInitialUrl.current.add('states');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Write States tab settings to URL
  useEffect(() => {
    if (!hasReadInitialUrl.current.has('states')) return;
    if (activeTab !== 'states') return;

    const params = new URLSearchParams(location.search);

    params.set('colorScale', stateColorScale);

    if (stateInvertColors) {
      params.set('invertColors', 'true');
    } else {
      params.delete('invertColors');
    }

    if (stateHideNames) {
      params.set('hideNames', 'true');
    } else {
      params.delete('hideNames');
    }

    if (stateHideValues) {
      params.set('hideValues', 'true');
    } else {
      params.delete('hideValues');
    }

    const newSearch = params.toString();
    const currentPath = location.pathname === '/' ? '' : location.pathname;
    const newUrl = `${currentPath}${newSearch ? '?' + newSearch : ''}`;

    if (location.pathname + location.search !== newUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [activeTab, stateColorScale, stateInvertColors, stateHideNames, stateHideValues, location.pathname, location.search, navigate]);

  // Read URL parameters on initial mount for Districts tab
  useEffect(() => {
    if (hasReadInitialUrl.current.has('districts')) return;
    if (activeTab !== 'districts') return;

    const params = new URLSearchParams(location.search);

    const colorScale = params.get('colorScale') as ColorScale;
    if (colorScale) setDistrictColorScale(colorScale);

    const invertColors = params.get('invertColors');
    if (invertColors) setDistrictInvertColors(invertColors === 'true');

    const mapType = params.get('mapType');
    if (mapType) {
      // Validate that the mapType exists in the config
      const config = getDistrictMapConfig(mapType);
      if (config) {
        setSelectedDistrictMapType(mapType);
      }
    }

    hasReadInitialUrl.current.add('districts');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Write Districts tab settings to URL
  useEffect(() => {
    if (!hasReadInitialUrl.current.has('districts')) return;
    if (activeTab !== 'districts') return;

    const params = new URLSearchParams(location.search);

    params.set('colorScale', districtColorScale);
    params.set('mapType', selectedDistrictMapType);

    if (districtInvertColors) {
      params.set('invertColors', 'true');
    } else {
      params.delete('invertColors');
    }

    const newSearch = params.toString();
    const currentPath = location.pathname;
    const newUrl = `${currentPath}${newSearch ? '?' + newSearch : ''}`;

    if (location.pathname + location.search !== newUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [activeTab, districtColorScale, districtInvertColors, selectedDistrictMapType, location.pathname, location.search, navigate]);

  // Read URL parameters on initial mount for Regions tab
  useEffect(() => {
    if (hasReadInitialUrl.current.has('regions')) return;
    if (activeTab !== 'regions') return;

    const params = new URLSearchParams(location.search);

    const colorScale = params.get('colorScale') as ColorScale;
    if (colorScale) setDistrictColorScale(colorScale);

    const invertColors = params.get('invertColors');
    if (invertColors) setDistrictInvertColors(invertColors === 'true');

    hasReadInitialUrl.current.add('regions');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Write Regions tab settings to URL
  useEffect(() => {
    if (!hasReadInitialUrl.current.has('regions')) return;
    if (activeTab !== 'regions') return;

    const params = new URLSearchParams(location.search);

    params.set('colorScale', districtColorScale);

    if (districtInvertColors) {
      params.set('invertColors', 'true');
    } else {
      params.delete('invertColors');
    }

    const newSearch = params.toString();
    const currentPath = location.pathname;
    const newUrl = `${currentPath}${newSearch ? '?' + newSearch : ''}`;

    if (location.pathname + location.search !== newUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [activeTab, districtColorScale, districtInvertColors, location.pathname, location.search, navigate]);

  // Read URL parameters on initial mount for State-Districts tab
  useEffect(() => {
    if (hasReadInitialUrl.current.has('state-districts')) return;
    if (activeTab !== 'state-districts') return;

    const params = new URLSearchParams(location.search);

    const colorScale = params.get('colorScale') as ColorScale;
    if (colorScale) setStateDistrictColorScale(colorScale);

    const invertColors = params.get('invertColors');
    if (invertColors) setStateDistrictInvertColors(invertColors === 'true');

    const hideNames = params.get('hideNames');
    if (hideNames) setStateDistrictHideNames(hideNames === 'true');

    const hideValues = params.get('hideValues');
    if (hideValues) setStateDistrictHideValues(hideValues === 'true');

    const selectedState = params.get('selectedState');
    if (selectedState) setSelectedStateForMap(selectedState);

    const mapType = params.get('mapType');
    if (mapType) setSelectedStateMapType(mapType);

    hasReadInitialUrl.current.add('state-districts');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Write State-Districts tab settings to URL
  useEffect(() => {
    if (!hasReadInitialUrl.current.has('state-districts')) return;
    if (activeTab !== 'state-districts') return;

    const params = new URLSearchParams(location.search);

    params.set('colorScale', stateDistrictColorScale);
    params.set('mapType', selectedStateMapType);
    params.set('selectedState', selectedStateForMap);

    if (stateDistrictInvertColors) {
      params.set('invertColors', 'true');
    } else {
      params.delete('invertColors');
    }

    if (stateDistrictHideNames) {
      params.set('hideNames', 'true');
    } else {
      params.delete('hideNames');
    }

    if (stateDistrictHideValues) {
      params.set('hideValues', 'true');
    } else {
      params.delete('hideValues');
    }

    const newSearch = params.toString();
    const currentPath = location.pathname;
    const newUrl = `${currentPath}${newSearch ? '?' + newSearch : ''}`;

    if (location.pathname + location.search !== newUrl) {
      navigate(newUrl, { replace: true });
    }
  }, [activeTab, stateDistrictColorScale, stateDistrictInvertColors, stateDistrictHideNames, stateDistrictHideValues, selectedStateForMap, selectedStateMapType, location.pathname, location.search, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const basePath = value === 'states' ? '' : value;
    const search = location.search;
    navigate(`/${basePath}${search}`);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dataUrl = searchParams.get('dataUrl');

    if (dataUrl) {
      const loadDataFromUrl = async () => {
        try {
          const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const apiBase = isDev ? 'http://localhost:3001' : `${window.location.protocol}//${window.location.hostname}`;
          const proxyUrl = `${apiBase}/api/v1/proxy/csv?url=${encodeURIComponent(dataUrl)}`;
          const response = await fetch(proxyUrl);

          if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
          }

          const csvText = await response.text();

          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const data = results.data as Record<string, string>[];

              const hasDistrict = data[0] && ('district_name' in data[0] || 'district' in data[0]);
              const colorScale = searchParams.get('colorScale') as ColorScale || 'spectral';
              const title = searchParams.get('title') || '';
              const legendTitle = searchParams.get('legendTitle') || 'Values';
              const boundary = searchParams.get('boundary') || 'LGD';
              const showStateBoundaries = searchParams.get('showStateBoundaries') === 'true';
              const invertColors = searchParams.get('invertColors') === 'true';

              if (hasDistrict) {
                const districtData = data.map((row) => ({
                  state: row.state_name || row.state || '',
                  district: row.district_name || row.district || '',
                  value: isNaN(Number(row.value)) ? row.value : Number(row.value),
                }));

                setDistrictMapData(districtData);
                setDistrictDataTitle(title);
                setDistrictColorScale(colorScale);
                setDistrictInvertColors(invertColors);
                setShowStateBoundaries(showStateBoundaries);
                setSelectedDistrictMapType(boundary);

                const values = districtData.map(d => d.value);
                const dataType = detectDataType(values);
                setDistrictDataType(dataType);

                if (dataType === 'categorical') {
                  const categories = getUniqueCategories(values);
                  const categoryColors = generateDefaultCategoryColors(categories);
                  setDistrictCategoryColors(categoryColors);
                  setDistrictColorBarSettings(prev => ({ ...prev, isDiscrete: true }));
                }

                handleTabChange('districts');
              } else {
                const stateData = data.map((row) => ({
                  state: row.state_name || row.state || '',
                  value: isNaN(Number(row.value)) ? row.value : Number(row.value),
                }));

                setStateMapData(stateData);
                setStateDataTitle(title);
                setStateColorScale(colorScale);
                setStateInvertColors(invertColors);

                const values = stateData.map(d => d.value);
                const dataType = detectDataType(values);
                setStateDataType(dataType);

                if (dataType === 'categorical') {
                  const categories = getUniqueCategories(values);
                  const categoryColors = generateDefaultCategoryColors(categories);
                  setStateCategoryColors(categoryColors);
                  setStateColorBarSettings(prev => ({ ...prev, isDiscrete: true }));
                }

                handleTabChange('states');
              }
            },
            error: (error) => {
              console.error('CSV parsing error:', error);
            }
          });
        } catch (error) {
          console.error('Error loading data from URL:', error);
        }
      };

      loadDataFromUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);


  useEffect(() => {
    if (activeTab === 'state-districts') {
      const fetchStates = async () => {
        try {
          const mapping = await loadStateGistMapping();
          setStateGistMapping(mapping);
          const states = getAvailableStates(mapping, selectedStateMapType);

          if (states.length === 0) {
            throw new Error('No states found in gist mapping');
          }

          setAvailableStates(states);
        } catch (error) {
          console.error('Failed to fetch states from gist mapping:', error);
          const geojsonPath = getDistrictMapConfig(selectedStateMapType).geojsonPath;
          const states = await getUniqueStatesFromGeoJSON(geojsonPath);
          setAvailableStates(states);
          setStateGistMapping(null);
        }
      };

      fetchStates();
    }
  }, [activeTab, selectedStateMapType]);

  useEffect(() => {
    async function updateChatContext() {
      try {
        let geoJsonPath = '';
        let data: DataPoint[] = [];
        let currentMapType = '';
        let currentSelectedState: string | undefined = undefined;
        let metricName: string | undefined = undefined;

        const normalizeValue = (v: number | string | null | undefined): number | null => {
          if (v === null || v === undefined) return null;
          if (typeof v === 'number') return Number.isFinite(v) ? v : null;
          const cleaned = String(v).trim();
          if (!cleaned) return null;
          const num = Number(cleaned);
          return Number.isFinite(num) ? num : null;
        };

        if (activeTab === 'states') {
          geoJsonPath = DATA_FILES.STATES_GEOJSON;
          currentMapType = 'states';
          // Use multi-year data if available, otherwise single-year
          if (stateMultiYearSeries.length > 0) {
            metricName = stateMultiYearSeries[0].title || undefined;
            data = stateMultiYearSeries[0].data.map(d => ({
              name: d.state,
              value: normalizeValue(d.value),
            }));
          } else {
            metricName = stateDataTitle || undefined;
            data = stateMapData.map(d => ({
              name: d.state,
              value: normalizeValue(d.value),
            }));
          }
        } else if (activeTab === 'districts') {
          const config = getDistrictMapConfig(selectedDistrictMapType);
          geoJsonPath = config.geojsonPath;
          currentMapType = selectedDistrictMapType;
          metricName = districtDataTitle || undefined;
          data = districtMapData.map(d => ({
            name: d.district,
            state: d.state,
            value: normalizeValue(d.value),
          }));
        } else if (activeTab === 'state-districts' && selectedStateForMap) {
          const config = getDistrictMapConfig(selectedStateMapType);
          geoJsonPath = config.geojsonPath;
          currentMapType = selectedStateMapType;
          currentSelectedState = selectedStateForMap;
          metricName = stateDistrictDataTitle || undefined;
          data = stateDistrictMapData.map(d => ({
            name: d.district,
            state: d.state,
            value: normalizeValue(d.value),
          }));
        }

        const prevContext = prevContextRef.current;
        const contextChanged =
          !prevContext ||
          prevContext.tab !== activeTab ||
          prevContext.mapType !== currentMapType ||
          prevContext.selectedState !== currentSelectedState;

        prevContextRef.current = {
          tab: activeTab,
          mapType: currentMapType,
          selectedState: currentSelectedState,
        };

        if (geoJsonPath && data.length > 0) {
          try {
            const context = await buildDynamicContext({
              activeTab: activeTab as 'states' | 'districts' | 'state-districts',
              selectedState: activeTab === 'state-districts' ? selectedStateForMap : undefined,
              mapType: activeTab === 'districts' ? selectedDistrictMapType : selectedStateMapType,
              data,
              geoJsonPath,
              metricName,
              conversationHistory: contextChanged ? [] : (chatContext?.conversationHistory || []),
            });

            setChatContext(context);
          } catch (contextError) {
            console.error('Failed to build chat context:', contextError, {
              error: contextError,
              stack: contextError instanceof Error ? contextError.stack : undefined
            });
            setChatContext(null);
          }
        } else {
          setChatContext(null);
        }
      } catch (error) {
        console.error('Chat context error:', error);
        setChatContext(null);
      }
    }

    updateChatContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    selectedStateForMap,
    selectedDistrictMapType,
    selectedStateMapType,
    stateMapData,
    stateMultiYearSeries,
    districtMapData,
    stateDistrictMapData,
    stateDataTitle,
    districtDataTitle,
    stateDistrictDataTitle,
  ]);

  const handleStateDataLoad = (data: StateMapData[], title?: string, naInfo?: NAInfo) => {
    // Clear multi-year data when single-year data is loaded
    setStateMultiYearSeries([]);
    setStateMapData(data);
    setStateDataTitle(title || '');
    setStateNAInfo(naInfo);

    const values = data.map(d => d.value);
    const dataType = detectDataType(values);
    setStateDataType(dataType);

    if (dataType === 'categorical') {
      const categories = getUniqueCategories(values);
      const categoryColors = generateDefaultCategoryColors(categories);
      setStateCategoryColors(categoryColors);
      setStateColorBarSettings(prev => ({ ...prev, isDiscrete: true }));
    }
  };

  const handleStateMultiYearDataLoad = (series: MultiYearSeries[]) => {
    // Clear single-year data when multi-year data is loaded
    setStateMapData([]);
    setStateDataTitle('');
    setStateNAInfo(undefined);
    
    setStateMultiYearSeries(series);
    
    // Determine data type from all series
    const allValues = series.flatMap(s => s.data.map(d => d.value));
    const dataType = detectDataType(allValues);
    setStateDataType(dataType);

    if (dataType === 'categorical') {
      const categories = getUniqueCategories(allValues);
      const categoryColors = generateDefaultCategoryColors(categories);
      setStateCategoryColors(categoryColors);
      setStateColorBarSettings(prev => ({ ...prev, isDiscrete: true }));
    }
  };

  const handleDistrictDataLoad = (rawData: Array<{ state?: string; state_name?: string; district?: string; district_name?: string; value: number | string }>, title?: string, naInfo?: NAInfo) => {
    const data: DistrictMapData[] = rawData.map(row => ({
      state: row.state || row.state_name || '',
      district: row.district || row.district_name || '',
      value: row.value === '' || row.value === 'NA' ? null : row.value
    }));

    setDistrictMapData(data);
    setDistrictDataTitle(title || '');
    setDistrictNAInfo(naInfo);

    const values = data.map(d => d.value);
    const dataType = detectDataType(values);
    setDistrictDataType(dataType);

    if (dataType === 'categorical') {
      const categories = getUniqueCategories(values);
      setDistrictCategoryColors(generateDefaultCategoryColors(categories));
      setDistrictColorBarSettings(prev => ({ ...prev, isDiscrete: true }));
    }
  };

  const handleStateDistrictDataLoad = (rawData: Array<{ state?: string; state_name?: string; district?: string; district_name?: string; value: number | string }>, title?: string, naInfo?: NAInfo) => {
    const data: DistrictMapData[] = rawData.map(row => ({
      state: row.state || row.state_name || '',
      district: row.district || row.district_name || '',
      value: row.value === '' || row.value === 'NA' ? null : row.value
    }));

    setStateDistrictMapData(data);
    setStateDistrictDataTitle(title || '');
    setStateDistrictNAInfo(naInfo);

    const values = data.map(d => d.value);
    const dataType = detectDataType(values);
    setStateDistrictDataType(dataType);

    if (dataType === 'categorical') {
      const categories = getUniqueCategories(values);
      setStateDistrictCategoryColors(generateDefaultCategoryColors(categories));
      setStateDistrictColorBarSettings(prev => ({ ...prev, isDiscrete: true }));
    }
  };

  const handleExportPNG = () => {
    if (activeTab === 'states') {
      if (stateMultiYearSeries.length > 0) {
        // Export all multi-year state maps as a single combined PNG
        exportMultiYearStatesAsPNG();
      } else {
        stateMapRef.current?.exportPNG();
      }
    } else if (activeTab === 'districts' || activeTab === 'regions') {
      districtMapRef.current?.exportPNG();
    } else {
      stateDistrictMapRef.current?.exportPNG();
    }
  };

  const handleExportSVG = () => {
    if (activeTab === 'states') {
      if (stateMultiYearSeries.length > 0) {
        // Export all multi-year state maps as a single combined SVG
        exportMultiYearStatesAsSVG();
      } else {
        stateMapRef.current?.exportSVG();
      }
    } else if (activeTab === 'districts' || activeTab === 'regions') {
      districtMapRef.current?.exportSVG();
    } else {
      stateDistrictMapRef.current?.exportSVG();
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'states') {
      if (stateMultiYearSeries.length > 0) {
        // Export all multi-year state maps as a single combined PDF
        exportMultiYearStatesAsPDF();
      } else {
        stateMapRef.current?.exportPDF();
      }
    } else if (activeTab === 'districts' || activeTab === 'regions') {
      districtMapRef.current?.exportPDF();
    } else {
      stateDistrictMapRef.current?.exportPDF();
    }
  };

  const handleDownloadCSVTemplate = () => {
    if (activeTab === 'states') {
      stateMapRef.current?.downloadCSVTemplate();
    } else if (activeTab === 'districts' || activeTab === 'regions') {
      districtMapRef.current?.downloadCSVTemplate();
    } else {
      stateDistrictMapRef.current?.downloadCSVTemplate();
    }
  };

  /**
   * Multi-year states export helpers
   *
   * For multi-year state maps we want a single combined image/PDF/SVG
   * instead of one file per map.
   */

  const getOrderedMultiYearMapRefs = () => {
    return stateMultiYearSeries
      .map(series => stateMultiYearMapRefs.current.get(series.key))
      .filter((ref): ref is IndiaMapRef => Boolean(ref));
  };

  const exportMultiYearStatesAsPNG = async () => {
    const mapRefs = getOrderedMultiYearMapRefs();
    if (mapRefs.length === 0) return;

    const svgElements = mapRefs
      .map(ref => ref.getSVGElement())
      .filter((el): el is SVGSVGElement => Boolean(el));

    if (svgElements.length === 0) return;

    const singleWidth = MAP_DIMENSIONS.STATES.width;
    const singleHeight = MAP_DIMENSIONS.STATES.height;
    const count = svgElements.length;
    const cols = count === 1 ? 1 : 2;
    const rows = Math.ceil(count / cols);

    const canvas = document.createElement('canvas');
    const dpiScale = 300 / 96;
    const totalWidth = singleWidth * cols;
    const totalHeight = singleHeight * rows;
    canvas.width = totalWidth * dpiScale;
    canvas.height = totalHeight * dpiScale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpiScale, dpiScale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    const drawSvgAt = (svg: SVGSVGElement, x: number, y: number) =>
      new Promise<void>((resolve, reject) => {
        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          try {
            ctx.drawImage(img, x, y, singleWidth, singleHeight);
            URL.revokeObjectURL(url);
            resolve();
          } catch (e) {
            URL.revokeObjectURL(url);
            reject(e);
          }
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });

    for (let i = 0; i < svgElements.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * singleWidth;
      const y = row * singleHeight;
      // eslint-disable-next-line no-await-in-loop
      await drawSvgAt(svgElements[i], x, y);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bharatviz-states-multi-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const exportMultiYearStatesAsSVG = () => {
    const mapRefs = getOrderedMultiYearMapRefs();
    if (mapRefs.length === 0) return;

    const svgElements = mapRefs
      .map(ref => ref.getSVGElement())
      .filter((el): el is SVGSVGElement => Boolean(el));

    if (svgElements.length === 0) return;

    const singleWidth = MAP_DIMENSIONS.STATES.width;
    const singleHeight = MAP_DIMENSIONS.STATES.height;
    const count = svgElements.length;
    const cols = count === 1 ? 1 : 2;
    const rows = Math.ceil(count / cols);

    const totalWidth = singleWidth * cols;
    const totalHeight = singleHeight * rows;

    const serializer = new XMLSerializer();
    let combined = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;

    svgElements.forEach((svg, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * singleWidth;
      const y = row * singleHeight;
      const svgData = serializer.serializeToString(svg);
      const inner = svgData
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>\s*$/, '');
      combined += `<g transform="translate(${x},${y})">${inner}</g>`;
    });

    combined += '</svg>';

    const blob = new Blob([combined], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bharatviz-states-multi-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMultiYearStatesAsPDF = async () => {
    const mapRefs = getOrderedMultiYearMapRefs();
    if (mapRefs.length === 0) return;

    const svgElements = mapRefs
      .map(ref => ref.getSVGElement())
      .filter((el): el is SVGSVGElement => Boolean(el));

    if (svgElements.length === 0) return;

    const singleWidth = MAP_DIMENSIONS.STATES.width;
    const singleHeight = MAP_DIMENSIONS.STATES.height;
    const count = svgElements.length;
    const cols = count === 1 ? 1 : 2;
    const rows = Math.ceil(count / cols);

    const canvas = document.createElement('canvas');
    const totalWidth = singleWidth * cols;
    const totalHeight = singleHeight * rows;
    const dpiScale = 300 / 96;
    canvas.width = totalWidth * dpiScale;
    canvas.height = totalHeight * dpiScale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpiScale, dpiScale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    const drawSvgAt = (svg: SVGSVGElement, x: number, y: number) =>
      new Promise<void>((resolve, reject) => {
        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          try {
            ctx.drawImage(img, x, y, singleWidth, singleHeight);
            URL.revokeObjectURL(url);
            resolve();
          } catch (e) {
            URL.revokeObjectURL(url);
            reject(e);
          }
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });

    for (let i = 0; i < svgElements.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * singleWidth;
      const y = row * singleHeight;
      await drawSvgAt(svgElements[i], x, y);
    }

    const [{ default: jsPDF }] = await Promise.all([import('jspdf')]);
    const imgData = canvas.toDataURL('image/png', 1.0);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pdfWidth - 2 * margin;
    const availableHeight = pdfHeight - 2 * margin;

    const imageAspect = totalWidth / totalHeight;
    const pageAspect = availableWidth / availableHeight;

    let renderWidth = availableWidth;
    let renderHeight = availableWidth / imageAspect;
    if (renderHeight > availableHeight) {
      renderHeight = availableHeight;
      renderWidth = availableHeight * imageAspect;
    }

    const x = (pdfWidth - renderWidth) / 2;
    const y = (pdfHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
    pdf.save(`bharatviz-states-multi-${Date.now()}.pdf`);
  };

  const createGistUrlProvider = () => {
    return (stateName: string) => {
      if (!stateGistMapping) return null;
      return getStateGeoJSONUrl(stateGistMapping, selectedStateMapType, stateName);
    };
  };

  const getSEOContent = () => {
    const baseUrl = 'https://bharatviz.saketlab.org';

    const seoConfigs = {
      states: {
        title: 'BharatViz - Fast Choropleth Maps for India | State-Level Data Visualization',
        description: 'Create beautiful, publication-ready choropleth maps of Indian states. Free online tool for data visualization with customizable color scales, export to PNG/SVG/PDF. Perfect for research, journalism, and presentations.',
        keywords: 'India maps, choropleth, state maps, data visualization, India states, interactive maps, geospatial analysis, India data, map maker, research visualization',
        canonical: baseUrl,
        ogTitle: 'BharatViz - Fast Choropleth Maps for India',
        ogDescription: 'Create beautiful choropleth maps of Indian states with customizable colors and export to PNG/SVG/PDF. Free and open source.'
      },
      districts: {
        title: 'District-Level Maps of India | BharatViz Choropleth Visualization',
        description: 'Visualize 800+ Indian districts with choropleth maps. Support for LGD, NFHS-5, and NFHS-4 boundaries. Export to PNG, SVG, PDF. Free tool for district-level data analysis and visualization.',
        keywords: 'India district maps, district choropleth, LGD districts, NFHS-5, NFHS-4, district data visualization, India geography, granular maps, district boundaries',
        canonical: `${baseUrl}/districts`,
        ogTitle: 'District-Level Maps of India | BharatViz',
        ogDescription: 'Visualize 800+ Indian districts with customizable choropleth maps. Support for LGD, NFHS-5, and NFHS-4 boundaries.'
      },
      regions: {
        title: 'NSSO Regions Maps | BharatViz India Regional Visualization',
        description: 'Create choropleth maps of NSSO (National Sample Survey Organization) regions in India. Ideal for survey analysis and regional statistical visualization. Free online mapping tool.',
        keywords: 'NSSO regions, India regions, survey regions, NSSO maps, regional analysis, statistical regions, sample survey, India geography',
        canonical: `${baseUrl}/regions`,
        ogTitle: 'NSSO Regions Maps | BharatViz',
        ogDescription: 'Visualize NSSO (National Sample Survey Organization) regions with customizable choropleth maps. Perfect for survey and statistical analysis.'
      },
      'state-districts': {
        title: 'Individual State District Maps | BharatViz State-Wise Visualization',
        description: 'Create detailed district-level maps for individual Indian states. High-resolution visualization with support for all major states. Export to PNG, SVG, PDF for presentations and publications.',
        keywords: 'state district maps, Maharashtra districts, Karnataka districts, Tamil Nadu districts, state-wise maps, detailed district maps, India state geography',
        canonical: `${baseUrl}/state-districts`,
        ogTitle: 'Individual State District Maps | BharatViz',
        ogDescription: 'Create detailed district-level maps for individual Indian states with customizable visualization options.'
      },
      help: {
        title: 'Help & API Documentation | BharatViz India Maps',
        description: 'Complete guide to using BharatViz: web interface, Python/R API, embedding maps, and programmatic access. Learn how to create choropleth maps of India with our comprehensive documentation.',
        keywords: 'BharatViz help, map API, Python India maps, R India maps, API documentation, embed maps, India map tutorial, choropleth API',
        canonical: `${baseUrl}/help`,
        ogTitle: 'BharatViz Help & API Documentation',
        ogDescription: 'Complete guide to using BharatViz for web, Python, R, and embedding maps. API documentation and examples included.'
      },
      credits: {
        title: 'Credits & Acknowledgments | BharatViz',
        description: 'Acknowledgments and credits for BharatViz - data sources, open source libraries, and contributors. Built with open data from Government of India sources.',
        keywords: 'BharatViz credits, data sources, acknowledgments, open source, India government data, LGD, NFHS',
        canonical: `${baseUrl}/credits`,
        ogTitle: 'Credits & Acknowledgments | BharatViz',
        ogDescription: 'Acknowledgments for BharatViz - data sources, libraries, and contributors.'
      },
      mcp: {
        title: 'MCP Server for AI Assistants | BharatViz India Maps',
        description: 'Connect BharatViz to Claude, Codex, or any MCP-compatible AI assistant. Generate India choropleth maps through natural language with 27 boundary sets, 17 color scales, and 300 DPI PNG output.',
        keywords: 'MCP server, Model Context Protocol, Claude AI maps, AI map generation, India maps API, LLM tools, bharatviz MCP, choropleth AI',
        canonical: `${baseUrl}/mcp`,
        ogTitle: 'BharatViz MCP Server for AI Assistants',
        ogDescription: 'Generate India choropleth maps through AI assistants. MCP server with 27 boundary sets and 17 color scales.'
      }
    };

    return seoConfigs[activeTab as keyof typeof seoConfigs] || seoConfigs.states;
  };

  const seoContent = getSEOContent();

  return (
    <div className="min-h-screen p-3 sm:p-6" style={{ backgroundColor: darkMode ? '#000000' : undefined }}>
      <Helmet>
        <title>{seoContent.title}</title>
        <meta name="title" content={seoContent.title} />
        <meta name="description" content={seoContent.description} />
        <meta name="keywords" content={seoContent.keywords} />

        <link rel="canonical" href={seoContent.canonical} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={seoContent.canonical} />
        <meta property="og:title" content={seoContent.ogTitle} />
        <meta property="og:description" content={seoContent.ogDescription} />
        <meta property="og:image" content="https://bharatviz.saketlab.org/bharatviz_favicon.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="BharatViz - Interactive India Maps" />
        <meta property="og:site_name" content="BharatViz" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={seoContent.canonical} />
        <meta name="twitter:title" content={seoContent.ogTitle} />
        <meta name="twitter:description" content={seoContent.ogDescription} />
        <meta name="twitter:image" content="https://bharatviz.saketlab.org/bharatviz_favicon.png" />
        <meta name="twitter:image:alt" content="BharatViz - Interactive India Maps" />
        <meta name="twitter:site" content="@saketkc" />
        <meta name="twitter:creator" content="@saketkc" />

        <meta name="author" content="Saket Choudhary" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "BharatViz",
            "description": "Fast choropleth maps for India - visualize state and district level data",
            "url": "https://bharatviz.saketlab.org",
            "applicationCategory": "DataVisualization",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Person",
              "name": "Saket Choudhary"
            },
            "provider": {
              "@type": "Organization",
              "name": "Saket Lab",
              "url": "http://saketlab.in"
            }
          })}
        </script>
      </Helmet>

      {/* Dark Mode Toggle Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-background border-2 border-primary hover:bg-accent transition-colors"
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-4xl font-bold mb-2 sm:mb-4 flex items-center justify-center gap-3 ${darkMode ? 'text-white' : ''}`}>
            <img src="/bharatviz_favicon.png" alt="BharatViz Logo" className="h-8 sm:h-12 w-auto" />
            <span>BharatViz - Fast choropleths for India</span>
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-2 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="states"
                className={`rounded-lg border-2 px-2 py-2 sm:px-4 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-blue-500 hover:text-blue-400 data-[state=active]:border-blue-500 data-[state=active]:text-blue-300 data-[state=active]:bg-blue-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-700 data-[state=active]:border-blue-600 data-[state=active]:text-blue-900 data-[state=active]:bg-blue-50'
                }`}
              >
                States
              </TabsTrigger>
              <TabsTrigger
                value="districts"
                className={`rounded-lg border-2 px-2 py-2 sm:px-4 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-blue-500 hover:text-blue-400 data-[state=active]:border-blue-500 data-[state=active]:text-blue-300 data-[state=active]:bg-blue-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-700 data-[state=active]:border-blue-600 data-[state=active]:text-blue-900 data-[state=active]:bg-blue-50'
                }`}
              >
                Districts
              </TabsTrigger>
              <TabsTrigger
                value="regions"
                className={`rounded-lg border-2 px-2 py-2 sm:px-4 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-blue-500 hover:text-blue-400 data-[state=active]:border-blue-500 data-[state=active]:text-blue-300 data-[state=active]:bg-blue-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-700 data-[state=active]:border-blue-600 data-[state=active]:text-blue-900 data-[state=active]:bg-blue-50'
                }`}
              >
                Regions
              </TabsTrigger>
              <TabsTrigger
                value="state-districts"
                className={`rounded-lg border-2 px-2 py-2 sm:px-4 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-blue-500 hover:text-blue-400 data-[state=active]:border-blue-500 data-[state=active]:text-blue-300 data-[state=active]:bg-blue-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-700 data-[state=active]:border-blue-600 data-[state=active]:text-blue-900 data-[state=active]:bg-blue-50'
                }`}
              >
                State-District
              </TabsTrigger>
              <TabsTrigger
                value="district-stats"
                className={`rounded-lg border-2 px-2 py-2 sm:px-4 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-blue-500 hover:text-blue-400 data-[state=active]:border-blue-500 data-[state=active]:text-blue-300 data-[state=active]:bg-blue-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-700 data-[state=active]:border-blue-600 data-[state=active]:text-blue-900 data-[state=active]:bg-blue-50'
                }`}
              >
                District Stats
              </TabsTrigger>
              <TabsTrigger
                value="help"
                className={`rounded-lg border-2 px-2 py-2 sm:px-4 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-blue-500 hover:text-blue-400 data-[state=active]:border-blue-500 data-[state=active]:text-blue-300 data-[state=active]:bg-blue-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-700 data-[state=active]:border-blue-600 data-[state=active]:text-blue-900 data-[state=active]:bg-blue-50'
                }`}
              >
                Help
              </TabsTrigger>
              <TabsTrigger
                value="credits"
                className={`rounded-lg border-2 px-2 py-2 sm:px-4 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-blue-500 hover:text-blue-400 data-[state=active]:border-blue-500 data-[state=active]:text-blue-300 data-[state=active]:bg-blue-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-700 data-[state=active]:border-blue-600 data-[state=active]:text-blue-900 data-[state=active]:bg-blue-50'
                }`}
              >
                Credits
              </TabsTrigger>
              <TabsTrigger
                value="mcp"
                className={`rounded-lg border-2 px-2 py-2 sm:px-4 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-200 ${
                  darkMode
                    ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-blue-500 hover:text-blue-400 data-[state=active]:border-blue-500 data-[state=active]:text-blue-300 data-[state=active]:bg-blue-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-700 data-[state=active]:border-blue-600 data-[state=active]:text-blue-900 data-[state=active]:bg-blue-50'
                }`}
              >
                MCP
              </TabsTrigger>
            </TabsList>
          </div>

          <div className={`space-y-6 ${activeTab === 'states' ? 'block' : 'hidden'}`}>
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 order-2 lg:order-2">
                {stateMultiYearSeries.length > 0 ? (
                  <div className="space-y-4">
                    {/* Multi-year grid layout */}
                    {stateMultiYearSeries.length === 2 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {stateMultiYearSeries.map((series) => (
                          <div key={series.key} className="flex flex-col items-center">
                            <div className={`text-sm font-semibold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>{series.title}</div>
                            <div className="w-full overflow-hidden" style={{ height: '85%' }}>
                              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '100%' }}>
                                <IndiaMap
                                  ref={(el) => {
                                    if (el) {
                                      stateMultiYearMapRefs.current.set(series.key, el);
                                    } else {
                                      stateMultiYearMapRefs.current.delete(series.key);
                                    }
                                  }}
                                  data={series.data}
                                  colorScale={stateColorScale}
                                  invertColors={stateInvertColors}
                                  hideStateNames={stateHideNames}
                                  hideValues={stateHideValues}
                                  dataTitle={series.title}
                                  colorBarSettings={stateColorBarSettings}
                                  dataType={stateDataType}
                                  categoryColors={stateCategoryColors}
                                  naInfo={series.naInfo}
                                  darkMode={darkMode}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : stateMultiYearSeries.length === 3 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {stateMultiYearSeries.map((series, idx) => (
                          <div key={series.key} className={`flex flex-col items-center ${idx === 2 ? 'col-span-2' : ''}`}>
                            <div className={`text-sm font-semibold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>{series.title}</div>
                            <div className="w-full overflow-hidden" style={{ height: idx === 2 ? '70%' : '85%' }}>
                              <div
                                style={{
                                  transform: idx === 2 ? 'scale(0.7)' : 'scale(0.85)',
                                  transformOrigin: 'top left',
                                  width: '100%',
                                }}
                              >
                                <IndiaMap
                                  ref={(el) => {
                                    if (el) {
                                      stateMultiYearMapRefs.current.set(series.key, el);
                                    } else {
                                      stateMultiYearMapRefs.current.delete(series.key);
                                    }
                                  }}
                                  data={series.data}
                                  colorScale={stateColorScale}
                                  invertColors={stateInvertColors}
                                  hideStateNames={stateHideNames}
                                  hideValues={stateHideValues}
                                  dataTitle={series.title}
                                  colorBarSettings={stateColorBarSettings}
                                  dataType={stateDataType}
                                  categoryColors={stateCategoryColors}
                                  naInfo={series.naInfo}
                                  darkMode={darkMode}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : stateMultiYearSeries.length >= 4 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {stateMultiYearSeries.slice(0, 4).map((series) => (
                            <div key={series.key} className="flex flex-col items-center gap-2">
                              <div className={`text-sm font-semibold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-700'}`}>{series.title}</div>
                              <div className="w-full overflow-hidden" style={{ height: '90%' }}>
                                <div
                                  style={{
                                    transform: 'scale(0.9)',
                                  transformOrigin: 'top left',
                                  width: '100%',
                                }}
                              >
                                <IndiaMap
                                  ref={(el) => {
                                    if (el) {
                                      stateMultiYearMapRefs.current.set(series.key, el);
                                    } else {
                                      stateMultiYearMapRefs.current.delete(series.key);
                                    }
                                  }}
                                  data={series.data}
                                  colorScale={stateColorScale}
                                  invertColors={stateInvertColors}
                                  hideStateNames={stateHideNames}
                                  hideValues={stateHideValues}
                                  dataTitle={series.title}
                                  colorBarSettings={stateColorBarSettings}
                                  dataType={stateDataType}
                                  categoryColors={stateCategoryColors}
                                  naInfo={series.naInfo}
                                  darkMode={darkMode}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <IndiaMap ref={stateMapRef} data={stateMapData} colorScale={stateColorScale}
                    invertColors={stateInvertColors}
                    hideStateNames={stateHideNames}
                    hideValues={stateHideValues}
                    dataTitle={stateDataTitle}
                    colorBarSettings={stateColorBarSettings}
                    dataType={stateDataType}
                    categoryColors={stateCategoryColors}
                    naInfo={stateNAInfo}
                    darkMode={darkMode}
                  />
                )}
                <div className="mt-6 flex justify-center">
                  <ExportOptions
                    onExportPNG={handleExportPNG}
                    onExportSVG={handleExportSVG}
                    onExportPDF={handleExportPDF}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div className="lg:col-span-1 order-1 lg:order-1">
                <FileUpload
                  onDataLoad={handleStateDataLoad}
                  onMultiDataLoad={(payload) => {
                    if (payload.kind === 'states') {
                      handleStateMultiYearDataLoad(payload.series);
                    }
                  }}
                  mode="states"
                  geojsonPath="/India_LGD_states.geojson"
                  darkMode={darkMode}
                />
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
                    darkMode={darkMode}
                    dataType={stateDataType}
                    categories={getUniqueCategories(stateMapData.map(d => d.value))}
                    categoryColors={stateCategoryColors}
                    onCategoryColorChange={(category, color) => {
                      setStateCategoryColors(prev => ({ ...prev, [category]: color }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`space-y-6 ${activeTab === 'districts' ? 'block' : 'hidden'}`}>
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 order-2 lg:order-2">
                <IndiaDistrictsMap
                  ref={districtMapRef}
                  data={districtMapData}
                  colorScale={districtColorScale}
                  invertColors={districtInvertColors}
                  dataTitle={districtDataTitle}
                  showStateBoundaries={showStateBoundaries}
                  colorBarSettings={districtColorBarSettings}
                  geojsonPath={getDistrictMapConfig(selectedDistrictMapType)?.geojsonPath}
                  statesGeojsonPath={getDistrictMapConfig(selectedDistrictMapType)?.states}
                  dataType={districtDataType}
                  categoryColors={districtCategoryColors}
                  naInfo={districtNAInfo}
                  darkMode={darkMode}
                />
                <div className="mt-6 flex justify-center">
                  <ExportOptions
                    onExportPNG={handleExportPNG}
                    onExportSVG={handleExportSVG}
                    onExportPDF={handleExportPDF}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div className="lg:col-span-1 order-1 lg:order-1">
                <div className={`mb-4 p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-card'}`}>
                  <Label htmlFor="district-map-type" className="text-sm font-medium mb-2 block">
                    District Map Type
                  </Label>
                  <Select value={selectedDistrictMapType} onValueChange={setSelectedDistrictMapType}>
                    <SelectTrigger id="district-map-type" className="w-full">
                      <SelectValue placeholder="Select district map type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDistrictMapTypesList().map((mapType) => (
                        <SelectItem key={mapType.id} value={mapType.id}>
                          <div className="flex flex-col">
                            <span>{mapType.displayName}</span>
                            {mapType.description && (
                              <span className="text-xs text-muted-foreground">{mapType.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FileUpload
                  onDataLoad={handleDistrictDataLoad}
                  mode="districts"
                  templateCsvPath={getDistrictMapConfig(selectedDistrictMapType).templateCsvPath}
                  demoDataPath={getDistrictMapConfig(selectedDistrictMapType).demoDataPath}
                  googleSheetLink={getDistrictMapConfig(selectedDistrictMapType).googleSheetLink}
                  geojsonPath={getDistrictMapConfig(selectedDistrictMapType).geojsonPath}
                  darkMode={darkMode}
                />
                <div className="space-y-4 mt-6">
                  <ColorMapChooser
                    selectedScale={districtColorScale}
                    darkMode={darkMode}
                    onScaleChange={setDistrictColorScale}
                    invertColors={districtInvertColors}
                    onInvertColorsChange={setDistrictInvertColors}
                    showStateBoundaries={showStateBoundaries}
                    onShowStateBoundariesChange={setShowStateBoundaries}
                    colorBarSettings={districtColorBarSettings}
                    onColorBarSettingsChange={setDistrictColorBarSettings}
                    dataType={districtDataType}
                    categories={getUniqueCategories(districtMapData.map(d => d.value))}
                    categoryColors={districtCategoryColors}
                    onCategoryColorChange={(category, color) => {
                      setDistrictCategoryColors(prev => ({ ...prev, [category]: color }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`space-y-6 ${activeTab === 'regions' ? 'block' : 'hidden'}`}>
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 order-2 lg:order-2">
                <IndiaDistrictsMap
                  ref={districtMapRef}
                  data={districtMapData}
                  colorScale={districtColorScale}
                  invertColors={districtInvertColors}
                  dataTitle={districtDataTitle}
                  showStateBoundaries={showStateBoundaries}
                  colorBarSettings={districtColorBarSettings}
                  geojsonPath={getDistrictMapConfig('NSSO').geojsonPath}
                  statesGeojsonPath={getDistrictMapConfig('NSSO').states}
                  dataType={districtDataType}
                  categoryColors={districtCategoryColors}
                  naInfo={districtNAInfo}
                  darkMode={darkMode}
                />
                <div className="mt-6 flex justify-center">
                  <ExportOptions
                    onExportPNG={handleExportPNG}
                    onExportSVG={handleExportSVG}
                    onExportPDF={handleExportPDF}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div className="lg:col-span-1 order-1 lg:order-1">
                <div className={`mb-4 p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>NSSO Regions</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-black'}`}>
                    National Sample Survey Organization (NSSO) regions are geographical divisions used for survey sampling and statistical analysis across India.
                  </p>
                </div>

                <FileUpload
                  onDataLoad={handleDistrictDataLoad}
                  mode="districts"
                  templateCsvPath={getDistrictMapConfig('NSSO').templateCsvPath}
                  demoDataPath={getDistrictMapConfig('NSSO').demoDataPath}
                  googleSheetLink={getDistrictMapConfig('NSSO').googleSheetLink}
                  geojsonPath={getDistrictMapConfig('NSSO').geojsonPath}
                  darkMode={darkMode}
                />
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
                    dataType={districtDataType}
                    categories={getUniqueCategories(districtMapData.map(d => d.value))}
                    categoryColors={districtCategoryColors}
                    onCategoryColorChange={(category, color) => {
                      setDistrictCategoryColors(prev => ({ ...prev, [category]: color }));
                    }}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`space-y-6 ${activeTab === 'state-districts' ? 'block' : 'hidden'}`}>
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 order-2 lg:order-2">
                <IndiaDistrictsMap
                  ref={stateDistrictMapRef}
                  data={stateDistrictMapData}
                  colorScale={stateDistrictColorScale}
                  invertColors={stateDistrictInvertColors}
                  dataTitle={stateDistrictDataTitle}
                  showStateBoundaries={true}
                  colorBarSettings={stateDistrictColorBarSettings}
                  geojsonPath={getDistrictMapConfig(selectedStateMapType).geojsonPath}
                  statesGeojsonPath={getDistrictMapConfig(selectedStateMapType).states}
                  selectedState={selectedStateForMap}
                  gistUrlProvider={createGistUrlProvider()}
                  hideDistrictNames={stateDistrictHideNames}
                  hideDistrictValues={stateDistrictHideValues}
                  onHideDistrictNamesChange={setStateDistrictHideNames}
                  onHideDistrictValuesChange={setStateDistrictHideValues}
                  dataType={stateDistrictDataType}
                  categoryColors={stateDistrictCategoryColors}
                  naInfo={stateDistrictNAInfo}
                  darkMode={darkMode}
                />
                <div className="mt-6 flex justify-center">
                  <ExportOptions
                    onExportPNG={handleExportPNG}
                    onExportSVG={handleExportSVG}
                    onExportPDF={handleExportPDF}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div className="lg:col-span-1 order-1 lg:order-1">
                <div className={`mb-4 p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-card'}`}>
                  <Label htmlFor="state-district-map-type" className="text-sm font-medium mb-2 block">
                    District Map Type
                  </Label>
                  <Select value={selectedStateMapType} onValueChange={setSelectedStateMapType}>
                    <SelectTrigger id="state-district-map-type" className="w-full">
                      <SelectValue placeholder="Select district map type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDistrictMapTypesList().map((mapType) => (
                        <SelectItem key={mapType.id} value={mapType.id}>
                          <div className="flex flex-col">
                            <span>{mapType.displayName}</span>
                            {mapType.description && (
                              <span className="text-xs text-muted-foreground">{mapType.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={`mb-4 p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-card'}`}>
                  <Label htmlFor="state-selector" className="text-sm font-medium mb-2 block">
                    Select State
                  </Label>
                  <input
                    type="text"
                    placeholder="Search state..."
                    value={stateSearchQuery}
                    onChange={(e) => setStateSearchQuery(e.target.value)}
                    className={`w-full mb-2 px-3 py-2 border rounded-md text-sm ${darkMode ? 'bg-[#222] border-[#444] text-white placeholder-gray-500' : 'border-input bg-background'}`}
                  />
                  <Select value={selectedStateForMap} onValueChange={(value) => {
                    setSelectedStateForMap(value);
                    setStateSearchQuery('');
                  }}>
                    <SelectTrigger id="state-selector" className="w-full">
                      <SelectValue placeholder="Select a state">
                        {selectedStateForMap}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableStates
                        .filter((state) =>
                          state.toLowerCase().includes(stateSearchQuery.toLowerCase())
                        )
                        .map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      {stateSearchQuery.length > 0 && availableStates.filter((state) =>
                        state.toLowerCase().includes(stateSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className={`px-2 py-1.5 text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                          No states found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <FileUpload
                  onDataLoad={handleStateDistrictDataLoad}
                  mode="districts"
                  templateCsvPath={getDistrictMapConfig(selectedStateMapType).templateCsvPath}
                  demoDataPath={getDistrictMapConfig(selectedStateMapType).demoDataPath}
                  googleSheetLink={getDistrictMapConfig(selectedStateMapType).googleSheetLink}
                  geojsonPath={getDistrictMapConfig(selectedStateMapType).geojsonPath}
                  selectedState={selectedStateForMap}
                  darkMode={darkMode}
                />
                <div className="space-y-4 mt-6">
                  <ColorMapChooser
                    selectedScale={stateDistrictColorScale}
                    onScaleChange={setStateDistrictColorScale}
                    invertColors={stateDistrictInvertColors}
                    onInvertColorsChange={setStateDistrictInvertColors}
                    showStateBoundaries={true}
                    hideDistrictNames={stateDistrictHideNames}
                    darkMode={darkMode}
                    hideValues={stateDistrictHideValues}
                    onHideDistrictNamesChange={setStateDistrictHideNames}
                    onHideDistrictValuesChange={setStateDistrictHideValues}
                    colorBarSettings={stateDistrictColorBarSettings}
                    onColorBarSettingsChange={setStateDistrictColorBarSettings}
                    dataType={stateDistrictDataType}
                    categories={getUniqueCategories(stateDistrictMapData.map(d => d.value))}
                    categoryColors={stateDistrictCategoryColors}
                    onCategoryColorChange={(category, color) => {
                      setStateDistrictCategoryColors(prev => ({ ...prev, [category]: color }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`space-y-6 ${activeTab === 'help' ? 'block' : 'hidden'}`}>
            <div className="max-w-4xl mx-auto p-6 space-y-8">
              <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-950">
                <h2 className="text-xl font-bold mb-2 text-green-800 dark:text-green-200">Privacy & data security</h2>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Your data is never stored.</strong> All processing happens in your browser or transiently on our servers.
                  We do not collect, store, or share any of your uploaded data.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : ''}`}>Web interface</h2>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-muted-foreground'} mb-4`}>
                    BharatViz helps you create publication-ready choropleth maps of India at state and district levels with just a few clicks.
                  </p>
                  <div className="space-y-4">
                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>1. Upload your data</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-muted-foreground'} mb-2`}>Upload a CSV file with your data. Required columns:</p>
                      <ul className={`list-disc list-inside space-y-1 text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <li><strong>States:</strong> <code>state</code> and <code>value</code></li>
                        <li><strong>Districts:</strong> <code>state_name</code>, <code>district_name</code>, and <code>value</code></li>
                      </ul>
                      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                        Download the CSV template or load demo data to get started quickly.
                      </p>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>2. Customize your map</h3>
                      <ul className={`list-disc list-inside space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
                        <li><strong>Color Scale:</strong> Choose from sequential (blues, greens, viridis) or diverging (spectral, rdylbu) scales</li>
                        <li><strong>Invert Colors:</strong> Flip the color mapping (useful when lower values are better)</li>
                        <li><strong>Discrete vs Continuous:</strong> Use discrete bins or smooth gradients</li>
                        <li><strong>Labels:</strong> Toggle state names and values on/off</li>
                        <li><strong>District Maps:</strong> Choose between LGD, NFHS-5, or NFHS-4 boundaries</li>
                      </ul>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>3. Export your map</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>Export in multiple formats:</p>
                      <ul className={`list-disc list-inside space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
                        <li><strong>PNG:</strong> High-resolution raster image (300 DPI)</li>
                        <li><strong>SVG:</strong> Vector format for editing in Adobe Illustrator, Inkscape, etc.</li>
                        <li><strong>PDF:</strong> Publication-ready format</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : ''}`}>Programmatic access (API)</h2>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-muted-foreground'} mb-4`}>
                    The API supports state and district-level maps (LGD, NFHS-5, NFHS-4), all color scales, and exports to PNG, SVG, and PDF formats from Python or R.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                      <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Documentation & examples</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                        <li>
                          <a
                            href="https://colab.research.google.com/github/saketlab/bharatviz/blob/main/server/examples/BharatViz_demo.ipynb"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-900 dark:hover:text-blue-100"
                          >
                            Try Python notebook in Google Colab
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://rpubs.com/saketkc/bharatviz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-900 dark:hover:text-blue-100"
                          >
                            View R notebook on RPubs
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>Python</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`# Install dependencies
pip install requests pillow pandas

# Download client
wget -q https://raw.githubusercontent.com/saketlab/bharatviz/refs/heads/main/server/examples/bharatviz.py

# Use in your code
from bharatviz import BharatViz

bv = BharatViz()
# States map
data = [{"state": "Maharashtra", "value": 75.8}]
bv.generate_map(data, title="My Map", show=True)

# Districts map (LGD)
dist_data = [{"state_name": "Telangana", "district_name": "Adilabad", "value": 45.2}]
bv.generate_districts_map(dist_data, map_type="LGD", show=True)

# Districts map (NFHS5)
bv.generate_districts_map(dist_data, map_type="NFHS5", show=True)`}
                      </pre>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>R</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`# Install dependencies
install.packages(c("R6", "httr", "jsonlite", "base64enc", "png"))

# Source client
source("https://raw.githubusercontent.com/saketlab/bharatviz/refs/heads/main/server/examples/bharatviz.R")

# Use in your code
library(R6)
bv <- BharatViz$new()
# States map
data <- data.frame(state = c("Maharashtra", "Kerala"), value = c(75.8, 85.5))
result <- bv$generate_map(data, title = "My Map")
bv$show_map(result)

# Districts map (LGD)
dist_data <- data.frame(state_name = "Telangana", district_name = "Adilabad", value = 45.2)
result_lgd <- bv$generate_districts_map(dist_data, map_type = "LGD")
bv$show_map(result_lgd)

# Districts map (NFHS5)
result_nfhs5 <- bv$generate_districts_map(dist_data, map_type = "NFHS5")
bv$show_map(result_nfhs5)`}
                      </pre>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>R: Side-by-side maps (high resolution)</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`library(R6)
library(grid)
library(gridExtra)

source("https://raw.githubusercontent.com/saketlab/bharatviz/refs/heads/main/server/examples/bharatviz.R")

bv <- BharatViz$new()

# Generate two maps
data1 <- data.frame(state = c("Maharashtra", "Kerala"), value = c(75.8, 85.5))
data2 <- data.frame(state = c("Maharashtra", "Kerala"), value = c(45.2, 62.1))

map1 <- bv$generate_map(data1, title = "Metric A", color_scale = "blues")
map2 <- bv$generate_map(data2, title = "Metric B", color_scale = "reds")

# Get raster grobs (preserves resolution)
grob1 <- bv$get_grob(map1)
grob2 <- bv$get_grob(map2)

# Display side by side
grid.arrange(grob1, grob2, ncol = 2)

# Save as high-res PNG (300 DPI)
png("comparison.png", width = 16, height = 8, units = "in", res = 300)
grid.arrange(grob1, grob2, ncol = 2)
dev.off()

# Save as PDF
pdf("comparison.pdf", width = 16, height = 8)
grid.arrange(grob1, grob2, ncol = 2)
dev.off()`}
                      </pre>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>Direct API reference</h3>
                      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
                        For custom implementations without the client libraries:
                      </p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`# States Map Endpoint
POST /api/v1/states/map
{
  "data": [{"state": "Maharashtra", "value": 75.8}],
  "colorScale": "spectral",    // Optional: spectral, viridis, blues, etc.
  "invertColors": false,       // Optional: invert color scale
  "mainTitle": "My Map Title", // Optional: map title (default: "BharatViz")
  "legendTitle": "Values",     // Optional: legend label
  "hideStateNames": false,     // Optional: hide state labels
  "hideValues": false,         // Optional: hide value labels
  "darkMode": false,           // Optional: dark background
  "formats": ["png"]           // Optional: png, svg, pdf
}

# Districts Map Endpoint
POST /api/v1/districts/map
{
  "data": [{"state_name": "Telangana", "district_name": "Adilabad", "value": 45.2}],
  "mapType": "LGD",            // Required: LGD, NFHS5, NFHS4, SOI2011, SOI2001
  "colorScale": "spectral",
  "mainTitle": "District Map",
  "legendTitle": "Values",
  "formats": ["png"]
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : ''}`}>Embedding maps</h2>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-muted-foreground'} mb-4`}>
                    Embed interactive BharatViz maps directly into your website, blog, or GitHub Pages without downloading files.
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">Live demo & interactive examples</h3>
                      <p className="text-blue-700 dark:text-blue-300 mb-3">
                        See both embedding methods in action with live, working examples.
                      </p>
                      <a
                        href="/embed-demo"
                        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        View Embed Demo →
                      </a>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>iframe embed</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`<iframe
  src="https://bharatviz.saketlab.org/api/v1/embed?dataUrl=https://yoursite.com/data.csv&colorScale=viridis&title=My%20Map"
  width="800"
  height="600"
  frameborder="0">
</iframe>`}
                      </pre>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>JavaScript widget</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`<div id="my-map"></div>
<script src="https://bharatviz.saketlab.org/api/embed.js"></script>
<script>
  BharatViz.embed({
    container: '#my-map',
    dataUrl: 'https://yoursite.com/data.csv',
    colorScale: 'viridis',
    title: 'My Map'
  });
</script>`}
                      </pre>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>Direct SVG</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`<img src="https://bharatviz.saketlab.org/api/v1/embed/svg?dataUrl=https://yoursite.com/data.csv&colorScale=viridis" />`}
                      </pre>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>GitHub Pages example</h3>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`# 1. Create data.csv in your GitHub repo
# 2. Enable GitHub Pages in repo settings
# 3. Embed using your GitHub Pages URL:
<iframe src="https://bharatviz.saketlab.org/api/v1/embed?dataUrl=https://USERNAME.github.io/REPO/data.csv&colorScale=viridis"></iframe>`}
                      </pre>
                    </div>

                    <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : ''}`}>Available parameters</h3>
                      <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
                        <p><code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#333] text-gray-200' : 'bg-muted'}`}>dataUrl</code> - URL to your CSV file (required)</p>
                        <p><code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#333] text-gray-200' : 'bg-muted'}`}>mapType</code> - 'states', 'districts', or 'state-districts' (default: 'states')</p>
                        <p><code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#333] text-gray-200' : 'bg-muted'}`}>colorScale</code> - 'viridis', 'spectral', 'blues', 'greens', etc. (default: 'spectral')</p>
                        <p><code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#333] text-gray-200' : 'bg-muted'}`}>mainTitle</code> - Map title (default: 'BharatViz')</p>
                        <p><code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#333] text-gray-200' : 'bg-muted'}`}>legendTitle</code> - Legend label (default: 'Values')</p>
                        <p><code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#333] text-gray-200' : 'bg-muted'}`}>invertColors</code> - true/false to reverse color scale</p>
                        <p><code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#333] text-gray-200' : 'bg-muted'}`}>darkMode</code> - true/false for dark background with white boundaries and text</p>
                        <p><code className={`px-1 py-0.5 rounded ${darkMode ? 'bg-[#333] text-gray-200' : 'bg-muted'}`}>districtBoundary</code> - 'LGD', 'NFHS4', 'NFHS5', 'SOI2011', or 'SOI2001' for district maps</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <div className={`p-4 border rounded-lg ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-muted/50'}`}>
                    <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
                      <Github className="h-5 w-5" />
                      Open source
                    </h2>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-muted-foreground'}`}>
                      BharatViz is open source and available on GitHub. Contributions, issues, and feedback are welcome!
                    </p>
                    <a
                      href="https://github.com/saketlab/bharatviz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-primary underline hover:text-primary/80"
                    >
                      https://github.com/saketlab/bharatviz
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`space-y-6 ${activeTab === 'district-stats' ? 'block' : 'hidden'}`}>
            <DistrictStats darkMode={darkMode} />
          </div>

          <div className={`space-y-6 ${activeTab === 'credits' ? 'block' : 'hidden'}`}>
            <Credits darkMode={darkMode} />
          </div>

          <div className={`space-y-6 ${activeTab === 'mcp' ? 'block' : 'hidden'}`}>
            <MCPDocs darkMode={darkMode} />
          </div>
        </Tabs>
      </div>
      <footer className={`w-full text-center text-xs mt-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
        <div className="flex flex-col items-center gap-2">
          <div>
            © 2025 Saket Choudhary | <a href="http://saketlab.in/" target="_blank" rel="noopener noreferrer" className="underline">Saket Lab</a>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/saketlab/bharatviz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>saketlab/bharatviz</span>
            </a>
          </div>
        </div>
      </footer>

      <ChatPanel
        key={`${activeTab}-${activeTab === 'districts' ? selectedDistrictMapType : selectedStateMapType}-${selectedStateForMap || ''}`}
        context={chatContext}
      />
    </div>
  );
};

export default Index;
