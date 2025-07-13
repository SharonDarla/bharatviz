import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Papa from 'papaparse';

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
        <Button onClick={handleUploadClick}>
          Choose File
        </Button>
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