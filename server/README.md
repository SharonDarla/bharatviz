# Bharatviz api server

Generate beautiful India choropleth maps programmatically through a REST API. Perfect for data scientists, researchers, and developers working with Indian state-level data.


## API reference

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

### Available color scales

**Sequential:**
- `blues`, `greens`, `reds`, `oranges`, `purples`, `pinks`
- `viridis`, `plasma`, `inferno`, `magma`

**Diverging:**
- `spectral`, `rdylbu`, `rdylgn`, `brbg`, `piyg`, `puor`

## Examples

### curl

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

### Python

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

### nodejs

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

## Architecture

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

