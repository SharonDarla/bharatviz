/**
 * District Label Rotation Utilities
 * Calculates optimal rotation angles for district labels to fit within boundaries
 */

interface Bounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

interface DistrictRotationInfo {
  angle: number;
  confidence: number; // 0-1, how much of the text fits inside
  aspectRatio: number;
  principalAxisAngle: number;
}

/**
 * Calculate aspect ratio from bounds
 */
export function calculateAspectRatio(bounds: Bounds): number {
  const width = bounds.maxLng - bounds.minLng;
  const height = bounds.maxLat - bounds.minLat;
  return height === 0 ? 1 : width / height;
}

/**
 * Calculate principal axis angle using coordinate moments
 * Uses the covariance matrix approach to find the orientation of elongation
 */
export function calculatePrincipalAxisAngle(coordinates: number[][]): number {
  if (coordinates.length < 2) return 0;

  // Calculate centroid
  let cx = 0, cy = 0;
  coordinates.forEach(([x, y]) => {
    cx += x;
    cy += y;
  });
  cx /= coordinates.length;
  cy /= coordinates.length;

  // Calculate covariance matrix elements
  let cov_xx = 0, cov_yy = 0, cov_xy = 0;
  coordinates.forEach(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    cov_xx += dx * dx;
    cov_yy += dy * dy;
    cov_xy += dx * dy;
  });

  // Normalize
  const n = coordinates.length;
  cov_xx /= n;
  cov_yy /= n;
  cov_xy /= n;

  // Calculate eigenvalues and eigenvector angle
  // For 2D covariance: principal axis angle = 0.5 * atan2(2*cov_xy, cov_xx - cov_yy)
  let angle = 0.5 * Math.atan2(2 * cov_xy, cov_xx - cov_yy);

  // Convert to degrees and normalize to 0-180
  angle = (angle * 180) / Math.PI;
  if (angle < 0) angle += 180;

  return angle;
}

/**
 * Generate candidate rotation angles based on aspect ratio and principal axis
 */
export function generateCandidateAngles(
  aspectRatio: number,
  principalAxisAngle: number
): number[] {
  const candidates = new Set<number>();

  // Always include horizontal
  candidates.add(0);

  // Based on aspect ratio, add candidates
  if (aspectRatio > 1.5) {
    // Wider than tall - try horizontal and principal axis
    candidates.add(principalAxisAngle);
    candidates.add((principalAxisAngle + 90) % 180);
  } else if (aspectRatio < 0.67) {
    // Taller than wide - try vertical and principal axis
    candidates.add(90);
    candidates.add(principalAxisAngle);
  } else {
    // Roughly square - add some intermediate angles
    candidates.add(45);
    candidates.add(principalAxisAngle);
  }

  // Filter angles for readability (avoid hard-to-read angles)
  const readableAngles = Array.from(candidates).filter((angle) => {
    // Angles close to 45-135 or 225-315 are hard to read
    // Normalize to 0-90 for easier checking
    const normalized = angle % 180;
    return !(normalized > 30 && normalized < 150);
  });

  return readableAngles.length > 0 ? readableAngles : [0];
}

/**
 * Rotate a point around a center
 */
function rotatePoint(
  point: [number, number],
  center: [number, number],
  angleRadians: number
): [number, number] {
  const [x, y] = point;
  const [cx, cy] = center;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  const dx = x - cx;
  const dy = y - cy;

  return [
    cx + dx * cos - dy * sin,
    cy + dx * sin + dy * cos
  ];
}

/**
 * Get the four corners of a text bounding box
 */
function getTextCorners(
  cx: number,
  cy: number,
  width: number,
  height: number
): [number, number][] {
  const hw = width / 2;
  const hh = height / 2;

  return [
    [cx - hw, cy - hh],
    [cx + hw, cy - hh],
    [cx + hw, cy + hh],
    [cx - hw, cy + hh]
  ];
}

