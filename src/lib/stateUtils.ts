/**
 * State utility functions for extracting state information from GeoJSON
 */

interface GeoJSONFeature {
  properties: {
    state_name?: string;
    NAME_1?: string;
    name?: string;
    ST_NM?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface GeoJSONData {
  features: GeoJSONFeature[];
  [key: string]: unknown;
}

/**
 * Extract unique state names from a GeoJSON file
 * Supports multiple property name conventions (state_name, NAME_1, name, ST_NM)
 */
export async function getUniqueStatesFromGeoJSON(geojsonPath: string): Promise<string[]> {
  try {
    const response = await fetch(geojsonPath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const geojsonData: GeoJSONData = await response.json();

    const stateSet = new Set<string>();

    if (geojsonData.features) {
      geojsonData.features.forEach((feature) => {
        const props = feature.properties;
        // Try different property names for state
        const stateName =
          props.state_name ||
          props.NAME_1 ||
          props.name ||
          props.ST_NM;

        if (stateName) {
          stateSet.add(stateName);
        }
      });
    }

    // Return sorted array of unique state names
    return Array.from(stateSet).sort();
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return [];
  }
}
