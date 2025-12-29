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
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 1.5B",
    size: "~1.2 GB",
    speed: "Fast (20-30 tokens/sec)",
    quality: "Very Good",
    description: "Excellent efficiency and quality in a compact size. Great for data analysis."
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    name: "Phi-3.5 Mini",
    size: "~2.4 GB",
    speed: "Fast (18-28 tokens/sec)",
    quality: "Very Good",
    description: "Improved version of Phi-3 with better reasoning and instruction following."
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
    id: "SmolLM-1.7B-Instruct-q4f16_1-MLC",
    name: "SmolLM 1.7B",
    size: "~1.3 GB",
    speed: "Very Fast (22-32 tokens/sec)",
    quality: "Good",
    description: "Efficient small model with surprisingly good performance. Great for quick queries."
  },
  {
    id: "gemma-2b-it-q4f16_1-MLC",
    name: "Gemma 2B",
    size: "~1.5 GB",
    speed: "Fastest (20-35 tokens/sec)",
    quality: "Good",
    description: "Fast and reliable for basic queries. Good for mobile and older devices."
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    name: "TinyLlama 1.1B",
    size: "~0.8 GB",
    speed: "Fastest (25-40 tokens/sec)",
    quality: "Decent",
    description: "Ultra-lightweight model for basic queries. Best for very limited resources."
  }
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

/**
 * Detect if the device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;

  return isMobileUA || (hasTouch && isSmallScreen);
}

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find(m => m.id === modelId);
}

/**
 * Get recommended model (returns smaller model for mobile devices)
 */
export function getRecommendedModel(): ModelInfo {
  if (isMobileDevice()) {
    return AVAILABLE_MODELS.find(m => m.id === "Qwen2.5-1.5B-Instruct-q4f16_1-MLC") || AVAILABLE_MODELS[1];
  }
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

  if (userAgent.includes('firefox')) {
    return {
      compatible: false,
      browser: 'Firefox',
      message: 'Firefox does not yet support WebGPU. Please use Chrome or Edge.'
    };
  }

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
