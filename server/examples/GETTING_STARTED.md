# Getting Started with BharatViz

Quick guide to start using BharatViz API from Python/Jupyter.

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies

```bash
pip install requests pillow pandas matplotlib
```

### 2. Start the API Server

```bash
cd server
npm run dev
```

Server will run on `http://localhost:3001`

### 3. Use in Jupyter

Open the demo notebook:

```bash
cd server/examples
jupyter notebook bharatviz_demo.ipynb
```

## 📝 Minimal Example

```python
from bharatviz import BharatViz

# Initialize
bv = BharatViz()

# Your data (dict format)
data = {
    'Maharashtra': 82.9,
    'Kerala': 93.9,
    'Karnataka': 75.6
}

# Convert and display
bv.generate_map(
    BharatViz.from_dict(data),
    title="Literacy Rate",
    show=True
)
```

That's it! 🎉

## 📊 From DataFrame

```python
import pandas as pd

# Your DataFrame
df = pd.DataFrame({
    'state': ['Maharashtra', 'Kerala', 'Karnataka'],
    'population': [112.4, 33.4, 61.1]
})

# Auto-converts and displays
bv.generate_map(df, title="Population", show=True)
```

## 💾 Save to File

```python
# Save PNG
bv.generate_map(data, save_path="my_map.png")

# Save all formats (PNG, SVG, PDF)
bv.save_all_formats(data, basename="india_map")
```

## 🎨 Change Colors

```python
bv.generate_map(
    data,
    color_scale="viridis",  # Try: viridis, plasma, blues, greens
    show=True
)
```

## 📚 More Examples

See **`bharatviz_demo.ipynb`** for:
- One-line map generation
- CSV file loading
- Comparing color scales
- Advanced customization
- Real-world examples

## ✅ Test Your Setup

Run the test script to verify everything works:

```bash
cd server/examples
python3 test_bharatviz.py
```

## 🆘 Troubleshooting

### Server Not Running

**Error:** `API connection failed: Connection refused`

**Fix:**
```bash
cd server
npm run dev
```

### Missing Packages

**Error:** `ModuleNotFoundError`

**Fix:**
```bash
pip install requests pillow pandas matplotlib
```

### State Names

Make sure state names are spelled correctly:
- ✅ `Maharashtra`, `Tamil Nadu`, `Kerala`
- ❌ `Maharastra`, `TN`, `Kerela`

## 📖 Full Documentation

- **Jupyter Demo:** `bharatviz_demo.ipynb` (START HERE!)
- **Examples README:** `README.md`
- **API Docs:** `../README.md`
- **Client Reference:** `bharatviz.py` (docstrings)

---

**Ready?** Open `bharatviz_demo.ipynb` and start creating maps! 🗺️
