import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeId, ThemeOption } from '../types';
import {
  Palette,
  Check,
  X,
  Sun,
  Moon,
  Sparkles,
  Info,
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme, setTheme, themes, currentThemeOption } = useTheme();

  if (!isOpen) return null;

  const handleSelectTheme = (selectedId: ThemeId) => {
    setTheme(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Color Themes & Dark Modes</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                  {themes.length} Available
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose your favorite editor-grade dark theme or standard light mode.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
            title="Close theme selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Theme Banner */}
        <div className="px-6 py-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-indigo-950 font-medium">
            {currentThemeOption.isDark ? (
              <Moon className="w-4 h-4 text-indigo-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>Current Active Theme: <strong className="font-bold text-indigo-700">{currentThemeOption.name}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-indigo-600 font-semibold">{currentThemeOption.accentLabel}</span>
          </div>
        </div>

        {/* Themes Grid */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  id={`theme-option-${item.id}`}
                  onClick={() => handleSelectTheme(item.id)}
                  className={`group relative text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Header Row with Color Palette Swatch and Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </span>
                        {item.isDark ? (
                          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-200 text-[10px] rounded-md font-medium">
                            Dark
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-md font-medium">
                            Light
                          </span>
                        )}
                      </div>

                      {/* Active Checkmark Pill */}
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-indigo-400 shrink-0" />
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Palette Preview Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Swatches */}
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: item.bgHex }}
                        title={`Background: ${item.bgHex}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: item.surfaceHex }}
                        title={`Surface: ${item.surfaceHex}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: item.accentHex }}
                        title={`Primary Accent: ${item.accentHex}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: item.secondaryAccentHex }}
                        title={`Secondary Accent: ${item.secondaryAccentHex}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                        style={{ backgroundColor: item.textHex }}
                        title={`Text: ${item.textHex}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                      {item.accentLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Themes are automatically saved to your browser session.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
