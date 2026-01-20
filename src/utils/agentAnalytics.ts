import Anthropic from '@anthropic-ai/sdk';
import type { Metrics, DepartmentAverages } from '../types';

export interface PeerRanking {
  metric: string;
  rank: number;
  total: number;
  percentile: number;
}

export interface AgentRankings {
  tq: PeerRanking;
  tp: PeerRanking;
  pq: PeerRanking;
  hotPassRate: PeerRanking;
  nonConvertedRate: PeerRanking;
  trips: PeerRanking;
  quotes: PeerRanking;
  passthroughs: PeerRanking;
  bookings: PeerRanking;
}

export const calculateDepartmentAverages = (metrics: Metrics[]): DepartmentAverages => {
  if (metrics.length === 0) {
    return {
      avgTrips: 0,
      avgQuotes: 0,
      avgPassthroughs: 0,
      avgHotPasses: 0,
      avgBookings: 0,
      avgNonConverted: 0,
      avgTQ: 0,
      avgTP: 0,
      avgPQ: 0,
      avgHotPassRate: 0,
      avgNonConvertedRate: 0,
    };
  }

  const totals = metrics.reduce(
    (acc, m) => ({
      trips: acc.trips + m.trips,
      quotes: acc.quotes + m.quotes,
      passthroughs: acc.passthroughs + m.passthroughs,
      hotPasses: acc.hotPasses + m.hotPasses,
      bookings: acc.bookings + m.bookings,
      nonConverted: acc.nonConverted + m.nonConvertedLeads,
      tq: acc.tq + m.quotesFromTrips,
      tp: acc.tp + m.passthroughsFromTrips,
      pq: acc.pq + m.quotesFromPassthroughs,
      hotPassRate: acc.hotPassRate + m.hotPassRate,
      nonConvertedRate: acc.nonConvertedRate + m.nonConvertedRate,
    }),
    {
      trips: 0,
      quotes: 0,
      passthroughs: 0,
      hotPasses: 0,
      bookings: 0,
      nonConverted: 0,
      tq: 0,
      tp: 0,
      pq: 0,
      hotPassRate: 0,
      nonConvertedRate: 0,
    }
  );

  const count = metrics.length;
  return {
    avgTrips: totals.trips / count,
    avgQuotes: totals.quotes / count,
    avgPassthroughs: totals.passthroughs / count,
    avgHotPasses: totals.hotPasses / count,
    avgBookings: totals.bookings / count,
    avgNonConverted: totals.nonConverted / count,
    avgTQ: totals.tq / count,
    avgTP: totals.tp / count,
    avgPQ: totals.pq / count,
    avgHotPassRate: totals.hotPassRate / count,
    avgNonConvertedRate: totals.nonConvertedRate / count,
  };
};

export const calculateSeniorAverages = (
  metrics: Metrics[],
  seniors: string[]
): DepartmentAverages => {
  const seniorMetrics = metrics.filter((m) =>
    seniors.some((s) => s.toLowerCase() === m.agentName.toLowerCase())
  );
  return calculateDepartmentAverages(seniorMetrics);
};

const calculateRank = (
  value: number,
  allValues: number[],
  higherIsBetter: boolean
): { rank: number; total: number; percentile: number } => {
  const total = allValues.length;
  const sorted = [...allValues].sort((a, b) =>
    higherIsBetter ? b - a : a - b
  );
  const rank = sorted.findIndex((v) => v === value) + 1;
  const percentile = ((total - rank + 1) / total) * 100;
  return { rank, total, percentile };
};

export const calculatePeerRankings = (
  agent: Metrics,
  allMetrics: Metrics[]
): AgentRankings => {
  const tqValues = allMetrics.map((m) => m.quotesFromTrips);
  const tpValues = allMetrics.map((m) => m.passthroughsFromTrips);
  const pqValues = allMetrics.map((m) => m.quotesFromPassthroughs);
  const hotPassValues = allMetrics.map((m) => m.hotPassRate);
  const nonConvertedValues = allMetrics.map((m) => m.nonConvertedRate);
  const tripsValues = allMetrics.map((m) => m.trips);
  const quotesValues = allMetrics.map((m) => m.quotes);
  const passthroughsValues = allMetrics.map((m) => m.passthroughs);
  const bookingsValues = allMetrics.map((m) => m.bookings);

  return {
    tq: {
      metric: 'T>Q %',
      ...calculateRank(agent.quotesFromTrips, tqValues, true),
    },
    tp: {
      metric: 'T>P %',
      ...calculateRank(agent.passthroughsFromTrips, tpValues, true),
    },
    pq: {
      metric: 'P>Q %',
      ...calculateRank(agent.quotesFromPassthroughs, pqValues, true),
    },
    hotPassRate: {
      metric: 'Hot Pass Rate',
      ...calculateRank(agent.hotPassRate, hotPassValues, true),
    },
    nonConvertedRate: {
      metric: 'Non-Converted Rate',
      ...calculateRank(agent.nonConvertedRate, nonConvertedValues, false), // Lower is better
    },
    trips: {
      metric: 'Trips',
      ...calculateRank(agent.trips, tripsValues, true),
    },
    quotes: {
      metric: 'Quotes',
      ...calculateRank(agent.quotes, quotesValues, true),
    },
    passthroughs: {
      metric: 'Passthroughs',
      ...calculateRank(agent.passthroughs, passthroughsValues, true),
    },
    bookings: {
      metric: 'Bookings',
      ...calculateRank(agent.bookings, bookingsValues, true),
    },
  };
};

