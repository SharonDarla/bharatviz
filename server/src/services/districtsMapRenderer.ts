import { JSDOM } from 'jsdom';
import * as d3 from 'd3';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DistrictsMapRequest, ColorScale } from '../types/index.js';
import type { FeatureCollection, Feature, Geometry, Polygon, MultiPolygon } from 'geojson';
import { getColorForValue, getD3ColorInterpolator } from '../utils/discreteColorUtils.js';
import { isColorDark, roundToSignificantDigits } from '../utils/colorUtils.js';
import { DEFAULT_LEGEND_POSITION, MAP_DIMENSIONS } from '../utils/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DistrictMapData {
  state: string;
  district: string;
  value: number;
}

// District map configuration matching frontend
export const DISTRICT_MAP_TYPES = {
  LGD: {
    id: 'LGD',
    name: 'LGD',
    geojsonPath: 'India_LGD_districts.geojson',
    statesPath: 'India_LGD_states.geojson'
  },
  NFHS5: {
    id: 'NFHS5',
    name: 'NFHS5',
    geojsonPath: 'India_NFHS5_districts_simplified.geojson',
    statesPath: 'India_LGD_states.geojson'
  },
  NFHS4: {
    id: 'NFHS4',
    name: 'NFHS4',
    geojsonPath: 'India_NFHS4_districts_simplified.geojson',
    statesPath: 'India_NFHS4_states_simplified.geojson'
  }
};

export type DistrictMapType = 'LGD' | 'NFHS5' | 'NFHS4';

/**
 * Renders district-level India maps as SVG using D3 and JSDOM
 */
export class DistrictsMapRenderer {
  private districtsGeojson: GeoJSON.FeatureCollection | null = null;
  private statesGeojson: GeoJSON.FeatureCollection | null = null;
  private currentMapType: DistrictMapType = 'LGD';

  constructor() {}

  /**
   * Load GeoJSON data for a specific map type
   */
  async loadGeoJSON(mapType: DistrictMapType = 'LGD'): Promise<void> {
    const config = DISTRICT_MAP_TYPES[mapType];

    if (this.districtsGeojson && this.currentMapType === mapType) {
      return; // Already loaded
    }

    this.currentMapType = mapType;

    // Load districts GeoJSON
    const districtsPath = join(__dirname, '../../public', config.geojsonPath);
    try {
      const districtsContent = await readFile(districtsPath, 'utf-8');
      this.districtsGeojson = JSON.parse(districtsContent);
    } catch (error) {
      // If local file doesn't exist, fetch from the live BharatViz site
      console.log('Local districts GeoJSON not found, fetching from bharatviz.web.app...');
      const response = await fetch(`https://bharatviz.web.app/${config.geojsonPath}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch districts GeoJSON: ${response.status} ${response.statusText}`);
      }
      this.districtsGeojson = await response.json();
    }

