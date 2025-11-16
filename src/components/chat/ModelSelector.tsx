/**
 * Model Selector Component
 * Allows users to choose which LLM model to use
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AVAILABLE_MODELS, checkWebGPUSupport, getBrowserCompatibility } from '@/lib/chat/models';
import type { ModelInfo } from '@/lib/chat/types';

interface ModelSelectorProps {
  onSelectModel: (modelId: string) => void;
  onCancel?: () => void;
}

export function ModelSelector({ onSelectModel, onCancel }: ModelSelectorProps) {
  const [webGPUSupported, setWebGPUSupported] = useState<boolean | null>(null);
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof getBrowserCompatibility> | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSupport() {
      setChecking(true);
      const supported = await checkWebGPUSupport();
      const browser = getBrowserCompatibility();

      setWebGPUSupported(supported);
      setBrowserInfo(browser);
      setChecking(false);
    }

    checkSupport();
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking browser compatibility...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose AI Model</h2>
        <p className="text-muted-foreground">
          Select an AI model to power the chat assistant. The model will be downloaded once and cached for future use.
        </p>
      </div>

      {/* Browser Compatibility Alert */}
      {browserInfo && (
        <Alert variant={browserInfo.compatible ? "default" : "destructive"}>
          <div className="flex items-start gap-2">
            {browserInfo.compatible ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 mt-0.5" />
            )}
            <AlertDescription>
              <strong>{browserInfo.browser}:</strong> {browserInfo.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {!webGPUSupported && (
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertDescription>
            <strong>WebGPU not supported</strong>
            <p className="mt-1 text-sm">
              Your browser or device doesn't support WebGPU, which is required for running local AI models.
              Please use a recent version of Chrome (113+) or Edge (113+) on a device with GPU support.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Model Cards */}
      <div className="space-y-4">
        {AVAILABLE_MODELS.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            onSelect={() => onSelectModel(model.id)}
            disabled={!webGPUSupported}
          />
        ))}
      </div>

      {/* Info Section */}
      <Alert>
        <AlertDescription>
          <p className="font-semibold mb-2">What happens when you select a model?</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>The model will be downloaded once (~1.5-2.3 GB depending on choice)</li>
            <li>Download is cached in your browser for future use</li>
            <li>Everything runs locally - no data sent to external servers</li>
            <li>You can change models later from the chat settings</li>
          </ul>
        </AlertDescription>
      </Alert>

      {onCancel && (
        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      )}
    </div>
  );
}

interface ModelCardProps {
  model: ModelInfo;
  onSelect: () => void;
  disabled?: boolean;
}

function ModelCard({ model, onSelect, disabled }: ModelCardProps) {
  return (
    <Card className={model.recommended ? 'border-primary border-2' : ''}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{model.name}</h3>
              {model.recommended && (
                <Badge variant="default">Recommended</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {model.description}
            </p>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Size</div>
                <div>{model.size}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Speed</div>
                <div>{model.speed.split(' ')[0]}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Quality</div>
                <div>{model.quality}</div>
              </div>
            </div>
          </div>

          <Button
            onClick={onSelect}
            disabled={disabled}
            variant={model.recommended ? "default" : "outline"}
          >
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
