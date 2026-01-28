/**
 * Dynamic Context Builder for Chat Interface
 * Rebuilds context whenever user changes tabs, uploads data, or switches maps
 */

import area from '@turf/area';
import { mean, median, standardDeviation, quantile, min, max } from 'simple-statistics';
import type {
  DynamicChatContext,
  DataPoint,
  Region,
  MapTab,
  StateHierarchy,
  DataStats,
  RegionalStats,
  HierarchicalStateStats,
  ConversationMessage,
  PreviousContext
} from './types';

interface BuildContextParams {
  activeTab: MapTab;
  selectedState?: string;
  mapType: string;
  data: DataPoint[];
  geoJsonPath: string;
  metricName?: string;  // The column name from CSV (e.g., "Literacy Rate", "GDP")
  previousContext?: PreviousContext;
  conversationHistory?: ConversationMessage[];
}

/**
 * Build dynamic context from current application state
 */
export async function buildDynamicContext(
  params: BuildContextParams
): Promise<DynamicChatContext> {
  const {
    activeTab,
    selectedState,
    mapType,
    data,
    geoJsonPath,
    metricName,
    previousContext,
    conversationHistory = []
  } = params;

  console.log('Building chat context with params:', {
    activeTab,
    selectedState,
    mapType,
    dataLength: data.length,
    geoJsonPath,
    metricName
  });

  // Load GeoJSON for current map
  const geoJson = await fetchGeoJSON(geoJsonPath);

  // Build hierarchy from GeoJSON
  const hierarchy = buildHierarchyFromGeoJSON(geoJson, activeTab);

  // Normalize data format
  const normalizedData = normalizeData(data);

  // Determine expected entities based on view
  const expectedEntities = getExpectedEntities(hierarchy, activeTab, selectedState);

  // Detect missing values
  const { missingEntities, missingPercentage } = detectMissingData(
    normalizedData,
    expectedEntities
  );

  // Calculate statistics
  const stats = calculateStatistics(normalizedData);

  // Build regional stats
  const regionalStats = buildRegionalStats(normalizedData, hierarchy, activeTab);

  // Build hierarchical stats (ONLY for district views, never for states view)
  const hierarchicalStats = (activeTab === 'districts' || activeTab === 'state-districts')
    ? buildHierarchicalStats(normalizedData, hierarchy)
    : undefined;

  // Get rankings
  const { top10, bottom10 } = getRankings(normalizedData);

  // Get all data with non-null values
  const allData = normalizedData
    .filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value))
    .map(d => ({
      name: d.state ? `${d.name}, ${d.state}` : d.name,
      value: d.value as number
    }))
    .sort((a, b) => b.value - a.value);

  return {
    currentView: {
      tab: activeTab,
      selectedState,
      mapType
    },

    geoMetadata: {
      totalStates: hierarchy.stateList.length,
      totalDistricts: Object.values(hierarchy.hierarchy).reduce(
        (sum, s) => sum + s.districts.length,
        0
      ),
      stateList: hierarchy.stateList,
      districtList: expectedEntities,
      hierarchy: hierarchy.hierarchy,
      selectedStateInfo: selectedState
        ? {
            name: selectedState,
            districtCount: hierarchy.hierarchy[selectedState]?.districts.length || 0,
            districts: hierarchy.hierarchy[selectedState]?.districts || []
          }
        : undefined
    },

    userData: {
      hasData: data.length > 0,
      dataType: activeTab === 'states' ? 'state' : 'district',
      metricName,
      count: normalizedData.filter(d => d.value !== null).length,
      totalExpected: expectedEntities.length,
      missingEntities,
      missingPercentage,
      stats,
      top10,
      bottom10,
      allData,
      regionalStats,
      hierarchicalStats
    },

    conversationHistory,
    previousContext
  };
}

/**
 * Fetch GeoJSON from path
 */
async function fetchGeoJSON(path: string): Promise<GeoJSON.FeatureCollection> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching GeoJSON:', error);
    throw error;
  }
}