    // Load states GeoJSON (for boundaries)
    const statesPath = join(__dirname, '../../public', config.statesPath);
    try {
      const statesContent = await readFile(statesPath, 'utf-8');
      this.statesGeojson = JSON.parse(statesContent);
    } catch (error) {
      // If local file doesn't exist, fetch from the live BharatViz site
      console.log('Local states GeoJSON not found, fetching from bharatviz.web.app...');
      const response = await fetch(`https://bharatviz.web.app/${config.statesPath}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch states GeoJSON: ${response.status} ${response.statusText}`);
      }
      this.statesGeojson = await response.json();
    }
  }

  /**
   * Calculate geographic bounds from GeoJSON
   */
  private calculateBounds(geojson: GeoJSON.FeatureCollection): { minLng: number; maxLng: number; minLat: number; maxLat: number } {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    const processCoordinates = (coords: unknown): void => {
      if (Array.isArray(coords)) {
        if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          // This is a coordinate pair [lng, lat]
          const [lng, lat] = coords;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        } else {
          // This is an array of coordinates or arrays
          coords.forEach(processCoordinates);
        }
      }
    };

    geojson.features.forEach((feature: Feature) => {
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const geometry = feature.geometry as Polygon | MultiPolygon;
        processCoordinates(geometry.coordinates);
      }
    });

    return { minLng, maxLng, minLat, maxLat };
  }

  /**
   * Project a coordinate to canvas space (matching frontend exactly)
   */
  private projectCoordinate(
    lng: number,
    lat: number,
    bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
    width: number,
    height: number
  ): [number, number] {
    const geoWidth = bounds.maxLng - bounds.minLng;
    const geoHeight = bounds.maxLat - bounds.minLat;
    const geoAspectRatio = geoWidth / geoHeight;
    const canvasAspectRatio = width / height;

    let projectionWidth = width;
    let projectionHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (geoAspectRatio > canvasAspectRatio) {
      projectionHeight = width / geoAspectRatio;
      offsetY = (height - projectionHeight) / 2;
    } else {
      projectionWidth = height * geoAspectRatio;
      offsetX = (width - projectionWidth) / 2;
    }

    const x = ((lng - bounds.minLng) / geoWidth) * projectionWidth + offsetX;
    const y = ((bounds.maxLat - lat) / geoHeight) * projectionHeight + offsetY;

    return [x, y];
  }

  /**
   * Convert GeoJSON coordinates to SVG path data
   */
  private convertCoordinatesToPath(
    coordinates: number[][] | number[][][] | number[][][][],
    bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
    width: number,
    height: number
  ): string {
    if (!coordinates || !Array.isArray(coordinates)) return '';

    const convertRing = (ring: number[][]): string => {
      return ring.map(coord => {
        const [lng, lat] = coord;
        const [x, y] = this.projectCoordinate(lng, lat, bounds, width, height);
        return `${x},${y}`;
      }).join(' L ');
    };

    // Check if it's a MultiPolygon
    if (coordinates[0] && Array.isArray(coordinates[0][0]) && Array.isArray(coordinates[0][0][0])) {
      // MultiPolygon
      return (coordinates as number[][][][]).map(polygon => {
        return polygon.map(ring => {
          const pathData = convertRing(ring);
          return `M ${pathData} Z`;
        }).join(' ');
      }).join(' ');
    } else if (coordinates[0] && Array.isArray(coordinates[0][0])) {
      // Polygon
      return (coordinates as number[][][]).map(ring => {
        const pathData = convertRing(ring);
        return `M ${pathData} Z`;
      }).join(' ');
    }

    return '';
  }

  /**
   * Render the districts map and return SVG string
   */
  async renderMap(request: DistrictsMapRequest): Promise<string> {
    const mapType = (request.mapType || 'LGD') as DistrictMapType;
    await this.loadGeoJSON(mapType);

    const {
      data,
      colorScale = 'spectral',
      invertColors = false,
      hideValues = false,
      mainTitle = 'BharatViz',
      legendTitle = 'Values',
      showStateBoundaries = true
    } = request;

    // Calculate statistics
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const meanValue = values.reduce((a, b) => a + b, 0) / values.length;

    // Create a virtual DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const document = dom.window.document;

    // Canvas dimensions (matching frontend exactly: 800x890)
    const width = 800;
    const height = 890;

    const svg = d3.select(document.body)
      .append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font-family', 'Arial, Helvetica, sans-serif');

    // Add white background rectangle
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white');

    // Create map content group
    const mapGroup = svg.append('g')
      .attr('class', 'map-content');

    // Calculate bounds from GeoJSON (matching frontend exactly)
    const bounds = this.calculateBounds(this.districtsGeojson);

    // Create color scale
    const interpolator = getD3ColorInterpolator(colorScale);

    // Create value map for lookup
    const valueMap = new Map<string, number>();
    data.forEach(d => {
      const key = `${d.state.toLowerCase().trim()}|${d.district.toLowerCase().trim()}`;
      valueMap.set(key, d.value);
    });

    // Helper function to get district value
    const getDistrictValue = (properties: Record<string, unknown>): number | undefined => {
      const stateName = String(properties.state_name || properties.STATE || '').toLowerCase().trim();
      const districtName = String(properties.district_name || properties.DISTRICT || '').toLowerCase().trim();
      const key = `${stateName}|${districtName}`;
      return valueMap.get(key);
    };

    // Draw districts using custom projection (matching frontend exactly)
    this.districtsGeojson.features.forEach((feature: Feature) => {
      const value = getDistrictValue(feature.properties);

      let fillColor = 'white'; // Default white for no data (matching frontend)

      if (value !== undefined) {
        const t = (value - minValue) / (maxValue - minValue);
        const colorT = invertColors ? (1 - t) : t;
        fillColor = interpolator(colorT);
      }

      // Determine stroke color based on fill color darkness (matching frontend)
      const strokeColor = (fillColor === 'white' || !isColorDark(fillColor))
        ? '#0f172a'  // Dark stroke for light fills
        : '#ffffff'; // White stroke for dark fills

      let pathData = '';
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const geometry = feature.geometry as Polygon | MultiPolygon;
        pathData = this.convertCoordinatesToPath(geometry.coordinates, bounds, width, height);
      }

      mapGroup.append('path')
        .attr('d', pathData)
        .attr('fill', fillColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', 0.3);
    });

    // Draw state boundaries if requested
    if (showStateBoundaries && this.statesGeojson) {
      this.statesGeojson.features.forEach((feature: Feature) => {
        let pathData = '';
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          const geometry = feature.geometry as Polygon | MultiPolygon;
          pathData = this.convertCoordinatesToPath(geometry.coordinates, bounds, width, height);
        }

        mapGroup.append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 1.2);
      });
    }

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold')
      .text(mainTitle);

    // Add legend
    this.addLegend(svg, {
      minValue,
      maxValue,
      meanValue,
      colorScale,
      invertColors,
      legendTitle
    });

    return document.body.innerHTML;
  }

  /**
   * Add horizontal legend to the map
   */
  private addLegend(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    options: {
      minValue: number;
      maxValue: number;
      meanValue: number;
      colorScale: string;
      invertColors: boolean;
      legendTitle: string;
    }
  ): void {
    const legendPosition = { x: 390, y: 200 }; // Districts legend position (desktop, non-mobile)
    const legendWidth = 200;  // Match frontend exactly
    const legendHeight = 15;  // Match frontend exactly

    const legendGroup = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendPosition.x}, ${legendPosition.y})`);

    // Add legend title (NO background box in frontend)
    legendGroup.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .attr('fill', '#374151')
      .text(options.legendTitle);

    // Create horizontal gradient
    const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'districts-legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    const interpolator = getD3ColorInterpolator(options.colorScale as ColorScale);

    // Create gradient stops
    for (let i = 0; i <= 10; i++) {
      let t = i / 10;
      if (options.invertColors) {
        t = 1 - t;
      }
      gradient.append('stop')
        .attr('offset', `${i * 10}%`)
        .attr('stop-color', interpolator(t));
    }

    // Add gradient rectangle with border (matching frontend exactly)
    legendGroup.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#districts-legend-gradient)')
      .attr('stroke', '#374151')
      .attr('stroke-width', '0.5')
      .attr('rx', '3');

    // Add min, mean, max labels (matching frontend style exactly)
    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'start')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#374151')
      .text(roundToSignificantDigits(options.minValue));

    legendGroup.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#374151')
      .text(roundToSignificantDigits(options.meanValue));

    legendGroup.append('text')
      .attr('x', legendWidth)
      .attr('y', 30)
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#374151')
      .text(roundToSignificantDigits(options.maxValue));
  }
}
