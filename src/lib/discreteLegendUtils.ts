/**
 * Calculate discrete legend dimensions
 */
export function getDiscreteLegendDimensions(
  binCount: number,
  isMobile: boolean = false
): { width: number; height: number } {
  const rectWidth = isMobile ? 24 : 32;
  const rectHeight = isMobile ? 20 : 28;
  const textWidth = isMobile ? 80 : 120; // More space for range text
  const totalHeight = binCount * (rectHeight + 4) - 4;
  
  return {
    width: rectWidth + textWidth + 6, // 6px padding for text
    height: totalHeight
  };
}