/**
 * Build hierarchy from GeoJSON
 */
function buildHierarchyFromGeoJSON(
  geoJson: GeoJSON.FeatureCollection,
  type: MapTab
): { hierarchy: Record<string, StateHierarchy>; stateList: string[] } {
  const hierarchy: Record<string, StateHierarchy> = {};
  const stateList: string[] = [];

  for (const feature of geoJson.features) {
    const properties = feature.properties || {};
    const stateName = properties.st_nm || properties.state_name || properties.ST_NM || properties.STATE_NAME;
    const districtName = properties.district || properties.DISTRICT || properties.district_name || properties.dtname || properties.DTNAME;

    if (type === 'states') {
      if (stateName && !stateList.includes(stateName)) {
        stateList.push(stateName);
        hierarchy[stateName] = {
          districts: [],
          region: classifyRegion(stateName),
          area_sqkm: Math.round(area(feature as GeoJSON.Feature) / 1_000_000)
        };
      }
    } else {
      // District level
      if (stateName && districtName) {
        if (!hierarchy[stateName]) {
          hierarchy[stateName] = {
            districts: [],
            region: classifyRegion(stateName),
            area_sqkm: 0
          };
          if (!stateList.includes(stateName)) {
            stateList.push(stateName);
          }
        }
        if (!hierarchy[stateName].districts.includes(districtName)) {
          hierarchy[stateName].districts.push(districtName);
        }
      }
    }
  }

  return { hierarchy, stateList };
}

/**
 * Classify state into region
 */
export function classifyRegion(stateName: string): Region {
  const normalized = stateName.toLowerCase().trim();

  // North
  const north = ['punjab', 'haryana', 'himachal pradesh', 'jammu', 'kashmir', 'ladakh', 'uttarakhand', 'delhi', 'chandigarh'];
  if (north.some(s => normalized.includes(s))) return 'North';

  // South
  const south = ['kerala', 'tamil nadu', 'karnataka', 'andhra pradesh', 'telangana', 'puducherry', 'pondicherry'];
  if (south.some(s => normalized.includes(s))) return 'South';

  // East
  const east = ['west bengal', 'odisha', 'orissa', 'bihar', 'jharkhand'];
  if (east.some(s => normalized.includes(s))) return 'East';

  // West
  const west = ['maharashtra', 'gujarat', 'rajasthan', 'goa', 'daman', 'diu', 'dadra', 'nagar haveli'];
  if (west.some(s => normalized.includes(s))) return 'West';

  // Northeast
  const northeast = ['assam', 'meghalaya', 'manipur', 'mizoram', 'nagaland', 'tripura', 'arunachal pradesh', 'sikkim'];
  if (northeast.some(s => normalized.includes(s))) return 'Northeast';

  // Default to Central
  return 'Central';
}

/**
 * Normalize data format
 */
function normalizeData(data: DataPoint[]): Array<{ name: string; value: number | null; state?: string }> {
  return data.map(item => ({
    name: (item.name || item.district || item.state || '').trim(),
    value: item.value,
    state: item.state?.trim()
  }));
}

/**
 * Get expected entities based on current view
 */
function getExpectedEntities(
  hierarchy: { hierarchy: Record<string, StateHierarchy>; stateList: string[] },
  type: MapTab,
  selectedState?: string
): string[] {
  if (type === 'states') {
    return hierarchy.stateList;
  } else if (type === 'state-districts' && selectedState) {
    return hierarchy.hierarchy[selectedState]?.districts || [];
  } else {
    // All districts
    return Object.values(hierarchy.hierarchy).flatMap(s => s.districts);
  }
}

/**
 * Detect missing data
 */
