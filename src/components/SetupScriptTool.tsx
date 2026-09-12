import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Cpu, Layers, Copy, Check, ExternalLink, Download, AlertTriangle } from 'lucide-react';
import { Language, SetupScriptSettings } from '../types';
import { translations } from '../i18n/translations';
import { CodeOutputPanel } from './CodeOutputPanel';
import { DistroBadges } from './DistroBadges';

interface SetupScriptToolProps {
  lang: Language;
}

export const SetupScriptTool: React.FC<SetupScriptToolProps> = ({ lang }) => {
  const t = translations[lang];

  const [settings, setSettings] = useState<SetupScriptSettings>({
    enableBbr: true,
    enableBbr3: false,
    qdisc: 'fq',
    enableSysctlOpt: true,
    enableCustomSshPort: false,
    sshPort: 2222,
    disablePasswordAuth: false,
    enableFail2ban: true,
    enableUfw: false,
    enableDocker: true,
    enableDockerMirror: true,
    enableTools: true,
    enableZsh: false,
  });

  const [copiedOneLiner, setCopiedOneLiner] = useState(false);

  // Generate the CLI flags string
  const flagsList = useMemo(() => {
    const flags: string[] = [];

    if (settings.enableBbr3) {
      flags.push('--bbr3');
    } else if (settings.enableBbr) {
      flags.push('--bbr');
    }

    if (settings.qdisc !== 'fq') {
      flags.push(`--qdisc ${settings.qdisc}`);
    }

    if (settings.enableSysctlOpt) {
      flags.push('--sysctl-opt');
    }

    if (settings.enableCustomSshPort && settings.sshPort) {
      flags.push(`--ssh-port ${settings.sshPort}`);
    }

    if (settings.disablePasswordAuth) {
      flags.push('--disable-pwd-auth');
    }

    if (settings.enableFail2ban) {
      flags.push('--fail2ban');
    }

    if (settings.enableUfw) {
      flags.push('--ufw');
    }

    if (settings.enableDocker) {
      flags.push('--docker');
      if (settings.enableDockerMirror) {
        flags.push('--docker-mirror');
      }
    }

    if (settings.enableTools) {
      flags.push('--tools');
    }

    if (settings.enableZsh) {
      flags.push('--zsh');
    }

    return flags;
  }, [settings]);

  // Full Live Bash Command
  const oneLinerCommand = useMemo(() => {
    const flagStr = flagsList.length > 0 ? ` ${flagsList.join(' ')}` : '';
    return `curl -fsSL https://linuxnetwork.ir/setup.sh | sudo bash -s --${flagStr}`;
  }, [flagsList]);

  const handleCopyOneLiner = () => {
    navigator.clipboard.writeText(oneLinerCommand);
    setCopiedOneLiner(true);
    setTimeout(() => setCopiedOneLiner(false), 2500);
  };

  // Preview of the execution plan & explanation
  const executionPlanText = useMemo(() => {
    return `# ==============================================================================
# LinuxNetwork.ir - Server Setup Plan
# Target Command:
# ${oneLinerCommand}
# ==============================================================================

# 1. Verification & Safety:
#   - Verifies root (EUID == 0)
#   - Confirms OS distribution (Debian, Ubuntu, RHEL/Rocky/AlmaLinux/CentOS, Fedora, or Alpine Linux)
#   - Creates automatic timestamped backups in /var/backups/linuxnetwork-*/

# 2. Kernel & Network Tuning:
${settings.enableBbr ? '#   [✔] Google BBR Congestion Control enabled' : '#   [ ] BBR skipped'}
${settings.enableSysctlOpt ? '#   [✔] Optimized TCP buffers: rmem_max=64MB, wmem_max=64MB, somaxconn=65535' : '#   [ ] Sysctl optimization skipped'}
#   [✔] Queue Discipline: ${settings.qdisc}

# 3. Server Hardening & SSH:
${settings.enableCustomSshPort ? `#   [✔] Custom SSH Port: ${settings.sshPort} (sshd syntax checked before reload)` : '#   [ ] SSH Port default (22)'}
${settings.disablePasswordAuth ? '#   [✔] Password authentication disabled (PubkeyAuthentication only)' : '#   [ ] Password authentication retained'}
${settings.enableFail2ban ? '#   [✔] Fail2ban installed and guarding SSH (3 retries = 24h ban)' : '#   [ ] Fail2ban skipped'}
${settings.enableUfw ? '#   [✔] Firewall enabled (UFW on Debian/Ubuntu, Firewalld on Red Hat, Iptables on Alpine; allows SSH, 80, 443)' : '#   [ ] Firewall skipped'}

# 4. Container Infrastructure:
${settings.enableDocker ? '#   [✔] Docker CE & Docker Compose plugin installed (APT / DNF / APK)' : '#   [ ] Docker skipped'}
${settings.enableDocker && settings.enableDockerMirror ? '#   [✔] Iranian registry mirrors (dockerir.com, docker.arvancloud.ir) configured in /etc/docker/daemon.json' : '#   [ ] Docker registry mirrors skipped'}

# 5. Diagnostics & Utilities:
${settings.enableTools ? '#   [✔] Modern tools installed: fastfetch, htop, iftop, iotop, net-tools, iperf3, curl, git, tmux, jq, traceroute, mtr' : '#   [ ] Tools skipped'}
${settings.enableZsh ? '#   [✔] ZSH shell installed' : '#   [ ] ZSH skipped'}

# To manually test or download setup.sh:
# wget -O setup.sh https://linuxnetwork.ir/setup.sh
# chmod +x setup.sh
# sudo ./setup.sh ${flagsList.join(' ')}
`;
  }, [settings, oneLinerCommand, flagsList]);

  return (
    <div className="space-y-6">
      {/* Dynamic One-Liner Generator Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-semibold text-emerald-300 uppercase tracking-wider">
              {t.setup.liveOneLiner}
            </span>
          </div>
          <DistroBadges lang={lang} />
        </div>

        {/* Real-time Command Preview Box */}
        <div className="relative flex items-center bg-[#070b14] border border-slate-700/80 rounded-xl px-4 py-3 font-mono text-sm text-cyan-300 overflow-x-auto shadow-inner group">
          <span className="text-slate-500 select-none mr-2 font-bold">$</span>
          <code className="whitespace-nowrap flex-1 font-semibold text-slate-100 select-all" dir="ltr">
            {oneLinerCommand}
          </code>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={handleCopyOneLiner}
            className={`ml-3 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
              copiedOneLiner
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copiedOneLiner ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.setup.copied}</span>
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
                  <span>{t.setup.copyCommand}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Standalone HTML Link and info */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono font-semibold">1-Click Run:</span>
            <span>Copies script output directly to clipboard. Fully idempotent with automatic backups.</span>
          </div>
          <a
            href="/standalone.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline"
          >
            <span>Open Standalone Single-File Web App</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Configuration Grid & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Module Selectors */}
        <div className="lg:col-span-6 space-y-4">
          {/* Module A: Kernel & Network Tuning */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.setup.moduleA}</h3>
                <p className="text-xs text-slate-400">{t.setup.moduleADesc}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableBbr}
                  onChange={(e) => setSettings({ ...settings, enableBbr: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.bbr}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.bbrDesc}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pl-6">
                <input
                  type="checkbox"
                  checked={settings.enableBbr3}
                  onChange={(e) => setSettings({ ...settings, enableBbr3: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.bbr3}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.bbr3Desc}</p>
                </div>
              </label>

              <div className="flex items-center gap-3 pl-6">
                <span className="text-xs text-slate-400 font-mono">{t.setup.qdiscLabel}</span>
                <select
                  value={settings.qdisc}
                  onChange={(e) => setSettings({ ...settings, qdisc: e.target.value as 'fq' | 'cake' })}
                  className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
                  dir="ltr"
                >
                  <option value="fq">fq (Fair Queueing - Recommended)</option>
                  <option value="cake">cake (Common Applications Kept Enhanced)</option>
                </select>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSysctlOpt}
                  onChange={(e) => setSettings({ ...settings, enableSysctlOpt: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.sysctlOpt}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.sysctlOptDesc}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Module B: Server Hardening & SSH */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.setup.moduleB}</h3>
                <p className="text-xs text-slate-400">{t.setup.moduleBDesc}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enable-custom-ssh"
                  checked={settings.enableCustomSshPort}
                  onChange={(e) => setSettings({ ...settings, enableCustomSshPort: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <label htmlFor="enable-custom-ssh" className="text-xs font-semibold text-slate-200 font-mono cursor-pointer">
                  {t.setup.customSshPort}
                </label>
                <input
                  type="number"
                  value={settings.sshPort}
                  min={1}
                  max={65535}
                  disabled={!settings.enableCustomSshPort}
                  onChange={(e) => setSettings({ ...settings, sshPort: parseInt(e.target.value, 10) || 22 })}
                  className="w-24 bg-slate-950 disabled:opacity-40 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-cyan-300"
                  dir="ltr"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.disablePasswordAuth}
                  onChange={(e) => setSettings({ ...settings, disablePasswordAuth: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.disablePwdAuth}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.disablePwdAuthDesc}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableFail2ban}
                  onChange={(e) => setSettings({ ...settings, enableFail2ban: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.fail2ban}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.fail2banDesc}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableUfw}
                  onChange={(e) => setSettings({ ...settings, enableUfw: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.ufw}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.ufwDesc}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Module C: Containers & Docker */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.setup.moduleC}</h3>
                <p className="text-xs text-slate-400">{t.setup.moduleCDesc}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableDocker}
                  onChange={(e) => setSettings({ ...settings, enableDocker: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.docker}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.dockerDesc}</p>
                </div>
              </label>

              {settings.enableDocker && (
                <label className="flex items-start gap-3 cursor-pointer pl-6">
                  <input
                    type="checkbox"
                    checked={settings.enableDockerMirror}
                    onChange={(e) => setSettings({ ...settings, enableDockerMirror: e.target.checked })}
                    className="mt-1 rounded bg-slate-950 border-slate-700 text-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 font-mono">{t.setup.dockerMirror}</span>
                    <p className="text-slate-400 text-[11px]">{t.setup.dockerMirrorDesc}</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Module D: Modern Tools & Shell */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t.setup.moduleD}</h3>
                <p className="text-xs text-slate-400">{t.setup.moduleDDesc}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableTools}
                  onChange={(e) => setSettings({ ...settings, enableTools: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-amber-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.tools}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.toolsDesc}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableZsh}
                  onChange={(e) => setSettings({ ...settings, enableZsh: e.target.checked })}
                  className="mt-1 rounded bg-slate-950 border-slate-700 text-amber-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 font-mono">{t.setup.zsh}</span>
                  <p className="text-slate-400 text-[11px]">{t.setup.zshDesc}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Live Output & Code Panel */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <CodeOutputPanel
            lang={lang}
            configText={executionPlanText}
            filename="setup-plan.sh"
            targetPath="https://linuxnetwork.ir/setup.sh"
            oneLinerBash={oneLinerCommand}
            reloadCommand="tail -f /var/log/syslog"
          />
        </div>
      </div>
    </div>
  );
};
