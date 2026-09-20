import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Download, Terminal, FileCode, Play, RefreshCw } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';

interface CodeOutputPanelProps {
  lang: Language;
  title?: string;
  configText: string;
  filename: string;
  targetPath: string;
  oneLinerBash?: string;
  reloadCommand?: string;
}

export const CodeOutputPanel: React.FC<CodeOutputPanelProps> = React.memo(({
  lang,
  title,
  configText,
  filename,
  targetPath,
  oneLinerBash,
  reloadCommand,
}) => {
  const t = translations[lang];
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedBash, setCopiedBash] = useState(false);
  const [copiedReload, setCopiedReload] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'bash' | 'reload'>('config');

  const availableTabs = (['config', oneLinerBash && 'bash', reloadCommand && 'reload'].filter(Boolean) as ('config' | 'bash' | 'reload')[]);

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'config' | 'bash' | 'reload') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = availableTabs.indexOf(currentTab);
      const direction = e.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + availableTabs.length) % availableTabs.length;
      const nextTab = availableTabs[nextIndex];
      setActiveTab(nextTab);
      document.getElementById(`tab-view-${nextTab}`)?.focus();
    }
  };

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(configText);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleCopyBash = async () => {
    if (!oneLinerBash) return;
    try {
      await navigator.clipboard.writeText(oneLinerBash);
      setCopiedBash(true);
      setTimeout(() => setCopiedBash(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleCopyReload = async () => {
    if (!reloadCommand) return;
    try {
      await navigator.clipboard.writeText(reloadCommand);
      setCopiedReload(true);
      setTimeout(() => setCopiedReload(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([configText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentDisplayContent =
    activeTab === 'config'
      ? configText
      : activeTab === 'bash'
      ? (oneLinerBash || '')
      : (reloadCommand || '');

  const parsedLines = React.useMemo(() => {
    return currentDisplayContent.split('\n').map((line) => {
      const trimmed = line.trim();
      let lineClass = 'text-slate-200';

      if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
        lineClass = 'text-slate-500 italic';
      } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        lineClass = 'text-amber-400 font-bold';
      } else if (/^(listen|server_name|proxy_|ssl_|add_header|client_|net\.|fs\.)/.test(trimmed)) {
        lineClass = 'text-emerald-300';
      } else if (trimmed.startsWith('sudo') || trimmed.startsWith('sysctl') || trimmed.startsWith('nginx')) {
        lineClass = 'text-cyan-300 font-semibold';
      }

      return { line, lineClass };
    });
  }, [currentDisplayContent]);

  const linesCount = parsedLines.length;

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="bg-[#0f172a]/90 border-b border-slate-800/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Title and active file path */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/30" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/30" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/30" />
          </div>
          <span className="text-slate-600 font-mono text-xs">|</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono" dir="ltr">
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-200">{filename}</span>
            <span className="relative flex h-1.5 w-1.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
            </span>
          </div>
        </div>

        {/* View Switcher Tabs with Animated Sliding Pill */}
        <div
          role="tablist"
          aria-label={t.output.title}
          className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-mono"
        >
          <button
            id="tab-view-config"
            role="tab"
            aria-selected={activeTab === 'config'}
            aria-controls="code-output-body"
            type="button"
            onClick={() => setActiveTab('config')}
            onKeyDown={(e) => handleTabKeyDown(e, 'config')}
            className={`relative px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              activeTab === 'config' ? 'text-emerald-200 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'config' && (
              <motion.div
                layoutId="codeViewTabPill"
                className="absolute inset-0 bg-emerald-500/20 rounded border border-emerald-500/40"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <FileCode className="w-3 h-3 relative z-10" />
            <span className="relative z-10">{t.output.activeTabConfig}</span>
          </button>

          {oneLinerBash && (
            <button
              id="tab-view-bash"
              role="tab"
              aria-selected={activeTab === 'bash'}
              aria-controls="code-output-body"
              type="button"
              onClick={() => setActiveTab('bash')}
              onKeyDown={(e) => handleTabKeyDown(e, 'bash')}
              className={`relative px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                activeTab === 'bash' ? 'text-cyan-200 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'bash' && (
                <motion.div
                  layoutId="codeViewTabPill"
                  className="absolute inset-0 bg-cyan-500/20 rounded border border-cyan-500/40"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <Terminal className="w-3 h-3 relative z-10" />
              <span className="relative z-10">{t.output.activeTabBash}</span>
            </button>
          )}

          {reloadCommand && (
            <button
              id="tab-view-reload"
              role="tab"
              aria-selected={activeTab === 'reload'}
              aria-controls="code-output-body"
              type="button"
              onClick={() => setActiveTab('reload')}
              onKeyDown={(e) => handleTabKeyDown(e, 'reload')}
              className={`relative px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                activeTab === 'reload' ? 'text-amber-200 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeTab === 'reload' && (
                <motion.div
                  layoutId="codeViewTabPill"
                  className="absolute inset-0 bg-amber-500/20 rounded border border-amber-500/40"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <RefreshCw className="w-3 h-3 relative z-10" />
              <span className="relative z-10">{t.output.activeTabReload}</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Copy Current / Config */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            id="copy-config-btn"
            onClick={activeTab === 'bash' ? handleCopyBash : activeTab === 'reload' ? handleCopyReload : handleCopyConfig}
            aria-label={
              copiedConfig || copiedBash || copiedReload
                ? t.output.copied
                : activeTab === 'bash'
                ? t.output.copyBash
                : t.output.copyConfig
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              copiedConfig || copiedBash || copiedReload
                ? 'bg-emerald-600 text-white border border-emerald-500 shadow-emerald-900/50 shadow-md'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copiedConfig || copiedBash || copiedReload ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.output.copied}</span>
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{activeTab === 'bash' ? t.output.copyBash : t.output.copyConfig}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Download button for config */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id="download-conf-btn"
            onClick={handleDownload}
            aria-label={`${t.output.download} ${filename}`}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            title={t.output.download}
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t.output.download}</span>
          </motion.button>
        </div>
      </div>

      {/* Target path banner */}
      <div className="bg-[#090d16] px-4 py-1.5 border-b border-slate-800/70 text-[11px] text-slate-400 flex items-center justify-between font-mono" dir="ltr">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-slate-500"># target:</span>
          <span className="text-cyan-300/90 font-medium truncate">{targetPath}</span>
        </div>
        <div className="text-slate-500 shrink-0 text-[10px]">
          {linesCount} {t.output.lines} | {currentDisplayContent.length} {t.output.chars}
        </div>
      </div>

      {/* Code Editor Body - ALWAYS dir="ltr" and font-mono */}
      <div
        id="code-output-body"
        className="relative flex-1 overflow-auto bg-[#070b14] p-4 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        tabIndex={0}
        role="region"
        aria-label={`${filename} - ${t.output.title}`}
        dir="ltr"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.3 }}
            transition={{ duration: 0.15 }}
            className="flex gap-3 min-w-max"
          >
            {/* Line Numbers */}
            <div className="select-none text-right text-slate-600 font-mono pr-2 border-r border-slate-800/80 shrink-0">
              {parsedLines.map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Lines with Syntax Coloring */}
            <pre className="font-mono flex-1 leading-6 focus:outline-none">
              <code>
                {parsedLines.map(({ line, lineClass }, i) => (
                  <div key={i} className={`${lineClass} whitespace-pre`}>
                    {line || ' '}
                  </div>
                ))}
              </code>
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick One-Liner Bash Footer Bar */}
      {oneLinerBash && activeTab === 'config' && (
        <div className="bg-[#090d16] border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs">{t.output.copyBash}:</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            id="quick-copy-bash-btn"
            onClick={handleCopyBash}
            aria-label={copiedBash ? t.output.copied : t.output.copyBash}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
          >
            {copiedBash ? <Check className="w-3 h-3 text-emerald-400" /> : <Terminal className="w-3 h-3 text-cyan-400" />}
            <span>{copiedBash ? t.output.copied : 'sudo bash -c ...'}</span>
          </motion.button>
        </div>
      )}

      {/* Screen Reader Live Region for Copy Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {(copiedConfig || copiedBash || copiedReload) && t.output.copied}
      </div>
    </div>
  );
});

CodeOutputPanel.displayName = 'CodeOutputPanel';
