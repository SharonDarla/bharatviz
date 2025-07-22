# BharatViz

Fast interactive choropleth maps for India - Create customizable visualizations of state and district-level data.

**Live Demo**: [bharatviz.saketlab.in](https://bharatviz.saketlab.in/)

## Quick Start

### Online (Recommended)
Visit [bharatviz.saketlab.in](https://bharatviz.saketlab.in/) and start creating maps immediately!

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/saketkc/bharatviz.git
   cd bharatviz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:8080`

## Data Format

### State-level Data
Your CSV should have exactly two columns:
```csv
state,value
Andhra Pradesh,45.2
Assam,67.8
Bihar,23.4
...
```

### District-level Data
Your CSV should have exactly three columns:
```csv
state_name,district_name,value
Telangana,Adilabad,45.2
Uttar Pradesh,Agra,67.8
Maharashtra,Ahmednagar,23.4
...
```

### Sample Data Files
- [State template CSV](public/bharatviz-state-template.csv)
- [District template CSV](public/bharatviz-district-template.csv)
- [Demo dataset](public/districts_demo.csv)

## Project Structure

```
bharatviz/
├── src/
│   ├── components/           # React components
│   │   ├── IndiaMap.tsx     # State-level map component
│   │   ├── IndiaDistrictsMap.tsx # District-level map component
│   │   ├── FileUpload.tsx   # CSV file upload handler
│   │   ├── ColorMapChooser.tsx # Color scheme selector
│   │   └── ui/              # Reusable UI components
│   ├── pages/               # Application pages
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utility functions
├── public/                  # Static assets and GeoJSON files
│   ├── india_map_states.geojson        # State boundaries
│   ├── India_LGD_Districts_simplified.geojson # District boundaries
│   └── *.csv                # Template and demo files
└── docs/                    # Documentation
```


## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**


## Bug Reports & Feature Requests

Please use [GitHub Issues](https://github.com/saketkc/bharatviz/issues) for:
- Bug reports
- Feature requests
- Documentation improvements
- Questions and support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


