import { Request, Response } from 'express';
import axios from 'axios';
import { gunzipSync } from 'zlib';

export class ProxyController {
  async fetchCSV(req: Request, res: Response) {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'url parameter is required', code: 'MISSING_URL' }
        });
      }

      const response = await axios.get(url, {
        responseType: url.endsWith('.gz') ? 'arraybuffer' : 'text',
        timeout: 30000
      });

      let csvData: string;

      if (url.endsWith('.gz')) {
        const buffer = Buffer.from(response.data);
        csvData = gunzipSync(buffer).toString('utf-8');
      } else {
        csvData = response.data;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(csvData);

    } catch (error) {
      const err = error as Error;
      console.error('Proxy fetch error:', err);
      res.status(500).json({
        success: false,
        error: {
          message: err.message || 'Failed to fetch CSV',
          code: 'PROXY_ERROR'
        }
      });
    }
  }
}
