import React, { useState } from 'react';

interface SeniorManagementProps {
  seniors: string[];
  onSeniorsChange: (seniors: string[]) => void;
  availableAgents: string[];
}

export const SeniorManagement: React.FC<SeniorManagementProps> = ({
  seniors,
  onSeniorsChange,
  availableAgents,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSenior = (agentName: string) => {
    if (seniors.includes(agentName)) {
      onSeniorsChange(seniors.filter(s => s !== agentName));
    } else {
      onSeniorsChange([...seniors, agentName]);
    }
  };

  const nonSeniorAgents = availableAgents.filter(a => !seniors.includes(a));
  const seniorAgents = availableAgents.filter(a => seniors.includes(a));

  if (availableAgents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 transition-all"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="font-bold text-lg">Senior Designation</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {seniors.length} seniors
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
          <p className="text-sm text-gray-600 mb-4">
            Click on an agent to toggle their Senior designation. Seniors will be tracked separately in Team Comparison and can be filtered in KPI Results.
          </p>

          {seniorAgents.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Seniors ({seniorAgents.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {seniorAgents.map(agent => (
                  <button
                    key={agent}
                    onClick={() => toggleSenior(agent)}
                    className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {agent}
                    <svg className="w-3 h-3 ml-1 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">
              Non-Seniors ({nonSeniorAgents.length})
            </h4>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {nonSeniorAgents.map(agent => (
                <button
                  key={agent}
                  onClick={() => toggleSenior(agent)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-amber-100 hover:text-amber-800 transition-colors"
                >
                  {agent}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
