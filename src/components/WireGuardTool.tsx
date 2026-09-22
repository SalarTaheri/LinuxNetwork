import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Shield, Key, RefreshCw, Smartphone, Server } from 'lucide-react';
import { Language, WireGuardSettings } from '../types';
import { translations } from '../i18n/translations';
import { generateWireGuardKeyPair } from '../utils/crypto';
import {
  generateWireGuardServerConfig,
  generateWireGuardClientConfig,
  generateWireGuardServerOneLiner,
} from '../utils/wireguardGenerator';
import { CodeOutputPanel } from './CodeOutputPanel';

interface WireGuardToolProps {
  lang: Language;
}

const DNS_PRESETS = [
  { name: '1.1.1.1', val: '1.1.1.1, 1.0.0.1' },
  { name: '8.8.8.8', val: '8.8.8.8, 8.8.4.4' },
  { name: 'Shecan (IR)', val: '178.22.122.100, 185.51.200.2' },
  { name: '9.9.9.9', val: '9.9.9.9, 149.112.112.112' },
] as const;

const MTU_PRESETS = [1420, 1360, 1280] as const;

export const WireGuardTool: React.FC<WireGuardToolProps> = React.memo(({ lang }) => {
  const t = translations[lang];

  const [activeOutputConfig, setActiveOutputConfig] = useState<'server' | 'client'>('server');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [keyFlash, setKeyFlash] = useState(false);

  const [settings, setSettings] = useState<WireGuardSettings>({
    serverEndpoint: '203.0.113.10',
    serverPort: 51820,
    tunnelSubnet: '10.8.0.0/24',
    serverIp: '10.8.0.1',
    clientIp: '10.8.0.2',
    dnsResolver: '1.1.1.1, 8.8.8.8',
    mtu: 1420,
    persistentKeepalive: 25,
    allowedIps: '0.0.0.0/0, ::/0',
    interfaceName: 'wg0',
    serverPrivateKey: '',
    serverPublicKey: '',
    clientPrivateKey: '',
    clientPublicKey: '',
    serverInterface: 'eth0',
  });

  // Generate keys on initial mount if empty
  useEffect(() => {
    try {
      const sKeys = generateWireGuardKeyPair();
      const cKeys = generateWireGuardKeyPair();
      setSettings((prev) => ({
        ...prev,
        serverPrivateKey: sKeys.privateKey,
        serverPublicKey: sKeys.publicKey,
        clientPrivateKey: cKeys.privateKey,
        clientPublicKey: cKeys.publicKey,
      }));
    } catch (err) {
      console.error('Initial key generation error', err);
    }
  }, []);

  const handleRegenerateKeys = () => {
    setIsRegenerating(true);
    setKeyFlash(true);
    const sKeys = generateWireGuardKeyPair();
    const cKeys = generateWireGuardKeyPair();
    setSettings((prev) => ({
      ...prev,
      serverPrivateKey: sKeys.privateKey,
      serverPublicKey: sKeys.publicKey,
      clientPrivateKey: cKeys.privateKey,
      clientPublicKey: cKeys.publicKey,
    }));
    setTimeout(() => setIsRegenerating(false), 500);
    setTimeout(() => setKeyFlash(false), 800);
  };

  // Memoize WireGuard server/client configs and one-liner bash installer to avoid redundant generator runs on UI re-renders
  const serverConfig = useMemo(() => generateWireGuardServerConfig(settings), [settings]);
  const clientConfig = useMemo(() => generateWireGuardClientConfig(settings), [settings]);
  const serverOneLiner = useMemo(() => generateWireGuardServerOneLiner(settings), [settings]);

  const displayedConfig = activeOutputConfig === 'server' ? serverConfig : clientConfig;
  const displayedFilename = activeOutputConfig === 'server' ? 'wg0.conf' : 'wg0-client.conf';
  const displayedTargetPath =
    activeOutputConfig === 'server'
      ? '/etc/wireguard/wg0.conf'
      : 'Import into WireGuard Client Application';
  const reloadCommand = 'sudo systemctl restart wg-quick@wg0 && sudo wg show';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form Controls */}
      <div className="lg:col-span-6 space-y-6">
        {/* Tool Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-medium">
              {t.wireguard.badge}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>{t.wireguard.title}</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.wireguard.subtitle}
          </p>
        </div>

        {/* Cryptographic Keys Management Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              <span>{t.wireguard.keysSection}</span>
            </h3>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              id="regen-keys-btn"
              type="button"
              onClick={handleRegenerateKeys}
              aria-label={t.wireguard.regenerateKeys}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              <motion.div
                animate={isRegenerating ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <RefreshCw className="w-3 h-3 text-amber-400" />
              </motion.div>
              <span>{t.wireguard.regenerateKeys}</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs font-mono" dir="ltr">
            {/* Server Keys */}
            <div className={`bg-slate-950/60 p-3 rounded-lg border transition-all duration-300 space-y-1.5 ${keyFlash ? 'border-cyan-400 shadow-lg shadow-cyan-950/50' : 'border-slate-800/80'}`}>
              <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                <Server className="w-3 h-3" />
                <span>{t.wireguard.serverKeys}</span>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500">Public Key:</div>
                <div className="text-slate-300 select-all truncate bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  {settings.serverPublicKey || 'Computing...'}
                </div>
              </div>
            </div>

            {/* Client Keys */}
            <div className={`bg-slate-950/60 p-3 rounded-lg border transition-all duration-300 space-y-1.5 ${keyFlash ? 'border-emerald-400 shadow-lg shadow-emerald-950/50' : 'border-slate-800/80'}`}>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                <span>{t.wireguard.clientKeys}</span>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-slate-500">Public Key:</div>
                <div className="text-slate-300 select-all truncate bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  {settings.clientPublicKey || 'Computing...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server & Network Parameters */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Endpoint */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t.wireguard.endpointLabel}
              </label>
              <input
                type="text"
                value={settings.serverEndpoint}
                onChange={(e) => setSettings({ ...settings, serverEndpoint: e.target.value })}
                placeholder={t.wireguard.endpointPlaceholder}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                dir="ltr"
              />
            </div>

            {/* Port */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t.wireguard.portLabel}
              </label>
              <input
                type="number"
                min="1"
                max="65535"
                value={settings.serverPort}
                onChange={(e) => setSettings({ ...settings, serverPort: parseInt(e.target.value, 10) || 51820 })}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Server IP */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                {t.wireguard.serverIpLabel}
              </label>
              <input
                type="text"
                value={settings.serverIp}
                onChange={(e) => setSettings({ ...settings, serverIp: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                dir="ltr"
              />
            </div>

            {/* Client IP */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                {t.wireguard.clientIpLabel}
              </label>
              <input
                type="text"
                value={settings.clientIp}
                onChange={(e) => setSettings({ ...settings, clientIp: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* DNS Resolver Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300">
              {t.wireguard.dnsLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono" dir="ltr">
              {DNS_PRESETS.map((dns) => (
                <button
                  key={dns.name}
                  type="button"
                  onClick={() => setSettings({ ...settings, dnsResolver: dns.val })}
                  aria-pressed={settings.dnsResolver === dns.val}
                  aria-label={`Select DNS resolver ${dns.name} (${dns.val})`}
                  className={`px-2 py-1.5 rounded text-[11px] border transition-all cursor-pointer truncate focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                    settings.dnsResolver === dns.val
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title={dns.val}
                >
                  {dns.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={settings.dnsResolver}
              onChange={(e) => setSettings({ ...settings, dnsResolver: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              dir="ltr"
            />
          </div>

          {/* MTU & Keepalive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 font-mono">
                  {t.wireguard.mtuLabel}
                </label>
                <span className="text-xs font-mono text-emerald-400 font-bold">{settings.mtu}</span>
              </div>
              <div className="flex gap-1 font-mono text-xs" dir="ltr">
                {MTU_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSettings({ ...settings, mtu: m })}
                    aria-pressed={settings.mtu === m}
                    className={`flex-1 py-1 rounded border text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                      settings.mtu === m
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {t.wireguard.mtuDesc}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                {t.wireguard.keepaliveLabel}
              </label>
              <input
                type="number"
                value={settings.persistentKeepalive}
                onChange={(e) => setSettings({ ...settings, persistentKeepalive: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                dir="ltr"
              />
              <div className="text-[10px] text-slate-400 leading-tight">
                {t.wireguard.keepaliveDesc}
              </div>
            </div>
          </div>

          {/* Interface name */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 font-mono">
              {t.wireguard.serverIfaceLabel}
            </label>
            <input
              type="text"
              value={settings.serverInterface}
              onChange={(e) => setSettings({ ...settings, serverInterface: e.target.value })}
              placeholder="eth0 or ens3"
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              dir="ltr"
            />
            <div className="text-[10px] text-slate-400">
              {t.wireguard.serverIfaceDesc}
            </div>
          </div>
        </div>
      </div>

      {/* Live Output Panel with Server / Client Tabs */}
      <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-3">
        {/* Output Profile Switcher */}
        <div role="tablist" aria-label="WireGuard Configuration View" className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            role="tab"
            aria-selected={activeOutputConfig === 'server'}
            onClick={() => setActiveOutputConfig('server')}
            className={`relative flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              activeOutputConfig === 'server'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeOutputConfig === 'server' && (
              <motion.div
                layoutId="wireguardTabIndicator"
                className="absolute inset-0 bg-emerald-600 rounded-lg shadow-md shadow-emerald-950/40 border border-emerald-400/30"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Server className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{t.wireguard.serverConfigTab}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeOutputConfig === 'client'}
            onClick={() => setActiveOutputConfig('client')}
            className={`relative flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
              activeOutputConfig === 'client'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeOutputConfig === 'client' && (
              <motion.div
                layoutId="wireguardTabIndicator"
                className="absolute inset-0 bg-cyan-600 rounded-lg shadow-md shadow-cyan-950/40 border border-cyan-400/30"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            <Smartphone className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{t.wireguard.clientConfigTab}</span>
          </button>
        </div>

        {/* Screen reader notification for key regeneration */}
        <div className="sr-only" aria-live="polite">
          {keyFlash && (lang === 'fa' ? 'کلیدهای جدید وایرگارد تولید شدند' : 'New WireGuard keys generated successfully')}
        </div>

        <CodeOutputPanel
          lang={lang}
          configText={displayedConfig}
          filename={displayedFilename}
          targetPath={displayedTargetPath}
          oneLinerBash={activeOutputConfig === 'server' ? serverOneLiner : undefined}
          reloadCommand={activeOutputConfig === 'server' ? reloadCommand : undefined}
        />
      </div>
    </div>
  );
});

WireGuardTool.displayName = 'WireGuardTool';
