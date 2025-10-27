# BharatViz API Server

Generate beautiful India choropleth maps programmatically through a REST API. Perfect for data scientists, researchers, and developers working with Indian state-level data.

## 🚀 Quick Start

### Installation

```bash
cd server
npm install
```

### Development

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Production

```bash
npm run build
npm start
```

## 📡 API Reference

### Endpoint

```
POST /api/v1/states/map
```

### Request Body

```typescript
{
  // Required: Array of state-value pairs
  data: Array<{
    state: string;      // State name (e.g., "Maharashtra", "Kerala")
    value: number;      // Numeric value to visualize
  }>;

  // Optional parameters
  colorScale?: string;           // Default: "spectral"
  invertColors?: boolean;        // Default: false
  hideStateNames?: boolean;      // Default: false
  hideValues?: boolean;          // Default: false
  mainTitle?: string;            // Default: "BharatViz"
  legendTitle?: string;          // Default: "Values"
  formats?: Array<"png" | "svg" | "pdf">;  // Default: ["png"]
}
```

### Response

```typescript
{
  success: true,
  exports: [
    {
      format: "png" | "svg" | "pdf",
      data: string,        // Base64 encoded file
      mimeType: string     // MIME type for the format
    }
  ],
  metadata: {
    dataPoints: number,
    colorScale: string,
    minValue: number,
    maxValue: number,
    meanValue: number
  }
}
```

### Available Color Scales

**Sequential:**
- `blues`, `greens`, `reds`, `oranges`, `purples`, `pinks`
- `viridis`, `plasma`, `inferno`, `magma`

**Diverging:**
- `spectral`, `rdylbu`, `rdylgn`, `brbg`, `piyg`, `puor`

## 📝 Examples

### cURL

```bash
curl -X POST http://localhost:3001/api/v1/states/map \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"state": "Maharashtra", "value": 75.8},
      {"state": "Karnataka", "value": 85.5},
      {"state": "Kerala", "value": 96.2}
    ],
    "colorScale": "viridis",
    "legendTitle": "Literacy Rate (%)",
    "formats": ["png", "svg", "pdf"]
  }'
```

### Python (Jupyter Notebook)

```python
import requests
import base64
from PIL import Image
from io import BytesIO

# Prepare data
data = [
    {"state": "Maharashtra", "value": 75.8},
    {"state": "Karnataka", "value": 85.5},
    {"state": "Kerala", "value": 96.2}
]

# Call API
response = requests.post(
    "http://localhost:3001/api/v1/states/map",
    json={
        "data": data,
        "colorScale": "viridis",
        "legendTitle": "Literacy Rate (%)",
        "formats": ["png"]
    }
)

result = response.json()

# Display map in Jupyter
png_data = result['exports'][0]['data']
image = Image.open(BytesIO(base64.b64decode(png_data)))
display(image)
```

### Node.js

```javascript
const response = await fetch('http://localhost:3001/api/v1/states/map', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: [
      { state: 'Maharashtra', value: 75.8 },
      { state: 'Karnataka', value: 85.5 }
    ],
    colorScale: 'viridis',
    formats: ['png']
  })
});

const result = await response.json();

// Save PNG
const pngBuffer = Buffer.from(result.exports[0].data, 'base64');
await fs.writeFile('map.png', pngBuffer);
```

### R

```r
library(httr)
library(jsonlite)
library(base64enc)

# Prepare data
data <- list(
  list(state = "Maharashtra", value = 75.8),
  list(state = "Karnataka", value = 85.5)
)

# Call API
response <- POST(
  "http://localhost:3001/api/v1/states/map",
  body = list(
    data = data,
    colorScale = "viridis",
    legendTitle = "Literacy Rate (%)",
    formats = list("png")
  ),
  encode = "json"
)

result <- content(response)

# Save PNG
png_data <- base64decode(result$exports[[1]]$data)
writeBin(png_data, "map.png")
```

## 🎯 Use Cases

### Data Science & Research
- Generate maps directly from Jupyter notebooks
- Create visualizations for research papers
- Automate map generation for reports

### Web Applications
- Backend service for dynamic map generation
- API integration for web dashboards
- Batch processing of geographic data

### Automation
- Scheduled reports with updated maps
- CI/CD pipelines with geographic visualizations
- Automated social media posts with maps

## 🏗️ Architecture

```
server/
├── src/
│   ├── index.ts              # Express server setup
│   ├── types/                # TypeScript type definitions
│   ├── routes/               # API routes
│   ├── controllers/          # Request handlers
│   ├── services/
│   │   ├── mapRenderer.ts    # D3 + JSDOM map rendering
│   │   └── exportService.ts  # PNG/SVG/PDF export
│   └── utils/                # Utility functions
├── examples/
│   └── jupyter_example.ipynb # Jupyter notebook examples
└── test-api.js               # API test script
```

### Key Technologies

- **Express.js**: REST API framework
- **D3.js**: Map rendering and visualization
- **JSDOM**: Headless DOM for server-side SVG generation
- **Sharp**: High-performance image processing
- **jsPDF**: PDF generation
- **Zod**: Request validation

## 🧪 Testing

Run the test script:

```bash
node test-api.js
```

This will:
1. Load demo CSV data
2. Call the API
3. Save generated PNG, SVG, and PDF files
4. Display metadata and statistics

## 🔒 Security

The API includes:
- **Rate limiting**: 100 requests per 15 minutes per IP
- **Request size limits**: 10MB max
- **Input validation**: Zod schema validation
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers

### Configuration

Set environment variables:

```bash
PORT=3001
ALLOWED_ORIGINS=https://yoursite.com,https://another.com
```

## 📊 Performance

- **Map Generation**: ~500-1000ms (first request, includes GeoJSON fetch)
- **Subsequent Requests**: ~200-400ms (GeoJSON cached)
- **Memory Usage**: ~150MB baseline + ~50MB per concurrent request
- **Throughput**: ~100-200 maps/minute on standard hardware

### Optimization Tips

1. **Cache GeoJSON**: The server caches GeoJSON data after first load
2. **Request only needed formats**: Don't request all formats if you only need PNG
3. **Use PNG for display, SVG for editing**: Different formats for different needs
4. **Batch requests**: Process multiple datasets in separate requests

## 🐛 Troubleshooting

### Server won't start

```bash
# Check if port is in use
lsof -i :3001

# Try a different port
PORT=3002 npm run dev
```

### Map generation fails

- Ensure state names match GeoJSON properties
- Check that values are valid numbers
- Verify network access to fetch GeoJSON

### Image quality issues

- PNG is generated at 2400x2400px (3x scale) for high quality
- SVG is vector format and scales infinitely
- PDF uses raster PNG internally for compatibility

## 🚢 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Cloud Platforms

- **Heroku**: Add `Procfile` with `web: npm start`
- **AWS Lambda**: Use serverless-http wrapper
- **Google Cloud Run**: Use provided Dockerfile
- **DigitalOcean App Platform**: Auto-detects npm scripts

## 📚 Additional Resources

- [Main BharatViz Web App](https://bharatviz.web.app)
- [Jupyter Notebook Examples](./examples/jupyter_example.ipynb)
- [GitHub Repository](https://github.com/saketkc/bharatviz)

## 📄 License

MIT License - see main repository for details

## 🤝 Contributing

Contributions welcome! Please open issues or pull requests on the main repository.

## 📧 Support

For questions or issues:
- Open an issue on GitHub
- Email: saket@saket.sh
