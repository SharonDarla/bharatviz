/**
 * Available WebLLM models for BharatViz
 */

import type { ModelInfo } from './types';

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    size: "~2.0 GB",
    speed: "Medium (15-25 tokens/sec)",
    quality: "Best",
    recommended: true,
    description: "Best overall quality for data analysis and reasoning. Recommended for most users."
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    name: "Phi-3 Mini",
    size: "~2.3 GB",
    speed: "Fast (18-30 tokens/sec)",
    quality: "Very Good",
    description: "Excellent for structured data analysis. Good balance of speed and quality."
  },
  {
    id: "gemma-2b-it-q4f16_1-MLC",
    name: "Gemma 2B",
    size: "~1.5 GB",
    speed: "Fastest (20-35 tokens/sec)",
    quality: "Good",
    description: "Fastest option with smaller download. Good for basic queries and older devices."
  }
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}

/**
 * Get recommended model
 */
export function getRecommendedModel(): ModelInfo {
  return AVAILABLE_MODELS.find(m => m.recommended) || AVAILABLE_MODELS[0];
}

/**
 * Check if WebGPU is supported
 */
export async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === 'undefined') {
    return false;
  }

  if (!('gpu' in navigator)) {
    return false;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch (error) {
    console.error('WebGPU check failed:', error);
    return false;
  }
}

/**
 * Get browser compatibility info
 */
export function getBrowserCompatibility(): {
  compatible: boolean;
  browser: string;
  message: string;
} {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for Chrome/Edge
  if (userAgent.includes('chrome') || userAgent.includes('edg')) {
    const version = parseInt(userAgent.match(/chrom(?:e|ium)\/([0-9]+)/)?.[1] || '0');
    if (version >= 113) {
      return {
        compatible: true,
        browser: 'Chrome/Edge',
        message: 'Your browser supports WebLLM with WebGPU.'
      };
    }
    return {
      compatible: false,
      browser: 'Chrome/Edge',
      message: 'Please update to Chrome 113+ or Edge 113+ for WebLLM support.'
    };
  }

  // Check for Firefox
  if (userAgent.includes('firefox')) {
    return {
      compatible: false,
      browser: 'Firefox',
      message: 'Firefox does not yet support WebGPU. Please use Chrome or Edge.'
    };
  }

  // Check for Safari
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return {
      compatible: false,
      browser: 'Safari',
      message: 'Safari does not yet fully support WebGPU. Please use Chrome or Edge.'
    };
  }

  return {
    compatible: false,
    browser: 'Unknown',
    message: 'For best experience, use Chrome 113+ or Edge 113+.'
  };
}