export const buildAnalysisPrompt = (
  agent: Metrics,
  deptAvg: DepartmentAverages,
  seniorAvg: DepartmentAverages | null,
  rankings: AgentRankings,
  isSenior: boolean
): string => {
  const senioritySection = seniorAvg && isSenior
    ? `\nSENIOR COMPARISON (agent is a senior):\n- Senior Avg T>Q: ${seniorAvg.avgTQ.toFixed(1)}%\n- Senior Avg T>P: ${seniorAvg.avgTP.toFixed(1)}%\n- Senior Avg P>Q: ${seniorAvg.avgPQ.toFixed(1)}%\n- Senior Avg Hot Pass Rate: ${seniorAvg.avgHotPassRate.toFixed(1)}%\n- Senior Avg Non-Converted Rate: ${seniorAvg.avgNonConvertedRate.toFixed(1)}%`
    : '';

  return `You are analyzing sales agent performance data. Provide a concise analysis (max 200 words) with bulleted strengths and opportunities.

AGENT: ${agent.agentName}
SENIORITY: ${isSenior ? 'Senior' : 'Non-Senior'}

RAW COUNTS:
- Trips: ${agent.trips} (Dept Avg: ${deptAvg.avgTrips.toFixed(1)}, Rank: ${rankings.trips.rank}/${rankings.trips.total})
- Quotes: ${agent.quotes} (Dept Avg: ${deptAvg.avgQuotes.toFixed(1)}, Rank: ${rankings.quotes.rank}/${rankings.quotes.total})
- Passthroughs: ${agent.passthroughs} (Dept Avg: ${deptAvg.avgPassthroughs.toFixed(1)}, Rank: ${rankings.passthroughs.rank}/${rankings.passthroughs.total})
- Hot Passes: ${agent.hotPasses} (Dept Avg: ${deptAvg.avgHotPasses.toFixed(1)})
- Bookings: ${agent.bookings} (Dept Avg: ${deptAvg.avgBookings.toFixed(1)}, Rank: ${rankings.bookings.rank}/${rankings.bookings.total})
- Non-Converted: ${agent.nonConvertedLeads} (Dept Avg: ${deptAvg.avgNonConverted.toFixed(1)})

CONVERSION RATES:
- T>Q: ${agent.quotesFromTrips.toFixed(1)}% (Dept Avg: ${deptAvg.avgTQ.toFixed(1)}%, Rank: ${rankings.tq.rank}/${rankings.tq.total})
- T>P: ${agent.passthroughsFromTrips.toFixed(1)}% (Dept Avg: ${deptAvg.avgTP.toFixed(1)}%, Rank: ${rankings.tp.rank}/${rankings.tp.total})
- P>Q: ${agent.quotesFromPassthroughs.toFixed(1)}% (Dept Avg: ${deptAvg.avgPQ.toFixed(1)}%, Rank: ${rankings.pq.rank}/${rankings.pq.total})
- Hot Pass Rate: ${agent.hotPassRate.toFixed(1)}% (Dept Avg: ${deptAvg.avgHotPassRate.toFixed(1)}%, Rank: ${rankings.hotPassRate.rank}/${rankings.hotPassRate.total})
- Non-Converted Rate: ${agent.nonConvertedRate.toFixed(1)}% (Dept Avg: ${deptAvg.avgNonConvertedRate.toFixed(1)}%, Rank: ${rankings.nonConvertedRate.rank}/${rankings.nonConvertedRate.total})
${senioritySection}

Provide analysis in this exact format:
**Strengths:**
- [bullet points identifying what the agent excels at, comparing to averages and peers]

**Opportunities for Improvement:**
- [bullet points identifying areas to focus on for improvement]`;
};

export const callAnthropicAPI = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  const anthropic = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
};

export const analyzeAgent = async (
  agentName: string,
  metrics: Metrics[],
  seniors: string[],
  apiKey: string
): Promise<string> => {
  const agent = metrics.find(
    (m) => m.agentName.toLowerCase() === agentName.toLowerCase()
  );

  if (!agent) {
    throw new Error(`Agent "${agentName}" not found in metrics`);
  }

  const deptAvg = calculateDepartmentAverages(metrics);
  const seniorAvg = seniors.length > 0 ? calculateSeniorAverages(metrics, seniors) : null;
  const rankings = calculatePeerRankings(agent, metrics);
  const isSenior = seniors.some(
    (s) => s.toLowerCase() === agentName.toLowerCase()
  );

  const prompt = buildAnalysisPrompt(agent, deptAvg, seniorAvg, rankings, isSenior);
  return callAnthropicAPI(prompt, apiKey);
};
