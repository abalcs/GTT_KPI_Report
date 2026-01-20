import type { CSVRow } from './csvParser';
import type { DailyAgentMetrics, AgentTimeSeries, DailyRatioPoint, TimeSeriesData, MetricKey } from '../types';

// Count rows by agent AND date, returning { [agent]: { [date]: count } }
export const countByAgentAndDate = (
  rows: CSVRow[],
  agentColumn: string,
  dateColumn: string | null,
  parseDateFn: (value: string) => Date | null
): Map<string, Map<string, number>> => {
  const counts = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const agent = row[agentColumn];
    if (!agent) continue;

    let dateStr = 'unknown';
    if (dateColumn && row[dateColumn]) {
      const date = parseDateFn(row[dateColumn]);
      if (date) {
        dateStr = formatDateKey(date);
      }
    }

    if (!counts.has(agent)) {
      counts.set(agent, new Map());
    }
    const agentDates = counts.get(agent)!;
    agentDates.set(dateStr, (agentDates.get(dateStr) || 0) + 1);
  }

  return counts;
};

// Format a Date to YYYY-MM-DD
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Build AgentTimeSeries from six separate count maps
export const buildAgentTimeSeries = (
  tripsCounts: Map<string, Map<string, number>>,
  quotesCounts: Map<string, Map<string, number>>,
  passthroughsCounts: Map<string, Map<string, number>>,
  hotPassCounts: Map<string, Map<string, number>>,
  bookingsCounts: Map<string, Map<string, number>>,
  nonConvertedCounts: Map<string, Map<string, number>>
): AgentTimeSeries[] => {
  // Get all unique agents
  const allAgents = new Set<string>();
  const allCountMaps = [tripsCounts, quotesCounts, passthroughsCounts, hotPassCounts, bookingsCounts, nonConvertedCounts];
  for (const counts of allCountMaps) {
    counts.forEach((_, agent) => allAgents.add(agent));
  }

  // Get all unique dates
  const allDates = new Set<string>();
  for (const counts of allCountMaps) {
    counts.forEach((dateCounts) => {
      dateCounts.forEach((_, date) => {
        if (date !== 'unknown') allDates.add(date);
      });
    });
  }

  const sortedDates = Array.from(allDates).sort();

  const result: AgentTimeSeries[] = [];

  for (const agent of allAgents) {
    const tripsDates = tripsCounts.get(agent) || new Map();
    const quotesDates = quotesCounts.get(agent) || new Map();
    const passthroughsDates = passthroughsCounts.get(agent) || new Map();
    const hotPassDates = hotPassCounts.get(agent) || new Map();
    const bookingsDates = bookingsCounts.get(agent) || new Map();
    const nonConvertedDates = nonConvertedCounts.get(agent) || new Map();

    const dailyMetrics: DailyAgentMetrics[] = sortedDates.map((date) => ({
      date,
      trips: tripsDates.get(date) || 0,
      quotes: quotesDates.get(date) || 0,
      passthroughs: passthroughsDates.get(date) || 0,
      hotPasses: hotPassDates.get(date) || 0,
      bookings: bookingsDates.get(date) || 0,
      nonConverted: nonConvertedDates.get(date) || 0,
    }));

    result.push({
      agentName: agent,
      dailyMetrics,
    });
  }

  return result.sort((a, b) => a.agentName.localeCompare(b.agentName));
};

// Calculate daily ratios from daily metrics
export const calculateDailyRatios = (dailyMetrics: DailyAgentMetrics[]): DailyRatioPoint[] => {
  return dailyMetrics.map(({ date, trips, quotes, passthroughs, hotPasses, bookings, nonConverted }) => ({
    date,
    tq: trips > 0 ? (quotes / trips) * 100 : 0,
    tp: trips > 0 ? (passthroughs / trips) * 100 : 0,
    pq: passthroughs > 0 ? (quotes / passthroughs) * 100 : 0,
    hp: passthroughs > 0 ? (hotPasses / passthroughs) * 100 : 0,
    bk: trips > 0 ? (bookings / trips) * 100 : 0,
    nc: trips > 0 ? (nonConverted / trips) * 100 : 0,
  }));
};

// Calculate group daily ratios (average across multiple agents)
export const calculateGroupDailyRatios = (
  agents: AgentTimeSeries[],
  dates: string[]
): DailyRatioPoint[] => {
  if (agents.length === 0) {
    return dates.map((date) => ({ date, tq: 0, tp: 0, pq: 0, hp: 0, bk: 0, nc: 0 }));
  }

  return dates.map((date) => {
    let totalTrips = 0;
    let totalQuotes = 0;
    let totalPassthroughs = 0;
    let totalHotPasses = 0;
    let totalBookings = 0;
    let totalNonConverted = 0;

    for (const agent of agents) {
      const dayMetrics = agent.dailyMetrics.find((m) => m.date === date);
      if (dayMetrics) {
        totalTrips += dayMetrics.trips;
        totalQuotes += dayMetrics.quotes;
        totalPassthroughs += dayMetrics.passthroughs;
        totalHotPasses += dayMetrics.hotPasses;
        totalBookings += dayMetrics.bookings;
        totalNonConverted += dayMetrics.nonConverted;
      }
    }

    return {
      date,
      tq: totalTrips > 0 ? (totalQuotes / totalTrips) * 100 : 0,
      tp: totalTrips > 0 ? (totalPassthroughs / totalTrips) * 100 : 0,
      pq: totalPassthroughs > 0 ? (totalQuotes / totalPassthroughs) * 100 : 0,
      hp: totalPassthroughs > 0 ? (totalHotPasses / totalPassthroughs) * 100 : 0,
      bk: totalTrips > 0 ? (totalBookings / totalTrips) * 100 : 0,
      nc: totalTrips > 0 ? (totalNonConverted / totalTrips) * 100 : 0,
    };
  });
};

