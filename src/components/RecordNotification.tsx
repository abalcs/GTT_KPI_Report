import { useEffect, useState, useCallback } from 'react';
import type { RecordUpdate } from '../utils/recordsTracker';
import { formatMetricName, formatPeriodName, formatRecordValue } from '../utils/recordsTracker';

interface RecordNotificationProps {
  updates: RecordUpdate[];
  onDismiss: () => void;
}

export const RecordNotification: React.FC<RecordNotificationProps> = ({ updates, onDismiss }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const currentUpdate = updates[currentIndex];

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  }, [onDismiss]);

  // Auto-dismiss after showing all updates
  useEffect(() => {
    if (!currentUpdate) {
      // Defer state update to avoid synchronous setState in effect
      const timeout = setTimeout(handleDismiss, 0);
      return () => clearTimeout(timeout);
    }

    // Auto-advance to next notification after 5 seconds
    const timer = setTimeout(() => {
      if (currentIndex < updates.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        handleDismiss();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, updates.length, currentUpdate, handleDismiss]);

  const handleNext = () => {
    if (currentIndex < updates.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleDismiss();
    }
  };

  if (!isVisible || !currentUpdate) return null;

  const isRate = ['tq', 'tp', 'pq'].includes(currentUpdate.metric);
  const metricColor = {
    trips: 'from-blue-600 to-blue-700',
    quotes: 'from-green-600 to-green-700',
    passthroughs: 'from-purple-600 to-purple-700',
    tq: 'from-emerald-600 to-emerald-700',
    tp: 'from-cyan-600 to-cyan-700',
    pq: 'from-pink-600 to-pink-700',
  }[currentUpdate.metric] || 'from-yellow-600 to-yellow-700';

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className={`bg-gradient-to-r ${metricColor} rounded-xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="px-4 py-2 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-300 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className="text-white font-bold text-sm">New Personal Record!</span>
          </div>
          <div className="flex items-center gap-2">
            {updates.length > 1 && (
              <span className="text-white/70 text-xs">
                {currentIndex + 1} of {updates.length}
              </span>
            )}
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-lg">
                {currentUpdate.agentName}
              </div>
              <div className="text-white/90 text-sm">
                {formatPeriodName(currentUpdate.period)} {formatMetricName(currentUpdate.metric)}
              </div>
            </div>
          </div>

          {/* Record Details */}
          <div className="mt-3 bg-black/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-white/60 text-xs mb-1">Previous</div>
                <div className="text-white/80 font-semibold">
                  {currentUpdate.previousValue !== null
                    ? formatRecordValue(currentUpdate.metric, currentUpdate.previousValue)
                    : '—'
                  }
                </div>
              </div>
              <div className="px-4">
                <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div className="text-center flex-1">
                <div className="text-yellow-300 text-xs mb-1">New Record!</div>
                <div className="text-yellow-300 font-bold text-xl">
                  {formatRecordValue(currentUpdate.metric, currentUpdate.newValue)}
                </div>
              </div>
            </div>

            {/* Improvement */}
            {currentUpdate.previousValue !== null && (
              <div className="mt-2 text-center">
                <span className="text-green-300 text-sm font-medium">
                  {isRate
                    ? `+${(currentUpdate.newValue - currentUpdate.previousValue).toFixed(1)} pp`
                    : `+${(currentUpdate.newValue - currentUpdate.previousValue).toLocaleString()}`
                  }
                  {' '}improvement
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {updates.length > 1 && currentIndex < updates.length - 1 && (
          <div className="px-4 pb-3">
            <button
              onClick={handleNext}
              className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Next Record ({updates.length - currentIndex - 1} more)
            </button>
          </div>
        )}

        {/* Progress bar */}
        <div className="h-1 bg-black/20">
          <div
            className="h-full bg-yellow-300 transition-all duration-100"
            style={{ width: `${((currentIndex + 1) / updates.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
