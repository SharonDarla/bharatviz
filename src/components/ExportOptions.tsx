import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, FileImage, FileText, FileSpreadsheet, MapIcon, ClipboardCopy, Check, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type CitationInfo, getCitation } from '@/lib/citations';

function useCopyFeedback(duration = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const trigger = useCallback(() => {
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), duration);
  }, [duration]);

  return { copied, trigger };
}

interface ExportOptionsProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportPDF: () => void;
  onCopyToClipboard?: () => void;
  disabled?: boolean;
  darkMode?: boolean;
  geojsonDownloadUrl?: string | null;
  geojsonDownloadName?: string;
  citationInfo?: CitationInfo;
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
  citationInfo,
}) => {
  const copyFeedback = useCopyFeedback();
  const citeFeedback = useCopyFeedback();

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
    copyFeedback.trigger();
  };

  const handleCopyCitation = () => {
    if (!citationInfo) return;
    navigator.clipboard.writeText(getCitation(citationInfo));
    citeFeedback.trigger();
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
            variant={copyFeedback.copied ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            {copyFeedback.copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copyFeedback.copied ? 'Copied!' : 'Copy'}
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
        {citationInfo && (
          <Button
            onClick={handleCopyCitation}
            variant={citeFeedback.copied ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            {citeFeedback.copied ? <Check className="h-4 w-4" /> : <Quote className="h-4 w-4" />}
            {citeFeedback.copied ? 'Copied!' : 'Cite'}
          </Button>
        )}
      </div>
    </Card>
  );
};
