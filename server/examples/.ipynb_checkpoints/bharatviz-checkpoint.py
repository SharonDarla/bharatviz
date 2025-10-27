"""
BharatViz Python Client
=======================

Simple Python wrapper for the BharatViz API to generate India choropleth maps.

Installation:
    pip install requests pillow pandas

Usage:
    from bharatviz import BharatViz

    # Initialize client
    bv = BharatViz(api_url="http://localhost:3001")

    # Generate map from data
    data = [
        {"state": "Maharashtra", "value": 75.8},
        {"state": "Karnataka", "value": 85.5}
    ]

    # Display in Jupyter
    bv.generate_map(data, title="My Map", show=True)

    # Save to file
    bv.generate_map(data, save_path="map.png")

    # Get all formats
    exports = bv.generate_map(data, formats=["png", "svg", "pdf"], return_all=True)
"""

import requests
import base64
from io import BytesIO
from typing import List, Dict, Optional, Union, Literal
import pandas as pd

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("Warning: PIL not available. Install with: pip install pillow")

try:
    import matplotlib.pyplot as plt
    MPL_AVAILABLE = True
except ImportError:
    MPL_AVAILABLE = False
    print("Warning: matplotlib not available. Install with: pip install matplotlib")


class BharatVizError(Exception):
    """Custom exception for BharatViz errors"""
    pass


class BharatViz:
    """
    Client for BharatViz API to generate India choropleth maps.

    Parameters
    ----------
    api_url : str, optional
        Base URL of the BharatViz API server.
        Default: "http://localhost:3001"
    """

    COLOR_SCALES = [
        'spectral', 'rdylbu', 'rdylgn', 'brbg', 'piyg', 'puor',
        'blues', 'greens', 'reds', 'oranges', 'purples', 'pinks',
        'viridis', 'plasma', 'inferno', 'magma'
    ]

    def __init__(self, api_url: str = "http://localhost:3001"):
        self.api_url = api_url.rstrip('/')
        self.endpoint = f"{self.api_url}/api/v1/states/map"

    def generate_map(
        self,
        data: Union[List[Dict], pd.DataFrame],
        title: str = "BharatViz",
        legend_title: str = "Values",
        color_scale: Literal[
            'spectral', 'rdylbu', 'rdylgn', 'brbg', 'piyg', 'puor',
            'blues', 'greens', 'reds', 'oranges', 'purples', 'pinks',
            'viridis', 'plasma', 'inferno', 'magma'
        ] = 'spectral',
        invert_colors: bool = False,
        hide_state_names: bool = False,
        hide_values: bool = False,
        formats: List[Literal['png', 'svg', 'pdf']] = ['png'],
        show: bool = False,
        save_path: Optional[str] = None,
        return_all: bool = False,
        figsize: tuple = (12, 12)
    ):
        """
        Generate India state choropleth map.

        Parameters
        ----------
        data : list of dict or DataFrame
            Data with 'state' and 'value' columns/keys
        title : str
            Main title for the map
        legend_title : str
            Title for the color legend
        color_scale : str
            Color scale to use (see COLOR_SCALES)
        invert_colors : bool
            Whether to invert the color scale
        hide_state_names : bool
            Hide state name labels
        hide_values : bool
            Hide value labels
        formats : list of str
            Export formats to generate
        show : bool
            Display the map (requires matplotlib)
        save_path : str, optional
            Path to save the PNG file
        return_all : bool
            Return all export formats instead of just image
        figsize : tuple
            Figure size for display (width, height)

        Returns
        -------
        PIL.Image or dict
            Image object if return_all=False, otherwise dict with all exports

        Examples
        --------
        >>> bv = BharatViz()
        >>> data = [{"state": "Maharashtra", "value": 75.8}]
        >>> img = bv.generate_map(data, show=True)
        >>> bv.generate_map(data, save_path="map.png")
        """
        # Convert DataFrame to list of dicts
        if isinstance(data, pd.DataFrame):
            # Ensure columns are named correctly
            if 'state' not in data.columns or 'value' not in data.columns:
                required_cols = ['state', 'value']
                if len(data.columns) >= 2:
                    # Assume first column is state, second is value
                    data = data.copy()
                    data.columns = required_cols + list(data.columns[2:])
                else:
                    raise BharatVizError(
                        f"DataFrame must have 'state' and 'value' columns. "
                        f"Got: {list(data.columns)}"
                    )
            data = data[['state', 'value']].to_dict('records')

        # Validate data
        if not data or len(data) == 0:
            raise BharatVizError("Data cannot be empty")

        # Validate color scale
        if color_scale not in self.COLOR_SCALES:
            raise BharatVizError(
                f"Invalid color scale '{color_scale}'. "
                f"Choose from: {', '.join(self.COLOR_SCALES)}"
            )

        # Prepare request
        request_body = {
            "data": data,
            "colorScale": color_scale,
            "invertColors": invert_colors,
            "hideStateNames": hide_state_names,
            "hideValues": hide_values,
            "mainTitle": title,
            "legendTitle": legend_title,
            "formats": formats
        }

        # Make API request
        try:
            response = requests.post(
                self.endpoint,
                json=request_body,
                timeout=30
            )
            response.raise_for_status()
        except requests.RequestException as e:
            raise BharatVizError(f"API request failed: {str(e)}")

        # Parse response
        try:
            result = response.json()
        except ValueError:
            raise BharatVizError("Invalid JSON response from API")

        if not result.get('success'):
            error_msg = result.get('error', {}).get('message', 'Unknown error')
            raise BharatVizError(f"API error: {error_msg}")

        # Get PNG export (default)
        png_export = next(
            (e for e in result['exports'] if e['format'] == 'png'),
            None
        )

        if not png_export:
            raise BharatVizError("PNG export not found in response")

        # Decode image
        if not PIL_AVAILABLE:
            raise BharatVizError(
                "PIL is required to handle images. Install with: pip install pillow"
            )

        png_data = png_export['data']
        image = Image.open(BytesIO(base64.b64decode(png_data)))

        # Save if requested
        if save_path:
            image.save(save_path)
            print(f"✅ Map saved to: {save_path}")

        # Display if requested
        if show:
            if not MPL_AVAILABLE:
                raise BharatVizError(
                    "matplotlib is required to display images. "
                    "Install with: pip install matplotlib"
                )

            plt.figure(figsize=figsize)
            plt.imshow(image)
            plt.axis('off')
            plt.title(title, fontsize=16, pad=20)
            plt.tight_layout()
            plt.show()

        # Return results
        if return_all:
            return {
                'image': image,
                'exports': result['exports'],
                'metadata': result['metadata']
            }

        return image

    def get_metadata(self, data: Union[List[Dict], pd.DataFrame]) -> Dict:
        """
        Get metadata about the data without generating a map.

        Parameters
        ----------
        data : list of dict or DataFrame
            Data with 'state' and 'value' columns/keys

        Returns
        -------
        dict
            Metadata including min, max, mean values
        """
        result = self.generate_map(data, formats=['svg'], return_all=True)
        return result['metadata']

    def save_all_formats(
        self,
        data: Union[List[Dict], pd.DataFrame],
        basename: str = "map",
        **kwargs
    ):
        """
        Generate and save all formats (PNG, SVG, PDF).

        Parameters
        ----------
        data : list of dict or DataFrame
            Data with 'state' and 'value' columns/keys
        basename : str
            Base filename (extensions will be added automatically)
        **kwargs
            Additional arguments passed to generate_map()

        Examples
        --------
        >>> bv = BharatViz()
        >>> data = [{"state": "Maharashtra", "value": 75.8}]
        >>> bv.save_all_formats(data, basename="my_map")
        # Creates: my_map.png, my_map.svg, my_map.pdf
        """
        result = self.generate_map(
            data,
            formats=['png', 'svg', 'pdf'],
            return_all=True,
            **kwargs
        )

        for export in result['exports']:
            filename = f"{basename}.{export['format']}"
            file_data = base64.b64decode(export['data'])

            with open(filename, 'wb') as f:
                f.write(file_data)

            size_kb = len(file_data) / 1024
            print(f"✅ Saved {filename} ({size_kb:.2f} KB)")

    def compare_scales(
        self,
        data: Union[List[Dict], pd.DataFrame],
        scales: Optional[List[str]] = None,
        figsize: tuple = (20, 12)
    ):
        """
        Compare different color scales side by side.

        Parameters
        ----------
        data : list of dict or DataFrame
            Data with 'state' and 'value' columns/keys
        scales : list of str, optional
            Color scales to compare. If None, shows all.
        figsize : tuple
            Figure size (width, height)
        """
        if not MPL_AVAILABLE:
            raise BharatVizError(
                "matplotlib is required. Install with: pip install matplotlib"
            )

        if scales is None:
            scales = ['spectral', 'viridis', 'plasma', 'blues', 'reds', 'greens']

        n_scales = len(scales)
        n_cols = 3
        n_rows = (n_scales + n_cols - 1) // n_cols

        fig, axes = plt.subplots(n_rows, n_cols, figsize=figsize)
        axes = axes.flatten() if n_scales > 1 else [axes]

        for idx, scale in enumerate(scales):
            img = self.generate_map(
                data,
                color_scale=scale,
                title=scale.title()
            )

            axes[idx].imshow(img)
            axes[idx].axis('off')
            axes[idx].set_title(scale.title(), fontsize=14, fontweight='bold')

        # Hide unused subplots
        for idx in range(n_scales, len(axes)):
            axes[idx].axis('off')

        plt.tight_layout()
        plt.show()


