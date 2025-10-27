# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BharatViz is a React + TypeScript application for creating interactive choropleth maps of India at both state and district levels. The app allows users to upload CSV data, visualize it with customizable color scales, and export maps as PNG, SVG, or PDF.

## Development Commands

### Essential Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server (runs on `http://[::]:8080`)
- `npm run build` - Production build using Vite
- `npm run build:dev` - Development mode build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Deployment
- `npm run deploy` - Build and deploy to Firebase hosting
- `npm run deploy:preview` - Deploy to Firebase preview channel

## Architecture

### Core Map Components

**IndiaMap** (`src/components/IndiaMap.tsx`)
- Renders state-level choropleth maps using D3.js and GeoJSON
- Uses D3's `geoMercator` projection for map rendering
- Supports 15 different color scales (sequential and diverging)
- Features draggable legend with editable title and min/max values
- Handles both continuous and discrete color scales
- Special positioning logic for small states (uses constants from `lib/constants.ts`)
- Export methods: `exportPNG()`, `exportSVG()`, `exportPDF()`
- PDF export uses multiple fallback strategies (svg2pdf.js → raster PDF → html2canvas)

**IndiaDistrictsMap** (`src/components/IndiaDistrictsMap.tsx`)
- Renders district-level choropleth maps
- Custom projection calculation using `projectCoordinate()` function
- Optional state boundary overlay
- Similar export and legend functionality to IndiaMap
- Taller viewport (890px vs 800px) to accommodate district detail

### Data Flow

1. User uploads CSV via `FileUpload` component
2. Data parsed using PapaParse library
3. Data stored in parent component state (`pages/Index.tsx`)
4. Map components receive data as props and render using D3
5. Color mapping handled by `lib/discreteColorUtils.ts` and `lib/colorUtils.ts`

### Color System

**Color Scales** (defined in `ColorMapChooser.tsx`)
- Sequential: blues, greens, reds, oranges, purples, pinks, viridis, plasma, inferno, magma
- Diverging: rdylbu, rdylgn, spectral, brbg, piyg, puor

**Color Modes**
- Continuous: Smooth gradient mapping values to colors
- Discrete: Binned color mapping with configurable bin count or custom boundaries

**Color Utilities** (`lib/colorUtils.ts`)
- `isColorDark()` - Determines if text should be black or white on colored background
- `roundToSignificantDigits()` - Smart number formatting for display
- `parseColorToRGB()` - Color parsing for luminance calculations

### State Management

State is managed at the page level (`pages/Index.tsx`) with separate state for:
- States tab: map data, color scale, settings, legend title
- Districts tab: map data, color scale, settings, legend title, boundary visibility

### Export Functionality

**Export Flow**
1. User clicks export button → triggers ref method on map component
2. PNG: SVG → Canvas → Blob at 300 DPI
3. SVG: Clone SVG → ensure fonts → serialize → download
4. PDF: Attempt vector (svg2pdf.js) → fallback to raster → fallback to html2canvas

**Legend Gradient Fix** (for PDF export)
- Gradients don't always export correctly in PDF
- `fixLegendGradient()` replaces gradient rect with 50 solid color rectangles
- Applied in both `IndiaMap.tsx` and `IndiaDistrictsMap.tsx`

### Constants and Configuration

All magic values centralized in `lib/constants.ts`:
- `BLACK_TEXT_STATES` - States requiring black text on white background
- `ABBREVIATED_STATES` - States with shortened names
- `EXTERNAL_LABEL_STATES` - States with labels positioned outside boundaries
- `STATE_ABBREVIATIONS` - Mapping of full names to abbreviations
- `MAP_DIMENSIONS` - Default canvas sizes
- `DEFAULT_LEGEND_POSITION` - Initial legend coordinates
- `DATA_FILES` - GeoJSON file paths

## Code Organization

### Path Aliases
TypeScript configured with `@/*` alias pointing to `src/*` for cleaner imports.

### Component Structure
- `src/components/` - Main map and UI components
- `src/components/ui/` - Reusable shadcn/ui components
- `src/lib/` - Utility functions and constants
- `src/pages/` - Route-level components
- `src/hooks/` - Custom React hooks (e.g., `use-mobile.tsx`)

### Build Configuration

**Vite** (`vite.config.ts`)
- React SWC plugin for fast refresh
- Manual code splitting configured:
  - `d3` - D3.js library isolated
  - `pdf-libs` - jsPDF and svg2pdf.js
  - `canvas-libs` - html2canvas
  - `react-vendor` - React core
  - `ui-vendor` - All Radix UI components
  - `utils` - Utility libraries

**TypeScript**
- Strict mode disabled (`noImplicitAny: false`, `strictNullChecks: false`)
- Allows JS files
- Skip lib check for faster builds

## Data Format Requirements

### State-level CSV
```csv
state,value
Andhra Pradesh,45.2
Assam,67.8
```

### District-level CSV
```csv
state_name,district_name,value
Telangana,Adilabad,45.2
Uttar Pradesh,Agra,67.8
```

## GeoJSON Files

Located in `public/`:
- `india_map_states.geojson` - State boundaries
- `India_LGD_Districts_simplified.geojson` - District boundaries (simplified for performance)

Feature properties expected:
- States: `state_name`, `NAME_1`, `name`, or `ST_NM`
- Districts: `state_name`, `district_name`

## Testing Notes

When testing map features:
- Test both mobile and desktop layouts (breakpoint handled by `use-mobile` hook)
- Verify exports work in all formats (PNG, SVG, PDF)
- Check discrete and continuous color scales
- Test with edge cases: missing data, NaN values, single value datasets
- Verify special state positioning (small states, external labels)

## Common Patterns

### Adding New Color Scale
1. Add to D3 interpolator mapping in both map components
2. Add to `ColorMapChooser.tsx` color scales object
3. Update type definition for `ColorScale`
4. Add preview colors to `getPreviewColor()` function

### Modifying Map Layout
- State positioning adjustments in `IndiaMap.tsx` (lines 764-846)
- Update `constants.ts` for classification changes
- Mobile responsiveness controlled by `isMobile` checks throughout

### Working with D3
- All D3 selections use `d3.select()` on refs
- Map rendering clears previous content with `.selectAll(".map-content").remove()`
- Legend managed separately from map content to persist during re-renders
