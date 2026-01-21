import type { TimeSeriesData, DailyAgentMetrics } from '../types';

// ============ Types ============

export type VolumeMetric = 'trips' | 'quotes' | 'passthroughs';
export type RateMetric = 'tq' | 'tp' | 'pq';
export type TimePeriod = 'week' | 'month' | 'quarter';

export interface RecordEntry {
  value: number;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  setAt: string;       // ISO timestamp when record was set
}

export interface AgentRecords {
  agentName: string;
  // Volume records (week, month, quarter)
  trips: {
    week: RecordEntry | null;
    month: RecordEntry | null;
    quarter: RecordEntry | null;
  };
  quotes: {
    week: RecordEntry | null;
    month: RecordEntry | null;
    quarter: RecordEntry | null;
  };
  passthroughs: {
    week: RecordEntry | null;
    month: RecordEntry | null;
    quarter: RecordEntry | null;
  };
  // Rate records (month, quarter only)
  tq: {
    month: RecordEntry | null;
    quarter: RecordEntry | null;
  };
  tp: {
    month: RecordEntry | null;
    quarter: RecordEntry | null;
  };
  pq: {
    month: RecordEntry | null;
    quarter: RecordEntry | null;
  };
}

export interface RecordUpdate {
  agentName: string;
  metric: VolumeMetric | RateMetric;
  period: TimePeriod;
  previousValue: number | null;
  newValue: number;
  periodStart: string;
  periodEnd: string;
  timestamp: string;
}

export interface AllRecords {
  agents: Record<string, AgentRecords>;
  lastUpdated: string;
}

// ============ Storage ============

const STORAGE_KEY = 'gtt-agent-records';

export const loadRecords = (): AllRecords => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load records:', e);
  }
  return { agents: {}, lastUpdated: new Date().toISOString() };
};

export const saveRecords = (records: AllRecords): void => {
  try {
    records.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save records:', e);
  }
};

export const clearRecords = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// ============ Date Utilities ============

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.setDate(diff));
};

const getWeekEnd = (date: Date): Date => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
};

const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getMonthEnd = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const getQuarterStart = (date: Date): Date => {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), quarter * 3, 1);
};

const getQuarterEnd = (date: Date): Date => {
  const quarter = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), (quarter + 1) * 3, 0);
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// ============ Period Aggregation ============

interface PeriodData {
  periodStart: string;
  periodEnd: string;
  trips: number;
  quotes: number;
  passthroughs: number;
}

const aggregateByPeriod = (
  dailyMetrics: DailyAgentMetrics[],
  getPeriodStart: (date: Date) => Date,
  getPeriodEnd: (date: Date) => Date
): PeriodData[] => {
  const periods = new Map<string, PeriodData>();

  for (const day of dailyMetrics) {
    if (day.date === 'unknown') continue;

    const date = parseDate(day.date);
    const periodStart = formatDate(getPeriodStart(date));
    const periodEnd = formatDate(getPeriodEnd(date));
    const key = `${periodStart}_${periodEnd}`;

    if (!periods.has(key)) {
      periods.set(key, {
        periodStart,
        periodEnd,
        trips: 0,
        quotes: 0,
        passthroughs: 0,
      });
    }

    const period = periods.get(key)!;
    period.trips += day.trips;
    period.quotes += day.quotes;
    period.passthroughs += day.passthroughs;
  }

  return Array.from(periods.values());
};

// Calculate rate for a period (needs sufficient volume)
const calculatePeriodRate = (
  dailyMetrics: DailyAgentMetrics[],
  getPeriodStart: (date: Date) => Date,
  getPeriodEnd: (date: Date) => Date,
  rateType: RateMetric
): { periodStart: string; periodEnd: string; rate: number }[] => {
  const periods = aggregateByPeriod(dailyMetrics, getPeriodStart, getPeriodEnd);

  return periods
    .map(p => {
      let rate = 0;
      if (rateType === 'tq' && p.trips > 0) {
        rate = (p.quotes / p.trips) * 100;
      } else if (rateType === 'tp' && p.trips > 0) {
        rate = (p.passthroughs / p.trips) * 100;
      } else if (rateType === 'pq' && p.passthroughs > 0) {
        rate = (p.quotes / p.passthroughs) * 100;
      }
      return { periodStart: p.periodStart, periodEnd: p.periodEnd, rate };
    })
    .filter(p => p.rate > 0); // Only include periods with actual data
};

// ============ Record Checking ============

const createEmptyAgentRecords = (agentName: string): AgentRecords => ({
  agentName,
  trips: { week: null, month: null, quarter: null },
  quotes: { week: null, month: null, quarter: null },
  passthroughs: { week: null, month: null, quarter: null },
  tq: { month: null, quarter: null },
  tp: { month: null, quarter: null },
  pq: { month: null, quarter: null },
});

const checkAndUpdateVolumeRecord = (
  currentRecord: RecordEntry | null,
  value: number,
  periodStart: string,
  periodEnd: string
): { updated: boolean; previousValue: number | null; newRecord: RecordEntry | null } => {
  if (value <= 0) {
    return { updated: false, previousValue: null, newRecord: currentRecord };
  }

  if (!currentRecord || value > currentRecord.value) {
    return {
      updated: true,
      previousValue: currentRecord?.value || null,
      newRecord: {
        value,
        periodStart,
        periodEnd,
        setAt: new Date().toISOString(),
      },
    };
  }

  return { updated: false, previousValue: null, newRecord: currentRecord };
};

