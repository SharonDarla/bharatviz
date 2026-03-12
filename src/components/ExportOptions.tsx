import React, { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileText, FileSpreadsheet, MapIcon, ClipboardCopy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ExportOptionsProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportPDF: () => void;
  onCopyToClipboard?: () => void;
  disabled?: boolean;
  darkMode?: boolean;
  geojsonDownloadUrl?: string | null;
  geojsonDownloadName?: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  onExportPNG,
  onExportSVG,
  onExportPDF,
  onCopyToClipboard,
  disabled = false,
  darkMode = false,
  geojsonDownloadUrl,
  geojsonDownloadName,
}) => {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { clearTimeout(copyTimerRef.current); };
  }, []);

  const handleDownloadGeoJSON = () => {
    if (!geojsonDownloadUrl) return;
    const link = document.createElement('a');
    link.href = geojsonDownloadUrl;
    link.download = geojsonDownloadName || 'districts.geojson';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (!onCopyToClipboard) return;
    onCopyToClipboard();
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`p-4 ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : ''}`}>
      <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}>
        <Download className={`h-4 w-4 ${darkMode ? 'text-gray-400' : ''}`} />
        Export
      </h3>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={onExportPNG}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileImage className="h-4 w-4" />
          PNG
        </Button>
        <Button
          onClick={onExportSVG}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          SVG
        </Button>
        <Button
          onClick={onExportPDF}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          PDF
        </Button>
        {onCopyToClipboard && (
          <Button
            onClick={handleCopy}
            disabled={disabled}
            variant={copied ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        )}
        {geojsonDownloadUrl && (
          <Button
            onClick={handleDownloadGeoJSON}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MapIcon className="h-4 w-4" />
            GeoJSON
          </Button>
        )}
      </div>
    </Card>
  );
};
