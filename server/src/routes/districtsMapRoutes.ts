import { Router } from 'express';
import { DistrictsMapController } from '../controllers/districtsMapController.js';

const router = Router();
const controller = new DistrictsMapController();

/**
 * POST /districts/map
 * Generate district-level choropleth map
 *
 * Request body:
 * {
 *   "data": [{"state": "...", "district": "...", "value": ...}],
 *   "mapType": "LGD" | "NFHS5" | "NFHS4",  // Optional, default: "LGD"
 *   "colorScale": "...",                    // Optional
 *   "invertColors": false,                  // Optional
 *   "showStateBoundaries": true,            // Optional
 *   "mainTitle": "...",                     // Optional
 *   "legendTitle": "...",                   // Optional
 *   "formats": ["png", "svg", "pdf"]        // Optional
 * }
 */
router.post('/map', (req, res) => controller.generateDistrictsMap(req, res));

export default router;
