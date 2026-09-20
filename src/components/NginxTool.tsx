import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Globe2, ArrowRightLeft, Lock, Sliders } from 'lucide-react';
import { Language, NginxSettings } from '../types';
import { translations } from '../i18n/translations';
import { generateNginxConfig, generateNginxOneLiner } from '../utils/nginxGenerator';
import { CodeOutputPanel } from './CodeOutputPanel';

interface NginxToolProps {
  lang: Language;
}

const BUFFERING_OPTIONS = ['enabled', 'disabled', 'stream'] as const;

export const NginxTool: React.FC<NginxToolProps> = React.memo(({ lang }) => {
  const t = translations[lang];

  const [settings, setSettings] = useState<NginxSettings>({
    domain: 'api.linuxnetwork.ir',
    serverAlias: '',
    upstreamType: 'http',
    upstreamAddress: '127.0.0.1:8080',
    listenPort: 80,
    enableSsl: true,
    sslCertPath: '',
    sslKeyPath: '',
    enableHttp2: true,
    enableWebsockets: true,
    clientMaxBodySize: 50,
    enableGzip: true,
    enableRealIpHeaders: true,
    proxyTimeout: 'standard',
    proxyBuffering: 'enabled',
    enableSecurityHeaders: true,
  });

  // Memoize expensive Nginx configuration and command calculations to avoid unnecessary string allocations and processing during re-renders
  const configText = useMemo(() => generateNginxConfig(settings, lang), [settings, lang]);
  const oneLinerBash = useMemo(() => generateNginxOneLiner(settings.domain, configText), [settings.domain, configText]);
  const safeFilename = useMemo(
    () => (settings.domain.trim() || 'api.example.com').replace(/[^a-zA-Z0-9_.-]/g, '_') + '.conf',
    [settings.domain]
  );
  const reloadCommand = `sudo nginx -t && sudo systemctl reload nginx`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form Controls */}
      <div className="lg:col-span-6 space-y-6">
        {/* Tool Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-medium">
              {t.nginx.badge}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            <span>{t.nginx.title}</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.nginx.subtitle}
          </p>
        </div>

        {/* Domain & Upstream Settings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          {/* Domain name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {t.nginx.domainLabel}
            </label>
            <input
              type="text"
              value={settings.domain}
              onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
              placeholder={t.nginx.domainPlaceholder}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              dir="ltr"
            />
          </div>

          {/* Server Aliases */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {t.nginx.serverAliasLabel}
            </label>
            <input
              type="text"
              value={settings.serverAlias}
              onChange={(e) => setSettings({ ...settings, serverAlias: e.target.value })}
              placeholder={t.nginx.serverAliasPlaceholder}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              dir="ltr"
            />
          </div>

          {/* Upstream Type & Address */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.nginx.upstreamTypeLabel}</span>
              </label>
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-mono" dir="ltr">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, upstreamType: 'http', upstreamAddress: '127.0.0.1:8080' })}
                  aria-pressed={settings.upstreamType === 'http'}
                  className={`relative px-2.5 py-1 rounded text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                    settings.upstreamType === 'http'
                      ? 'text-cyan-200 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {settings.upstreamType === 'http' && (
                    <motion.div
                      layoutId="nginxUpstreamType"
                      className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/40 rounded"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">TCP / HTTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, upstreamType: 'unix', upstreamAddress: '/run/gunicorn.sock' })}
                  aria-pressed={settings.upstreamType === 'unix'}
                  className={`relative px-2.5 py-1 rounded text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                    settings.upstreamType === 'unix'
                      ? 'text-cyan-200 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {settings.upstreamType === 'unix' && (
                    <motion.div
                      layoutId="nginxUpstreamType"
                      className="absolute inset-0 bg-cyan-500/20 border border-cyan-500/40 rounded"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">Unix Socket</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">
                {t.nginx.upstreamAddressLabel}
              </label>
              <input
                type="text"
                value={settings.upstreamAddress}
                onChange={(e) => setSettings({ ...settings, upstreamAddress: e.target.value })}
                placeholder={
                  settings.upstreamType === 'unix'
                    ? t.nginx.upstreamPlaceholderUnix
                    : t.nginx.upstreamPlaceholderHttp
                }
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* SSL / HTTPS Settings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>{t.nginx.sslSectionTitle}</span>
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableSsl}
                onChange={(e) => setSettings({ ...settings, enableSsl: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <span className="text-xs font-medium text-emerald-400">
                {settings.enableSsl ? 'SSL On' : 'Plain HTTP'}
              </span>
            </label>
          </div>

          {settings.enableSsl && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="text-[11px] text-emerald-400/90 bg-emerald-950/20 border border-emerald-800/30 p-2.5 rounded-lg">
                {t.nginx.certbotHint}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-mono">
                    {t.nginx.sslCertLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.sslCertPath}
                    onChange={(e) => setSettings({ ...settings, sslCertPath: e.target.value })}
                    placeholder={`/etc/letsencrypt/live/${settings.domain || 'domain'}/fullchain.pem`}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-mono">
                    {t.nginx.sslKeyLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.sslKeyPath}
                    onChange={(e) => setSettings({ ...settings, sslKeyPath: e.target.value })}
                    placeholder={`/etc/letsencrypt/live/${settings.domain || 'domain'}/privkey.pem`}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.enableHttp2}
                  onChange={(e) => setSettings({ ...settings, enableHttp2: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                />
                <span className="text-xs text-slate-200 font-mono">{t.nginx.http2}</span>
              </label>
            </div>
          )}
        </div>

        {/* WebSocket & Performance Toggles */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>تنظیمات پیشرفته و هدرها</span>
          </h3>

          {/* WebSockets */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.enableWebsockets}
              onChange={(e) => setSettings({ ...settings, enableWebsockets: e.target.checked })}
              className="mt-0.5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500/30"
            />
            <div className="text-xs">
              <div className="font-semibold text-slate-200 font-mono">{t.nginx.websockets}</div>
              <div className="text-slate-400 text-[11px] leading-relaxed">{t.nginx.websocketsDesc}</div>
            </div>
          </label>

          {/* Client Max Body Size */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="nginx-client-max-body-size" className="text-slate-300 font-semibold cursor-pointer">
                {t.nginx.clientMaxBodySize}:
              </label>
              <span className="font-mono text-cyan-400 font-bold">{settings.clientMaxBodySize} MB</span>
            </div>
            <input
              id="nginx-client-max-body-size"
              type="range"
              min="1"
              max="500"
              step="5"
              value={settings.clientMaxBodySize}
              onChange={(e) => setSettings({ ...settings, clientMaxBodySize: parseInt(e.target.value, 10) })}
              aria-label={t.nginx.clientMaxBodySize}
              aria-valuemin={1}
              aria-valuemax={500}
              aria-valuenow={settings.clientMaxBodySize}
              aria-valuetext={`${settings.clientMaxBodySize} MB`}
              className="w-full accent-cyan-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
            />
          </div>

          {/* Buffering Strategy */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              {t.nginx.bufferingLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {BUFFERING_OPTIONS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSettings({ ...settings, proxyBuffering: b })}
                  aria-pressed={settings.proxyBuffering === b}
                  className={`p-2 rounded border text-start transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                    settings.proxyBuffering === b
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold font-mono text-[11px] capitalize">{b}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles: Gzip, Real IP, Security */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableRealIpHeaders}
                onChange={(e) => setSettings({ ...settings, enableRealIpHeaders: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500"
              />
              <span className="text-xs text-slate-200 font-mono">{t.nginx.realIpHeaders}</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableGzip}
                onChange={(e) => setSettings({ ...settings, enableGzip: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500"
              />
              <span className="text-xs text-slate-200 font-mono">{t.nginx.gzip}</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableSecurityHeaders}
                onChange={(e) => setSettings({ ...settings, enableSecurityHeaders: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500"
              />
              <span className="text-xs text-slate-200 font-mono">{t.nginx.securityHeaders}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Live Output Panel */}
      <div className="lg:col-span-6 lg:sticky lg:top-24">
        <CodeOutputPanel
          lang={lang}
          configText={configText}
          filename={safeFilename}
          targetPath={`/etc/nginx/sites-available/${safeFilename}`}
          oneLinerBash={oneLinerBash}
          reloadCommand={reloadCommand}
        />
      </div>
    </div>
  );
});

NginxTool.displayName = 'NginxTool';
