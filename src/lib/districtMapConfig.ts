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
  LGD: {
    id: 'LGD',
    name: 'LGD',
    displayName: 'LGD (Default)',
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
