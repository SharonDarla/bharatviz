import { Router } from 'express';
import { MapController } from '../controllers/mapController.js';

const router = Router();
const controller = new MapController();

/**
 * POST /api/v1/states/map
 * Generate state-level choropleth map
 *
 * Request body:
 * {
 *   data: [{ state: string, value: number }],
 *   colorScale?: string,
 *   invertColors?: boolean,
 *   hideStateNames?: boolean,
 *   hideValues?: boolean,
 *   mainTitle?: string,
 *   legendTitle?: string,
 *   formats?: ['png', 'svg', 'pdf']
 * }
 */
router.post('/states/map', (req, res) => controller.generateStatesMap(req, res));

export default router;
