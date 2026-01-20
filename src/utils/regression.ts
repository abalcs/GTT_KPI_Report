// Regression utilities for trend analysis

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictedValues: number[];
  type: 'linear' | 'log-linear';
}

/**
 * Calculate linear regression: y = a + bx
 */
export function linearRegression(xValues: number[], yValues: number[]): RegressionResult | null {
  const n = xValues.length;
  if (n < 2) return null;

  // Filter out invalid values
  const validPairs: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    if (typeof yValues[i] === 'number' && !isNaN(yValues[i]) && yValues[i] !== null) {
      validPairs.push({ x: xValues[i], y: yValues[i] });
    }
  }

  if (validPairs.length < 2) return null;

  const validN = validPairs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (const { x, y } of validPairs) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const meanX = sumX / validN;
  const meanY = sumY / validN;

  const denominator = sumX2 - (sumX * sumX) / validN;
  if (Math.abs(denominator) < 1e-10) return null;

  const slope = (sumXY - (sumX * sumY) / validN) / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate R-squared
  let ssTot = 0, ssRes = 0;
  for (const { x, y } of validPairs) {
    const predicted = intercept + slope * x;
    ssTot += (y - meanY) ** 2;
    ssRes += (y - predicted) ** 2;
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Generate predicted values for all x points
  const predictedValues = xValues.map(x => intercept + slope * x);

  return { slope, intercept, rSquared, predictedValues, type: 'linear' };
}

/**
 * Calculate log-linear (exponential) regression: y = a * e^(bx)
 * Linearized: ln(y) = ln(a) + bx
 */
export function logLinearRegression(xValues: number[], yValues: number[]): RegressionResult | null {
  const n = xValues.length;
  if (n < 2) return null;

  // Filter out invalid and non-positive values (can't take log of 0 or negative)
  const validPairs: { x: number; y: number; lnY: number }[] = [];
  for (let i = 0; i < n; i++) {
    if (typeof yValues[i] === 'number' && !isNaN(yValues[i]) && yValues[i] > 0) {
      validPairs.push({ x: xValues[i], y: yValues[i], lnY: Math.log(yValues[i]) });
    }
  }

  if (validPairs.length < 2) return null;

  const validN = validPairs.length;
  let sumX = 0, sumLnY = 0, sumXLnY = 0, sumX2 = 0;

  for (const { x, lnY } of validPairs) {
    sumX += x;
    sumLnY += lnY;
    sumXLnY += x * lnY;
    sumX2 += x * x;
  }

  const meanX = sumX / validN;
  const meanLnY = sumLnY / validN;

  const denominator = sumX2 - (sumX * sumX) / validN;
  if (Math.abs(denominator) < 1e-10) return null;

  const b = (sumXLnY - (sumX * sumLnY) / validN) / denominator;
  const lnA = meanLnY - b * meanX;
  const a = Math.exp(lnA);

  // Calculate R-squared on original scale
  let ssTot = 0, ssRes = 0;
  const meanY = validPairs.reduce((sum, p) => sum + p.y, 0) / validN;

  for (const { x, y } of validPairs) {
    const predicted = a * Math.exp(b * x);
    ssTot += (y - meanY) ** 2;
    ssRes += (y - predicted) ** 2;
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Generate predicted values for all x points
  const predictedValues = xValues.map(x => a * Math.exp(b * x));

  return { slope: b, intercept: a, rSquared, predictedValues, type: 'log-linear' };
}

/**
 * Get the best regression fit (linear or log-linear) with R² >= threshold
 * Returns both if both meet threshold, prefers log-linear if both are similar
 */
export function getBestRegression(
  xValues: number[],
  yValues: number[],
  rSquaredThreshold: number = 0.95
): RegressionResult | null {
  const linear = linearRegression(xValues, yValues);
  const logLinear = logLinearRegression(xValues, yValues);

  // Filter by threshold
  const meetsThreshold = (r: RegressionResult | null) => r && r.rSquared >= rSquaredThreshold;

  if (meetsThreshold(logLinear) && meetsThreshold(linear)) {
    // Both meet threshold, prefer log-linear (as requested)
    return logLinear!.rSquared >= linear!.rSquared ? logLinear : linear;
  }

  if (meetsThreshold(logLinear)) return logLinear;
  if (meetsThreshold(linear)) return linear;

  return null;
}

/**
 * Calculate regression for chart data series
 */
export function calculateSeriesRegression(
  chartData: Record<string, unknown>[],
  seriesKey: string,
  rSquaredThreshold: number = 0.95
): RegressionResult | null {
  const xValues: number[] = [];
  const yValues: number[] = [];

  chartData.forEach((point, index) => {
    const value = point[seriesKey];
    if (typeof value === 'number' && !isNaN(value)) {
      xValues.push(index);
      yValues.push(value);
    }
  });

  if (xValues.length < 3) return null;

  return getBestRegression(xValues, yValues, rSquaredThreshold);
}

/**
 * Generate trend line data points for Recharts
 */
export function generateTrendLineData(
  chartData: Record<string, unknown>[],
  seriesKey: string,
  regression: RegressionResult
): Record<string, unknown>[] {
  const trendKey = `${seriesKey}_trend`;

  return chartData.map((point, index) => ({
    ...point,
    [trendKey]: regression.predictedValues[index],
  }));
}