/**
 * Point in polygon test (ray casting algorithm)
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: number[][]
): boolean {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check how much of a rotated text box fits inside a polygon
 * Returns a confidence score (0-1) representing the fraction of text inside
 */
export function calculateFitConfidence(
  textCenterX: number,
  textCenterY: number,
  textWidth: number,
  textHeight: number,
  rotationAngle: number,
  polygonCoordinates: number[][]
): number {
  const angleRadians = (rotationAngle * Math.PI) / 180;
  const center: [number, number] = [textCenterX, textCenterY];

  // Get corners of text box
  const corners = getTextCorners(textCenterX, textCenterY, textWidth, textHeight);

  // Rotate corners
  const rotatedCorners = corners.map((corner) =>
    rotatePoint(corner, center, angleRadians)
  );

  // Sample points inside the rotated text box with much finer grid (2-3 pixel spacing)
  // This ensures we get good coverage of the text area
  const gridSpacing = Math.max(0.5, Math.min(2, Math.max(textWidth, textHeight) / 25));
  const samplePoints = generateSamplePoints(rotatedCorners, gridSpacing);

  // Count how many sample points are inside the polygon
  let pointsInside = 0;
  samplePoints.forEach((point) => {
    if (isPointInPolygon(point, polygonCoordinates)) {
      pointsInside++;
    }
  });

  return samplePoints.length > 0 ? pointsInside / samplePoints.length : 0;
}

/**
 * Check if point is inside a convex polygon (the rotated text box)
 */
function isPointInConvexPolygon(
  point: [number, number],
  corners: [number, number][]
): boolean {
  const [px, py] = point;

  // For a rectangle (4 corners), check if point is on the correct side of all edges
  if (corners.length !== 4) {
    // Fallback to ray casting for non-rectangles
    return isPointInPolygon(point, corners.map(c => [c[0], c[1]]));
  }

  // Check if point is inside the quadrilateral using cross product method
  // This works by checking if the point is consistently on one side of all edges
  const sign = (p1: [number, number], p2: [number, number], p3: [number, number]) => {
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  };

  const d1 = sign(point, corners[0], corners[1]);
  const d2 = sign(point, corners[1], corners[2]);
  const d3 = sign(point, corners[2], corners[3]);
  const d4 = sign(point, corners[3], corners[0]);

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0 || d4 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0 || d4 > 0;

  return !(hasNeg && hasPos);
}

/**
 * Generate grid of sample points inside a rotated text box
 */
function generateSamplePoints(
  corners: [number, number][],
  gridSpacing: number
): [number, number][] {
  // Find bounding box of rotated corners
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  corners.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  const points: [number, number][] = [];

  for (let x = minX; x <= maxX; x += gridSpacing) {
    for (let y = minY; y <= maxY; y += gridSpacing) {
      const point: [number, number] = [x, y];
      // Only include points that are actually inside the rotated rectangle
      if (isPointInConvexPolygon(point, corners)) {
        points.push(point);
      }
    }
  }

  return points;
}

/**
 * Convert geographic coordinates to screen coordinates
 */
function convertPolygonToScreenCoords(
  geoCoords: number[][],
  bounds: Bounds,
  mapWidth: number,
  mapHeight: number,
  offsetX: number,
  offsetY: number
): number[][] {
  return geoCoords.map(([lng, lat]) => {
    const geoWidth = bounds.maxLng - bounds.minLng;
    const geoHeight = bounds.maxLat - bounds.minLat;
    const geoAspectRatio = geoWidth / geoHeight;
    const canvasAspectRatio = mapWidth / mapHeight;

    let projectionWidth = mapWidth;
    let projectionHeight = mapHeight;
    let pOffsetX = 0;
    let pOffsetY = 0;

    // Apply aspect ratio correction
    if (geoAspectRatio > canvasAspectRatio) {
      projectionHeight = mapWidth / geoAspectRatio;
      pOffsetY = (mapHeight - projectionHeight) / 2;
    } else {
      projectionWidth = mapHeight * geoAspectRatio;
      pOffsetX = (mapWidth - projectionWidth) / 2;
    }

    // Convert to screen coordinates
    const x = ((lng - bounds.minLng) / geoWidth) * projectionWidth + pOffsetX + offsetX;
    const y = ((bounds.maxLat - lat) / geoHeight) * projectionHeight + pOffsetY + offsetY;

    return [x, y];
  });
}

