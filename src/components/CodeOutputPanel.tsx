import React, { useState } from 'react';
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

export const CodeOutputPanel: React.FC<CodeOutputPanelProps> = ({
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

  const lines = currentDisplayContent.split('\n');

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
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            id="tab-view-config"
            onClick={() => setActiveTab('config')}
            className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3 h-3" />
            <span>{t.output.activeTabConfig}</span>
          </button>

          {oneLinerBash && (
            <button
              id="tab-view-bash"
              onClick={() => setActiveTab('bash')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bash'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>{t.output.activeTabBash}</span>
            </button>
          )}

          {reloadCommand && (
            <button
              id="tab-view-reload"
              onClick={() => setActiveTab('reload')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reload'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t.output.activeTabReload}</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Copy Current / Config */}
          <button
            id="copy-config-btn"
            onClick={activeTab === 'bash' ? handleCopyBash : activeTab === 'reload' ? handleCopyReload : handleCopyConfig}
            aria-label={
              copiedConfig || copiedBash || copiedReload
                ? t.output.copied
                : activeTab === 'bash'
                ? t.output.copyBash
                : t.output.copyConfig
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              copiedConfig || copiedBash || copiedReload
                ? 'bg-emerald-600 text-white border border-emerald-500'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            {copiedConfig || copiedBash || copiedReload ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t.output.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{activeTab === 'bash' ? t.output.copyBash : t.output.copyConfig}</span>
              </>
            )}
          </button>

          {/* Download button for config */}
          <button
            id="download-conf-btn"
            onClick={handleDownload}
            aria-label={`${t.output.download} ${filename}`}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer"
            title={t.output.download}
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t.output.download}</span>
          </button>
        </div>
      </div>

      {/* Target path banner */}
      <div className="bg-[#090d16] px-4 py-1.5 border-b border-slate-800/70 text-[11px] text-slate-400 flex items-center justify-between font-mono" dir="ltr">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-slate-500"># target:</span>
          <span className="text-cyan-300/90 font-medium truncate">{targetPath}</span>
        </div>
        <div className="text-slate-500 shrink-0 text-[10px]">
          {lines.length} {t.output.lines} | {currentDisplayContent.length} {t.output.chars}
        </div>
      </div>

      {/* Code Editor Body - ALWAYS dir="ltr" and font-mono */}
      <div className="relative flex-1 overflow-auto bg-[#070b14] p-4 text-xs font-mono text-slate-200 leading-relaxed" dir="ltr">
        <div className="flex gap-3 min-w-max">
          {/* Line Numbers */}
          <div className="select-none text-right text-slate-600 font-mono pr-2 border-r border-slate-800/80 shrink-0">
            {lines.map((_, i) => (
              <div key={i} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Lines with Syntax Coloring */}
          <pre className="font-mono flex-1 leading-6 focus:outline-none">
            <code>
              {lines.map((line, i) => {
                const isComment = line.trim().startsWith('#') || line.trim().startsWith('//');
                const isSectionHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
                const isDirective = /^(listen|server_name|proxy_|ssl_|add_header|client_|net\.|fs\.)/.test(line.trim());
                const isCommand = line.trim().startsWith('sudo') || line.trim().startsWith('sysctl') || line.trim().startsWith('nginx');

                let lineClass = 'text-slate-200';
                if (isComment) lineClass = 'text-slate-500 italic';
                else if (isSectionHeader) lineClass = 'text-amber-400 font-bold';
                else if (isDirective) lineClass = 'text-emerald-300';
                else if (isCommand) lineClass = 'text-cyan-300 font-semibold';

                return (
                  <div key={i} className={`${lineClass} whitespace-pre`}>
                    {line || ' '}
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>

      {/* Quick One-Liner Bash Footer Bar */}
      {oneLinerBash && activeTab === 'config' && (
        <div className="bg-[#090d16] border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs">{t.output.copyBash}:</span>
          </div>
          <button
            id="quick-copy-bash-btn"
            onClick={handleCopyBash}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer"
          >
            {copiedBash ? <Check className="w-3 h-3 text-emerald-400" /> : <Terminal className="w-3 h-3 text-cyan-400" />}
            <span>{copiedBash ? t.output.copied : 'sudo bash -c ...'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
