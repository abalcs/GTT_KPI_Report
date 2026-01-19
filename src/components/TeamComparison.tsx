import React, { useState } from 'react';
import type { Metrics, Team } from '../types';

interface TeamComparisonProps {
  metrics: Metrics[];
  teams: Team[];
}

type SortKey = 'name' | 'trips' | 'quotes' | 'passthroughs' | 'tq' | 'tp' | 'pq' | 'hotPass';

const formatPercent = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
};

export const TeamComparison: React.FC<TeamComparisonProps> = ({ metrics, teams }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('trips');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  if (teams.length < 2) {
    return null;
  }

  const teamData = teams.map((team) => {
    const teamMetrics = metrics.filter((m) => team.agentNames.includes(m.agentName));
    const totals = teamMetrics.reduce(
      (acc, m) => ({
        trips: acc.trips + m.trips,
        quotes: acc.quotes + m.quotes,
        passthroughs: acc.passthroughs + m.passthroughs,
        hotPasses: acc.hotPasses + m.hotPasses,
      }),
      { trips: 0, quotes: 0, passthroughs: 0, hotPasses: 0 }
    );

    return {
      name: team.name,
      agentCount: team.agentNames.length,
      trips: totals.trips,
      quotes: totals.quotes,
      passthroughs: totals.passthroughs,
      tq: totals.trips > 0 ? (totals.quotes / totals.trips) * 100 : 0,
      tp: totals.trips > 0 ? (totals.passthroughs / totals.trips) * 100 : 0,
      pq: totals.passthroughs > 0 ? (totals.quotes / totals.passthroughs) * 100 : 0,
      hotPass: totals.passthroughs > 0 ? (totals.hotPasses / totals.passthroughs) * 100 : 0,
    };
  });

  const sortedTeams = [...teamData].sort((a, b) => {
    const modifier = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'name') {
      return a.name.localeCompare(b.name) * modifier;
    }
    return (a[sortKey] - b[sortKey]) * modifier;
  });

  const maxTrips = Math.max(...teamData.map(t => t.trips));
  const maxQuotes = Math.max(...teamData.map(t => t.quotes));
  const maxPassthroughs = Math.max(...teamData.map(t => t.passthroughs));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortButton = ({ label, sortKeyVal, color = 'gray' }: { label: string; sortKeyVal: SortKey; color?: string }) => (
    <button
      onClick={() => handleSort(sortKeyVal)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        sortKey === sortKeyVal
          ? `bg-${color}-600 text-white`
          : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
      }`}
    >
      {label}
      {sortKey === sortKeyVal && (
        <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-bold text-lg">Team Comparison</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {teams.length} teams
          </span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-sm text-gray-500 mr-2 self-center">Sort by:</span>
            <SortButton label="Name" sortKeyVal="name" />
            <SortButton label="Trips" sortKeyVal="trips" />
            <SortButton label="Quotes" sortKeyVal="quotes" />
            <SortButton label="Passthroughs" sortKeyVal="passthroughs" />
            <SortButton label="T>Q" sortKeyVal="tq" color="blue" />
            <SortButton label="T>P" sortKeyVal="tp" color="green" />
            <SortButton label="P>Q" sortKeyVal="pq" color="purple" />
            <SortButton label="Hot Pass" sortKeyVal="hotPass" color="orange" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTeams.map((team, idx) => (
              <div
                key={team.name}
                className={`relative p-5 rounded-xl border-2 ${
                  idx === 0 && sortKey !== 'name'
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {idx === 0 && sortKey !== 'name' && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    #1
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-800 mb-1">{team.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{team.agentCount} agents</p>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Trips</span>
                      <span className="font-semibold">{team.trips}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-500 rounded-full transition-all"
                        style={{ width: `${maxTrips > 0 ? (team.trips / maxTrips) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Quotes</span>
                      <span className="font-semibold">{team.quotes}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${maxQuotes > 0 ? (team.quotes / maxQuotes) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Passthroughs</span>
                      <span className="font-semibold">{team.passthroughs}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${maxPassthroughs > 0 ? (team.passthroughs / maxPassthroughs) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{formatPercent(team.tq)}</div>
                    <div className="text-xs text-gray-500">T&gt;Q</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{formatPercent(team.tp)}</div>
                    <div className="text-xs text-gray-500">T&gt;P</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{formatPercent(team.pq)}</div>
                    <div className="text-xs text-gray-500">P&gt;Q</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">{formatPercent(team.hotPass)}</div>
                    <div className="text-xs text-gray-500">Hot Pass</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