function detectMissingData(
  data: Array<{ name: string; value: number | null }>,
  expectedEntities: string[]
): { missingEntities: string[]; missingPercentage: number } {
  const dataEntityNames = data
    .filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value))
    .map(d => d.name.toLowerCase());

  const missingEntities = expectedEntities.filter(
    entity => !dataEntityNames.includes(entity.toLowerCase())
  );

  const missingPercentage = expectedEntities.length > 0
    ? (missingEntities.length / expectedEntities.length) * 100
    : 0;

  return { missingEntities, missingPercentage };
}

/**
 * Calculate statistics from data
 */
function calculateStatistics(
  data: Array<{ name: string; value: number | null }>
): DataStats | null {
  const values = data
    .filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value))
    .map(d => d.value as number);

  if (values.length === 0) {
    return null;
  }

  return {
    min: min(values),
    max: max(values),
    mean: mean(values),
    median: median(values),
    stdDev: values.length > 1 ? standardDeviation(values) : 0,
    q25: quantile(values, 0.25),
    q75: quantile(values, 0.75)
  };
}

/**
 * Build regional statistics
 */
function buildRegionalStats(
  data: Array<{ name: string; value: number | null; state?: string }>,
  hierarchy: { hierarchy: Record<string, StateHierarchy>; stateList: string[] },
  type: MapTab
): Record<string, RegionalStats> {
  const regions: Record<Region, number[]> = {
    North: [],
    South: [],
    East: [],
    West: [],
    Northeast: [],
    Central: []
  };

  for (const item of data) {
    if (item.value === null || item.value === undefined || isNaN(item.value)) continue;

    const stateName = type === 'states' ? item.name : item.state;
    if (!stateName) continue;

    const stateInfo = hierarchy.hierarchy[stateName];
    if (!stateInfo) continue;

    const region = stateInfo.region;
    regions[region].push(item.value);
  }

  const regionalStats: Record<string, RegionalStats> = {};

  for (const [region, values] of Object.entries(regions)) {
    if (values.length > 0) {
      regionalStats[region] = {
        count: values.length,
        dataCount: values.length,
        missingCount: 0, // TODO: Calculate based on expected
        mean: mean(values),
        min: min(values),
        max: max(values)
      };
    }
  }

  return regionalStats;
}

/**
 * Build hierarchical statistics (state-level aggregations of district data)
 */
function buildHierarchicalStats(
  data: Array<{ name: string; value: number | null; state?: string }>,
  hierarchy: { hierarchy: Record<string, StateHierarchy>; stateList: string[] }
): Record<string, HierarchicalStateStats> {
  const hierarchicalStats: Record<string, HierarchicalStateStats> = {};

  for (const [stateName, stateInfo] of Object.entries(hierarchy.hierarchy)) {
    const stateData = data.filter(d => d.state === stateName);
    const values = stateData
      .filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value))
      .map(d => d.value as number);

    if (stateData.length > 0 || values.length > 0) {
      hierarchicalStats[stateName] = {
        districtCount: stateInfo.districts.length,
        dataCount: values.length,
        missingCount: stateInfo.districts.length - values.length,
        mean: values.length > 0 ? mean(values) : null,
        min: values.length > 0 ? min(values) : null,
        max: values.length > 0 ? max(values) : null,
        districts: stateData.map(d => ({
          name: d.name,
          value: d.value,
          missing: d.value === null || d.value === undefined || isNaN(d.value)
        }))
      };
    }
  }

  return hierarchicalStats;
}

/**
 * Get top and bottom rankings
 */
function getRankings(
  data: Array<{ name: string; value: number | null; state?: string }>
): { top10: Array<{ name: string; value: number }>; bottom10: Array<{ name: string; value: number }> } {
  const sorted = data
    .filter(d => d.value !== null && d.value !== undefined && !isNaN(d.value))
    .map(d => ({
      name: d.state ? `${d.name}, ${d.state}` : d.name,
      value: d.value as number
    }))
    .sort((a, b) => b.value - a.value);

  return {
    top10: sorted.slice(0, 10),
    bottom10: sorted.slice(-10).reverse()
  };
}
