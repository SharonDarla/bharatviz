import React, { useRef, useState } from 'react';
import { Upload, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Papa from 'papaparse';

// Demo data with Indian states and literacy rates
const demoData = [
  { state: 'kerala', value: 94.0 },
  { state: 'mizoram', value: 91.3 },
  { state: 'goa', value: 88.7 },
  { state: 'tripura', value: 87.2 },
  { state: 'himachal pradesh', value: 82.8 },
  { state: 'maharashtra', value: 82.3 },
  { state: 'sikkim', value: 81.4 },
  { state: 'tamil nadu', value: 80.1 },
  { state: 'nagaland', value: 79.6 },
  { state: 'punjab', value: 75.8 },
  { state: 'haryana', value: 75.6 },
  { state: 'west bengal', value: 76.3 },
  { state: 'gujarat', value: 78.0 },
  { state: 'manipur', value: 79.2 },
  { state: 'karnataka', value: 75.4 },
  { state: 'uttarakhand', value: 78.8 },
  { state: 'delhi', value: 86.2 },
  { state: 'assam', value: 72.2 },
  { state: 'meghalaya', value: 74.4 },
  { state: 'odisha', value: 72.9 },
  { state: 'jammu & kashmir', value: 67.2 },
  { state: 'ladakh', value: 71.0 },
  { state: 'uttar pradesh', value: 67.7 },
  { state: 'madhya pradesh', value: 69.3 },
  { state: 'chhattisgarh', value: 70.3 },
  { state: 'rajasthan', value: 66.1 },
  { state: 'jharkhand', value: 66.4 },
  { state: 'andhra pradesh', value: 67.4 },
  { state: 'telangana', value: 66.5 },
  { state: 'bihar', value: 61.8 },
  { state: 'arunachal pradesh', value: 65.4 }
];

interface FileUploadProps {
  onDataLoad: (data: Array<{ state: string; value: number }>, title?: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (result) => {
        try {
          const data = result.data as Array<Record<string, string>>;
          const headers = result.meta.fields || [];
          
          // Use first column as state, second column as value
          const stateColumn = headers[0];
          const valueColumn = headers[1];
          
          if (!stateColumn || !valueColumn) {
            alert('CSV must have at least two columns.');
            return;
          }
          
          const processedData = data
            .filter(row => row[stateColumn] && row[valueColumn] && !isNaN(Number(row[valueColumn])))
            .map(row => ({
              state: row[stateColumn].trim(),
              value: Number(row[valueColumn])
            }));
          
          if (processedData.length === 0) {
            alert('No valid data found. Please ensure your file has data in the first two columns.');
            return;
          }
          
          // Use second column header as title
          onDataLoad(processedData, valueColumn);
        } catch (error) {
          console.error('Error processing data:', error);
          alert('Error processing file data');
        }
      },
      error: (error) => {
        console.error('Error parsing file:', error);
        alert('Error parsing file');
      }
    });
  };

  const handleLoadDemo = async () => {
    try {
      const response = await fetch('/nfhs5_protein_consumption_eggs.csv');
      if (!response.ok) {
        throw new Error('Failed to load demo data');
      }
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        complete: (result) => {
          try {
            const data = result.data as Array<Record<string, string>>;
            const headers = result.meta.fields || [];
            
            // Use first column as state, second column as value
            const stateColumn = headers[0];
            const valueColumn = headers[1];
            
            if (!stateColumn || !valueColumn) {
              alert('CSV must have at least two columns.');
              return;
            }
            
            const processedData = data
              .filter(row => row[stateColumn] && row[valueColumn] && !isNaN(Number(row[valueColumn])))
              .map(row => ({
                state: row[stateColumn].trim(),
                value: Number(row[valueColumn])
              }));
            
            if (processedData.length === 0) {
              alert('No valid data found in demo file.');
              return;
            }
            
            // Use second column header as title
            onDataLoad(processedData, valueColumn);
          } catch (error) {
            console.error('Error processing demo data:', error);
            alert('Error processing demo data');
          }
        },
        error: (error) => {
          console.error('Error parsing demo file:', error);
          alert('Error parsing demo file');
        }
      });
    } catch (error) {
      console.error('Error loading demo data:', error);
      alert('Error loading demo data');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const downloadCSVTemplate = () => {
    const stateNames = [
      'A & N Islands',
      'Andhra Pradesh', 
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chandigarh',
      'Chhattisgarh',
      'Delhi',
      'DNHDD',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jammu & Kashmir',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Ladakh',
      'Lakshadweep',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Puducherry',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal'
    ];

    const csvContent = 'state,value\n' + stateNames.map(state => `${state},NA`).join('\n');
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'india-states-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to extract Google Sheet ID and GID from URL
  function extractSheetInfo(url: string) {
    // Typical format: https://docs.google.com/spreadsheets/d/{sheetId}/edit#gid={gid}
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)(?:\/.*?gid=(\d+))?/);
    if (!match) return null;
    return { sheetId: match[1], gid: match[2] || '0' };
  }

  const handleLoadGoogleSheet = async () => {
    setSheetError(null);
    setLoadingSheet(true);
    const info = extractSheetInfo(googleSheetUrl);
    if (!info) {
      setSheetError('Invalid Google Sheet link.');
      setLoadingSheet(false);
      return;
    }
    const csvUrl = `https://docs.google.com/spreadsheets/d/${info.sheetId}/gviz/tq?tqx=out:csv&gid=${info.gid}`;
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Failed to fetch Google Sheet.');
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: true,
        complete: (result) => {
          try {
            const data = result.data as Array<Record<string, string>>;
            const headers = result.meta.fields || [];
            
            // Use first column as state, second column as value
            const stateColumn = headers[0];
            const valueColumn = headers[1];
            
            if (!stateColumn || !valueColumn) {
              setSheetError('Sheet must have at least two columns.');
              setLoadingSheet(false);
              return;
            }
            
            const processedData = data
              .filter(row => row[stateColumn] && row[valueColumn] && !isNaN(Number(row[valueColumn])))
              .map(row => ({
                state: row[stateColumn].trim(),
                value: Number(row[valueColumn])
              }));
            if (processedData.length === 0) {
              setSheetError('No valid data found. Ensure your sheet has data in the first two columns.');
              setLoadingSheet(false);
              return;
            }
            // Use second column header as title
            onDataLoad(processedData, valueColumn);
            setLoadingSheet(false);
          } catch (error) {
            setSheetError('Error processing sheet data.');
            setLoadingSheet(false);
          }
        },
        error: () => {
          setSheetError('Error parsing CSV from Google Sheet.');
          setLoadingSheet(false);
        }
      });
    } catch (err) {
      setSheetError('Failed to fetch or parse Google Sheet.');
      setLoadingSheet(false);
    }
  };

  return (
    <Card className="p-6 border-dashed border-2 hover:border-primary/50 transition-colors">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Upload Your Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a CSV or TSV file with 'state' and 'value' columns
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
        <div className="flex flex-col items-center mt-3 gap-2">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full max-w-xs"
            placeholder="Paste link to Google Sheet"
            value={googleSheetUrl}
            onChange={e => setGoogleSheetUrl(e.target.value)}
            disabled={loadingSheet}
          />
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleLoadGoogleSheet}
              disabled={loadingSheet || !googleSheetUrl}
            >
              {loadingSheet ? 'Loading...' : 'Load from Google Sheet'}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Need a template? Use this <a href="https://docs.google.com/spreadsheets/d/1BtZOnh15b4ZG_I0pFLdMIK7nNqplikn5_ui59SFbxaI/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="underline text-blue-500">Google Sheet template</a></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {sheetError && <div className="text-xs text-red-500 mt-1">{sheetError}</div>}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </Card>
  );
};
