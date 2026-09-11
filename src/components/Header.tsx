import React from 'react';
import { Terminal, ShieldCheck, Globe, Github, BookOpen, Cpu } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, onToggleLang }) => {
  const t = translations[lang];

  return (
    <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Privacy Banner */}
      <div className="bg-emerald-950/40 border-b border-emerald-800/30 px-4 py-1.5 text-xs text-emerald-300 flex items-center justify-center gap-2 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium tracking-wide">{t.privacyBanner}</span>
        <span className="hidden sm:inline text-emerald-500/70">|</span>
        <span className="hidden sm:inline text-emerald-400/80 text-[11px]">
          {t.privacyTooltip}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white font-mono dir-ltr">
                LinuxNetwork<span className="text-emerald-400">.ir</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                v2.4 LTS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Actions & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Docs & Github links */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all font-medium"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">{t.github}</span>
          </a>

          {/* Language Switch Toggle */}
          <button
            id="lang-toggle-btn"
            onClick={onToggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white shadow-sm transition-all cursor-pointer"
            title="Switch Language / تغییر زبان"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">{t.switchLang}</span>
            <span className="text-[10px] px-1 rounded bg-slate-700 text-slate-300 font-mono">
              {lang === 'fa' ? 'FA' : 'EN'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
