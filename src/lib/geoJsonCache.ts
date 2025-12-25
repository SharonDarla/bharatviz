/**
 * GeoJSON Cache - avoid fetching the same file multiple times
 */

interface GeoJSONFeature {
  properties?: Record<string, string | undefined>;
}

interface GeoJSON {
  features: GeoJSONFeature[];
}

const cache = new Map<string, Promise<GeoJSON>>();

export async function fetchGeoJSON(path: string): Promise<GeoJSON> {
  if (cache.has(path)) {
    return cache.get(path)!;
  }

  const promise = fetch(path)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
      }
      return response.json() as Promise<GeoJSON>;
    })
    .catch(error => {
      cache.delete(path);
      throw error;
    });

  cache.set(path, promise);
  return promise;
}

export function clearCache() {
  cache.clear();
}