const checkAndUpdateRateRecord = (
  currentRecord: RecordEntry | null,
  rate: number,
  periodStart: string,
  periodEnd: string
): { updated: boolean; previousValue: number | null; newRecord: RecordEntry | null } => {
  // Rate must be > 0 and reasonable (< 200% as sanity check)
  if (rate <= 0 || rate > 200) {
    return { updated: false, previousValue: null, newRecord: currentRecord };
  }

  if (!currentRecord || rate > currentRecord.value) {
    return {
      updated: true,
      previousValue: currentRecord?.value || null,
      newRecord: {
        value: rate,
        periodStart,
        periodEnd,
        setAt: new Date().toISOString(),
      },
    };
  }

  return { updated: false, previousValue: null, newRecord: currentRecord };
};

// ============ Main Analysis Function ============

export const analyzeAndUpdateRecords = (
  timeSeriesData: TimeSeriesData,
  existingRecords: AllRecords
): { updatedRecords: AllRecords; updates: RecordUpdate[] } => {
  const updates: RecordUpdate[] = [];
  const newRecords: AllRecords = {
    agents: { ...existingRecords.agents },
    lastUpdated: new Date().toISOString(),
  };

  for (const agent of timeSeriesData.agents) {
    const { agentName, dailyMetrics } = agent;

    if (!newRecords.agents[agentName]) {
      newRecords.agents[agentName] = createEmptyAgentRecords(agentName);
    }

    const agentRecords = { ...newRecords.agents[agentName] };

    // Aggregate data by period
    const weeklyData = aggregateByPeriod(dailyMetrics, getWeekStart, getWeekEnd);
    const monthlyData = aggregateByPeriod(dailyMetrics, getMonthStart, getMonthEnd);
    const quarterlyData = aggregateByPeriod(dailyMetrics, getQuarterStart, getQuarterEnd);

    // Check volume records
    const volumeMetrics: VolumeMetric[] = ['trips', 'quotes', 'passthroughs'];

    for (const metric of volumeMetrics) {
      // Weekly
      for (const period of weeklyData) {
        const result = checkAndUpdateVolumeRecord(
          agentRecords[metric].week,
          period[metric],
          period.periodStart,
          period.periodEnd
        );
        if (result.updated) {
          agentRecords[metric] = { ...agentRecords[metric], week: result.newRecord };
          updates.push({
            agentName,
            metric,
            period: 'week',
            previousValue: result.previousValue,
            newValue: period[metric],
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Monthly
      for (const period of monthlyData) {
        const result = checkAndUpdateVolumeRecord(
          agentRecords[metric].month,
          period[metric],
          period.periodStart,
          period.periodEnd
        );
        if (result.updated) {
          agentRecords[metric] = { ...agentRecords[metric], month: result.newRecord };
          updates.push({
            agentName,
            metric,
            period: 'month',
            previousValue: result.previousValue,
            newValue: period[metric],
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Quarterly
      for (const period of quarterlyData) {
        const result = checkAndUpdateVolumeRecord(
          agentRecords[metric].quarter,
          period[metric],
          period.periodStart,
          period.periodEnd
        );
        if (result.updated) {
          agentRecords[metric] = { ...agentRecords[metric], quarter: result.newRecord };
          updates.push({
            agentName,
            metric,
            period: 'quarter',
            previousValue: result.previousValue,
            newValue: period[metric],
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Check rate records (monthly and quarterly only)
    const rateMetrics: RateMetric[] = ['tq', 'tp', 'pq'];

    for (const metric of rateMetrics) {
      // Monthly rates
      const monthlyRates = calculatePeriodRate(dailyMetrics, getMonthStart, getMonthEnd, metric);
      for (const period of monthlyRates) {
        const result = checkAndUpdateRateRecord(
          agentRecords[metric].month,
          period.rate,
          period.periodStart,
          period.periodEnd
        );
        if (result.updated) {
          agentRecords[metric] = { ...agentRecords[metric], month: result.newRecord };
          updates.push({
            agentName,
            metric,
            period: 'month',
            previousValue: result.previousValue,
            newValue: period.rate,
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Quarterly rates
      const quarterlyRates = calculatePeriodRate(dailyMetrics, getQuarterStart, getQuarterEnd, metric);
      for (const period of quarterlyRates) {
        const result = checkAndUpdateRateRecord(
          agentRecords[metric].quarter,
          period.rate,
          period.periodStart,
          period.periodEnd
        );
        if (result.updated) {
          agentRecords[metric] = { ...agentRecords[metric], quarter: result.newRecord };
          updates.push({
            agentName,
            metric,
            period: 'quarter',
            previousValue: result.previousValue,
            newValue: period.rate,
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    newRecords.agents[agentName] = agentRecords;
  }

  return { updatedRecords: newRecords, updates };
};

// ============ Display Helpers ============

export const formatMetricName = (metric: VolumeMetric | RateMetric): string => {
  const names: Record<string, string> = {
    trips: 'Trips',
    quotes: 'Quotes',
    passthroughs: 'Passthroughs',
    tq: 'T>Q %',
    tp: 'T>P %',
    pq: 'P>Q %',
  };
  return names[metric] || metric;
};

export const formatPeriodName = (period: TimePeriod): string => {
  const names: Record<TimePeriod, string> = {
    week: 'Weekly',
    month: 'Monthly',
    quarter: 'Quarterly',
  };
  return names[period];
};

export const formatRecordValue = (metric: VolumeMetric | RateMetric, value: number): string => {
  if (['tq', 'tp', 'pq'].includes(metric)) {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString();
};

export const formatDateRange = (start: string, end: string): string => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = startDate.toLocaleDateString('en-US', options);
  const endStr = endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' });

  return `${startStr} - ${endStr}`;
};
