import { Request, Response } from 'express';
import { StatesMapRequestSchema, MapExportResult, StatesMapResponse, ErrorResponse } from '../types/index.js';
import { StatesMapRenderer } from '../services/mapRenderer.js';
import { ExportService } from '../services/exportService.js';
import { ZodError } from 'zod';

/**
 * Controller for map generation endpoints
 */
export class MapController {
  private renderer: StatesMapRenderer;
  private exportService: ExportService;

  constructor() {
    this.renderer = new StatesMapRenderer();
    this.exportService = new ExportService();
  }

  /**
   * Generate states map with requested formats
   */
  async generateStatesMap(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const validatedRequest = StatesMapRequestSchema.parse(req.body);

      // Calculate statistics
      const values = validatedRequest.data.map(d => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const meanValue = values.reduce((a, b) => a + b, 0) / values.length;

      // Render SVG
      const svgString = await this.renderer.renderMap(validatedRequest);

      // Generate requested formats
      const exports: MapExportResult[] = [];

      for (const format of validatedRequest.formats || ['png']) {
        let base64Data: string;

        switch (format) {
          case 'png':
            base64Data = await this.exportService.svgToPNG(svgString);
            break;
          case 'svg':
            base64Data = await this.exportService.svgToBase64(svgString);
            break;
          case 'pdf':
            base64Data = await this.exportService.svgToPDF(svgString);
            break;
          default:
            continue;
        }

        exports.push({
          format,
          data: base64Data,
          mimeType: this.exportService.getMimeType(format)
        });
      }

      // Prepare response
      const response: StatesMapResponse = {
        success: true,
        exports,
        metadata: {
          dataPoints: validatedRequest.data.length,
          colorScale: validatedRequest.colorScale || 'spectral',
          minValue,
          maxValue,
          meanValue
        }
      };

      res.json(response);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Handle errors and send appropriate response
   */
  private handleError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          message: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          details: { validationErrors: error.errors }
        }
      };
      res.status(400).json(errorResponse);
      return;
    }

    console.error('Map generation error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    };

    res.status(500).json(errorResponse);
  }
}
