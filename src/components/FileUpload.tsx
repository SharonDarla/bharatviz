import React, { useRef, useState } from 'react';
import { Upload, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import pako from 'pako';

interface FileUploadProps {
  onDataLoad: (data: Array<{ state: string; value: number }> | Array<{ state: string; district: string; value: number }>, title?: string) => void;
  mode?: 'states' | 'districts';
  templateCsvPath?: string;
  demoDataPath?: string;
  googleSheetLink?: string;
  geojsonPath?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoad, mode = 'states', templateCsvPath, demoDataPath, googleSheetLink, geojsonPath }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Helper function to decompress gzipped files
  const decompressGzip = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const compressed = new Uint8Array(e.target?.result as ArrayBuffer);
          const decompressed = pako.inflate(compressed, { to: 'string' });
          resolve(decompressed);
        } catch (error) {
          reject(new Error('Failed to decompress gzipped file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper function to process uploaded CSV data
  const processUploadedData = async (result: Papa.ParseResult<Record<string, string>>) => {
    try {
      const data = result.data as Array<Record<string, string>>;
      const headers = result.meta.fields || [];

      // Validate column count based on mode
      const requiredColumns = mode === 'districts' ? 3 : 2;
      if (headers.length < requiredColumns) {
        alert(`CSV must have at least ${requiredColumns} columns${mode === 'districts' ? ' (state, district, value)' : ' (state, value)'}`);
        return;
      }

      // For districts: state, district, value columns (value is always last column)
      // For states: state, value columns (value is always last column)
      const stateColumn = headers[0];
      const locationColumn = mode === 'districts' ? headers[1] : headers[0];
      const valueColumn = headers[headers.length - 1]; // Always use the last column

      const processedData = data
        .filter(row => {
          const hasLocationData = mode === 'districts'
            ? row[stateColumn] && row[locationColumn]
            : row[locationColumn];
          return hasLocationData;
        })
        .map(row => {
          const value = row[valueColumn];
          const trimmedValue = value ? value.trim() : '';
          const numericValue = trimmedValue === '' || trimmedValue.toLowerCase() === 'na' || trimmedValue.toLowerCase() === 'n/a'
            ? NaN
            : Number(trimmedValue);

          return mode === 'districts'
            ? {
                state: row[stateColumn].trim(),
                district: row[locationColumn].trim(),
                value: numericValue
              }
            : {
                state: row[locationColumn].trim(),
                value: numericValue
              };
        })
        .filter(row => !isNaN(row.value) && isFinite(row.value)) as Array<{ state: string; value: number }> | Array<{ state: string; district: string; value: number }>;

      if (processedData.length === 0) {
        const columnDesc = mode === 'districts' ? 'state, district, and value columns (value is last column)' : 'state and value columns (value is last column)';
        alert(`No valid data found. Please ensure your file has data in the ${columnDesc}.`);
        return;
      }

      // Filter data based on GeoJSON before passing to parent
      const filteredData = await filterDataByGeoJSON(processedData);

      if (filteredData.length === 0) {
        alert(`No data matched the current map. Please check that your ${mode === 'districts' ? 'state and district' : 'state'} names match the map.`);
        return;
      }

      // Use second column header as title
      onDataLoad(filteredData, valueColumn);
    } catch (error) {
      alert('Error processing file data');
    }
  };

  // Helper function to filter data based on GeoJSON
  const filterDataByGeoJSON = async (
    data: Array<{ state: string; value: number } | { state: string; district: string; value: number }>
  ): Promise<Array<{ state: string; value: number } | { state: string; district: string; value: number }>> => {
    if (!geojsonPath) return data; // If no geojsonPath provided, return all data

    try {
      const response = await fetch(geojsonPath);
      if (!response.ok) return data;

      const geojson = await response.json();

      if (mode === 'districts') {
        // For districts, filter based on both state_name and district_name
        const districtData = data as Array<{ state: string; district: string; value: number }>;
        return districtData.filter(row => {
          return geojson.features.some((feature: { properties: { district_name?: string; state_name?: string } }) =>
            row.district.toLowerCase().trim() === feature.properties.district_name?.toLowerCase().trim() &&
            row.state.toLowerCase().trim() === feature.properties.state_name?.toLowerCase().trim()
          );
        });
      } else {
        // For states, filter based on state_name
        const stateData = data as Array<{ state: string; value: number }>;
        return stateData.filter(row => {
          return geojson.features.some((feature: { properties: { state_name?: string; NAME_1?: string; name?: string; ST_NM?: string } }) => {
            const featureStateName = (feature.properties.state_name || feature.properties.NAME_1 || feature.properties.name || feature.properties.ST_NM)?.toLowerCase().trim();
            return row.state.toLowerCase().trim() === featureStateName;
          });
        });
      }
    } catch (error) {
      console.error('Error filtering data by GeoJSON:', error);
      return data; // Return unfiltered data on error
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is gzipped
    const isGzipped = file.name.endsWith('.gz');

    if (isGzipped) {
      try {
        const decompressedText = await decompressGzip(file);
        Papa.parse(decompressedText, {
          header: true,
          complete: async (result) => {
            await processUploadedData(result);
          },
          error: (error) => {
            alert('Error parsing decompressed file');
          }
        });
      } catch (error) {
        alert('Error decompressing gzipped file. Please ensure the file is a valid .gz file.');
      }
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: async (result) => {
        await processUploadedData(result);
      },
      error: (error) => {
        alert('Error parsing file');
      }
    });
  };

  const handleLoadDemo = async () => {
    try {
      const demoFile = demoDataPath || (mode === 'districts' ? '/districts_demo.csv' : '/nfhs5_protein_consumption_eggs.csv');
      const response = await fetch(demoFile);
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        complete: async (result) => {
          try {
            const data = result.data as Array<Record<string, string>>;
            const headers = result.meta.fields || [];
            
            // Validate column count based on mode
            const requiredColumns = mode === 'districts' ? 3 : 2;
            if (headers.length < requiredColumns) {
              alert(`CSV must have at least ${requiredColumns} columns${mode === 'districts' ? ' (state, district, value)' : ' (state, value)'}`);
              return;
            }
            
            // For districts: state, district, value columns (value is always last column)
            // For states: state, value columns (value is always last column)
            const stateColumn = headers[0];
            const locationColumn = mode === 'districts' ? headers[1] : headers[0];
            const valueColumn = headers[headers.length - 1]; // Always use the last column
            
            const processedData = data
              .filter(row => {
                const hasLocationData = mode === 'districts' 
                  ? row[stateColumn] && row[locationColumn] 
                  : row[locationColumn];
                return hasLocationData;
              })
              .map(row => {
                const value = row[valueColumn];
                const trimmedValue = value ? value.trim() : '';
                const numericValue = trimmedValue === '' || trimmedValue.toLowerCase() === 'na' || trimmedValue.toLowerCase() === 'n/a' 
                  ? NaN 
                  : Number(trimmedValue);
                
                return mode === 'districts'
                  ? {
                      state: row[stateColumn].trim(),
                      district: row[locationColumn].trim(),
                      value: numericValue
                    }
                  : {
                      state: row[locationColumn].trim(),
                      value: numericValue
                    };
              })
              .filter(row => !isNaN(row.value) && isFinite(row.value)) as Array<{ state: string; value: number }> | Array<{ state: string; district: string; value: number }>;
            
            if (processedData.length === 0) {
              const columnDesc = mode === 'districts' ? 'state, district, and value columns (value is last column)' : 'state and value columns (value is last column)';
              alert(`No valid data found in demo file. Please ensure it has data in the ${columnDesc}.`);
              return;
            }

            // Filter data based on GeoJSON before passing to parent
            const filteredData = await filterDataByGeoJSON(processedData);

            if (filteredData.length === 0) {
              alert(`No data matched the current map. Please check that your ${mode === 'districts' ? 'state and district' : 'state'} names match the map.`);
              return;
            }

            // Use second column header as title
            onDataLoad(filteredData, valueColumn);
          } catch (error) {
            alert('Error processing demo data');
          }
        },
        error: (error) => {
          alert('Error parsing demo file');
        }
      });
    } catch (error) {
      alert('Error loading demo data');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const downloadCSVTemplate = async () => {
    try {
      const templateFile = templateCsvPath || (mode === 'districts' ? '/bharatviz-district-template.csv' : '/bharatviz-state-template.csv');
      const response = await fetch(templateFile);
      if (!response.ok) {
        throw new Error('Failed to download template');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mode === 'districts' ? 'bharatviz-district-template.csv' : 'bharatviz-state-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading template file');
    }
  };

  // Helper to detect URL type
  function detectUrlType(url: string): 'google-sheets' | 'csv' | 'tsv' | 'csv-gz' | 'tsv-gz' | 'unknown' {
    if (url.includes('docs.google.com/spreadsheets')) {
      return 'google-sheets';
    }
    if (url.endsWith('.csv.gz')) {
      return 'csv-gz';
    }
    if (url.endsWith('.tsv.gz')) {
      return 'tsv-gz';
    }
    if (url.endsWith('.csv')) {
      return 'csv';
    }
    if (url.endsWith('.tsv')) {
      return 'tsv';
    }
    return 'unknown';
  }

  // Helper to extract Google Sheet ID and GID from URL
  function extractSheetInfo(url: string) {
    // Typical format: https://docs.google.com/spreadsheets/d/{sheetId}/edit#gid={gid}
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)(?:\/.*?gid=(\d+))?/);
    if (!match) return null;
    return { sheetId: match[1], gid: match[2] || '0' };
  }

  // Helper to create timeout signal (compatible with older browsers)
  const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
  };

  // Helper to try multiple CORS proxy services as fallbacks
  const tryProxyServices = async (url: string): Promise<Response> => {
    const proxyServices = [
      { name: 'allorigins.win', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
      { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(url)}` },
      { name: 'codetabs.com', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` },
    ];

    const errors: string[] = [];
    
    for (const proxy of proxyServices) {
      try {
        const response = await fetch(proxy.url, {
          // Add timeout to prevent hanging
          signal: createTimeoutSignal(30000), // 30 second timeout
        });
        if (response.ok) {
          return response;
        }
        errors.push(`${proxy.name}: ${response.status} ${response.statusText}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${proxy.name}: ${errorMsg}`);
        // Continue to next proxy service
        continue;
      }
    }
    
    throw new Error(`All proxy services failed. Errors: ${errors.join('; ')}`);
  };

  // Helper to fetch with CORS proxy fallback
  const fetchWithCorsFallback = async (url: string, options: RequestInit = {}): Promise<Response> => {
    try {
      // Try direct fetch first
      const response = await fetch(url, {
        ...options,
        signal: createTimeoutSignal(10000), // 10 second timeout for direct fetch
      });
      // If response is ok, return it
      if (response.ok) {
        return response;
      }
      // If response exists but not ok, it's not a CORS issue - throw the error
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    } catch (error) {
      // CORS errors typically result in TypeError with "Failed to fetch" or network errors
      // Also catch timeout errors
      const isCorsOrNetworkError = 
        error instanceof TypeError || 
        (error instanceof Error && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('timeout') ||
          error.name === 'AbortError'
        ));
      
      if (isCorsOrNetworkError) {
        // Try proxy services as fallback
        try {
          return await tryProxyServices(url);
        } catch (proxyError) {
          throw new Error(`Failed to fetch URL. Direct fetch failed (CORS/network error) and all proxy services failed: ${proxyError instanceof Error ? proxyError.message : 'Unknown error'}`);
        }
      }
      // Re-throw other errors
      throw error;
    }
  };

  // Helper to fetch and decompress gzipped URL with CORS fallback
  const fetchAndDecompressGzUrl = async (url: string): Promise<string> => {
    let response: Response;
    
    try {
      // Try direct fetch first
      response = await fetch(url, {
        signal: createTimeoutSignal(10000), // 10 second timeout
      });
      if (response.ok) {
        // Success, use direct response
      } else {
        // HTTP error (4xx, 5xx) - not a CORS issue, throw error
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // CORS or network error - try proxy services
      const isCorsOrNetworkError = 
        error instanceof TypeError || 
        (error instanceof Error && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('timeout') ||
          error.name === 'AbortError'
        ));
      
      if (isCorsOrNetworkError) {
        // Try proxy services as fallback
        try {
          response = await tryProxyServices(url);
        } catch (proxyError) {
          throw new Error(`Failed to fetch gzipped URL. Direct fetch failed (CORS/network error) and all proxy services failed: ${proxyError instanceof Error ? proxyError.message : 'Unknown error'}`);
        }
      } else {
        // Re-throw other errors
        throw error;
      }
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const compressed = new Uint8Array(arrayBuffer);
    const decompressed = pako.inflate(compressed, { to: 'string' });
    return decompressed;
  };

  const handleLoadGoogleSheet = async () => {
    setSheetError(null);
    setLoadingSheet(true);

    const urlType = detectUrlType(googleSheetUrl);
    let csvText: string;

    try {
      if (urlType === 'google-sheets') {
        // Handle Google Sheets URL
        const info = extractSheetInfo(googleSheetUrl);
        if (!info) {
          setSheetError('Invalid Google Sheet link.');
          setLoadingSheet(false);
          return;
        }
        const csvUrl = `https://docs.google.com/spreadsheets/d/${info.sheetId}/gviz/tq?tqx=out:csv&gid=${info.gid}`;
        const response = await fetchWithCorsFallback(csvUrl);
        if (!response.ok) throw new Error('Failed to fetch Google Sheet.');
        csvText = await response.text();
      } else if (urlType === 'csv-gz' || urlType === 'tsv-gz') {
        // Handle gzipped CSV/TSV URL
        csvText = await fetchAndDecompressGzUrl(googleSheetUrl);
      } else if (urlType === 'csv' || urlType === 'tsv') {
        // Handle direct CSV/TSV URL with CORS fallback
        const response = await fetchWithCorsFallback(googleSheetUrl);
        if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
        csvText = await response.text();
      } else {
        setSheetError('Invalid URL. Please provide a Google Sheets link or a direct link to a CSV, TSV, or gzipped file.');
        setLoadingSheet(false);
        return;
      }
      Papa.parse(csvText, {
        header: true,
        complete: async (result) => {
          try {
            await processUploadedData(result);
            setLoadingSheet(false);
          } catch (error) {
            setSheetError('Error processing data from URL.');
            setLoadingSheet(false);
          }
        },
        error: () => {
          setSheetError('Error parsing CSV/TSV data from URL.');
          setLoadingSheet(false);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch or parse data from URL.';
      setSheetError(errorMessage);
      setLoadingSheet(false);
    }
  };

  return (
    <Card className="p-6 border-dashed border-2 hover:border-primary/50 transition-colors">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Upload Your Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {mode === 'districts'
            ? 'Upload a CSV, TSV, or gzipped (.gz) file with state, district, and value columns. The last column name becomes the color map title. Your data is never stored.'
            : 'Upload a CSV, TSV, or gzipped (.gz) file with state and value columns. The last column name becomes the color map title. Your data is never stored.'
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleUploadClick}>
            Choose File
          </Button>
          <Button variant="outline" onClick={handleLoadDemo} className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Load Demo
          </Button>
        </div>
        <div className="flex justify-center mt-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={downloadCSVTemplate}>
            Download CSV Template
          </Button>
        </div>
        
        <div className="mt-4 p-4 border-t border-gray-200">
          <div className="text-center mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Or load from URL</h4>
            <p className="text-xs text-gray-500">
              Paste a Google Sheets link (see{' '}
              <a
                href={googleSheetLink || (mode === 'districts'
                  ? "https://docs.google.com/spreadsheets/d/1mxE70Qrf0ij3z--4alVbmKEfAIftH3N1wqMWYPNQk7Q/edit?usp=sharing"
                  : "https://docs.google.com/spreadsheets/d/1BtZOnh15b4ZG_I0pFLdMIK7nNqplikn5_ui59SFbxaI/edit?usp=sharing")}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-500 hover:text-blue-700"
              >
                template
              </a>
              ) or a direct URL to CSV, TSV, or gzipped files (.csv, .tsv, .csv.gz, .tsv.gz)
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://docs.google.com/... or https://example.com/data.csv"
                value={googleSheetUrl}
                onChange={e => setGoogleSheetUrl(e.target.value)}
                disabled={loadingSheet}
              />
              {googleSheetUrl && (
                <button
                  onClick={() => setGoogleSheetUrl('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loadingSheet}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleLoadGoogleSheet}
                disabled={loadingSheet || !googleSheetUrl}
              >
                {loadingSheet ? 'Loading...' : 'Load from URL'}
              </Button>
            </div>
            {sheetError && <div className="text-xs text-red-500 text-center">{sheetError}</div>}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.gz"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </Card>
  );
};
