import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Globe2, Shield, Calculator } from 'lucide-react';
import { Language, ToolTab } from './types';
import { translations } from './i18n/translations';
import { Header } from './components/Header';
import { SEOHead } from './components/SEOHead';
import { SetupScriptTool } from './components/SetupScriptTool';
import { SysctlTool } from './components/SysctlTool';
import { NginxTool } from './components/NginxTool';
import { WireGuardTool } from './components/WireGuardTool';
import { SubnetTool } from './components/SubnetTool';

const VALID_TABS: ToolTab[] = ['setup', 'sysctl', 'nginx', 'wireguard', 'subnet'];

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('linuxnetwork_lang');
    return saved === 'en' ? 'en' : 'fa';
  });

  const [activeTab, setActiveTab] = useState<ToolTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const toolParam = params.get('tool') as ToolTab | null;
      if (toolParam && VALID_TABS.includes(toolParam)) {
        return toolParam;
      }
      const hash = window.location.hash.replace('#', '') as ToolTab;
      if (VALID_TABS.includes(hash)) {
        return hash;
      }
    }
    return 'setup';
  });

  useEffect(() => {
    localStorage.setItem('linuxnetwork_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  // Sync tab with browser back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const toolParam = params.get('tool') as ToolTab | null;
      if (toolParam && VALID_TABS.includes(toolParam)) {
        setActiveTab(toolParam);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const t = translations[lang];

  const tabs: { id: ToolTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'setup',
      label: t.tabs.setup,
      icon: <Terminal className="w-4 h-4" />,
      badge: 'setup.sh',
    },
    {
      id: 'sysctl',
      label: t.tabs.sysctl,
      icon: <Cpu className="w-4 h-4" />,
      badge: 'BBR / TCP',
    },
    {
      id: 'nginx',
      label: t.tabs.nginx,
      icon: <Globe2 className="w-4 h-4" />,
      badge: 'Reverse Proxy',
    },
    {
      id: 'wireguard',
      label: t.tabs.wireguard,
      icon: <Shield className="w-4 h-4" />,
      badge: 'VPN / Curve25519',
    },
    {
      id: 'subnet',
      label: t.tabs.subnet,
      icon: <Calculator className="w-4 h-4" />,
      badge: 'CIDR / IP',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col bg-[#090d16] text-slate-100 ${lang === 'fa' ? 'font-sans' : ''}`}>
      {/* Navbar & Privacy Banner */}
      <Header lang={lang} onToggleLang={toggleLanguage} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div role="tablist" aria-label="Linux Tools Navigation" className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl shadow-lg flex flex-wrap gap-1.5 items-center">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                role="tab"
                aria-selected={active}
                aria-controls={`tabpanel-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] sm:min-w-0 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className={active ? 'text-white' : 'text-emerald-400'}>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`hidden xl:inline text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      active
                        ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                    dir="ltr"
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic SEO, Open Graph Meta Tags & Social Sharing Manager */}
        <SEOHead activeTab={activeTab} lang={lang} />

        {/* Active Tool View */}
        <div id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-nav-${activeTab}`} className="pt-2">
          {activeTab === 'setup' && <SetupScriptTool lang={lang} />}
          {activeTab === 'sysctl' && <SysctlTool lang={lang} />}
          {activeTab === 'nginx' && <NginxTool lang={lang} />}
          {activeTab === 'wireguard' && <WireGuardTool lang={lang} />}
          {activeTab === 'subnet' && <SubnetTool lang={lang} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b12] py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-300 font-semibold dir-ltr">LinuxNetwork.ir</span>
            <span>—</span>
            <span>{t.footer.rights}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400/80 bg-emerald-950/30 border border-emerald-900/40 px-3 py-1 rounded-full">
            <span>{t.footer.openSource}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
