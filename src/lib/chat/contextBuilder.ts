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
  metricName?: string;
  previousContext?: PreviousContext;
  conversationHistory?: ConversationMessage[];
}

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

  const geoJson = await fetchGeoJSON(geoJsonPath);
  const hierarchy = buildHierarchyFromGeoJSON(geoJson, activeTab);
  const normalizedData = normalizeData(data);
  const expectedEntities = getExpectedEntities(hierarchy, activeTab, selectedState);
  const { missingEntities, missingPercentage } = detectMissingData(normalizedData, expectedEntities);
  const stats = calculateStatistics(normalizedData);
  const regionalStats = buildRegionalStats(normalizedData, hierarchy, activeTab);
  const hierarchicalStats = (activeTab === 'districts' || activeTab === 'state-districts')
    ? buildHierarchicalStats(normalizedData, hierarchy)
    : undefined;
  const { top10, bottom10 } = getRankings(normalizedData);
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
        : undefined,
      featureProperties: extractFeatureProperties(geoJson, activeTab),
    },

    userData: {
      hasData: data.length > 0,
      dataType: (activeTab === 'states' || activeTab === 'regions') ? 'state' : 'district',
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

function buildHierarchyFromGeoJSON(
  geoJson: GeoJSON.FeatureCollection,
  type: MapTab
): { hierarchy: Record<string, StateHierarchy>; stateList: string[] } {
  const hierarchy: Record<string, StateHierarchy> = {};
  const stateList: string[] = [];

  if (type === 'cities') {
    const wardNames: string[] = [];
    for (const feature of geoJson.features) {
      const props = feature.properties || {};
      const wardName = props.ward_name || props.WARD_NAME || `Ward ${props.ward_number || props.wardcode || wardNames.length + 1}`;
      if (!wardNames.includes(wardName)) {
        wardNames.push(wardName);
      }
    }
    hierarchy['City'] = {
      districts: wardNames,
      region: 'Central' as Region,
      area_sqkm: 0
    };
    stateList.push('City');
    return { hierarchy, stateList };
  }

  for (const feature of geoJson.features) {
    const properties = feature.properties || {};
    const stateName = properties.st_nm || properties.state_name || properties.ST_NM || properties.STATE_NAME;
    const districtName = properties.district || properties.DISTRICT || properties.district_name || properties.dtname || properties.DTNAME || properties.nss_region;

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

export function classifyRegion(stateName: string): Region {
  const normalized = stateName.toLowerCase().trim();

  const north = ['punjab', 'haryana', 'himachal pradesh', 'jammu', 'kashmir', 'ladakh', 'uttarakhand', 'delhi', 'chandigarh'];
  if (north.some(s => normalized.includes(s))) return 'North';

  const south = ['kerala', 'tamil nadu', 'karnataka', 'andhra pradesh', 'telangana', 'puducherry', 'pondicherry'];
  if (south.some(s => normalized.includes(s))) return 'South';

  const east = ['west bengal', 'odisha', 'orissa', 'bihar', 'jharkhand'];
  if (east.some(s => normalized.includes(s))) return 'East';

  const west = ['maharashtra', 'gujarat', 'rajasthan', 'goa', 'daman', 'diu', 'dadra', 'nagar haveli'];
  if (west.some(s => normalized.includes(s))) return 'West';

  const northeast = ['assam', 'meghalaya', 'manipur', 'mizoram', 'nagaland', 'tripura', 'arunachal pradesh', 'sikkim'];
  if (northeast.some(s => normalized.includes(s))) return 'Northeast';

  return 'Central';
}

function normalizeData(data: DataPoint[]): Array<{ name: string; value: number | null; state?: string }> {
  return data.map(item => ({
    name: (item.name || item.district || item.state || '').trim(),
    value: item.value,
    state: item.state?.trim()
  }));
}

function getExpectedEntities(
  hierarchy: { hierarchy: Record<string, StateHierarchy>; stateList: string[] },
  type: MapTab,
  selectedState?: string
): string[] {
  if (type === 'states') {
    return hierarchy.stateList;
  } else if (type === 'state-districts' && selectedState) {
    return hierarchy.hierarchy[selectedState]?.districts || [];
  } else if (type === 'cities') {
    return hierarchy.hierarchy['City']?.districts || [];
  } else {
    return Object.values(hierarchy.hierarchy).flatMap(s => s.districts);
  }
}

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
        missingCount: 0,
        mean: mean(values),
        min: min(values),
        max: max(values)
      };
    }
  }

  return regionalStats;
}

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

function extractFeatureProperties(
  geoJson: GeoJSON.FeatureCollection,
  type: MapTab
): Array<Record<string, unknown>> | undefined {
  if (type !== 'cities' && geoJson.features.length > 100) {
    return undefined;
  }

  return geoJson.features.map(f => ({ ...(f.properties || {}) }));
}
