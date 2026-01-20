import React from 'react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}) => {
  const hasFilter = startDate || endDate;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Date Range Filter</h3>
        </div>
        {hasFilter && (
          <button
            onClick={onClear}
            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all [color-scheme:dark]"
          />
        </div>

        <div className="flex items-center">
          {hasFilter ? (
            <div className="text-sm text-indigo-400 bg-indigo-500/10 px-4 py-2.5 rounded-lg border border-indigo-500/20 w-full text-center">
              <span className="font-medium">Active:</span> {startDate || 'Any'} to {endDate || 'Any'}
            </div>
          ) : (
            <div className="text-sm text-slate-500 px-4 py-2.5">
              No date filter applied
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs text-slate-500">
          Filters by Trip Created Date, Passthrough to Sales Date, and Quote First Sent Date.
        </p>
        <p className="text-xs text-slate-400">
          <strong>Tip:</strong> Both dates are inclusive. For a single day (e.g., Jan 18), set both Start and End to the same date.
        </p>
      </div>
    </div>
  );
};
