import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { toggleTheme, isAudley } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium transition-colors ${
        isAudley ? 'text-white' : 'text-slate-500'
      }`}>
        AUDLEY
      </span>

      <button
        onClick={toggleTheme}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
          isAudley
            ? 'bg-[#4d726d]'
            : 'bg-slate-600'
        }`}
        title={`Switch to ${isAudley ? 'dark' : 'Audley'} theme`}
        aria-label={`Current theme: ${isAudley ? 'Audley' : 'Dark'}. Click to switch.`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
            isAudley ? 'left-1' : 'translate-x-6 left-1'
          }`}
        />
      </button>

      <span className={`text-xs font-medium transition-colors ${
        !isAudley ? 'text-slate-300' : 'text-slate-500'
      }`}>
        Dark
      </span>
    </div>
  );
};
