import { Router } from 'express';
import { ProxyController } from '../controllers/proxyController.js';

const router = Router();
const controller = new ProxyController();

router.get('/csv', (req, res) => controller.fetchCSV(req, res));

export default router;
