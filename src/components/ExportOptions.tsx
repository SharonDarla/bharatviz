import React from 'react';
import { Download, FileImage, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ExportOptionsProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
  darkMode?: boolean;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  onExportPNG,
  onExportSVG,
  onExportPDF,
  disabled = false,
  darkMode = false
}) => {
  return (
    <Card className={`p-4 ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
      <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
        <Download className={`h-4 w-4 ${darkMode ? 'text-gray-400' : ''}`} />
        Export
      </h3>
      <div className="flex gap-2">
        <Button 
          onClick={onExportPNG} 
          disabled={disabled}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileImage className="h-4 w-4" />
          Export as PNG
        </Button>
        <Button 
          onClick={onExportSVG} 
          disabled={disabled}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Export as SVG
        </Button>
        <Button 
          onClick={onExportPDF} 
          disabled={disabled}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export as PDF
        </Button>
      </div>
    </Card>
  );
};