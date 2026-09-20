import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  Cpu,
  Globe2,
  Shield,
  Calculator,
  Route,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Github,
  Sparkles,
  Lock,
  Zap,
  Server,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Language, ToolTab } from '../types';
import { translations } from '../i18n/translations';
import { DistroBadges } from './DistroBadges';

interface LandingPageProps {
  lang: Language;
  onLaunchToolbox: (tool?: ToolTab) => void;
}

const SUPPORTED_DISTROS = ['Ubuntu', 'Debian', 'RHEL', 'Rocky', 'AlmaLinux', 'Alpine'] as const;

export const LandingPage: React.FC<LandingPageProps> = ({ lang, onLaunchToolbox }) => {
  const t = translations[lang];
  const l = t.landing;
  const isFa = lang === 'fa';
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const oneLinerCommand = 'curl -fsSL https://linuxnetwork.ir/setup.sh | sudo bash -s -- --bbr --sysctl-opt --tools';

  const handleCopyOneLiner = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(oneLinerCommand);
      } else {
        const input = document.createElement('input');
        input.value = oneLinerCommand;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedTerminal(true);
      setTimeout(() => setCopiedTerminal(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Memoize tool card structure to prevent re-creating 6 complex card objects, JSX icons, and highlights arrays on every render (e.g., FAQ toggle or command copy)
  const toolCards = useMemo<
    {
      id: ToolTab;
      title: string;
      desc: string;
      badge: string;
      icon: React.ReactNode;
      colorClasses: {
        glow: string;
        badge: string;
        iconBg: string;
        button: string;
      };
      highlights: string[];
    }[]
  >(
    () => [
      {
        id: 'setup',
        title: l.toolsSection.items.setup.title,
        desc: l.toolsSection.items.setup.desc,
        badge: l.toolsSection.items.setup.badge,
        icon: <Terminal className="w-5 h-5" />,
        colorClasses: {
          glow: 'group-hover:border-emerald-500/50 group-hover:shadow-emerald-950/40',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          button: 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30',
        },
        highlights: isFa
          ? ['BBRv1 و BBRv3', 'هاردنینگ پورت SSH', 'فایروال و Fail2ban', 'داکر با میرور داخلی']
          : ['BBRv1 & BBRv3 Tuning', 'SSH Port Hardening', 'Fail2ban & Firewalls', 'Docker with Fast Mirrors'],
      },
      {
        id: 'sysctl',
        title: l.toolsSection.items.sysctl.title,
        desc: l.toolsSection.items.sysctl.desc,
        badge: l.toolsSection.items.sysctl.badge,
        icon: <Cpu className="w-5 h-5" />,
        colorClasses: {
          glow: 'group-hover:border-cyan-500/50 group-hover:shadow-cyan-950/40',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          button: 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-500/30',
        },
        highlights: isFa
          ? ['تنظیم بر اساس RAM و پهنای باند', 'الگوریتم fq / cake', 'بازیافت سوکت‌های TIME_WAIT', 'افزایش File Descriptors']
          : ['Hardware-aware Presets', 'fq / cake Qdisc', 'TIME_WAIT Socket Reuse', 'Max File Descriptors'],
      },
      {
        id: 'nginx',
        title: l.toolsSection.items.nginx.title,
        desc: l.toolsSection.items.nginx.desc,
        badge: l.toolsSection.items.nginx.badge,
        icon: <Globe2 className="w-5 h-5" />,
        colorClasses: {
          glow: 'group-hover:border-sky-500/50 group-hover:shadow-sky-950/40',
          badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          button: 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border-sky-500/30',
        },
        highlights: isFa
          ? ['پروفایل مدرن موزیلا (TLS 1.3)', 'پشتیبانی HTTP/2 و HTTP/3', 'ارتقای اتصالات WebSocket', 'هدرهای امنیتی HSTS و CSP']
          : ['Mozilla Modern SSL', 'HTTP/2 & HTTP/3 QUIC', 'WebSocket Proxying', 'HSTS & Security Headers'],
      },
      {
        id: 'wireguard',
        title: l.toolsSection.items.wireguard.title,
        desc: l.toolsSection.items.wireguard.desc,
        badge: l.toolsSection.items.wireguard.badge,
        icon: <Shield className="w-5 h-5" />,
        colorClasses: {
          glow: 'group-hover:border-purple-500/50 group-hover:shadow-purple-950/40',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          button: 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/30',
        },
        highlights: isFa
          ? ['تولید کلید با Web Crypto در مرورگر', 'ساخت کیو‌آرکد برای موبایل', 'محاسبه‌گر خودکار MTU', 'وان‌لاینر نصب سرور']
          : ['Browser-native Curve25519', 'Mobile QR Code Generation', 'Optimal MTU Calculation', 'Automated Server Setup'],
      },
      {
        id: 'subnet',
        title: l.toolsSection.items.subnet.title,
        desc: l.toolsSection.items.subnet.desc,
        badge: l.toolsSection.items.subnet.badge,
        icon: <Calculator className="w-5 h-5" />,
        colorClasses: {
          glow: 'group-hover:border-amber-500/50 group-hover:shadow-amber-950/40',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          button: 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30',
        },
        highlights: isFa
          ? ['تفکیک شبکه و آدرس Broadcast', 'محاسبه دقیق هاست‌های مفید', 'نمایش وایلدکارت و باینری', 'دستورات آماده ip route و iptables']
          : ['Network & Broadcast IPs', 'Usable Host Capacity', 'Wildcard & Binary Masks', 'Ready iproute2 & iptables CLI'],
      },
      {
        id: 'routing',
        title: l.toolsSection.items.routing.title,
        desc: l.toolsSection.items.routing.desc,
        badge: l.toolsSection.items.routing.badge,
        icon: <Route className="w-5 h-5" />,
        colorClasses: {
          glow: 'group-hover:border-emerald-500/50 group-hover:shadow-emerald-950/40',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          button: 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30',
        },
        highlights: isFa
          ? ['اشتراک اینترنت NAT Gateway', 'پورت فورواردینگ و Hairpin NAT', 'ایمن‌سازی پورت‌های داکر (DOCKER-USER)', 'پالیسی روتینگ و سینتکس nftables']
          : ['NAT Gateway & Masquerade', 'Port Forwarding & Hairpin NAT', 'Docker Protection (DOCKER-USER)', 'Policy Routing & Modern nftables'],
      },
    ],
    [l, isFa]
  );

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* 1. HERO SECTION */}
      <section className="relative text-center max-w-5xl mx-auto space-y-8 px-2 sm:px-4">
        {/* Glow ambient background sphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Top Feature Pill */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 shadow-lg shadow-emerald-950/40 backdrop-blur-sm text-xs font-mono text-emerald-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="font-semibold text-emerald-400 dir-ltr">v{__APP_VERSION__}</span>
          <span className="text-slate-600">•</span>
          <span>{l.hero.badge}</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-tight text-white"
        >
          <span>{l.hero.titlePrefix}</span>
          <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            {l.hero.titleHighlight}
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal"
        >
          {l.hero.subtitle}
        </motion.p>

        {/* Dual Primary Call-to-Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2"
        >
          <button
            type="button"
            id="btn-hero-launch-toolbox"
            onClick={() => onLaunchToolbox('setup')}
            className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-950/60 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer border border-emerald-400/40 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <span>{l.hero.ctaLaunch}</span>
            <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
          </button>

          <a
            href="https://github.com/SalarTaheri/LinuxNetwork"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${l.hero.ctaGithub} (opens in new tab)`}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-slate-600 text-sm sm:text-base font-semibold shadow-md transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <Github className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>{l.hero.ctaGithub}</span>
          </a>
        </motion.div>

        {/* Interactive Mock Terminal Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto mt-8 text-left dir-ltr"
        >
          <div className="bg-[#0b101c]/95 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/60" />
                <span className="ml-2 text-slate-400 font-medium">bash — linuxnetwork.ir</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>production ready</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 sm:p-5 space-y-3 font-mono text-xs sm:text-sm">
              <div className="text-slate-400 text-xs flex items-center justify-between">
                <span># {l.hero.terminalDesc}</span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">bash 5.x+ / curl</span>
              </div>
              <div className="bg-slate-950/90 rounded-lg p-3 sm:p-3.5 border border-slate-800/90 flex items-center justify-between gap-3 text-slate-200">
                <div className="overflow-x-auto whitespace-nowrap text-emerald-300 font-semibold select-all scrollbar-thin">
                  <span className="text-slate-500">$ </span>
                  {oneLinerCommand}
                </div>
                <button
                  type="button"
                  onClick={handleCopyOneLiner}
                  aria-label={copiedTerminal ? t.setup.copied : l.hero.copyCmd}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  title="Copy command"
                >
                  {copiedTerminal ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.setup.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{l.hero.copyCmd}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Supported distributions tags inside terminal */}
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-slate-500">{l.hero.distrosLabel}</span>
                {SUPPORTED_DISTROS.map((distro) => (
                  <span
                    key={distro}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {distro}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. CORE TOOLS SHOWCASE (5 GRID CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{l.toolsSection.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            {l.toolsSection.title}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            {l.toolsSection.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {toolCards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 transition-all duration-300 shadow-lg hover:shadow-2xl ${card.colorClasses.glow}`}
            >
              <div className="space-y-4">
                {/* Header: Icon & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner ${card.colorClasses.iconBg}`}>
                    {card.icon}
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${card.colorClasses.badge}`}>
                    {card.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed min-h-[44px]">
                    {card.desc}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  {card.highlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => onLaunchToolbox(card.id)}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${card.colorClasses.button}`}
                >
                  <span>{l.toolsSection.openTool}</span>
                  <ArrowIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. SECURITY & PRIVACY ARCHITECTURE PILLARS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 to-[#0b101c]/90 border border-slate-800 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{l.securitySection.badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
              {l.securitySection.title}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {l.securitySection.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {l.securitySection.pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono">
                  {idx === 0 ? <Lock className="w-5 h-5" /> : idx === 1 ? <Server className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <h4 className="text-base font-bold text-white">
                  {pillar.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DISTRIBUTIONS COMPATIBILITY BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-slate-200">
            {l.distrosSection.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {l.distrosSection.subtitle}
          </p>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <DistroBadges lang={lang} />
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
            <span>{l.faqSection.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {l.faqSection.title}
          </h2>
        </div>

        <div className="space-y-3">
          {l.faqSection.items.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  id={`faq-question-${idx}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left rtl:text-right gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                >
                  <span className="font-semibold text-sm sm:text-base text-slate-200">
                    {item.q}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-question-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-teal-950/70 border border-emerald-500/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              {l.ctaSection.title}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              {l.ctaSection.subtitle}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onLaunchToolbox('setup')}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-950/80 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer border border-emerald-400/40"
            >
              <span>{l.ctaSection.button}</span>
              <ArrowIcon className="w-5 h-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
