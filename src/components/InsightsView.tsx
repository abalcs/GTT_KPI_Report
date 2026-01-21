import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import type { RawParsedData } from '../utils/indexedDB';
import {
  generateInsightsData,
  generateAIInsights,
  discoverColumns,
  analyzeRegionalPerformance,
  analyzeAgentRegionalDeviations,
  generateDepartmentRecommendations,
  type InsightsData,
  type RegionalTimeframe,
  type DepartmentRegionalPerformance,
  type AgentRegionalAnalysis,
  type DepartmentImprovementRecommendation,
} from '../utils/insightsAnalytics';
import {
  loadAnthropicApiKey,
  saveAnthropicApiKey,
} from '../utils/storage';

interface InsightsViewProps {
  rawData: RawParsedData;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export const InsightsView: React.FC<InsightsViewProps> = ({ rawData }) => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColumns, setShowColumns] = useState(false);
  const [selectedAgentForReasons, setSelectedAgentForReasons] = useState<string>('');
  const [regionalTimeframe, setRegionalTimeframe] = useState<RegionalTimeframe>('all');
  const [selectedAgentForRegions, setSelectedAgentForRegions] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    timing: true,
    regional: true,
    leadQuality: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Load API key
  useEffect(() => {
    const storedKey = loadAnthropicApiKey();
    if (storedKey) {
      setApiKey(storedKey);
      setApiKeySaved(true);
    }
  }, []);

  // Generate insights when raw data changes
  useEffect(() => {
    if (rawData) {
      const data = generateInsightsData(rawData);
      setInsights(data);
    }
  }, [rawData]);

  const columns = useMemo(() => discoverColumns(rawData), [rawData]);

  // Regional performance with timeframe filtering
  const filteredRegionalPerformance = useMemo<DepartmentRegionalPerformance | null>(() => {
    if (!rawData.trips || rawData.trips.length === 0) return null;
    return analyzeRegionalPerformance(rawData.trips, regionalTimeframe);
  }, [rawData.trips, regionalTimeframe]);

  const filteredAgentRegionalAnalysis = useMemo<AgentRegionalAnalysis[]>(() => {
    if (!rawData.trips || rawData.trips.length === 0 || !filteredRegionalPerformance) return [];
    return analyzeAgentRegionalDeviations(rawData.trips, filteredRegionalPerformance, regionalTimeframe);
  }, [rawData.trips, filteredRegionalPerformance, regionalTimeframe]);

  const selectedAgentAnalysis = useMemo(() => {
    return filteredAgentRegionalAnalysis.find(a => a.agentName === selectedAgentForRegions);
  }, [filteredAgentRegionalAnalysis, selectedAgentForRegions]);

  const departmentRecommendations = useMemo<DepartmentImprovementRecommendation[]>(() => {
    if (!filteredRegionalPerformance) return [];
    return generateDepartmentRecommendations(filteredRegionalPerformance);
  }, [filteredRegionalPerformance]);

  const handleSaveApiKey = useCallback(() => {
    if (apiKey) {
      saveAnthropicApiKey(apiKey);
      setApiKeySaved(true);
    }
  }, [apiKey]);

  const handleGenerateAIAnalysis = useCallback(async () => {
    if (!insights || !apiKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateAIInsights(insights, apiKey);
      setAiAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI analysis');
    } finally {
      setIsLoading(false);
    }
  }, [insights, apiKey]);

  const renderAnalysis = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={index} className="font-bold text-white mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="ml-4 text-slate-300 mb-1">
            {line.substring(2)}
          </li>
        );
      }
      if (line.trim()) {
        return (
          <p key={index} className="text-slate-300 mb-2">
            {line}
          </p>
        );
      }
      return null;
    });
  };

  if (!insights) {
    return (
      <div className="text-center py-16 text-slate-400">
        Loading insights...
      </div>
    );
  }

  const selectedAgentReasons = insights.agentNonValidated.find(
    a => a.agentName === selectedAgentForReasons
  );

  // Section Header component for consistency
  const SectionHeader = ({
    title,
    icon,
    iconColor,
    section,
    subtitle
  }: {
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    section: string;
    subtitle?: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconColor} rounded-lg`}>
          {icon}
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <svg
        className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections[section] ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Department Insights
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Statistical analysis and AI-powered recommendations
          </p>
        </div>
        <button
          onClick={() => setShowColumns(!showColumns)}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          {showColumns ? 'Hide' : 'Show'} columns
        </button>
      </div>

      {/* Column Discovery (debug) */}
      {showColumns && (
        <div className="bg-slate-900/50 rounded-xl p-4 text-xs">
          <h4 className="font-medium text-slate-300 mb-2">Available Columns by File:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(columns).map(([file, cols]) => (
              <div key={file}>
                <span className="text-indigo-400 font-medium">{file}:</span>
                <ul className="text-slate-500 mt-1">
                  {cols.slice(0, 8).map(col => (
                    <li key={col} className="truncate">{col}</li>
                  ))}
                  {cols.length > 8 && <li>...+{cols.length - 8} more</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-800/40 rounded-lg p-3 text-center border border-slate-700/30">
          <div className="text-lg font-bold text-white">{insights.totalPassthroughs.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Passthroughs</div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3 text-center border border-slate-700/30">
          <div className="text-lg font-bold text-white">{insights.totalHotPass.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Hot Passes</div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3 text-center border border-slate-700/30">
          <div className="text-lg font-bold text-white">{insights.totalBookings.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Bookings</div>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3 text-center border border-slate-700/30">
          <div className="text-lg font-bold text-white">{insights.totalNonValidated.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Non-Validated</div>
        </div>
      </div>

      {/* ==================== TIMING INSIGHTS SECTION ==================== */}
      <div className="space-y-4">
        <SectionHeader
          title="Timing Insights"
          icon={<svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
          iconColor="bg-purple-500/20"
          section="timing"
          subtitle="Best days and times for passthroughs and hot passes"
        />

        {expandedSections.timing && (
          <div className="space-y-4 pl-2 border-l-2 border-purple-500/20">
            {/* Best Day/Time Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {insights.bestPassthroughDay && (
                <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-lg p-3 border border-indigo-500/30">
                  <div className="text-xs text-indigo-300 mb-1">Best Day - Passthroughs</div>
                  <div className="text-lg font-bold text-white">{insights.bestPassthroughDay}</div>
                  <div className="text-xs text-slate-400">{insights.passthroughsByDay[0]?.percentage.toFixed(0)}% of total</div>
                </div>
              )}
              {insights.bestPassthroughTime && (
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-3 border border-purple-500/30">
                  <div className="text-xs text-purple-300 mb-1">Best Time - Passthroughs</div>
                  <div className="text-lg font-bold text-white">{insights.bestPassthroughTime.split(' ')[0]}</div>
                  <div className="text-xs text-slate-400">{insights.passthroughsByTime[0]?.percentage.toFixed(0)}% of total</div>
                </div>
              )}
              {insights.bestHotPassDay && (
                <div className="bg-gradient-to-br from-orange-600/20 to-amber-600/20 rounded-lg p-3 border border-orange-500/30">
                  <div className="text-xs text-orange-300 mb-1">Best Day - Hot Passes</div>
                  <div className="text-lg font-bold text-white">{insights.bestHotPassDay}</div>
                  <div className="text-xs text-slate-400">{insights.hotPassByDay[0]?.percentage.toFixed(0)}% of total</div>
                </div>
              )}
              {insights.bestHotPassTime && (
                <div className="bg-gradient-to-br from-amber-600/20 to-yellow-600/20 rounded-lg p-3 border border-amber-500/30">
                  <div className="text-xs text-amber-300 mb-1">Best Time - Hot Passes</div>
                  <div className="text-lg font-bold text-white">{insights.bestHotPassTime.split(' ')[0]}</div>
                  <div className="text-xs text-slate-400">{insights.hotPassByTime[0]?.percentage.toFixed(0)}% of total</div>
                </div>
              )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Passthroughs by Day */}
              {insights.passthroughsByDay.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Passthroughs by Day</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={insights.passthroughsByDay.map(d => ({ ...d, label: `${d.percentage.toFixed(0)}%` }))}>
                      <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} activeBar={false}>
                        {insights.passthroughsByDay.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Hot Passes by Day */}
              {insights.hotPassByDay.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Hot Passes by Day</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={insights.hotPassByDay.map(d => ({ ...d, label: `${d.percentage.toFixed(0)}%` }))}>
                      <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#f97316" activeBar={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Passthroughs by Time */}
              {insights.hasTimeData && insights.passthroughsByTime.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Passthroughs by Time</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={insights.passthroughsByTime} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="timeSlot" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} activeBar={false}>
                        {insights.passthroughsByTime.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Hot Passes by Time */}
              {insights.hasHotPassTimeData && insights.hotPassByTime.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Hot Passes by Time</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={insights.hotPassByTime} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="timeSlot" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#f59e0b" activeBar={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== REGIONAL PERFORMANCE SECTION ==================== */}
      <div className="space-y-4">
        <SectionHeader
          title="Regional Performance"
          icon={<svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
          iconColor="bg-teal-500/20"
          section="regional"
          subtitle="T>P conversion rates by region with improvement opportunities"
        />

        {expandedSections.regional && filteredRegionalPerformance && filteredRegionalPerformance.allRegions.length > 0 && (
          <div className="space-y-4 pl-2 border-l-2 border-teal-500/20">
            {/* Timeframe Toggle */}
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
              {[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'quarter', label: 'Quarter' },
                { value: 'ytd', label: 'YTD' },
                { value: 'all', label: 'All' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRegionalTimeframe(value as RegionalTimeframe)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    regionalTimeframe === value
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

          {/* Department Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-white">{filteredRegionalPerformance.totalTrips.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Total Trips</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-white">{filteredRegionalPerformance.totalPassthroughs.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Passthroughs</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-teal-400">{filteredRegionalPerformance.overallTpRate.toFixed(1)}%</div>
              <div className="text-sm text-slate-400">Overall T&gt;P Rate</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-2xl font-bold text-white">{filteredRegionalPerformance.allRegions.length}</div>
              <div className="text-sm text-slate-400">Regions Tracked</div>
            </div>
          </div>

          {/* Top & Bottom Regions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Performing Regions */}
            <div className="bg-gradient-to-br from-teal-600/20 to-emerald-600/20 rounded-xl p-4 border border-teal-500/30">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h4 className="text-sm font-medium text-teal-300">Top Performing Regions</h4>
              </div>
              <div className="space-y-2">
                {filteredRegionalPerformance.topRegions.slice(0, 5).map((region, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-teal-400 font-bold w-5">{i + 1}.</span>
                      <span className="text-sm text-white truncate max-w-[180px]">{region.region}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-teal-400">{region.tpRate.toFixed(1)}%</span>
                      <span className="text-xs text-slate-500 ml-2">({region.passthroughs}/{region.trips})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Performing Regions */}
            <div className="bg-gradient-to-br from-rose-600/20 to-red-600/20 rounded-xl p-4 border border-rose-500/30">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                <h4 className="text-sm font-medium text-rose-300">Needs Improvement</h4>
              </div>
              <div className="space-y-2">
                {filteredRegionalPerformance.bottomRegions.slice(0, 5).map((region, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-400 font-bold w-5">{filteredRegionalPerformance.allRegions.length - 4 + i}.</span>
                      <span className="text-sm text-white truncate max-w-[180px]">{region.region}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-rose-400">{region.tpRate.toFixed(1)}%</span>
                      <span className="text-xs text-slate-500 ml-2">({region.passthroughs}/{region.trips})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regional Performance Full List */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-300 mb-4">
              All Regions by T&gt;P Rate ({filteredRegionalPerformance.allRegions.length} regions)
            </h4>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                    <th className="pb-2 pl-2">#</th>
                    <th className="pb-2">Region</th>
                    <th className="pb-2 text-right">T&gt;P Rate</th>
                    <th className="pb-2 text-right">Trips</th>
                    <th className="pb-2 text-right pr-2">Passthroughs</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegionalPerformance.allRegions.map((region, index) => {
                    const isTop = index < 3;
                    const isBottom = index >= filteredRegionalPerformance.allRegions.length - 3;
                    const rateColor = isTop ? 'text-teal-400' : isBottom ? 'text-rose-400' : 'text-white';
                    return (
                      <tr
                        key={region.region}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-2 pl-2 text-xs text-slate-500">{index + 1}</td>
                        <td className="py-2 text-sm text-slate-200">{region.region}</td>
                        <td className={`py-2 text-right text-sm font-medium ${rateColor}`}>
                          {region.tpRate.toFixed(1)}%
                        </td>
                        <td className="py-2 text-right text-sm text-slate-400">{region.trips}</td>
                        <td className="py-2 text-right text-sm text-slate-400 pr-2">{region.passthroughs}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Improvement Recommendations */}
          {departmentRecommendations.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl p-4 border border-indigo-600/30">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h4 className="text-sm font-medium text-indigo-300">Department Focus Areas</h4>
                <span className="text-xs text-indigo-500/70">Regions with highest improvement potential</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {departmentRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 border ${
                      rec.priority === 'high'
                        ? 'bg-rose-900/30 border-rose-600/40'
                        : rec.priority === 'medium'
                        ? 'bg-amber-900/30 border-amber-600/40'
                        : 'bg-slate-800/50 border-slate-600/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        rec.priority === 'high'
                          ? 'bg-rose-500/30 text-rose-300'
                          : rec.priority === 'medium'
                          ? 'bg-amber-500/30 text-amber-300'
                          : 'bg-slate-500/30 text-slate-300'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="text-white font-medium text-sm truncate">{rec.region}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">
                        <span className="text-rose-400 font-medium">{rec.tpRate.toFixed(1)}%</span>
                        <span className="text-slate-500 mx-1">vs</span>
                        <span className="text-slate-300">{rec.departmentAvgRate.toFixed(1)}% avg</span>
                      </div>
                      <span className="text-xs text-rose-400">{rec.deviation.toFixed(1)}pp</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{rec.reason}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{rec.trips} trips</span>
                      {rec.potentialGain > 0 && (
                        <span className="text-teal-400">+{Math.round(rec.potentialGain)} potential</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Regional Performance with Deviations */}
          {filteredAgentRegionalAnalysis.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h4 className="text-sm font-medium text-slate-300 mb-4">Agent Regional Performance vs Department</h4>
              <div className="space-y-4">
                <select
                  value={selectedAgentForRegions}
                  onChange={(e) => setSelectedAgentForRegions(e.target.value)}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white min-w-[250px]"
                >
                  <option value="">Select agent to analyze...</option>
                  {filteredAgentRegionalAnalysis.map(a => (
                    <option key={a.agentName} value={a.agentName}>
                      {a.agentName} ({a.totalTrips} trips, {a.overallTpRate.toFixed(1)}% T&gt;P)
                    </option>
                  ))}
                </select>

                {selectedAgentAnalysis && (
                  <div className="space-y-6">
                    {/* Agent Overview */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-lg text-white font-medium">{selectedAgentAnalysis.agentName}</div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-slate-400">{selectedAgentAnalysis.totalTrips} trips</span>
                        <span className="text-teal-400 font-medium">{selectedAgentAnalysis.overallTpRate.toFixed(1)}% T&gt;P</span>
                        <span className="text-slate-500">
                          (Dept avg: {filteredRegionalPerformance?.overallTpRate.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Above/Below Department Average */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Above Average Regions */}
                      <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-700/30">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          <span className="text-sm font-medium text-teal-300">Above Department Average</span>
                          <span className="text-xs text-teal-500">({selectedAgentAnalysis.aboveAverage.length} regions)</span>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                          {selectedAgentAnalysis.aboveAverage.slice(0, 10).map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-slate-800/50 rounded px-2 py-1.5">
                              <span className="text-slate-200 truncate max-w-[140px]">{d.region}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white">{d.agentTpRate.toFixed(1)}%</span>
                                <span className="text-teal-400 text-xs font-medium">+{d.deviation.toFixed(1)}pp</span>
                              </div>
                            </div>
                          ))}
                          {selectedAgentAnalysis.aboveAverage.length === 0 && (
                            <div className="text-slate-500 text-xs">No regions above department average</div>
                          )}
                        </div>
                      </div>

                      {/* Below Average Regions */}
                      <div className="bg-rose-900/20 rounded-lg p-4 border border-rose-700/30">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <span className="text-sm font-medium text-rose-300">Below Department Average</span>
                          <span className="text-xs text-rose-500">({selectedAgentAnalysis.belowAverage.length} regions)</span>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                          {selectedAgentAnalysis.belowAverage.slice(0, 10).map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-slate-800/50 rounded px-2 py-1.5">
                              <span className="text-slate-200 truncate max-w-[140px]">{d.region}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-white">{d.agentTpRate.toFixed(1)}%</span>
                                <span className="text-rose-400 text-xs font-medium">{d.deviation.toFixed(1)}pp</span>
                              </div>
                            </div>
                          ))}
                          {selectedAgentAnalysis.belowAverage.length === 0 && (
                            <div className="text-slate-500 text-xs">No regions below department average</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Improvement Recommendations */}
                    {selectedAgentAnalysis.recommendations.length > 0 && (
                      <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-xl p-4 border border-amber-600/30">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <h5 className="text-sm font-medium text-amber-300">Recommended Focus Areas</h5>
                          <span className="text-xs text-amber-500/70">Based on deviation &amp; volume impact</span>
                        </div>
                        <div className="space-y-3">
                          {selectedAgentAnalysis.recommendations.map((rec, i) => (
                            <div
                              key={i}
                              className={`rounded-lg p-3 border ${
                                rec.priority === 'high'
                                  ? 'bg-rose-900/30 border-rose-600/40'
                                  : rec.priority === 'medium'
                                  ? 'bg-amber-900/30 border-amber-600/40'
                                  : 'bg-slate-800/50 border-slate-600/40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                      rec.priority === 'high'
                                        ? 'bg-rose-500/30 text-rose-300'
                                        : rec.priority === 'medium'
                                        ? 'bg-amber-500/30 text-amber-300'
                                        : 'bg-slate-500/30 text-slate-300'
                                    }`}>
                                      {rec.priority.toUpperCase()}
                                    </span>
                                    <span className="text-white font-medium">{rec.region}</span>
                                  </div>
                                  <p className="text-xs text-slate-400">{rec.reason}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-sm">
                                    <span className="text-white">{rec.agentTpRate.toFixed(1)}%</span>
                                    <span className="text-slate-500 mx-1">vs</span>
                                    <span className="text-slate-300">{rec.departmentTpRate.toFixed(1)}%</span>
                                  </div>
                                  <div className="text-xs text-rose-400 font-medium">{rec.deviation.toFixed(1)}pp gap</div>
                                  <div className="text-xs text-slate-500">{rec.agentTrips} agent / {rec.departmentTrips} dept trips</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>
        )}
      </div>

      {/* ==================== LEAD QUALITY SECTION ==================== */}
      {(insights.hasNonValidatedReasons || insights.agentNonValidated.length > 0) && (
        <div className="space-y-4">
          <SectionHeader
            title="Lead Quality"
            icon={<svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>}
            iconColor="bg-rose-500/20"
            section="leadQuality"
            subtitle="Non-validated lead analysis and reasons"
          />

          {expandedSections.leadQuality && (
            <div className="space-y-4 pl-2 border-l-2 border-rose-500/20">
              {/* Non-Validated Reasons */}
              {insights.hasNonValidatedReasons && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Top Non-Validated Reasons</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={insights.topNonValidatedReasons.slice(0, 6).map(r => ({
                              name: r.reason,
                              value: r.count,
                              pct: r.percentage,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({ payload }) => `${(payload?.pct as number)?.toFixed(0) || 0}%`}
                            labelLine={false}
                          >
                            {insights.topNonValidatedReasons.slice(0, 6).map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {insights.topNonValidatedReasons.slice(0, 6).map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs text-slate-300 truncate max-w-[150px]">{r.reason}</span>
                          </div>
                          <span className="text-xs font-medium text-white">{r.percentage.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Agent-Level Non-Validated */}
              {insights.agentNonValidated.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">By Agent</h4>
                  <div className="flex flex-wrap gap-4">
                    <select
                      value={selectedAgentForReasons}
                      onChange={(e) => setSelectedAgentForReasons(e.target.value)}
                      className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select agent...</option>
                      {insights.agentNonValidated.map(a => (
                        <option key={a.agentName} value={a.agentName}>
                          {a.agentName} ({a.total})
                        </option>
                      ))}
                    </select>

                    {selectedAgentReasons && (
                      <div className="flex-1 min-w-[300px]">
                        <div className="text-sm text-white mb-2">
                          <strong>{selectedAgentReasons.agentName}</strong> - {selectedAgentReasons.total} non-validated
                        </div>
                        <div className="space-y-1">
                          {selectedAgentReasons.topReasons.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">{r.reason}</span>
                              <span className="text-white">{r.count} ({r.percentage.toFixed(1)}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== AI ANALYSIS SECTION ==================== */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI-Powered Analysis
        </h3>

        {!apiKeySaved && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Anthropic API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerateAIAnalysis}
          disabled={isLoading || !apiKey}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate AI Insights
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {aiAnalysis && (
          <div className="mt-6 p-6 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div className="prose prose-invert prose-sm max-w-none">
              <ul className="list-none p-0 m-0">{renderAnalysis(aiAnalysis)}</ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
