import { useTheme, backgrounds } from '../context/ThemeContext';

const BackgroundSelector = () => {
  const { background, setBackground, showSelector, setShowSelector } = useTheme();

  if (!showSelector) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#112240] p-6 rounded-2xl w-80 shadow-2xl border border-gray-700/50 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Choose Background</h3>
          <button
            onClick={() => setShowSelector(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {backgrounds.map((bg) => (
            <button
              key={bg.id}
              onClick={() => {
                setBackground(bg.id);
                setShowSelector(false);
              }}
              className={`relative h-16 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                background === bg.id ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-[#112240]' : ''
              }`}
              style={{ background: bg.value }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <span className="absolute bottom-1 left-1 text-xs text-white/80 font-medium">
                {bg.name}
              </span>
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-xs mt-4 text-center">
          Select a background for your workspace
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BackgroundSelector;