/**
 * Calculate optimal rotation angle for a district label
 * Memoization is handled by the caller
 */
export function calculateOptimalRotation(
  textCenterX: number,
  textCenterY: number,
  textWidth: number,
  textHeight: number,
  bounds: Bounds,
  polygonCoordinates: number[][],
  mapWidth: number = 760,
  mapHeight: number = 850,
  offsetX: number = 45,
  offsetY: number = 20
): DistrictRotationInfo {
  // Convert polygon to screen coordinates
  const screenPolygon = convertPolygonToScreenCoords(
    polygonCoordinates,
    bounds,
    mapWidth,
    mapHeight,
    offsetX,
    offsetY
  );

  // Calculate aspect ratio from bounds
  const aspectRatio = calculateAspectRatio(bounds);

  // Calculate principal axis from geographic coordinates
  const principalAxisAngle = calculatePrincipalAxisAngle(polygonCoordinates);

  // Generate candidate angles
  const candidateAngles = generateCandidateAngles(aspectRatio, principalAxisAngle);

  // Test each candidate angle
  let bestAngle = 0;
  let bestConfidence = -1;

  candidateAngles.forEach((angle) => {
    const confidence = calculateFitConfidence(
      textCenterX,
      textCenterY,
      textWidth,
      textHeight,
      angle,
      screenPolygon
    );

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestAngle = angle;
    }
  });

  // Always do comprehensive search at fine granularity
  // Test every 5 degrees to find the best fit
  for (let angle = 0; angle < 180; angle += 5) {
    const confidence = calculateFitConfidence(
      textCenterX,
      textCenterY,
      textWidth,
      textHeight,
      angle,
      screenPolygon
    );

    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestAngle = angle;
    }
  }

  // If still very low confidence, try even finer angles around candidates
  if (bestConfidence < 0.3) {
    for (let angle = 0; angle < 180; angle += 1) {
      const confidence = calculateFitConfidence(
        textCenterX,
        textCenterY,
        textWidth,
        textHeight,
        angle,
        screenPolygon
      );

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestAngle = angle;
      }
    }
  }

  // Ensure confidence is in valid range
  bestConfidence = Math.max(0, Math.min(1, bestConfidence));

  return {
    angle: bestAngle,
    confidence: bestConfidence,
    aspectRatio,
    principalAxisAngle
  };
}

/**
 * Create a memoized rotation calculator
 * Caches results per district to avoid recalculation
 */
export function createRotationCalculator() {
  const cache = new Map<string, DistrictRotationInfo>();

  return {
    getRotation(
      districtKey: string,
      textCenterX: number,
      textCenterY: number,
      textWidth: number,
      textHeight: number,
      bounds: Bounds,
      polygonCoordinates: number[][],
      mapWidth: number = 760,
      mapHeight: number = 850,
      offsetX: number = 45,
      offsetY: number = 20
    ): DistrictRotationInfo {
      if (cache.has(districtKey)) {
        return cache.get(districtKey)!;
      }

      const rotation = calculateOptimalRotation(
        textCenterX,
        textCenterY,
        textWidth,
        textHeight,
        bounds,
        polygonCoordinates,
        mapWidth,
        mapHeight,
        offsetX,
        offsetY
      );

      cache.set(districtKey, rotation);
      return rotation;
    },

    clearCache() {
      cache.clear();
    },

    getCacheSize() {
      return cache.size;
    }
  };
}