// Build complete TimeSeriesData from raw data
export const buildTimeSeriesData = (
  agentTimeSeries: AgentTimeSeries[],
  seniors: string[]
): TimeSeriesData => {
  // Get all dates
  const allDates = new Set<string>();
  agentTimeSeries.forEach((agent) => {
    agent.dailyMetrics.forEach((m) => {
      if (m.date !== 'unknown') allDates.add(m.date);
    });
  });
  const sortedDates = Array.from(allDates).sort();

  const dateRange = {
    start: sortedDates[0] || '',
    end: sortedDates[sortedDates.length - 1] || '',
  };

  // Separate seniors and non-seniors
  const seniorAgents = agentTimeSeries.filter((a) =>
    seniors.some((s) => s.toLowerCase() === a.agentName.toLowerCase())
  );
  const nonSeniorAgents = agentTimeSeries.filter(
    (a) => !seniors.some((s) => s.toLowerCase() === a.agentName.toLowerCase())
  );

  return {
    dateRange,
    agents: agentTimeSeries,
    departmentDaily: calculateGroupDailyRatios(agentTimeSeries, sortedDates),
    seniorDaily: calculateGroupDailyRatios(seniorAgents, sortedDates),
    nonSeniorDaily: calculateGroupDailyRatios(nonSeniorAgents, sortedDates),
  };
};

// Merge time series data into format suitable for Recharts
// Returns array like: [{ date: '2024-01-01', Agent1_tq: 50, Agent2_tq: 60, dept_tq: 55, ... }]
export const mergeSeriesForChart = (
  timeSeriesData: TimeSeriesData,
  selectedAgents: string[],
  selectedMetrics: MetricKey[],
  showDeptAvg: boolean,
  showSeniorAvg: boolean,
  showNonSeniorAvg: boolean,
  dateStartIdx: number,
  dateEndIdx: number
): Record<string, unknown>[] => {
  // Get all unique dates
  const allDates = new Set<string>();
  timeSeriesData.agents.forEach((agent) => {
    agent.dailyMetrics.forEach((m) => {
      if (m.date !== 'unknown') allDates.add(m.date);
    });
  });
  const sortedDates = Array.from(allDates).sort();

  // Apply date range filter
  const filteredDates = sortedDates.slice(dateStartIdx, dateEndIdx + 1);

  // Build data points
  return filteredDates.map((date) => {
    const point: Record<string, unknown> = { date };

    // Add selected agent metrics
    for (const agentName of selectedAgents) {
      const agent = timeSeriesData.agents.find((a) => a.agentName === agentName);
      if (!agent) continue;

      const dayMetrics = agent.dailyMetrics.find((m) => m.date === date);
      const ratios = dayMetrics
        ? {
            tq: dayMetrics.trips > 0 ? (dayMetrics.quotes / dayMetrics.trips) * 100 : 0,
            tp: dayMetrics.trips > 0 ? (dayMetrics.passthroughs / dayMetrics.trips) * 100 : 0,
            pq: dayMetrics.passthroughs > 0 ? (dayMetrics.quotes / dayMetrics.passthroughs) * 100 : 0,
            hp: dayMetrics.passthroughs > 0 ? (dayMetrics.hotPasses / dayMetrics.passthroughs) * 100 : 0,
            bk: dayMetrics.trips > 0 ? (dayMetrics.bookings / dayMetrics.trips) * 100 : 0,
            nc: dayMetrics.trips > 0 ? (dayMetrics.nonConverted / dayMetrics.trips) * 100 : 0,
          }
        : { tq: 0, tp: 0, pq: 0, hp: 0, bk: 0, nc: 0 };

      for (const metric of selectedMetrics) {
        point[`${agentName}_${metric}`] = ratios[metric];
      }
    }

    // Add average lines
    const deptDay = timeSeriesData.departmentDaily.find((d) => d.date === date);
    const seniorDay = timeSeriesData.seniorDaily.find((d) => d.date === date);
    const nonSeniorDay = timeSeriesData.nonSeniorDaily.find((d) => d.date === date);

    for (const metric of selectedMetrics) {
      if (showDeptAvg && deptDay) {
        point[`dept_${metric}`] = deptDay[metric];
      }
      if (showSeniorAvg && seniorDay) {
        point[`senior_${metric}`] = seniorDay[metric];
      }
      if (showNonSeniorAvg && nonSeniorDay) {
        point[`nonsenior_${metric}`] = nonSeniorDay[metric];
      }
    }

    return point;
  });
};

// Generate consistent colors for agents
const AGENT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#A855F7', // purple
];

export const getAgentColor = (index: number): string => {
  return AGENT_COLORS[index % AGENT_COLORS.length];
};

// Get all unique dates from time series data
export const getAllDates = (timeSeriesData: TimeSeriesData): string[] => {
  const allDates = new Set<string>();
  timeSeriesData.agents.forEach((agent) => {
    agent.dailyMetrics.forEach((m) => {
      if (m.date !== 'unknown') allDates.add(m.date);
    });
  });
  return Array.from(allDates).sort();
};