# Convenience function
def quick_map(
    data: Union[List[Dict], pd.DataFrame],
    title: str = "India Map",
    legend_title: str = "Values",
    color_scale: str = "spectral",
    save_path: Optional[str] = None,
    api_url: str = "http://localhost:3001"
):
    """
    Quick function to generate and display a map.

    Parameters
    ----------
    data : list of dict or DataFrame
        Data with 'state' and 'value' columns/keys
    title : str
        Main title
    legend_title : str
        Legend title
    color_scale : str
        Color scale to use
    save_path : str, optional
        Path to save PNG
    api_url : str
        API server URL

    Returns
    -------
    PIL.Image
        Generated map image

    Examples
    --------
    >>> data = [{"state": "Maharashtra", "value": 75.8}]
    >>> quick_map(data, title="Literacy Rate", save_path="map.png")
    """
    bv = BharatViz(api_url=api_url)
    return bv.generate_map(
        data,
        title=title,
        legend_title=legend_title,
        color_scale=color_scale,
        show=True,
        save_path=save_path
    )


if __name__ == "__main__":
    # Example usage
    print("BharatViz Python Client")
    print("=" * 50)
    print("\nExample usage:")
    print("""
    from bharatviz import BharatViz, quick_map

    # Quick usage
    data = [
        {"state": "Maharashtra", "value": 75.8},
        {"state": "Karnataka", "value": 85.5},
        {"state": "Kerala", "value": 96.2}
    ]

    quick_map(data, title="My Map")

    # Advanced usage
    bv = BharatViz()
    bv.generate_map(data, color_scale="viridis", save_path="map.png")
    bv.save_all_formats(data, basename="my_map")
    """)
