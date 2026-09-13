import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Cpu, Server, Wifi, Zap, Activity, HardDrive, CheckCircle2 } from 'lucide-react';
import { Language, SysctlSettings, ServerProfile, RamSize, BandwidthTier } from '../types';
import { translations } from '../i18n/translations';
import { generateSysctlConfig, generateSysctlOneLiner } from '../utils/sysctlGenerator';
import { CodeOutputPanel } from './CodeOutputPanel';

interface SysctlToolProps {
  lang: Language;
}

const SERVER_PROFILES: ServerProfile[] = ['web', 'proxy', 'download', 'lowlatency'];
const RAM_SIZES: (RamSize | '32GB+')[] = ['1GB', '2GB', '4GB', '8GB', '16GB', '32GB+'];
const BANDWIDTH_TIERS: BandwidthTier[] = ['100M', '1G', '10G'];

export const SysctlTool: React.FC<SysctlToolProps> = ({ lang }) => {
  const t = translations[lang];

  const [settings, setSettings] = useState<SysctlSettings>({
    profile: 'proxy',
    ram: '4GB',
    bandwidth: '1G',
    enableBbr: true,
    enableSynCookies: true,
    enableTwReuse: true,
    enableFastOpen: true,
    disableIpv6: false,
    enableIpForward: true,
    enableMtuProbing: true,
    increaseFileLimits: true,
  });

  const handleProfileChange = (profile: ServerProfile) => {
    // Smart defaults per profile
    let ipForward = settings.enableIpForward;
    let bbr = true;
    let mtuProbe = settings.enableMtuProbing;

    if (profile === 'proxy') {
      ipForward = true;
      mtuProbe = true;
    } else if (profile === 'web') {
      ipForward = false;
    }

    setSettings((prev) => ({
      ...prev,
      profile,
      enableIpForward: ipForward,
      enableBbr: bbr,
      enableMtuProbing: mtuProbe,
    }));
  };

  const configText = useMemo(() => generateSysctlConfig(settings, lang), [settings, lang]);
  const oneLinerBash = useMemo(() => generateSysctlOneLiner(configText), [configText]);
  const reloadCommand = 'sudo sysctl --system';

  // Quick stats calculation
  const getCalculatedBuffers = () => {
    let rmem = '32 MB';
    let somax = '32,768';
    let fileMax = '1,048,576';
    if (settings.ram === '1GB') {
      rmem = '8 MB';
      somax = '8,192';
      fileMax = '262,144';
    } else if (settings.ram === '2GB') {
      rmem = '16 MB';
      somax = '16,384';
      fileMax = '524,288';
    } else if (settings.ram === '8GB') {
      rmem = '64 MB';
      somax = '65,536';
      fileMax = '2,097,152';
    } else if (settings.ram === '16GB') {
      rmem = '128 MB';
      somax = '131,072';
      fileMax = '4,194,304';
    } else if (settings.ram === '32GB+') {
      rmem = '256 MB';
      somax = '262,144';
      fileMax = '8,388,608';
    }
    return { rmem, somax, fileMax };
  };

  const calculated = getCalculatedBuffers();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Form & Tuning Options */}
      <div className="lg:col-span-6 space-y-6">
        {/* Tool Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-medium">
              {t.sysctl.badge}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>{t.sysctl.title}</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.sysctl.subtitle}
          </p>
        </div>

        {/* Server Profile Selection */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>{t.sysctl.profileLabel}</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SERVER_PROFILES.map((prof) => {
              const active = settings.profile === prof;
              return (
                <motion.button
                  key={prof}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProfileChange(prof)}
                  className={`relative p-3 rounded-lg text-start transition-colors border cursor-pointer ${
                    active
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-md shadow-emerald-950/30'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeProfileGlow"
                      className="absolute inset-0 border-2 border-emerald-400/50 rounded-lg pointer-events-none"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-xs font-semibold">{t.sysctl.profiles[prof]}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Hardware Presets (RAM & Bandwidth) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* RAM preset */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.sysctl.ramLabel}</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs" dir="ltr">
              {RAM_SIZES.map((r) => {
                const ramVal = r === '32GB+' ? '32GB' : (r as RamSize);
                const active = settings.ram === ramVal;
                return (
                  <motion.button
                    key={r}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSettings({ ...settings, ram: ramVal as RamSize })}
                    className={`py-1.5 px-2 rounded font-medium border text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Bandwidth preset */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.sysctl.bandwidthLabel}</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs" dir="ltr">
              {BANDWIDTH_TIERS.map((bw) => {
                const active = settings.bandwidth === bw;
                return (
                  <motion.button
                    key={bw}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSettings({ ...settings, bandwidth: bw })}
                    className={`py-1.5 px-2 rounded font-medium border text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {bw}bps
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Calculated Stats Badges */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.sysctl.calculatedStats}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono" dir="ltr">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">rmem_max</div>
              <div className="text-emerald-300 font-bold">{calculated.rmem}</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">wmem_max</div>
              <div className="text-emerald-300 font-bold">{calculated.rmem}</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">somaxconn</div>
              <div className="text-cyan-300 font-bold">{calculated.somax}</div>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <div className="text-[10px] text-slate-500">fs.file-max</div>
              <div className="text-cyan-300 font-bold">{calculated.fileMax}</div>
            </div>
          </div>
        </div>

        {/* Kernel Toggles List */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{t.sysctl.togglesTitle}</span>
          </h3>

          <div className="space-y-2.5 divide-y divide-slate-800/60">
            {/* BBR */}
            <label className="pt-2 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableBbr}
                onChange={(e) => setSettings({ ...settings, enableBbr: e.target.checked })}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200 font-mono text-xs">{t.sysctl.bbr}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{t.sysctl.bbrDesc}</div>
              </div>
            </label>

            {/* SYN Flood */}
            <label className="pt-2.5 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableSynCookies}
                onChange={(e) => setSettings({ ...settings, enableSynCookies: e.target.checked })}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200 font-mono text-xs">{t.sysctl.synCookies}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{t.sysctl.synCookiesDesc}</div>
              </div>
            </label>

            {/* TIME_WAIT reuse */}
            <label className="pt-2.5 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableTwReuse}
                onChange={(e) => setSettings({ ...settings, enableTwReuse: e.target.checked })}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200 font-mono text-xs">{t.sysctl.twReuse}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{t.sysctl.twReuseDesc}</div>
              </div>
            </label>

            {/* Fast Open */}
            <label className="pt-2.5 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableFastOpen}
                onChange={(e) => setSettings({ ...settings, enableFastOpen: e.target.checked })}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200 font-mono text-xs">{t.sysctl.fastOpen}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{t.sysctl.fastOpenDesc}</div>
              </div>
            </label>

            {/* IP Forwarding */}
            <label className="pt-2.5 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableIpForward}
                onChange={(e) => setSettings({ ...settings, enableIpForward: e.target.checked })}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200 font-mono text-xs">{t.sysctl.ipForward}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{t.sysctl.ipForwardDesc}</div>
              </div>
            </label>

            {/* MTU Probing */}
            <label className="pt-2.5 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.enableMtuProbing}
                onChange={(e) => setSettings({ ...settings, enableMtuProbing: e.target.checked })}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200 font-mono text-xs">{t.sysctl.mtuProbing}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{t.sysctl.mtuProbingDesc}</div>
              </div>
            </label>

            {/* File Limits */}
            <label className="pt-2.5 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.increaseFileLimits}
                onChange={(e) => setSettings({ ...settings, increaseFileLimits: e.target.checked })}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200 font-mono text-xs">{t.sysctl.fileLimits}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{t.sysctl.fileLimitsDesc}</div>
              </div>
            </label>

            {/* Disable IPv6 */}
            <label className="pt-2.5 flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.disableIpv6}
                onChange={(e) => setSettings({ ...settings, disableIpv6: e.target.checked })}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200 font-mono text-xs">{t.sysctl.disableIpv6}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{t.sysctl.disableIpv6Desc}</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Right Column: Live Output Panel */}
      <div className="lg:col-span-6 lg:sticky lg:top-24">
        <CodeOutputPanel
          lang={lang}
          configText={configText}
          filename="99-network-tuning.conf"
          targetPath="/etc/sysctl.d/99-network-tuning.conf"
          oneLinerBash={oneLinerBash}
          reloadCommand={reloadCommand}
        />
      </div>
    </div>
  );
};
