import React from 'react';
import { motion } from 'motion/react';
import { Terminal, ShieldCheck, Globe, Github, Home, ArrowRight, ArrowLeft } from 'lucide-react';
import { Language, PageView, ToolTab } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  view: PageView;
  onNavigateLanding: () => void;
  onNavigateToolbox: (tool?: ToolTab) => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  lang,
  onToggleLang,
  view,
  onNavigateLanding,
  onNavigateToolbox,
}) => {
  const t = translations[lang];
  const isFa = lang === 'fa';
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

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
        {/* Brand & Tagline - Clickable to return to landing or reload */}
        <button
          type="button"
          onClick={onNavigateLanding}
          aria-label={isFa ? 'صفحه اصلی LinuxNetwork.ir' : 'LinuxNetwork.ir Home'}
          className="flex items-center gap-3 text-left rtl:text-right cursor-pointer group rounded-xl p-1 -m-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          title={isFa ? 'صفحه اصلی LinuxNetwork' : 'LinuxNetwork Home'}
        >
          <motion.div
            whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50"
          >
            <Terminal className="w-5 h-5" aria-hidden="true" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white font-mono dir-ltr group-hover:text-emerald-300 transition-colors">
                LinuxNetwork<span className="text-emerald-400">.ir</span>
              </span>
              <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                v{__APP_VERSION__}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {t.tagline}
            </p>
          </div>
        </button>

        {/* Actions, Navigation & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Switch Button: Toolbox vs Landing */}
          {view === 'landing' ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              id="btn-header-launch-toolbox"
              onClick={() => onNavigateToolbox('setup')}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              <span>{t.nav.launchToolbox}</span>
              <ArrowIcon className="w-3.5 h-3.5" aria-hidden="true" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              id="btn-header-go-home"
              onClick={onNavigateLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>{t.nav.home}</span>
            </motion.button>
          )}

          {/* Docs & Github links */}
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="https://github.com/SalarTaheri/LinuxNetwork"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t.github} (opens in new tab)`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t.github}</span>
          </motion.a>

          {/* Language Switch Toggle */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            id="lang-toggle-btn"
            onClick={onToggleLang}
            aria-label={`Switch Language / تغییر زبان (${lang === 'fa' ? 'Farsi' : 'English'})`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white shadow-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            title="Switch Language / تغییر زبان"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span className="font-semibold">{t.switchLang}</span>
            <span className="text-[10px] px-1 rounded bg-slate-700 text-slate-300 font-mono">
              {lang === 'fa' ? 'FA' : 'EN'}
            </span>
          </motion.button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
