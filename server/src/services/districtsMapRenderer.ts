import { JSDOM } from 'jsdom';
import * as d3 from 'd3';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DistrictsMapRequest } from '../types/index.js';
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
  private districtsGeojson: any = null;
  private statesGeojson: any = null;
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
    const districtsPath = join(__dirname, '../../../public', config.geojsonPath);
    try {
      const districtsContent = await readFile(districtsPath, 'utf-8');
      this.districtsGeojson = JSON.parse(districtsContent);
    } catch (error) {
      throw new Error(`Failed to load districts GeoJSON for ${mapType}: ${error}`);
    }

    // Load states GeoJSON (for boundaries)
    const statesPath = join(__dirname, '../../../public', config.statesPath);
    try {
      const statesContent = await readFile(statesPath, 'utf-8');
      this.statesGeojson = JSON.parse(statesContent);
    } catch (error) {
      throw new Error(`Failed to load states GeoJSON for ${mapType}: ${error}`);
    }
  }

  /**
   * Calculate geographic bounds from GeoJSON
   */
  private calculateBounds(geojson: any): { minLng: number; maxLng: number; minLat: number; maxLat: number } {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    const processCoordinates = (coords: any) => {
      if (typeof coords[0] === 'number') {
        // Single coordinate pair
        const [lng, lat] = coords;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      } else {
        // Array of coordinates
        coords.forEach(processCoordinates);
      }
    };

    geojson.features.forEach((feature: any) => {
      processCoordinates(feature.geometry.coordinates);
    });

    return { minLng, maxLng, minLat, maxLat };
  }

  /**
   * Custom projection function matching frontend logic
   */
  private projectCoordinate(
    lng: number,
    lat: number,
    bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
    width = 800,
    height = 890
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
   * Convert GeoJSON coordinates to SVG path using custom projection
   */
  private coordinatesToPath(
    coords: any,
    bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
    width: number,
    height: number
  ): string {
    const processRing = (ring: number[][]): string => {
      const points = ring.map(([lng, lat]) => {
        const [x, y] = this.projectCoordinate(lng, lat, bounds, width, height);
        return `${x},${y}`;
      });
      return `M${points.join('L')}Z`;
    };

    if (coords[0] && typeof coords[0][0] === 'number') {
      // Single ring (Polygon)
      return processRing(coords);
    } else if (coords[0] && coords[0][0] && typeof coords[0][0][0] === 'number') {
      // Multiple rings (Polygon with holes)
      return coords.map(processRing).join(' ');
    } else {
      // MultiPolygon
      return coords.map((polygon: any) =>
        polygon.map(processRing).join(' ')
      ).join(' ');
    }
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

    // Calculate bounds using custom logic (matching frontend)
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
    const getDistrictValue = (properties: any): number | undefined => {
      const stateName = (properties.state_name || properties.STATE || '').toLowerCase().trim();
      const districtName = (properties.district_name || properties.DISTRICT || '').toLowerCase().trim();
      const key = `${stateName}|${districtName}`;
      return valueMap.get(key);
    };

    // Draw districts using custom projection
    this.districtsGeojson.features.forEach((feature: any) => {
      const value = getDistrictValue(feature.properties);

      let fillColor = '#f0f0f0'; // Default gray for no data

      if (value !== undefined) {
        const t = (value - minValue) / (maxValue - minValue);
        const colorT = invertColors ? (1 - t) : t;
        fillColor = interpolator(colorT);
      }

      const pathData = this.coordinatesToPath(
        feature.geometry.coordinates,
        bounds,
        width,
        height
      );

      mapGroup.append('path')
        .attr('d', pathData)
        .attr('fill', fillColor)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 0.3);
    });

    // Draw state boundaries if requested
    if (showStateBoundaries && this.statesGeojson) {
      this.statesGeojson.features.forEach((feature: any) => {
        const pathData = this.coordinatesToPath(
          feature.geometry.coordinates,
          bounds,
          width,
          height
        );

        mapGroup.append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', '#0f172a')
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
    svg: any,
    options: {
      minValue: number;
      maxValue: number;
      meanValue: number;
      colorScale: string;
      invertColors: boolean;
      legendTitle: string;
    }
  ): void {
    const legendPosition = { x: 390, y: 200 }; // Districts legend position
    const legendWidth = 180;
    const legendHeight = 20;

    const legendGroup = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendPosition.x}, ${legendPosition.y})`);

    // Add legend background box (no border)
    legendGroup.append('rect')
      .attr('x', -10)
      .attr('y', -35)
      .attr('width', legendWidth + 20)
      .attr('height', 90)
      .attr('fill', 'white')
      .attr('stroke', 'none')
      .attr('rx', 5);

    // Add title
    legendGroup.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(options.legendTitle);

    // Create horizontal gradient
    const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'districts-legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%');

    const interpolator = getD3ColorInterpolator(options.colorScale as any);

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

    // Add gradient rectangle (horizontal) - NO BORDER
    legendGroup.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#districts-legend-gradient)')
      .attr('stroke', 'none');

    // Add min, mean, max labels
    legendGroup.append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 18)
      .attr('text-anchor', 'start')
      .attr('font-size', '11px')
      .text(roundToSignificantDigits(options.minValue));

    legendGroup.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', legendHeight + 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .text(roundToSignificantDigits(options.meanValue));

    legendGroup.append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 18)
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .text(roundToSignificantDigits(options.maxValue));
  }
}
