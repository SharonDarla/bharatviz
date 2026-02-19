# Bharatviz Examples

Interactive examples for using the BharatViz API - Run directly in your browser with Google Colab or Rstudio!

## Quick Start

### Python users (Google colab)

No installation required!


[![Open Quick Demo](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/saketkc/bharatviz/blob/main/server/examples/BharatViz_demo.ipynb) 


### R users

Download and run the R Markdown demo: https://rpubs.com/saketkc/bharatviz
```r
# Download files
download.file(
  "https://gist.githubusercontent.com/saketkc/7b227151bde59dfa31fd2b1dd15f0c67/raw/bharatviz.R",
  "bharatviz.R"
)
download.file(
  "https://raw.githubusercontent.com/saketkc/bharatviz/main/server/examples/BharatViz_demo.qmd",
  "BharatViz_demo.qmd"
)

# Install dependencies
install.packages(c("httr", "jsonlite", "base64enc", "R6", "png", "rmarkdown"))

# Render the notebook
quarto render BharatViz_demo.qmd
```

## Quick start to run server locally

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
jupyter notebook BharatViz_demo.ipynb
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

# Convert dict to list format
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
# Save all formats (png, svg, pdf)
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

#### From dataframe

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

#### Save district map to pdf

```python
# Generate with all formats
result = bv.generate_districts_map(df, map_type='LGD', formats=['png', 'svg', 'pdf'])
bv.save_all(result, basename="districts_map")
```

### Compare color scales

```python
bv.compare_scales(data, scales=['spectral', 'viridis', 'plasma'])
```

## API reference

### `BharatViz(api_url)`
Main client class.

**Parameters:**
- `api_url` (str): API server URL. Default: `"https://bharatviz.saketlab.org"`

### `generate_map(data, **options)`
Generate a choropleth map.

**Parameters:**
- `data`: List of dicts or dataframe with 'state' and 'value'
- `title` (str): Map title
- `legend_title` (str): Legend label
- `color_scale` (str): Color scheme (see below)
- `show` (bool): Display in notebook
- `save_path` (str): Save png to path
- `formats` (list): Export formats `['png', 'svg', 'pdf']`
- `figsize` (tuple): Display size `(width, height)`

**Returns:** PIL Image or dict (if `return_all=True`)

### Helper functions

#### `BharatViz.from_dataframe(df, state_col, value_col)`
Convert dataframe to API format.

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
Save png, svg, and pdf at once.

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

