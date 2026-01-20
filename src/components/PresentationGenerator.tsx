import { useState, useCallback } from 'react';
import type { Metrics, Team } from '../types';
import { generatePresentation, getDefaultConfig, THEME_INFO, type PresentationConfig, type ThemeStyle } from '../utils/presentationGenerator';

interface PresentationGeneratorProps {
  metrics: Metrics[];
  seniors: string[];
  teams: Team[];
}

export const PresentationGenerator: React.FC<PresentationGeneratorProps> = ({
  metrics,
  seniors,
  teams,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<PresentationConfig>(getDefaultConfig);
  const [newCascade, setNewCascade] = useState('');

  // Find My Team to show preview
  const myTeam = teams.find(t => t.name.toLowerCase() === 'my team');
  const myTeamCount = myTeam?.agentNames.length || 0;
  const myTeamMetrics = metrics.filter(m =>
    myTeam?.agentNames.some(name => name.toLowerCase() === m.agentName.toLowerCase())
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generatePresentation(metrics, seniors, teams, config);
    } catch (error) {
      console.error('Failed to generate presentation:', error);
      alert('Failed to generate presentation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [metrics, seniors, teams, config]);

  const addCascade = useCallback(() => {
    if (newCascade.trim()) {
      setConfig(prev => ({
        ...prev,
        cascades: [...prev.cascades, newCascade.trim()],
      }));
      setNewCascade('');
    }
  }, [newCascade]);

  const removeCascade = useCallback((index: number) => {
    setConfig(prev => ({
      ...prev,
      cascades: prev.cascades.filter((_, i) => i !== index),
    }));
  }, []);

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={metrics.length === 0}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8" />
        </svg>
        Generate Slides
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Generate Team Huddle</h2>
            <p className="text-slate-400 text-sm mt-1">Customize your presentation settings</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Team Name & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
              <input
                type="text"
                value={config.teamName}
                onChange={(e) => setConfig(prev => ({ ...prev, teamName: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Team GTT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Date</label>
              <input
                type="date"
                value={formatDateForInput(config.meetingDate)}
                onChange={(e) => setConfig(prev => ({ ...prev, meetingDate: new Date(e.target.value) }))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Presentation Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(THEME_INFO) as ThemeStyle[]).map((themeKey) => {
                const theme = THEME_INFO[themeKey];
                const isSelected = config.theme === themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => setConfig(prev => ({ ...prev, theme: themeKey }))}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                    }`}
                  >
                    <div className="flex gap-1">
                      {theme.preview.map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: `#${color}` }}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {theme.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {theme.description}
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly Goals Per Person */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Weekly Goals (per person)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.weeklyGoalPassthroughsPerPerson}
                    onChange={(e) => setConfig(prev => ({ ...prev, weeklyGoalPassthroughsPerPerson: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-slate-400 text-sm">Passthroughs</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Team goal: {config.weeklyGoalPassthroughsPerPerson * myTeamCount}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.weeklyGoalQuotesPerPerson}
                    onChange={(e) => setConfig(prev => ({ ...prev, weeklyGoalQuotesPerPerson: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-slate-400 text-sm">Quotes</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Team goal: {config.weeklyGoalQuotesPerPerson * myTeamCount}
                </p>
              </div>
            </div>
          </div>

          {/* Cascades */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cascades & Announcements
            </label>
            <div className="space-y-2">
              {config.cascades.map((cascade, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-900 rounded-lg p-3">
                  <span className="flex-1 text-white text-sm">{cascade}</span>
                  <button
                    onClick={() => removeCascade(index)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCascade}
                  onChange={(e) => setNewCascade(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCascade()}
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Add a cascade or announcement..."
                />
                <button
                  onClick={addCascade}
                  disabled={!newCascade.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Data Summary - My Team */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              My Team Preview
              {!myTeam && (
                <span className="text-amber-400 ml-2 text-xs">(Create a team named "My Team" to filter data)</span>
              )}
            </h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{myTeamCount}</div>
                <div className="text-xs text-slate-400">Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-400">
                  {myTeamMetrics.reduce((sum, m) => sum + m.passthroughs, 0)}
                </div>
                <div className="text-xs text-slate-400">Passthroughs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {myTeamMetrics.reduce((sum, m) => sum + m.quotes, 0)}
                </div>
                <div className="text-xs text-slate-400">Quotes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {myTeamMetrics.reduce((sum, m) => sum + m.bookings, 0)}
                </div>
                <div className="text-xs text-slate-400">Bookings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || metrics.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Presentation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
