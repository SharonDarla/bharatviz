import React from 'react';
import { Download, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ExportOptionsProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  disabled?: boolean;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ 
  onExportPNG, 
  onExportSVG, 
  disabled = false 
}) => {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Download className="h-4 w-4" />
        Export Map
      </h3>
      <div className="flex flex-col gap-2">
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
      </div>
    </Card>
  );
};