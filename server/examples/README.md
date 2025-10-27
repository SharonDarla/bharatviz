# Bharatviz Examples

Interactive examples for using the BharatViz API - Run directly in your browser with Google Colab!

## Quick Start

### Python users (Google colab)

No installation required! Click any badge below to run examples in your browser:

[![Open Complete Demo](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/saketkc/bharatviz/blob/main/server/examples/BharatViz_Complete_Demo.ipynb) **Complete Demo** - States & Districts

[![Open Quick Demo](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/saketkc/bharatviz/blob/main/server/examples/bharatviz_demo.ipynb) **Quick Demo** - State Maps Only

[![Open Tutorial](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/saketkc/bharatviz/blob/main/server/examples/jupyter_example.ipynb) **Tutorial** - Step-by-step Guide

### R users

Download and run the R Markdown demo:

```r
# Download files
download.file(
  "https://raw.githubusercontent.com/saketkc/bharatviz/main/server/examples/bharatviz.R",
  "bharatviz.R"
)
download.file(
  "https://raw.githubusercontent.com/saketkc/bharatviz/main/server/examples/BharatViz_Demo.Rmd",
  "BharatViz_Demo.Rmd"
)

# Install dependencies
install.packages(c("httr", "jsonlite", "base64enc", "R6", "png", "rmarkdown"))

# Render the notebook
rmarkdown::render("BharatViz_Demo.Rmd")
```

## Files

### `bharatviz.py`
**Python client library for BharatViz API** - Provides easy-to-use functions for generating India choropleth maps.

**Features:**
- **State & District maps** (LGD, NFHS4, NFHS5)
- Auto-converts DataFrames and dictionaries
- One-line map generation with `quick_map()` and `quick_districts_map()`
- Save to PNG, SVG, PDF
- Compare color scales side-by-side
- Full customization options

### `BharatViz_Complete_Demo.ipynb` **New!**
**Comprehensive demo notebook with states AND districts!**

Covers:
1. **States:** From dict, DataFrame, custom columns
2. **Districts:** LGD/NFHS maps, CSV import, custom columns
3. **PDF Export:** Publication-ready outputs
4. **Advanced:** Metadata, inverted scales, comparisons

**Start here!** This is the most complete demo.

### `bharatviz_demo.ipynb`
**States-only minimal-code examples.**

Covers:
1. One-line map generation
2. DataFrame auto-conversion
3. Custom column names
4. Saving maps (PNG, SVG, PDF)
5. Comparing color scales
6. Advanced customization
7. Real-world CSV example

### `jupyter_example.ipynb`
Original detailed examples with full API usage.

---

### `bharatviz.R` **New!**
**R client library for BharatViz API** - Full-featured R interface with R6 classes.

**Features:**
- **State & District maps** (LGD, NFHS4, NFHS5)
- Works with data frames and named lists
- One-line functions: `quick_map()` and `quick_districts_map()`
- Save to PNG, SVG, PDF
- Auto-detects column names
- Full R6 class interface

### `BharatViz_Demo.Rmd` **New!**
**Comprehensive R Markdown demo for R users!**

Covers:
1. **States:** From named lists, data frames, custom columns
2. **Districts:** LGD/NFHS maps, CSV import
3. **PDF Export:** Publication-ready outputs
4. **Advanced:** Metadata, inverted scales, customization

**R users start here!**

---

 ## Quick start

### 1. Install dependencies

```bash
pip install requests pillow pandas matplotlib
```

### 2. Start the api server

```bash
cd server
npm run dev
```

Server runs on `http://localhost:3001`

### 3. Run the demo notebook

```bash
jupyter notebook bharatviz_demo.ipynb
```

## Minimal code examples

### State maps

#### From dictionary (simplest!)

```python
from bharatviz import BharatViz, quick_map

data = {
    'Maharashtra': 82.9,
    'Kerala': 93.9,
    'Karnataka': 75.6
}

quick_map(BharatViz.from_dict(data), title="Literacy Rate")
```

#### From dataframe

```python
import pandas as pd
from bharatviz import BharatViz

df = pd.DataFrame({
    'state': ['Maharashtra', 'Kerala', 'Karnataka'],
    'value': [82.9, 93.9, 75.6]
})

bv = BharatViz()
bv.generate_map(df, title="My Map", show=True)
```

#### Save to pdf

```python
# Save all formats (PNG, SVG, PDF)
bv.save_all_formats(df, basename="india_map")
```

### District maps

#### Quick district map

```python
from bharatviz import quick_districts_map

data = [
    {"state": "Maharashtra", "district": "Mumbai", "value": 89.7},
    {"state": "Karnataka", "district": "Bengaluru Urban", "value": 88.7},
    {"state": "Kerala", "district": "Thiruvananthapuram", "value": 93.0}
]

quick_districts_map(data, title="District Literacy", map_type='LGD')
```

#### From DataFrame

```python
from bharatviz import BharatViz

df = pd.DataFrame({
    'state': ['Maharashtra', 'Karnataka'],
    'district': ['Mumbai', 'Bengaluru Urban'],
    'value': [89.7, 88.7]
})

bv = BharatViz()
bv.generate_districts_map(df, map_type='LGD', show=True)
```

#### Save District Map to PDF

```python
# Save all formats for district map
bv.save_all_formats(df, basename="districts_map", map_type="districts")
```

### Compare color scales

```python
bv.compare_scales(data, scales=['spectral', 'viridis', 'plasma'])
```

## Api reference

### `BharatViz(api_url)`
Main client class.

**Parameters:**
- `api_url` (str): API server URL. Default: `"http://localhost:3001"`

### `generate_map(data, **options)`
Generate a choropleth map.

**Parameters:**
- `data`: List of dicts or DataFrame with 'state' and 'value'
- `title` (str): Map title
- `legend_title` (str): Legend label
- `color_scale` (str): Color scheme (see below)
- `show` (bool): Display in notebook
- `save_path` (str): Save PNG to path
- `formats` (list): Export formats `['png', 'svg', 'pdf']`
- `figsize` (tuple): Display size `(width, height)`

**Returns:** PIL Image or dict (if `return_all=True`)

### Helper functions

#### `BharatViz.from_dataframe(df, state_col, value_col)`
Convert DataFrame to API format.

```python
data = BharatViz.from_dataframe(
    df,
    state_col='state_name',
    value_col='literacy_rate'
)
```

#### `BharatViz.from_dict(dict)`
Convert dict to API format.

```python
data = BharatViz.from_dict({'Maharashtra': 82.9, 'Kerala': 93.9})
```

#### `quick_map(data, title, **options)`
One-line map generation and display.

```python
quick_map(data, title="Literacy Rate", save_path="map.png")
```

#### `save_all_formats(data, basename, **options)`
Save PNG, SVG, and PDF at once.

```python
bv.save_all_formats(data, basename="my_map")
# Creates: my_map.png, my_map.svg, my_map.pdf
```

#### `compare_scales(data, scales, figsize)`
Compare different color scales.

```python
bv.compare_scales(data, scales=['viridis', 'plasma', 'spectral'])
```

## Color scales

### Sequential
- `blues`, `greens`, `reds`, `oranges`, `purples`, `pinks`
- `viridis`, `plasma`, `inferno`, `magma`

### Diverging
- `spectral`, `rdylbu`, `rdylgn`, `brbg`, `piyg`, `puor`

## Advanced usage

### Get metadata

```python
metadata = bv.get_metadata(data)
print(f"Min: {metadata['minValue']}")
print(f"Max: {metadata['maxValue']}")
```

### Return all formats

```python
result = bv.generate_map(
    data,
    formats=['png', 'svg', 'pdf'],
    return_all=True
)

image = result['image']
exports = result['exports']  # All formats
metadata = result['metadata']
```

### Custom styling

```python
bv.generate_map(
    data,
    title="Custom Map",
    legend_title="My Metric",
    color_scale="inferno",
    invert_colors=True,
    hide_state_names=False,
    hide_values=False,
    show=True
)
```

## Troubleshooting

### Api not running

**Error:** `API request failed: Connection refused`

**Solution:**
```bash
cd server
npm run dev
```

### Missing dependencies

**Error:** `ModuleNotFoundError: No module named 'PIL'`

**Solution:**
```bash
pip install pillow matplotlib pandas requests
```

### State names not matching

Make sure state names match exactly:
- `Maharashtra`
- `Tamil Nadu`
- `Maharastra` (typo)
- `TN` (abbreviation)

## District map types

BharatViz supports three district boundary definitions:

| Type | Description | Use Case |
|------|-------------|----------|
| **LGD** | Latest Government of India boundaries | General purpose, most recent |
| **NFHS5** | NFHS-5 (2019-21) survey boundaries | Compare with NFHS-5 data |
| **NFHS4** | NFHS-4 (2015-16) survey boundaries | Compare with NFHS-4 data |

## Examples directory structure

```
examples/
├── README.md                       # This file
├── bharatviz.py                   # Python client library
├── test_bharatviz.py              # Test suite
├── BharatViz_Complete_Demo.ipynb  # NEW! States + Districts (START HERE!)
├── bharatviz_demo.ipynb           # States-only minimal examples
└── jupyter_example.ipynb          # Original detailed examples
```

## Support

- **Complete Demo:** `BharatViz_Complete_Demo.ipynb`
- **API Documentation:** `../README.md`
- **Deployment Guide:** `../../DEPLOY_SIMPLE.md`
- **API Health:** `http://localhost:3001/health`

---

**Ready to start?** Open `BharatViz_Complete_Demo.ipynb`

**From data to PDF in 3 lines:**
```python
from bharatviz import BharatViz
bv = BharatViz()
bv.save_all_formats(your_data, basename="publication_map")
```
