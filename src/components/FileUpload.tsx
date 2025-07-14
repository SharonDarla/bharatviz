import React, { useRef } from 'react';
import { Upload, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  { state: 'jammu and kashmir', value: 67.2 },
  { state: 'ladakh', value: 71.0 },
  { state: 'uttar pradesh', value: 67.7 },
  { state: 'madhya pradesh', value: 69.3 },
  { state: 'chhattisgarh', value: 70.3 },
  { state: 'rajasthan', value: 66.1 },
  { state: 'jharkhand', value: 66.4 },
  { state: 'andhra pradesh', value: 67.4 },
  { state: 'bihar', value: 61.8 },
  { state: 'arunachal pradesh', value: 65.4 }
];

interface FileUploadProps {
  onDataLoad: (data: Array<{ state: string; value: number }>) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (result) => {
        try {
          const data = result.data as Array<Record<string, string>>;
          const processedData = data
            .filter(row => row.state && row.value && !isNaN(Number(row.value)))
            .map(row => ({
              state: row.state.trim(),
              value: Number(row.value)
            }));
          
          if (processedData.length === 0) {
            alert('No valid data found. Please ensure your file has "state" and "value" columns.');
            return;
          }
          
          onDataLoad(processedData);
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

  const handleLoadDemo = () => {
    onDataLoad(demoData);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
        <p className="text-xs text-muted-foreground mt-3">
          Demo shows literacy rates across Indian states
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