/**
 * BharatViz Embed Widget
 * Easy embedding of BharatViz maps into any website
 *
 * Usage:
 * <div id="bharatviz-map"></div>
 * <script src="https://bharatviz.saketlab.org/embed.js"></script>
 * <script>
 *   BharatViz.embed({
 *     container: '#bharatviz-map',
 *     dataUrl: 'https://yoursite.com/data.csv',
 *     colorScale: 'viridis',
 *     title: 'My Map'
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
  let API_BASE = 'https://bharatviz.saketlab.org/api/v1';

  if (currentScript) {
    const scriptSrc = currentScript.src;
    const match = scriptSrc.match(/^(https?:\/\/[^\/]+)/);
    if (match) {
      API_BASE = `${match[1]}/api/v1`;
    }
  }

  const BharatViz = {
    _cache: {
      get: function(key) {
        try {
          const item = localStorage.getItem('bharatviz_' + key);
          if (!item) return null;
          const parsed = JSON.parse(item);
          if (Date.now() - parsed.timestamp > 300000) {
            localStorage.removeItem('bharatviz_' + key);
            return null;
          }
          return parsed.data;
        } catch (e) {
          return null;
        }
      },
      set: function(key, data) {
        try {
          localStorage.setItem('bharatviz_' + key, JSON.stringify({
            data: data,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('BharatViz: Cache storage failed');
        }
      },
      generateKey: function(params) {
        return btoa(JSON.stringify(params)).substring(0, 50);
      }
    },

    embed: async function(options) {
      const container = document.querySelector(options.container);
      if (!container) {
        console.error('BharatViz: Container not found:', options.container);
        return;
      }

      const method = options.method || 'inline';

      if (method === 'iframe') {
        this._embedIframe(container, options);
      } else {
        await this._embedInline(container, options);
      }
    },

    _embedIframe: function(container, options) {
      const params = new URLSearchParams();

      if (options.dataUrl) params.append('dataUrl', options.dataUrl);
      if (options.mapType) params.append('mapType', options.mapType);
      if (options.state) params.append('state', options.state);
      if (options.boundary) {
        params.append('boundary', options.boundary);
      } else if (options.districtBoundary) {
        params.append('boundary', options.districtBoundary);
      }
      if (options.colorScale) params.append('colorScale', options.colorScale);
      if (options.title) params.append('title', options.title);
      if (options.legendTitle) params.append('legendTitle', options.legendTitle);
      if (options.invertColors) params.append('invertColors', 'true');
      if (options.hideValues) params.append('hideValues', 'true');
      if (options.hideStateNames) params.append('hideStateNames', 'true');
      if (options.hideDistrictNames) params.append('hideDistrictNames', 'true');
      if (options.showStateBoundaries !== undefined) {
        params.append('showStateBoundaries', options.showStateBoundaries ? 'true' : 'false');
      }
      if (options.darkMode) params.append('darkMode', 'true');

      const iframe = document.createElement('iframe');
      iframe.src = `${API_BASE}/embed?${params.toString()}`;
      iframe.width = options.width || '100%';
      iframe.height = options.height || '600';
      iframe.frameBorder = '0';
      iframe.style.border = 'none';
      iframe.style.maxWidth = '100%';

      container.appendChild(iframe);
    },

    _embedInline: async function(container, options) {
      try {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="display: inline-block; position: relative;">
              <div style="width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <div style="margin-top: 20px; color: #666; font-size: 14px;">
              <div id="bharatviz-load-status">Preparing map...</div>
              <div style="font-size: 12px; color: #999; margin-top: 8px;">This may take a few moments</div>
            </div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </div>
        `;

        const statusEl = container.querySelector('#bharatviz-load-status');
        const updateStatus = (msg) => {
          if (statusEl) statusEl.textContent = msg;
        };

        const cacheKey = this._cache.generateKey(options);
        const cachedSVG = this._cache.get(cacheKey);

        if (cachedSVG) {
          updateStatus('Loading from cache...');
          await new Promise(resolve => setTimeout(resolve, 100));
          this._renderSVG(container, cachedSVG, options.title, options.darkMode);
          return;
        }

        let svgContent;

        if (options.dataUrl) {
          const params = new URLSearchParams();
          params.append('dataUrl', options.dataUrl);
          params.append('colorScale', options.colorScale || 'spectral');
          params.append('legendTitle', options.legendTitle || 'Values');

          if (options.mapType) params.append('mapType', options.mapType);
          if (options.state) params.append('state', options.state);

          const boundary = options.boundary || options.districtBoundary || 'LGD';
          params.append('boundary', boundary);

          if (options.invertColors) params.append('invertColors', 'true');
          if (options.hideValues) params.append('hideValues', 'true');
          if (options.hideStateNames) params.append('hideStateNames', 'true');
          if (options.hideDistrictNames) params.append('hideDistrictNames', 'true');
          if (options.showStateBoundaries !== undefined) {
            params.append('showStateBoundaries', options.showStateBoundaries ? 'true' : 'false');
          }
          if (options.darkMode) params.append('darkMode', 'true');

          const url = `${API_BASE}/embed/svg?${params.toString()}`;

          updateStatus('Fetching data...');
          const fetchStart = Date.now();

          const controller = new AbortController();
          const timeout = setTimeout(() => {
            controller.abort();
          }, 60000);

          let response;
          try {
            response = await fetch(url, { signal: controller.signal });
          } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
              throw new Error('Request timed out after 60 seconds. The server may be overloaded or the data source may be unavailable.');
            }
            throw new Error(`Network error: ${fetchError.message}`);
          }
          clearTimeout(timeout);

          const fetchTime = Date.now() - fetchStart;

          if (fetchTime > 1000) {
            updateStatus('Processing map data...');
          }

          if (!response.ok) {
            let errorMessage = 'Failed to fetch map';
            try {
              const error = await response.json();
              errorMessage = error.error?.message || errorMessage;
            } catch (e) {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }

          updateStatus('Rendering map...');
          svgContent = await response.text();

        } else if (options.data) {
          const requestBody = {
            data: options.data,
            colorScale: options.colorScale || 'spectral',
            title: options.title || 'BharatViz',
            legendTitle: options.legendTitle || 'Values',
            format: 'svg'
          };

          if (options.mapType) requestBody.mapType = options.mapType;
          if (options.state) requestBody.state = options.state;

          requestBody.boundary = options.boundary || options.districtBoundary || 'LGD';
          requestBody.invertColors = options.invertColors || false;
          requestBody.hideValues = options.hideValues || false;
          requestBody.hideStateNames = options.hideStateNames || false;
          requestBody.hideDistrictNames = options.hideDistrictNames || false;
          requestBody.showStateBoundaries = options.showStateBoundaries !== undefined ? options.showStateBoundaries : true;
          requestBody.darkMode = options.darkMode || false;

          const generateUrl = `${API_BASE}/embed/generate`;

          updateStatus('Generating map...');
          const controller = new AbortController();
          const timeout = setTimeout(() => {
            controller.abort();
          }, 60000);

          let response;
          try {
            response = await fetch(generateUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
              signal: controller.signal
            });
          } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
              throw new Error('Request timed out after 60 seconds. The server may be overloaded.');
            }
            throw new Error(`Network error: ${fetchError.message}`);
          }
          clearTimeout(timeout);

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error?.message || 'Failed to generate map');
          }

          svgContent = result.svg;

        } else {
          throw new Error('Either dataUrl or data must be provided');
        }

        this._cache.set(cacheKey, svgContent);
        this._renderSVG(container, svgContent, options.title, options.darkMode);

      } catch (error) {
        console.error('BharatViz embed error:', error);
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc3545; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <strong>Error loading map:</strong><br>
          <div style="margin-top: 10px; font-size: 14px;">${error.message}</div>
          <div style="margin-top: 10px; font-size: 12px; color: #666;">
            Check browser console for details
          </div>
        </div>`;
      }
    },

    _renderSVG: function(container, svgContent, title, darkMode) {
      const wrapper = document.createElement('div');
      wrapper.style.textAlign = 'center';
      wrapper.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';
      wrapper.style.backgroundColor = darkMode ? '#000000' : 'transparent';
      wrapper.style.padding = darkMode ? '20px' : '0';

      if (title) {
        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.marginBottom = '20px';
        titleEl.style.color = darkMode ? '#ffffff' : '#333';
        wrapper.appendChild(titleEl);
      }

      const mapDiv = document.createElement('div');
      mapDiv.innerHTML = svgContent;
      mapDiv.style.maxWidth = '100%';

      const svgEl = mapDiv.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.height = 'auto';
      }

      wrapper.appendChild(mapDiv);

      const credits = document.createElement('div');
      credits.style.marginTop = '20px';
      credits.style.fontSize = '12px';
      credits.style.color = darkMode ? '#999' : '#666';
      credits.innerHTML = `Created with <a href="https://bharatviz.saketlab.org/" target="_blank" style="color: ${darkMode ? '#60a5fa' : '#0066cc'}; text-decoration: none;">BharatViz</a>`;
      wrapper.appendChild(credits);

      container.innerHTML = '';
      container.appendChild(wrapper);
    },

    getEmbedUrl: function(options) {
      const params = new URLSearchParams();

      if (options.dataUrl) params.append('dataUrl', options.dataUrl);
      if (options.mapType) params.append('mapType', options.mapType);
      if (options.state) params.append('state', options.state);
      if (options.boundary) params.append('boundary', options.boundary);
      else if (options.districtBoundary) params.append('boundary', options.districtBoundary);
      if (options.colorScale) params.append('colorScale', options.colorScale);
      if (options.title) params.append('title', options.title);
      if (options.legendTitle) params.append('legendTitle', options.legendTitle);
      if (options.invertColors) params.append('invertColors', 'true');
      if (options.hideValues) params.append('hideValues', 'true');
      if (options.hideStateNames) params.append('hideStateNames', 'true');
      if (options.hideDistrictNames) params.append('hideDistrictNames', 'true');
      if (options.showStateBoundaries !== undefined) {
        params.append('showStateBoundaries', options.showStateBoundaries ? 'true' : 'false');
      }
      if (options.darkMode) params.append('darkMode', 'true');

      return `${API_BASE}/embed?${params.toString()}`;
    },

    getEmbedCode: function(options) {
      const url = this.getEmbedUrl(options);
      const width = options.width || 800;
      const height = options.height || 600;

      return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" style="border: none; max-width: 100%;"></iframe>`;
    }
  };

  window.BharatViz = BharatViz;

})(window);
