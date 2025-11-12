import { Request, Response } from 'express';
import { DistrictsMapRequestSchema, StateDistrictMapRequestSchema, type DistrictsMapRequest, type StateDistrictMapRequest, type StatesMapResponse } from '../types/index.js';
import { DistrictsMapRenderer } from '../services/districtsMapRenderer.js';
import { ExportService } from '../services/exportService.js';

// Singleton instances to share GeoJSON data across requests
let sharedRenderer: DistrictsMapRenderer | null = null;
let sharedExportService: ExportService | null = null;

/**
 * Districts map controller
 * Uses singleton pattern to reduce memory usage by sharing GeoJSON data
 */
export class DistrictsMapController {
  private renderer: DistrictsMapRenderer;
  private exportService: ExportService;

  constructor() {
    // Reuse shared instances to save memory
    if (!sharedRenderer) {
      sharedRenderer = new DistrictsMapRenderer();
    }
    if (!sharedExportService) {
      sharedExportService = new ExportService();
    }
    this.renderer = sharedRenderer;
    this.exportService = sharedExportService;
  }

  /**
   * Generate state-district choropleth map (single state)
   */
  async generateStateDistrictsMap(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = StateDistrictMapRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            details: validationResult.error.errors
          }
        });
        return;
      }

      const request: StateDistrictMapRequest = validationResult.data;

      // Filter data for the specified state
      const filteredData = request.data.filter(d => d.state === request.state);

      if (filteredData.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            message: `No data found for state: ${request.state}`,
            code: 'NO_DATA_FOR_STATE'
          }
        });
        return;
      }

      // Create a DistrictsMapRequest with filtered data
      const districtsRequest: DistrictsMapRequest = {
        data: filteredData,
        mapType: request.mapType,
        colorScale: request.colorScale,
        invertColors: request.invertColors,
        hideValues: request.hideValues,
        mainTitle: request.mainTitle,
        legendTitle: request.legendTitle,
        showStateBoundaries: false,
        state: request.state,
        colorBarSettings: request.colorBarSettings,
        formats: request.formats
      };

      // Calculate metadata
      const values = filteredData.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const meanValue = values.reduce((a, b) => a + b, 0) / values.length;

      // Render SVG
      const svgString = await this.renderer.renderMap(districtsRequest);

      // Generate requested exports
      const exports = [];
      const formats = request.formats || ['png'];

      for (const format of formats) {
        let exportData: string;
        let mimeType: string;

        switch (format) {
          case 'png':
            exportData = await this.exportService.svgToPNG(svgString);
            mimeType = 'image/png';
            break;

          case 'svg':
            exportData = Buffer.from(svgString).toString('base64');
            mimeType = 'image/svg+xml';
            break;

          case 'pdf':
            exportData = await this.exportService.svgToPDF(svgString);
            mimeType = 'application/pdf';
            break;

          default:
            continue;
        }

        exports.push({
          format,
          data: exportData,
          mimeType
        });

        // Explicitly clear exportData to allow GC to reclaim memory
        exportData = '';
      }

      // Send response
      const response: StatesMapResponse = {
        success: true,
        exports,
        metadata: {
          dataPoints: filteredData.length,
          colorScale: request.colorScale || 'spectral',
          minValue,
          maxValue,
          meanValue
        }
      };

      res.json(response);

    } catch (error: unknown) {
      console.error('Error generating state-districts map:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate state-districts map';
      const errorStack = error instanceof Error ? error.stack : undefined;

      res.status(500).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'GENERATION_ERROR',
          details: process.env.NODE_ENV === 'development' ? errorStack : undefined
        }
      });
    }
  }

  /**
   * Generate districts choropleth map
   */
  async generateDistrictsMap(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = DistrictsMapRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            details: validationResult.error.errors
          }
        });
        return;
      }

      const request: DistrictsMapRequest = validationResult.data;

      // Calculate metadata
      const values = request.data.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const meanValue = values.reduce((a, b) => a + b, 0) / values.length;

      // Render SVG
      const svgString = await this.renderer.renderMap(request);

      // Generate requested exports
      const exports = [];
      const formats = request.formats || ['png'];

      for (const format of formats) {
        let exportData: string;
        let mimeType: string;

        switch (format) {
          case 'png':
            exportData = await this.exportService.svgToPNG(svgString);
            mimeType = 'image/png';
            break;

          case 'svg':
            exportData = Buffer.from(svgString).toString('base64');
            mimeType = 'image/svg+xml';
            break;

          case 'pdf':
            exportData = await this.exportService.svgToPDF(svgString);
            mimeType = 'application/pdf';
            break;

          default:
            continue;
        }

        exports.push({
          format,
          data: exportData,
          mimeType
        });

        // Explicitly clear exportData to allow GC to reclaim memory
        exportData = '';
      }

      // Send response
      const response: StatesMapResponse = {
        success: true,
        exports,
        metadata: {
          dataPoints: request.data.length,
          colorScale: request.colorScale || 'spectral',
          minValue,
          maxValue,
          meanValue
        }
      };

      res.json(response);

    } catch (error: unknown) {
      console.error('Error generating districts map:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate districts map';
      const errorStack = error instanceof Error ? error.stack : undefined;

      res.status(500).json({
        success: false,
        error: {
          message: errorMessage,
          code: 'GENERATION_ERROR',
          details: process.env.NODE_ENV === 'development' ? errorStack : undefined
        }
      });
    }
  }
}
