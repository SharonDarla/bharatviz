/**
 * State Gist Mapping Module
 * Manages loading and accessing GeoJSON data from GitHub gists for individual states
 */

export interface StateGistMapping {
  [mapType: string]: {
    [stateName: string]: string; // stateName -> gist URL mapping
  };
}

/**
 * Load state gist mapping from a remote source
 * Returns null if unable to load, which triggers fallback to static GeoJSON
 */
export async function loadStateGistMapping(): Promise<StateGistMapping | null> {
  try {
    // This would typically load from a GitHub gist or other remote mapping
    // For now, return null to use fallback (static GeoJSON)
    return null;
  } catch (error) {
    console.error('Failed to load state gist mapping:', error);
    return null;
  }
}

/**
 * Get available states for a given map type from the gist mapping
 */
export function getAvailableStates(mapping: StateGistMapping | null, mapType: string): string[] {
  if (!mapping || !mapping[mapType]) {
    return [];
  }
  return Object.keys(mapping[mapType]).sort();
}

/**
 * Get the GeoJSON URL for a specific state and map type
 */
export function getStateGeoJSONUrl(
  mapping: StateGistMapping | null,
  mapType: string,
  stateName: string
): string | null {
  if (!mapping || !mapping[mapType] || !mapping[mapType][stateName]) {
    return null;
  }
  return mapping[mapType][stateName];
}
