/**
 * District Map Configuration
 *
 * This file contains configuration for different district map types.
 * You can easily add or modify district map types by editing this file.
 */

export interface DistrictMapConfig {
  id: string;
  name: string;
  displayName: string;
  geojsonPath: string;
  states: string;
  templateCsvPath: string;
  demoDataPath: string;
  googleSheetLink: string;
  description?: string;
}

/**
 * Available district map types
 *
 * To add a new map type:
 * 1. Add a new entry to this object
 * 2. Ensure the GeoJSON file exists in the public/ directory
 * 3. Create corresponding template CSV file (optional)
 * 4. Add Google Sheets template link (optional)
 */
export const DISTRICT_MAP_TYPES: Record<string, DistrictMapConfig> = {
  // Historical Census Data - 1941-2011
  '1941': {
    id: '1941',
    name: '1941',
    displayName: 'Census 1941',
    geojsonPath: '/India-1941-districts.geojson',
    states: '/India-1941-states.geojson',
    templateCsvPath: '/bharatviz-India-1941-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1hxnjwON9VneIza7ZuOmDjtWNBpzR_VnT4vIBkXqGKxI/edit?usp=sharing',
    description: '1941 Census district boundaries - Pre-independence India'
  },
  '1951': {
    id: '1951',
    name: '1951',
    displayName: 'Census 1951',
    geojsonPath: '/India-1951-districts.geojson',
    states: '/India-1951-states.geojson',
    templateCsvPath: '/bharatviz-India-1951-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/18wPUvvXMhJkHycwgg712lN4AKYRthsIW6PNVbe7jr3U/edit?usp=sharing',
    description: '1951 Census district boundaries - First Census of independent India'
  },
  '1961': {
    id: '1961',
    name: '1961',
    displayName: 'Census 1961',
    geojsonPath: '/India-1961-districts.geojson',
    states: '/India-1961-states.geojson',
    templateCsvPath: '/bharatviz-India-1961-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1QtIKdq8AGV_KieooKEQ7nw-t4gFNxZlOOydzFP8Gph4/edit?usp=sharing',
    description: '1961 Census district boundaries'
  },
  '1971': {
    id: '1971',
    name: '1971',
    displayName: 'Census 1971',
    geojsonPath: '/India-1971-districts.geojson',
    states: '/India-1971-states.geojson',
    templateCsvPath: '/bharatviz-India-1971-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1SU_na34oi4R0B-uNt_KPkbNiyjCRlWditmgIQWm3FLU/edit?usp=sharing',
    description: '1971 Census district boundaries'
  },
  '1981': {
    id: '1981',
    name: '1981',
    displayName: 'Census 1981',
    geojsonPath: '/India-1981-districts.geojson',
    states: '/India-1981-states.geojson',
    templateCsvPath: '/bharatviz-India-1981-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1iNnV_nby-9A8wIvopvToFxk6bV-VFs8w9znQNvFSVRI/edit?usp=sharing',
    description: '1981 Census district boundaries'
  },
  '1991': {
    id: '1991',
    name: '1991',
    displayName: 'Census 1991',
    geojsonPath: '/India-1991-districts.geojson',
    states: '/India-1991-states.geojson',
    templateCsvPath: '/bharatviz-India-1991-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1K83Ejs8gJf2sTCuOCFf64-OgX_E7knzH06gJTW64Ra4/edit?usp=sharing',
    description: '1991 Census district boundaries'
  },
  '2011': {
    id: '2011',
    name: '2011',
    displayName: 'Census 2011',
    geojsonPath: '/India-2011-districts.geojson',
    states: '/India-2011-states.geojson',
    templateCsvPath: '/bharatviz-India-2011-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1kovaw869NZ6i_JcpS3vQPKB66uBMMsHy7PSp0qvLYas/edit?usp=sharing',
    description: '2011 Census district boundaries - Current administrative boundaries'
  },
  '2001': {
    id: '2001',
    name: '2001',
    displayName: 'Census 2001',
    geojsonPath: '/India-2001-districts.geojson',
    states: '/India-2001-states.geojson',
    templateCsvPath: '/bharatviz-India-2001-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1mtXOY58xi_OFvzaq3KcrPiA6QHRSXWbEU0-uldgXeiY/edit?usp=sharing',
    description: '2001 Census district boundaries'
  },

  // Current Reference Data
  LGD: {
    id: 'LGD',
    name: 'LGD',
    displayName: 'LGD',
    geojsonPath: '/India_LGD_districts.geojson',
    states: '/India_LGD_states.geojson',
    templateCsvPath: '/bharatviz-lgd-district-template.csv',
    demoDataPath: '/districts_demo.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1mxE70Qrf0ij3z--4alVbmKEfAIftH3N1wqMWYPNQk7Q/edit?usp=sharing',
    description: 'Local Government Directory (LGD) district boundaries'
  },
  NFHS5: {
    id: 'NFHS5',
    name: 'NFHS5',
    displayName: 'NFHS-5',
    geojsonPath: '/India_NFHS5_districts_simplified.geojson',
    /*states: '/India_NFHS5_states_simplified.geojson',*/
    states: '/India_LGD_states.geojson',
    templateCsvPath: '/bharatviz-NFHS5-district-template.csv',
    demoDataPath: '/nfhs5_blood_sugar_levels.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1xUOwqgpvp4hkO-e3-ENvSaqWsu0JGb6i_vUncklWotk/edit?usp=sharing',
    description: 'NFHS-5 survey district boundaries'
  },
  NFHS4: {
    id: 'NFHS4',
    name: 'NFHS4',
    displayName: 'NFHS-4',
    geojsonPath: '/India_NFHS4_districts_simplified.geojson',
    states: '/India_NFHS4_states_simplified.geojson',
    templateCsvPath: '/bharatviz-NFHS4-district-template.csv',
    demoDataPath: '/nfhs4_blood_sugar_levels.csv',
    googleSheetLink: 'https://docs.google.com/spreadsheets/d/1kiVltD6zV7N500r6sgAMaubrFGLSUNd1DxXlGcnnuls/edit?usp=sharing',
    description: 'NFHS-4 survey district boundaries'
  }
};

/**
 * Default district map type to use when the app loads
 */
export const DEFAULT_DISTRICT_MAP_TYPE = 'LGD';

/**
 * Get list of all available district map types
 */
export const getDistrictMapTypesList = (): DistrictMapConfig[] => {
  return Object.values(DISTRICT_MAP_TYPES);
};

/**
 * Get config for a specific district map type
 */
export const getDistrictMapConfig = (typeId: string): DistrictMapConfig => {
  return DISTRICT_MAP_TYPES[typeId] || DISTRICT_MAP_TYPES[DEFAULT_DISTRICT_MAP_TYPE];
};
