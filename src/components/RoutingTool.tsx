import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  ArrowRightLeft,
  ShieldAlert,
  GitFork,
  Zap,
  Info,
  AlertTriangle,
  Route,
  Network,
  Check,
  Copy,
  Download,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { Language, RoutingSettings, RoutingScenario, NatMode, Protocol } from '../types';
import { translations } from '../i18n/translations';
import {
  generateIptablesRules,
  generateNftablesRules,
  generateRoutingOneLiner,
  generateVerificationCommands,
  generateRollbackCommands,
} from '../utils/routingGenerator';
import { CodeOutputPanel } from './CodeOutputPanel';

interface RoutingToolProps {
  lang: Language;
}

export const RoutingTool: React.FC<RoutingToolProps> = React.memo(({ lang }) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [settings, setSettings] = useState<RoutingSettings>({
    scenario: 'nat_gateway',
    wanInterface: 'eth0',
    lanInterface: 'eth1',
    lanSubnet: '192.168.100.0/24',
    natMode: 'masquerade',
    staticPublicIp: '203.0.113.10',
    enableDnsForwarding: true,
    enableMssClamping: true,

    protocol: 'tcp',
    externalPort: '8080',
    internalIp: '192.168.100.15',
    internalPort: '80',
    enableHairpinNat: true,

    dockerPort: '5432',
    dockerAllowedSubnet: '10.8.0.0/24',
    dockerAction: 'DROP',

    secondaryInterface: 'eth1',
    secondaryIp: '192.168.2.100',
    secondaryGateway: '192.168.2.1',
    pbrTableNumber: 200,
    pbrTableName: 'isp2',
    enableLooseRpFilter: true,

    rateLimitPort: '22',
    rateLimitMaxHits: 4,
    rateLimitWindowSeconds: 60,
    rateLimitBlockSeconds: 300,
  });

  const [outputFormat, setOutputFormat] = useState<'iptables' | 'nftables' | 'diagnostics'>('iptables');

  // Memoize routing config generator functions and derived bash one-liners to avoid redundant string processing on UI re-renders
  const iptablesText = useMemo(() => generateIptablesRules(settings, lang), [settings, lang]);
  const nftablesText = useMemo(() => generateNftablesRules(settings, lang), [settings, lang]);
  const oneLinerBash = useMemo(() => generateRoutingOneLiner(settings, lang), [settings, lang]);
  const diagnosticsText = useMemo(
    () => generateVerificationCommands(settings, lang) + '\n\n' + generateRollbackCommands(settings, lang),
    [settings, lang]
  );
  const rollbackCommand = useMemo(() => generateRollbackCommands(settings, lang), [settings, lang]);

  // Memoize scenario options and derived active properties to prevent re-creating objects and JSX icons on form input re-renders
  const scenarioTabs = useMemo<{ id: RoutingScenario; label: string; desc: string; icon: React.ReactNode }[]>(
    () => [
      {
        id: 'nat_gateway',
        label: t.routing.scenarios.nat_gateway.title,
        desc: t.routing.scenarios.nat_gateway.desc,
        icon: <Globe className="w-4 h-4" />,
      },
      {
        id: 'port_forward',
        label: t.routing.scenarios.port_forward.title,
        desc: t.routing.scenarios.port_forward.desc,
        icon: <ArrowRightLeft className="w-4 h-4" />,
      },
      {
        id: 'docker_shield',
        label: t.routing.scenarios.docker_shield.title,
        desc: t.routing.scenarios.docker_shield.desc,
        icon: <ShieldAlert className="w-4 h-4" />,
      },
      {
        id: 'pbr_multiwan',
        label: t.routing.scenarios.pbr_multiwan.title,
        desc: t.routing.scenarios.pbr_multiwan.desc,
        icon: <GitFork className="w-4 h-4" />,
      },
      {
        id: 'rate_limit',
        label: t.routing.scenarios.rate_limit.title,
        desc: t.routing.scenarios.rate_limit.desc,
        icon: <Zap className="w-4 h-4" />,
      },
    ],
    [t.routing.scenarios]
  );

  const activeConfigText = useMemo(() => {
    return outputFormat === 'iptables'
      ? iptablesText
      : outputFormat === 'nftables'
      ? nftablesText
      : diagnosticsText;
  }, [outputFormat, iptablesText, nftablesText, diagnosticsText]);

  const activeFilename = useMemo(() => {
    return outputFormat === 'nftables'
      ? 'nftables.conf'
      : outputFormat === 'diagnostics'
      ? 'network-diagnostics.sh'
      : 'iptables-rules.sh';
  }, [outputFormat]);

  const activeTargetPath = useMemo(() => {
    return outputFormat === 'nftables'
      ? '/etc/nftables.conf'
      : '/etc/iptables/rules.v4';
  }, [outputFormat]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form & Controls Panel (Left on LTR / Right on RTL) */}
      <div className="lg:col-span-6 space-y-6">
        {/* Tool Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-medium">
              {t.routing.badge}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
            <Route className="w-5 h-5 text-emerald-400" />
            <span>{t.routing.title}</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.routing.subtitle}
          </p>
        </div>

        {/* Scenario Presets Selector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" />
            <span>{t.routing.scenarioSelect}</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scenarioTabs.map((tab) => {
              const isActive = settings.scenario === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, scenario: tab.id })}
                  aria-pressed={isActive}
                  className={`text-left rtl:text-right p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-sm shadow-emerald-950/30'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-xs">
                    <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>
                      {tab.icon}
                    </span>
                    <span className={isActive ? 'text-emerald-300 font-semibold' : 'text-slate-200'}>
                      {tab.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                    {tab.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Scenario Form Settings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
          {/* 1. NAT GATEWAY SETTINGS */}
          {settings.scenario === 'nat_gateway' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.wanIfLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.wanInterface}
                    onChange={(e) => setSettings({ ...settings, wanInterface: e.target.value })}
                    placeholder="eth0"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.lanIfLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.lanInterface}
                    onChange={(e) => setSettings({ ...settings, lanInterface: e.target.value })}
                    placeholder="eth1"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.lanSubnetLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.lanSubnet}
                    onChange={(e) => setSettings({ ...settings, lanSubnet: e.target.value })}
                    placeholder="192.168.100.0/24"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.natModeLabel}
                  </label>
                  <select
                    value={settings.natMode}
                    onChange={(e) => setSettings({ ...settings, natMode: e.target.value as NatMode })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="masquerade">{t.routing.natModeMasq}</option>
                    <option value="snat">{t.routing.natModeSnat}</option>
                  </select>
                </div>
              </div>

              {settings.natMode === 'snat' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.staticIpLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.staticPublicIp}
                    onChange={(e) => setSettings({ ...settings, staticPublicIp: e.target.value })}
                    placeholder="203.0.113.10"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableDnsForwarding}
                    onChange={(e) => setSettings({ ...settings, enableDnsForwarding: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950 h-4 w-4"
                  />
                  <span>{t.routing.dnsFwdLabel}</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableMssClamping}
                    onChange={(e) => setSettings({ ...settings, enableMssClamping: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950 h-4 w-4"
                  />
                  <span>{t.routing.mssClampLabel}</span>
                </label>
              </div>
            </div>
          )}

          {/* 2. PORT FORWARDING SETTINGS */}
          {settings.scenario === 'port_forward' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.wanIfLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.wanInterface}
                    onChange={(e) => setSettings({ ...settings, wanInterface: e.target.value })}
                    placeholder="eth0"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.protoLabel}
                  </label>
                  <select
                    value={settings.protocol}
                    onChange={(e) => setSettings({ ...settings, protocol: e.target.value as Protocol })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="tcp">TCP (HTTP, SSH, HTTPS)</option>
                    <option value="udp">UDP (DNS, WireGuard, Game)</option>
                    <option value="both">TCP & UDP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.extPortLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.externalPort}
                    onChange={(e) => setSettings({ ...settings, externalPort: e.target.value })}
                    placeholder="8080"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.intIpLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.internalIp}
                    onChange={(e) => setSettings({ ...settings, internalIp: e.target.value })}
                    placeholder="192.168.100.15"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.intPortLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.internalPort}
                    onChange={(e) => setSettings({ ...settings, internalPort: e.target.value })}
                    placeholder="80"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Hairpin NAT Info Box & Toggle */}
              <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3.5 space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableHairpinNat}
                    onChange={(e) => setSettings({ ...settings, enableHairpinNat: e.target.checked })}
                    className="rounded border-amber-700 text-amber-500 focus:ring-amber-500/20 bg-slate-950 h-4 w-4"
                  />
                  <span>{t.routing.hairpinNatLabel}</span>
                </label>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  {t.routing.hairpinNatTooltip}
                </p>
                {settings.enableHairpinNat && (
                  <div className="pt-2">
                    <label className="text-[11px] font-medium text-slate-300 block mb-1">
                      {t.routing.lanSubnetLabel}
                    </label>
                    <input
                      type="text"
                      value={settings.lanSubnet}
                      onChange={(e) => setSettings({ ...settings, lanSubnet: e.target.value })}
                      placeholder="192.168.100.0/24"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. DOCKER SHIELD SETTINGS */}
          {settings.scenario === 'docker_shield' && (
            <div className="space-y-4">
              <div className="bg-sky-950/30 border border-sky-800/40 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-sky-200 leading-relaxed">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{t.routing.dockerExpl}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.wanIfLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.wanInterface}
                    onChange={(e) => setSettings({ ...settings, wanInterface: e.target.value })}
                    placeholder="eth0"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.dockerPortLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.dockerPort}
                    onChange={(e) => setSettings({ ...settings, dockerPort: e.target.value })}
                    placeholder="5432"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.dockerActionLabel}
                  </label>
                  <select
                    value={settings.dockerAction}
                    onChange={(e) => setSettings({ ...settings, dockerAction: e.target.value as 'DROP' | 'REJECT' })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DROP">DROP (Silent Drop)</option>
                    <option value="REJECT">REJECT (TCP RST)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {t.routing.dockerSubnetLabel}
                </label>
                <input
                  type="text"
                  value={settings.dockerAllowedSubnet}
                  onChange={(e) => setSettings({ ...settings, dockerAllowedSubnet: e.target.value })}
                  placeholder="10.8.0.0/24 or 198.51.100.4"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* 4. POLICY-BASED ROUTING SETTINGS */}
          {settings.scenario === 'pbr_multiwan' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.secIfLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.secondaryInterface}
                    onChange={(e) => setSettings({ ...settings, secondaryInterface: e.target.value })}
                    placeholder="eth1"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.secIpLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.secondaryIp}
                    onChange={(e) => setSettings({ ...settings, secondaryIp: e.target.value })}
                    placeholder="192.168.2.100"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.secGwLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.secondaryGateway}
                    onChange={(e) => setSettings({ ...settings, secondaryGateway: e.target.value })}
                    placeholder="192.168.2.1"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.pbrTableLabel}
                  </label>
                  <input
                    type="number"
                    value={settings.pbrTableNumber}
                    onChange={(e) => setSettings({ ...settings, pbrTableNumber: parseInt(e.target.value, 10) || 200 })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.pbrTableNameLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.pbrTableName}
                    onChange={(e) => setSettings({ ...settings, pbrTableName: e.target.value })}
                    placeholder="isp2"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableLooseRpFilter}
                    onChange={(e) => setSettings({ ...settings, enableLooseRpFilter: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950 h-4 w-4"
                  />
                  <span>{t.routing.rpFilterLabel}</span>
                </label>
                <p className="text-[11px] text-slate-400 leading-relaxed pr-6 rtl:pr-0 rtl:pl-6">
                  {t.routing.rpFilterTooltip}
                </p>
              </div>
            </div>
          )}

          {/* 5. RATE LIMITING SETTINGS */}
          {settings.scenario === 'rate_limit' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.rateLimitPortLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.rateLimitPort}
                    onChange={(e) => setSettings({ ...settings, rateLimitPort: e.target.value })}
                    placeholder="22"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.rateLimitHitsLabel}
                  </label>
                  <input
                    type="number"
                    value={settings.rateLimitMaxHits}
                    onChange={(e) => setSettings({ ...settings, rateLimitMaxHits: parseInt(e.target.value, 10) || 4 })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.rateLimitWindowLabel}
                  </label>
                  <input
                    type="number"
                    value={settings.rateLimitWindowSeconds}
                    onChange={(e) => setSettings({ ...settings, rateLimitWindowSeconds: parseInt(e.target.value, 10) || 60 })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {t.routing.rateLimitBlockLabel}
                  </label>
                  <input
                    type="number"
                    value={settings.rateLimitBlockSeconds}
                    onChange={(e) => setSettings({ ...settings, rateLimitBlockSeconds: parseInt(e.target.value, 10) || 300 })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code & Output Panel (Right on LTR / Left on RTL) */}
      <div className="lg:col-span-6 space-y-4">
        {/* Output Selector Tabs */}
        <div role="tablist" aria-label="Routing Output Format View" className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            type="button"
            role="tab"
            aria-selected={outputFormat === 'iptables'}
            onClick={() => setOutputFormat('iptables')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              outputFormat === 'iptables'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{t.routing.outputTabs.iptables}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={outputFormat === 'nftables'}
            onClick={() => setOutputFormat('nftables')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              outputFormat === 'nftables'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>{t.routing.outputTabs.nftables}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={outputFormat === 'diagnostics'}
            onClick={() => setOutputFormat('diagnostics')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              outputFormat === 'diagnostics'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.routing.outputTabs.diagnostics}</span>
          </button>
        </div>

        {/* Output Code Panel */}
        <CodeOutputPanel
          lang={lang}
          configText={activeConfigText}
          filename={activeFilename}
          targetPath={activeTargetPath}
          oneLinerBash={oneLinerBash}
          reloadCommand={rollbackCommand}
        />
      </div>
    </div>
  );
});

RoutingTool.displayName = 'RoutingTool';
