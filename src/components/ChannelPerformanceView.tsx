import { useState, useMemo } from 'react';
import type { RawParsedData } from '../utils/indexedDB';
import {
  analyzeRepeatClientPerformance,
  analyzeRepeatClientPerformanceByAgent,
  analyzeB2BPerformance,
  analyzeB2BPerformanceByAgent,
  type RegionalTimeframe,
  type DepartmentClientSegmentPerformance,
  type AgentClientSegmentPerformance,
} from '../utils/insightsAnalytics';

interface ChannelPerformanceViewProps {
  rawData: RawParsedData;
  seniors: string[];
}

export const ChannelPerformanceView: React.FC<ChannelPerformanceViewProps> = ({ rawData, seniors }) => {
  const [repeatTimeframe, setRepeatTimeframe] = useState<RegionalTimeframe>('all');
  const [b2bTimeframe, setB2bTimeframe] = useState<RegionalTimeframe>('all');
  const [selectedAgentForRepeat, setSelectedAgentForRepeat] = useState<string>('');
  const [selectedAgentForB2B, setSelectedAgentForB2B] = useState<string>('');

  // Repeat client performance analysis
  const repeatClientPerformance = useMemo<DepartmentClientSegmentPerformance | null>(() => {
    if (!rawData.trips || rawData.trips.length === 0) return null;
    return analyzeRepeatClientPerformance(rawData.trips, repeatTimeframe);
  }, [rawData.trips, repeatTimeframe]);

  const repeatClientByAgent = useMemo<AgentClientSegmentPerformance[]>(() => {
    if (!rawData.trips || rawData.trips.length === 0) return [];
    return analyzeRepeatClientPerformanceByAgent(rawData.trips, repeatTimeframe);
  }, [rawData.trips, repeatTimeframe]);

  const selectedRepeatAgentData = useMemo(() => {
    return repeatClientByAgent.find(a => a.agentName === selectedAgentForRepeat);
  }, [repeatClientByAgent, selectedAgentForRepeat]);

  // B2B performance analysis
  const b2bPerformance = useMemo<DepartmentClientSegmentPerformance | null>(() => {
    if (!rawData.trips || rawData.trips.length === 0) return null;
    return analyzeB2BPerformance(rawData.trips, b2bTimeframe);
  }, [rawData.trips, b2bTimeframe]);

  const b2bByAgent = useMemo<AgentClientSegmentPerformance[]>(() => {
    if (!rawData.trips || rawData.trips.length === 0) return [];
    return analyzeB2BPerformanceByAgent(rawData.trips, b2bTimeframe);
  }, [rawData.trips, b2bTimeframe]);

  const selectedB2BAgentData = useMemo(() => {
    return b2bByAgent.find(a => a.agentName === selectedAgentForB2B);
  }, [b2bByAgent, selectedAgentForB2B]);

  // Create a Set for efficient senior lookup (case-insensitive)
  const seniorSet = useMemo(() => {
    return new Set(seniors.map(s => s.toLowerCase()));
  }, [seniors]);

  // Helper function to get T>P rate for repeat clients
  const getRepeatTpRate = (agent: AgentClientSegmentPerformance): number => {
    const repeatSeg = agent.segments.find(s => s.segment === 'Repeat');
    return repeatSeg?.tpRate ?? 0;
  };

  // Helper function to get T>P rate for B2B
  const getB2BTpRate = (agent: AgentClientSegmentPerformance): number => {
    const b2bSeg = agent.segments.find(s => s.segment === 'B2B');
    return b2bSeg?.tpRate ?? 0;
  };

  // Repeat client rankings by senior/non-senior
  const repeatAgentRankings = useMemo(() => {
    // Filter agents who have repeat client data
    const agentsWithRepeatData = repeatClientByAgent.filter(a => {
      const repeatSeg = a.segments.find(s => s.segment === 'Repeat');
      return repeatSeg && repeatSeg.trips >= 3; // Minimum 3 repeat trips for meaningful data
    });

    const seniorAgents = agentsWithRepeatData
      .filter(a => seniorSet.has(a.agentName.toLowerCase()))
      .sort((a, b) => getRepeatTpRate(b) - getRepeatTpRate(a));

    const nonSeniorAgents = agentsWithRepeatData
      .filter(a => !seniorSet.has(a.agentName.toLowerCase()))
      .sort((a, b) => getRepeatTpRate(b) - getRepeatTpRate(a));

    return {
      seniorTop3: seniorAgents.slice(0, 3),
      seniorBottom3: seniorAgents.slice(-3).reverse(),
      nonSeniorTop3: nonSeniorAgents.slice(0, 3),
      nonSeniorBottom3: nonSeniorAgents.slice(-3).reverse(),
    };
  }, [repeatClientByAgent, seniorSet]);

  // B2B rankings by senior/non-senior
  const b2bAgentRankings = useMemo(() => {
    // Filter agents who have B2B data
    const agentsWithB2BData = b2bByAgent.filter(a => {
      const b2bSeg = a.segments.find(s => s.segment === 'B2B');
      return b2bSeg && b2bSeg.trips >= 3; // Minimum 3 B2B trips for meaningful data
    });

    const seniorAgents = agentsWithB2BData
      .filter(a => seniorSet.has(a.agentName.toLowerCase()))
      .sort((a, b) => getB2BTpRate(b) - getB2BTpRate(a));

    const nonSeniorAgents = agentsWithB2BData
      .filter(a => !seniorSet.has(a.agentName.toLowerCase()))
      .sort((a, b) => getB2BTpRate(b) - getB2BTpRate(a));

    return {
      seniorTop3: seniorAgents.slice(0, 3),
      seniorBottom3: seniorAgents.slice(-3).reverse(),
      nonSeniorTop3: nonSeniorAgents.slice(0, 3),
      nonSeniorBottom3: nonSeniorAgents.slice(-3).reverse(),
    };
  }, [b2bByAgent, seniorSet]);

  const hasData = (repeatClientPerformance?.segments.length ?? 0) > 0 || (b2bPerformance?.segments.length ?? 0) > 0;

  if (!hasData) {
    return (
      <div className="text-center py-16 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p>No channel performance data available.</p>
        <p className="text-sm mt-2">Upload trip data with repeat client or B2B indicators to see this analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Channel Performance
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Repeat client and B2B conversion performance analysis
        </p>
      </div>

      {/* Repeat Client Performance */}
      {repeatClientPerformance && repeatClientPerformance.segments.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Repeat Client T&gt;P Performance
            </h3>
            {/* Timeframe Toggle */}
            <div className="flex flex-wrap gap-1 bg-slate-800/50 p-1 rounded-lg">
              {[
                { value: 'lastWeek', label: 'Last Wk' },
                { value: 'thisMonth', label: 'This Mo' },
                { value: 'lastMonth', label: 'Last Mo' },
                { value: 'thisQuarter', label: 'This Q' },
                { value: 'lastQuarter', label: 'Last Q' },
                { value: 'lastYear', label: 'Last Yr' },
                { value: 'all', label: 'All' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setRepeatTimeframe(value as RegionalTimeframe)}
                  className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                    repeatTimeframe === value
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Department Level Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {repeatClientPerformance.segments.map((seg) => (
              <div
                key={seg.segment}
                className={`rounded-lg p-4 border ${
                  seg.segment === 'Repeat'
                    ? 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border-emerald-500/30'
                    : 'bg-gradient-to-br from-slate-700/30 to-slate-800/30 border-slate-600/30'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">{seg.segment} Clients</div>
                <div className={`text-2xl font-bold ${seg.segment === 'Repeat' ? 'text-emerald-400' : 'text-white'}`}>
                  {seg.tpRate.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {seg.passthroughs}/{seg.trips} trips
                </div>
              </div>
            ))}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
              <div className="text-xs text-slate-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{repeatClientPerformance.totalTrips.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">trips analyzed</div>
            </div>
            {repeatClientPerformance.segments.length === 2 && (
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
                <div className="text-xs text-slate-400 mb-1">Difference</div>
                <div className={`text-2xl font-bold ${
                  (repeatClientPerformance.segments[0]?.tpRate || 0) > (repeatClientPerformance.segments[1]?.tpRate || 0)
                    ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {repeatClientPerformance.segments[0] && repeatClientPerformance.segments[1]
                    ? `${((repeatClientPerformance.segments[0].tpRate - repeatClientPerformance.segments[1].tpRate) > 0 ? '+' : '')}${(repeatClientPerformance.segments[0].tpRate - repeatClientPerformance.segments[1].tpRate).toFixed(1)}pp`
                    : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {repeatClientPerformance.segments[0]?.segment} vs {repeatClientPerformance.segments[1]?.segment}
                </div>
              </div>
            )}
          </div>

          {/* Agent Level Breakdown */}
          {repeatClientByAgent.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <h5 className="text-xs font-medium text-slate-400 mb-3">Agent Performance by Client Type</h5>
              <select
                value={selectedAgentForRepeat}
                onChange={(e) => setSelectedAgentForRepeat(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white mb-3"
              >
                <option value="">Select agent...</option>
                {repeatClientByAgent.map(a => (
                  <option key={a.agentName} value={a.agentName}>
                    {a.agentName} ({a.totalTrips} trips)
                  </option>
                ))}
              </select>

              {selectedRepeatAgentData && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedRepeatAgentData.segments.map(seg => (
                    <div
                      key={seg.segment}
                      className={`rounded-lg p-3 ${
                        seg.segment === 'Repeat' ? 'bg-emerald-900/30' : 'bg-slate-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{seg.segment}</span>
                        <span className={`text-lg font-bold ${seg.segment === 'Repeat' ? 'text-emerald-400' : 'text-white'}`}>
                          {seg.tpRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {seg.passthroughs} passthroughs / {seg.trips} trips
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agent Rankings by Senior/Non-Senior for Repeat Clients */}
          {(repeatAgentRankings.seniorTop3.length > 0 || repeatAgentRankings.nonSeniorTop3.length > 0) && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <h5 className="text-xs font-medium text-slate-400 mb-4">Agent Rankings - Repeat Client T&gt;P</h5>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Senior Agents */}
                {repeatAgentRankings.seniorTop3.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs text-emerald-400 font-medium">Senior Agents</div>
                    {/* Top 3 */}
                    <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700/30">
                      <div className="text-xs text-emerald-300 mb-2">Top Performers</div>
                      <div className="space-y-1.5">
                        {repeatAgentRankings.seniorTop3.map((agent, i) => {
                          const repeatSeg = agent.segments.find(s => s.segment === 'Repeat');
                          return (
                            <div key={agent.agentName} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 truncate max-w-[150px]">
                                <span className="text-emerald-400 mr-1">{i + 1}.</span>
                                {agent.agentName}
                              </span>
                              <span className="text-emerald-400 font-medium">{repeatSeg?.tpRate.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Bottom 3 */}
                    {repeatAgentRankings.seniorBottom3.length > 0 && (
                      <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700/30">
                        <div className="text-xs text-rose-300 mb-2">Needs Improvement</div>
                        <div className="space-y-1.5">
                          {repeatAgentRankings.seniorBottom3.map((agent) => {
                            const repeatSeg = agent.segments.find(s => s.segment === 'Repeat');
                            return (
                              <div key={agent.agentName} className="flex items-center justify-between text-sm">
                                <span className="text-slate-300 truncate max-w-[150px]">{agent.agentName}</span>
                                <span className="text-rose-400 font-medium">{repeatSeg?.tpRate.toFixed(1)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-Senior Agents */}
                {repeatAgentRankings.nonSeniorTop3.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 font-medium">Non-Senior Agents</div>
                    {/* Top 3 */}
                    <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700/30">
                      <div className="text-xs text-emerald-300 mb-2">Top Performers</div>
                      <div className="space-y-1.5">
                        {repeatAgentRankings.nonSeniorTop3.map((agent, i) => {
                          const repeatSeg = agent.segments.find(s => s.segment === 'Repeat');
                          return (
                            <div key={agent.agentName} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 truncate max-w-[150px]">
                                <span className="text-emerald-400 mr-1">{i + 1}.</span>
                                {agent.agentName}
                              </span>
                              <span className="text-emerald-400 font-medium">{repeatSeg?.tpRate.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Bottom 3 */}
                    {repeatAgentRankings.nonSeniorBottom3.length > 0 && (
                      <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700/30">
                        <div className="text-xs text-rose-300 mb-2">Needs Improvement</div>
                        <div className="space-y-1.5">
                          {repeatAgentRankings.nonSeniorBottom3.map((agent) => {
                            const repeatSeg = agent.segments.find(s => s.segment === 'Repeat');
                            return (
                              <div key={agent.agentName} className="flex items-center justify-between text-sm">
                                <span className="text-slate-300 truncate max-w-[150px]">{agent.agentName}</span>
                                <span className="text-rose-400 font-medium">{repeatSeg?.tpRate.toFixed(1)}%</span>
                              </div>
                            );
                          })}
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

      {/* B2B Performance */}
      {b2bPerformance && b2bPerformance.segments.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              B2B vs B2C T&gt;P Performance
            </h3>
            {/* Timeframe Toggle */}
            <div className="flex flex-wrap gap-1 bg-slate-800/50 p-1 rounded-lg">
              {[
                { value: 'lastWeek', label: 'Last Wk' },
                { value: 'thisMonth', label: 'This Mo' },
                { value: 'lastMonth', label: 'Last Mo' },
                { value: 'thisQuarter', label: 'This Q' },
                { value: 'lastQuarter', label: 'Last Q' },
                { value: 'lastYear', label: 'Last Yr' },
                { value: 'all', label: 'All' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setB2bTimeframe(value as RegionalTimeframe)}
                  className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                    b2bTimeframe === value
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Department Level Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {b2bPerformance.segments.map((seg) => (
              <div
                key={seg.segment}
                className={`rounded-lg p-4 border ${
                  seg.segment === 'B2B'
                    ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/30'
                    : 'bg-gradient-to-br from-slate-700/30 to-slate-800/30 border-slate-600/30'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">{seg.segment}</div>
                <div className={`text-2xl font-bold ${seg.segment === 'B2B' ? 'text-blue-400' : 'text-white'}`}>
                  {seg.tpRate.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {seg.passthroughs}/{seg.trips} trips
                </div>
              </div>
            ))}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
              <div className="text-xs text-slate-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{b2bPerformance.totalTrips.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">trips analyzed</div>
            </div>
            {b2bPerformance.segments.length === 2 && (
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
                <div className="text-xs text-slate-400 mb-1">Difference</div>
                <div className={`text-2xl font-bold ${
                  (b2bPerformance.segments[0]?.tpRate || 0) > (b2bPerformance.segments[1]?.tpRate || 0)
                    ? 'text-blue-400' : 'text-rose-400'
                }`}>
                  {b2bPerformance.segments[0] && b2bPerformance.segments[1]
                    ? `${((b2bPerformance.segments[0].tpRate - b2bPerformance.segments[1].tpRate) > 0 ? '+' : '')}${(b2bPerformance.segments[0].tpRate - b2bPerformance.segments[1].tpRate).toFixed(1)}pp`
                    : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {b2bPerformance.segments[0]?.segment} vs {b2bPerformance.segments[1]?.segment}
                </div>
              </div>
            )}
          </div>

          {/* Agent Level Breakdown */}
          {b2bByAgent.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <h5 className="text-xs font-medium text-slate-400 mb-3">Agent Performance by Business Type</h5>
              <select
                value={selectedAgentForB2B}
                onChange={(e) => setSelectedAgentForB2B(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white mb-3"
              >
                <option value="">Select agent...</option>
                {b2bByAgent.map(a => (
                  <option key={a.agentName} value={a.agentName}>
                    {a.agentName} ({a.totalTrips} trips)
                  </option>
                ))}
              </select>

              {selectedB2BAgentData && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedB2BAgentData.segments.map(seg => (
                    <div
                      key={seg.segment}
                      className={`rounded-lg p-3 ${
                        seg.segment === 'B2B' ? 'bg-blue-900/30' : 'bg-slate-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{seg.segment}</span>
                        <span className={`text-lg font-bold ${seg.segment === 'B2B' ? 'text-blue-400' : 'text-white'}`}>
                          {seg.tpRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {seg.passthroughs} passthroughs / {seg.trips} trips
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agent Rankings by Senior/Non-Senior for B2B */}
          {(b2bAgentRankings.seniorTop3.length > 0 || b2bAgentRankings.nonSeniorTop3.length > 0) && (
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
              <h5 className="text-xs font-medium text-slate-400 mb-4">Agent Rankings - B2B T&gt;P</h5>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Senior Agents */}
                {b2bAgentRankings.seniorTop3.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs text-blue-400 font-medium">Senior Agents</div>
                    {/* Top 3 */}
                    <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/30">
                      <div className="text-xs text-blue-300 mb-2">Top Performers</div>
                      <div className="space-y-1.5">
                        {b2bAgentRankings.seniorTop3.map((agent, i) => {
                          const b2bSeg = agent.segments.find(s => s.segment === 'B2B');
                          return (
                            <div key={agent.agentName} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 truncate max-w-[150px]">
                                <span className="text-blue-400 mr-1">{i + 1}.</span>
                                {agent.agentName}
                              </span>
                              <span className="text-blue-400 font-medium">{b2bSeg?.tpRate.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Bottom 3 */}
                    {b2bAgentRankings.seniorBottom3.length > 0 && (
                      <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700/30">
                        <div className="text-xs text-rose-300 mb-2">Needs Improvement</div>
                        <div className="space-y-1.5">
                          {b2bAgentRankings.seniorBottom3.map((agent) => {
                            const b2bSeg = agent.segments.find(s => s.segment === 'B2B');
                            return (
                              <div key={agent.agentName} className="flex items-center justify-between text-sm">
                                <span className="text-slate-300 truncate max-w-[150px]">{agent.agentName}</span>
                                <span className="text-rose-400 font-medium">{b2bSeg?.tpRate.toFixed(1)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Non-Senior Agents */}
                {b2bAgentRankings.nonSeniorTop3.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 font-medium">Non-Senior Agents</div>
                    {/* Top 3 */}
                    <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/30">
                      <div className="text-xs text-blue-300 mb-2">Top Performers</div>
                      <div className="space-y-1.5">
                        {b2bAgentRankings.nonSeniorTop3.map((agent, i) => {
                          const b2bSeg = agent.segments.find(s => s.segment === 'B2B');
                          return (
                            <div key={agent.agentName} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 truncate max-w-[150px]">
                                <span className="text-blue-400 mr-1">{i + 1}.</span>
                                {agent.agentName}
                              </span>
                              <span className="text-blue-400 font-medium">{b2bSeg?.tpRate.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Bottom 3 */}
                    {b2bAgentRankings.nonSeniorBottom3.length > 0 && (
                      <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700/30">
                        <div className="text-xs text-rose-300 mb-2">Needs Improvement</div>
                        <div className="space-y-1.5">
                          {b2bAgentRankings.nonSeniorBottom3.map((agent) => {
                            const b2bSeg = agent.segments.find(s => s.segment === 'B2B');
                            return (
                              <div key={agent.agentName} className="flex items-center justify-between text-sm">
                                <span className="text-slate-300 truncate max-w-[150px]">{agent.agentName}</span>
                                <span className="text-rose-400 font-medium">{b2bSeg?.tpRate.toFixed(1)}%</span>
                              </div>
                            );
                          })}
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
  );
};
