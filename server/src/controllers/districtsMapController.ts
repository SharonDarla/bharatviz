import { Request, Response } from 'express';
import { DistrictsMapRequestSchema, type DistrictsMapRequest, type StatesMapResponse } from '../types/index.js';
import { DistrictsMapRenderer } from '../services/districtsMapRenderer.js';
import { ExportService } from '../services/exportService.js';

export class DistrictsMapController {
  private renderer: DistrictsMapRenderer;
  private exportService: ExportService;

  constructor() {
    this.renderer = new DistrictsMapRenderer();
    this.exportService = new ExportService();
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

    } catch (error: any) {
      console.error('Error generating districts map:', error);

      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to generate districts map',
          code: 'GENERATION_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  }
}
