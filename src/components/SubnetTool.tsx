import React, { useState, useMemo } from 'react';
import { Calculator, Network, Globe, Layers, ArrowUpDown, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { calculateSubnet, isValidIpv4 } from '../utils/subnetCalculator';
import { CodeOutputPanel } from './CodeOutputPanel';

interface SubnetToolProps {
  lang: Language;
}

export const SubnetTool: React.FC<SubnetToolProps> = ({ lang }) => {
  const t = translations[lang];

  const [ipInput, setIpInput] = useState('192.168.1.100');
  const [cidr, setCidr] = useState(24);
  const [gatewayIp, setGatewayIp] = useState('192.168.1.1');
  const [iface, setIface] = useState('eth0');

  // Validate IP
  const isValid = isValidIpv4(ipInput);

  // Compute Subnet Results
  const result = useMemo(() => {
    return calculateSubnet(ipInput, cidr);
  }, [ipInput, cidr]);

  // Generate Linux commands block
  const linuxCommandsText = useMemo(() => {
    if (!result) return '# Please provide a valid IPv4 address';

    return `# ==========================================================================
# LinuxNetwork.ir - Linux Network & Routing Commands for ${result.networkAddress}/${result.cidr}
# ==========================================================================

# 1. Add static route for this entire subnet:
sudo ip route add ${result.networkAddress}/${result.cidr} via ${gatewayIp} dev ${iface}

# 2. Add policy-based routing rule (PBR):
sudo ip rule add from ${result.networkAddress}/${result.cidr} table 100
sudo ip route add default via ${gatewayIp} dev ${iface} table 100

# 3. Enable IPv4 NAT masquerade for outbound traffic:
sudo iptables -t nat -A POSTROUTING -s ${result.networkAddress}/${result.cidr} -o ${iface} -j MASQUERADE

# 4. Or using modern nftables:
# nft add rule ip nat postrouting ip saddr ${result.networkAddress}/${result.cidr} oif "${iface}" masquerade

# 5. Verify routing table and test lookup:
ip route show
ip route get ${result.firstUsableIp}
`;
  }, [result, gatewayIp, iface]);

  const oneLinerBash = useMemo(() => {
    if (!result) return '';
    return `sudo ip route add ${result.networkAddress}/${result.cidr} via ${gatewayIp} dev ${iface}`;
  }, [result, gatewayIp, iface]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Inputs and Calculator View */}
      <div className="lg:col-span-6 space-y-6">
        {/* Tool Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-medium">
              {t.subnet.badge}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <span>{t.subnet.title}</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.subnet.subtitle}
          </p>
        </div>

        {/* IP & CIDR Inputs */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* IP Address */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t.subnet.ipLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value.trim())}
                  placeholder={t.subnet.ipPlaceholder}
                  className={`w-full bg-slate-950/80 border rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none ${
                    isValid
                      ? 'border-slate-700/80 focus:border-emerald-500'
                      : 'border-rose-500/80 text-rose-300 focus:border-rose-500'
                  }`}
                  dir="ltr"
                />
                {!isValid && (
                  <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{t.subnet.invalidIpError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CIDR Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                {t.subnet.cidrLabel}
              </label>
              <select
                value={cidr}
                onChange={(e) => setCidr(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
                dir="ltr"
              >
                {Array.from({ length: 25 }, (_, i) => i + 8).map((mask) => (
                  <option key={mask} value={mask}>
                    /{mask}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick CIDR Preset Chips */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] text-slate-400 font-medium">
              {t.subnet.quickPicks}
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs" dir="ltr">
              {[8, 16, 22, 24, 26, 28, 29, 30, 32].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCidr(m)}
                  className={`px-2.5 py-1 rounded text-xs border transition-all cursor-pointer ${
                    cidr === m
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  /{m}
                </button>
              ))}
            </div>
          </div>

          {/* Gateway & Interface for Command Generator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">
                Gateway IP for routes:
              </label>
              <input
                type="text"
                value={gatewayIp}
                onChange={(e) => setGatewayIp(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">
                Egress Interface (dev):
              </label>
              <input
                type="text"
                value={iface}
                onChange={(e) => setIface(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Calculated Breakdown Results Table */}
        {result && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" />
              <span>{t.subnet.resultsTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono" dir="ltr">
              {/* Network Address */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  {t.subnet.netAddress}
                </span>
                <span className="text-emerald-400 font-bold text-sm select-all">
                  {result.networkAddress}/{result.cidr}
                </span>
              </div>

              {/* Broadcast Address */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  {t.subnet.broadcast}
                </span>
                <span className="text-emerald-400 font-bold text-sm select-all">
                  {result.broadcastAddress}
                </span>
              </div>

              {/* Usable Range */}
              <div className="sm:col-span-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  {t.subnet.usableRange}
                </span>
                <span className="text-cyan-300 font-bold text-xs select-all">
                  {result.firstUsableIp} - {result.lastUsableIp}
                </span>
              </div>

              {/* Usable Hosts */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  {t.subnet.usableHosts}
                </span>
                <span className="text-amber-300 font-bold text-sm">
                  {result.usableHosts.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">
                  ({result.totalHosts.toLocaleString()} total)
                </span>
              </div>

              {/* Subnet Mask */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  {t.subnet.netmask}
                </span>
                <span className="text-slate-200 font-bold text-xs select-all">
                  {result.netmask}
                </span>
              </div>

              {/* Wildcard Mask */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  {t.subnet.wildcard}
                </span>
                <span className="text-slate-300 text-xs select-all">
                  {result.wildcardMask}
                </span>
              </div>

              {/* Scope & Class */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  {t.subnet.ipClass} / {t.subnet.ipScope}
                </span>
                <span className="text-cyan-400 text-[11px] truncate block font-medium">
                  {result.ipScope}
                </span>
              </div>

              {/* Binary Representation */}
              <div className="sm:col-span-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                  {t.subnet.binaryIp}
                </span>
                <div className="text-[10px] text-slate-400 truncate">
                  <span className="text-slate-500">IP:   </span>
                  <span className="text-cyan-300">{result.binaryIp}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  <span className="text-slate-500">MASK: </span>
                  <span className="text-emerald-300">{result.netmaskBinary}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Output Panel: Linux iproute2 and iptables script */}
      <div className="lg:col-span-6 lg:sticky lg:top-24">
        <CodeOutputPanel
          lang={lang}
          configText={linuxCommandsText}
          filename="routing-rules.sh"
          targetPath="/etc/network/routing.sh"
          oneLinerBash={oneLinerBash}
          reloadCommand="ip route show && ip rule show"
        />
      </div>
    </div>
  );
};
