import React, { useRef, useState } from 'react';
import { Upload, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';
import pako from 'pako';
import { processStateData, processDistrictData } from '@/lib/dataProcessor';
import { fetchWithCorsFallback, fetchAndDecompressGz } from '@/lib/corsProxy';

interface NAInfo {
  states?: string[];
  districts?: Array<{ state: string; district: string }>;
  count: number;
}

interface FileUploadProps {
  onDataLoad: (
    data: Array<{ state: string; value: number }> | Array<{ state: string; district: string; value: number }>,
    title?: string,
    naInfo?: NAInfo
  ) => void;
  mode?: 'states' | 'districts';
  templateCsvPath?: string;
  demoDataPath?: string;
  googleSheetLink?: string;
  geojsonPath?: string;
  selectedState?: string; // Optional: for state-district tab, filter NAs by this state
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoad, mode = 'states', templateCsvPath, demoDataPath, googleSheetLink, geojsonPath, selectedState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [fuzzyThreshold, setFuzzyThreshold] = useState<number>(0.4);

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


  const processUploadedData = async (result: Papa.ParseResult<Record<string, string>>) => {
    try {
      const data = result.data as Array<Record<string, string>>;
      const headers = result.meta.fields || [];

      const requiredColumns = mode === 'districts' ? 3 : 2;
      if (headers.length < requiredColumns) {
        alert(`CSV must have at least ${requiredColumns} columns${mode === 'districts' ? ' (state, district, value)' : ' (state, value)'}`);
        return;
      }

      const stateColumn = headers[0];
      const locationColumn = mode === 'districts' ? headers[1] : headers[0];
      const valueColumn = headers[headers.length - 1];

      const parseValue = (val: string): number | string => {
        const trimmed = val ? val.trim() : '';
        if (trimmed === '' || trimmed.toLowerCase() === 'na' || trimmed.toLowerCase() === 'n/a') {
          return NaN;
        }
        const num = Number(trimmed);
        return isNaN(num) ? trimmed : num;
      };

      const processedData = data
        .filter(row => {
          return mode === 'districts'
            ? row[stateColumn] && row[locationColumn]
            : row[locationColumn];
        })
        .map(row => {
          return mode === 'districts'
            ? { state: row[stateColumn].trim(), district: row[locationColumn].trim(), value: parseValue(row[valueColumn]) }
            : { state: row[locationColumn].trim(), value: parseValue(row[valueColumn]) };
        });

      if (processedData.length === 0) {
        alert(`No valid data found. Please ensure your file has data in the correct columns.`);
        return;
      }

      if (mode === 'districts') {
        const result = await processDistrictData(
          processedData as Array<{ state: string; district: string; value: number | string }>,
          geojsonPath || '',
          fuzzyThreshold,
          selectedState
        );

        if (result.matched.length === 0) {
          alert(`No data matched the current map. Please check your state and district names.`);
          return;
        }

        onDataLoad(result.matched, valueColumn, result.naInfo);
      } else {
        const result = await processStateData(
          processedData as Array<{ state: string; value: number | string }>,
          geojsonPath || '',
          fuzzyThreshold
        );

        if (result.matched.length === 0) {
          alert(`No data matched the current map. Please check your state names.`);
          return;
        }

        onDataLoad(result.matched, valueColumn, result.naInfo);
      }
    } catch (error) {
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          await processUploadedData(result);
        },
        error: () => {
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

  function detectUrlType(url: string): 'google-sheets' | 'csv' | 'tsv' | 'csv-gz' | 'tsv-gz' | 'unknown' {
    if (url.includes('docs.google.com/spreadsheets')) return 'google-sheets';
    if (url.endsWith('.csv.gz')) return 'csv-gz';
    if (url.endsWith('.tsv.gz')) return 'tsv-gz';
    if (url.endsWith('.csv')) return 'csv';
    if (url.endsWith('.tsv')) return 'tsv';
    return 'unknown';
  }

  function extractSheetInfo(url: string) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)(?:\/.*?gid=(\d+))?/);
    if (!match) return null;
    return { sheetId: match[1], gid: match[2] || '0' };
  }

  const handleLoadGoogleSheet = async () => {
    setSheetError(null);
    setLoadingSheet(true);

    const urlType = detectUrlType(googleSheetUrl);
    let csvText: string;

    try {
      if (urlType === 'google-sheets') {
        const info = extractSheetInfo(googleSheetUrl);
        if (!info) {
          setSheetError('Invalid Google Sheet link.');
          setLoadingSheet(false);
          return;
        }
        const csvUrl = `https://docs.google.com/spreadsheets/d/${info.sheetId}/gviz/tq?tqx=out:csv&gid=${info.gid}`;
        const response = await fetchWithCorsFallback(csvUrl);
        csvText = await response.text();
      } else if (urlType === 'csv-gz' || urlType === 'tsv-gz') {
        csvText = await fetchAndDecompressGz(googleSheetUrl);
      } else if (urlType === 'csv' || urlType === 'tsv') {
        const response = await fetchWithCorsFallback(googleSheetUrl);
        csvText = await response.text();
      } else {
        setSheetError('Invalid URL. Please provide a Google Sheets link or a direct link to a CSV, TSV, or gzipped file.');
        setLoadingSheet(false);
        return;
      }

      Papa.parse(csvText, {
        header: true,
        complete: async (result) => {
          await processUploadedData(result);
          setLoadingSheet(false);
        },
        error: () => {
          setSheetError('Error parsing CSV/TSV data from URL.');
          setLoadingSheet(false);
        }
      });
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : 'Failed to fetch or parse data from URL.');
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
