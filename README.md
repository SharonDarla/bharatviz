# BharatViz

**Open-source choropleth map generator for India** - Create beautiful, interactive visualizations of state and district-level data in seconds.

## Quick Links

- **Web Application**: [bharatviz.saketlab.in](http://bharatviz.saketlab.in/)
- **REST API**: [bharatviz.saketlab.in/api](http://bharatviz.saketlab.in/api/)
- **API Documentation**: [server/README.md](server/README.md)

## Supported Maps

### State-Level Maps

Create choropleth maps for all Indian states and union territories.

**CSV Format:**
```csv
state,value
Maharashtra,75.8
Karnataka,85.5
Kerala,96.2
```

### District-Level Maps

Visualize data across all Indian districts with precise boundary mapping.

**CSV Format:**
```csv
state_name,district_name,value
Telangana,Adilabad,45.2
Uttar Pradesh,Agra,67.8
Maharashtra,Ahmednagar,23.4
```

## Color Scales

**Sequential**: Blues, Greens, Reds, Oranges, Purples, Pinks, Viridis, Plasma, Inferno, Magma

**Diverging**: RdYlBu, RdYlGn, Spectral, BrBG, PiYG, PuOr

## REST API

Generate maps programmatically with the REST API:

```bash
curl -X POST http://bharatviz.saketlab.in/api/v1/states/map \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"state": "Maharashtra", "value": 75.8},
      {"state": "Karnataka", "value": 85.5}
    ],
    "colorScale": "viridis",
    "formats": ["png", "svg"]
  }'
```

**Response**: JSON with base64-encoded images and metadata.

See [API documentation](server/README.md) for complete reference with examples in Python, R, and Node.js.

## Local Development

### Prerequisites
- Node.js 25.0+
- npm

### Setup

```bash
# Clone repository
git clone https://github.com/saketkc/bharatviz.git
cd bharatviz

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Visit `http://localhost:8080`

### API Server (Optional)

```bash
cd server
npm install
npm run dev
```

API runs at `http://localhost:3001`

### Build

```bash
# Build frontend
npm run build

# Build server
cd server
npm run build
```

## Project Structure

```
bharatviz/
├── src/                    # Frontend React application
│   ├── components/         # Map components and UI
│   ├── lib/               # Utilities and helpers
│   └── pages/             # Application pages
├── server/                # REST API server
│   ├── src/               # API source code
│   └── public/            # GeoJSON data files
└── public/                # Static assets and templates
```

## Contributing

Contributions are welcome! This is an open-source project built for the community.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Issues & Support

Found a bug or have a feature request? Please use [GitHub Issues](https://github.com/saketkc/bharatviz/issues).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- GeoJSON data from Government of India's LGD (Local Government Directory)
- Built with [React](https://react.dev/), [D3.js](https://d3js.org/), and [Vite](https://vite.dev/)
- Claude [Anthropic](https://www.anthropic.com/)
