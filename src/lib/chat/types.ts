/**
 * Type definitions for BharatViz Chat Interface
 */

export type Region = 'North' | 'South' | 'East' | 'West' | 'Northeast' | 'Central';

export type MapTab = 'states' | 'districts' | 'state-districts';

export interface CurrentView {
  tab: MapTab;
  selectedState?: string;
  mapType: string; // 'nfhs4' | 'nfhs5' | 'lgd' | etc.
}

export interface StateHierarchy {
  districts: string[];
  region: Region;
  area_sqkm: number;
}

export interface GeoMetadata {
  totalStates: number;
  totalDistricts: number;
  stateList: string[];
  districtList?: string[];
  hierarchy: Record<string, StateHierarchy>;
  selectedStateInfo?: {
    name: string;
    districtCount: number;
    districts: string[];
  };
}

export interface DataStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  q25: number;
  q75: number;
}

export interface RegionalStats {
  count: number;
  dataCount: number;
  missingCount: number;
  mean: number;
  min: number;
  max: number;
}

export interface DistrictData {
  name: string;
  value: number | null;
  missing: boolean;
}

export interface HierarchicalStateStats {
  districtCount: number;
  dataCount: number;
  missingCount: number;
  mean: number | null;
  min: number | null;
  max: number | null;
  districts: DistrictData[];
}

export interface UserData {
  hasData: boolean;
  dataType: 'state' | 'district';
  metricName?: string;  // The actual column name from CSV (e.g., "literacy_rate", "GDP")
  count: number;
  totalExpected: number;
  missingEntities: string[];
  missingPercentage: number;
  stats: DataStats | null;
  top10: Array<{ name: string; value: number }>;
  bottom10: Array<{ name: string; value: number }>;
  allData?: Array<{ name: string; value: number }>;  // Full dataset with non-null values
  regionalStats?: Record<string, RegionalStats>;
  hierarchicalStats?: Record<string, HierarchicalStateStats>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PreviousContext {
  mapType: string;
  stats: DataStats | null;
}

export interface DynamicChatContext {
  currentView: CurrentView;
  geoMetadata: GeoMetadata;
  userData: UserData;
  conversationHistory: ConversationMessage[];
  previousContext?: PreviousContext;
  mentionedStates?: string[];  // States mentioned in the current query (for selective context)
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  response?: ChatResponse;
}

export interface MapAction {
  type: 'highlight' | 'zoom' | 'color-regions';
  targets: string[];
  colors?: string[];
}

export interface ChatVisualization {
  type: 'table' | 'bar-chart' | 'line-chart' | 'box-plot' | 'heatmap';
  data: unknown;
  config?: unknown;
}

export interface ChatResponse {
  answer: string;
  visualization?: ChatVisualization;
  mapAction?: MapAction;
  confidence: number;
  processingTime: number;
  suggestions?: string[];
}

export interface DataPoint {
  name?: string;
  state?: string;
  district?: string;
  value: number | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  size: string;
  speed: string;
  quality: string;
  recommended?: boolean;
  description: string;
}

export interface ChatSettings {
  selectedModel: string;
  autoScroll: boolean;
  showTimestamps: boolean;
}
