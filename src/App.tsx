import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Cpu, Globe2, Shield, Calculator } from 'lucide-react';
import { Language, ToolTab, PageView } from './types';
import { translations } from './i18n/translations';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { SEOHead } from './components/SEOHead';
import { NetworkBackground } from './components/NetworkBackground';
import { SetupScriptTool } from './components/SetupScriptTool';
import { SysctlTool } from './components/SysctlTool';
import { NginxTool } from './components/NginxTool';
import { WireGuardTool } from './components/WireGuardTool';
import { SubnetTool } from './components/SubnetTool';

const VALID_TABS: ToolTab[] = ['setup', 'sysctl', 'nginx', 'wireguard', 'subnet'];

// Helper to determine initial view & tab from window.location
const getInitialRouting = (): { view: PageView; tab: ToolTab } => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const toolParam = params.get('tool') as ToolTab | null;
    if (toolParam && VALID_TABS.includes(toolParam)) {
      return { view: 'toolbox', tab: toolParam };
    }
    const hash = window.location.hash.replace('#', '') as ToolTab;
    if (VALID_TABS.includes(hash)) {
      return { view: 'toolbox', tab: hash };
    }
    if (window.location.pathname.startsWith('/app') || window.location.hash.startsWith('#app')) {
      return { view: 'toolbox', tab: 'setup' };
    }
  }
  return { view: 'landing', tab: 'setup' };
};

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('linuxnetwork_lang');
    return saved === 'en' ? 'en' : 'fa';
  });

  const [view, setView] = useState<PageView>(() => getInitialRouting().view);
  const [activeTab, setActiveTab] = useState<ToolTab>(() => getInitialRouting().tab);

  useEffect(() => {
    localStorage.setItem('linuxnetwork_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  // Sync view & tab with browser back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const routing = getInitialRouting();
      setView(routing.view);
      setActiveTab(routing.tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const navigateToLanding = () => {
    setView('landing');
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('tool');
      const newPath = currentUrl.pathname === '/app' ? '/' : currentUrl.pathname;
      const target = currentUrl.search ? `${newPath}?${currentUrl.searchParams.toString()}` : newPath;
      window.history.pushState(null, '', target);
    }
  };

  const navigateToToolbox = (tool?: ToolTab) => {
    const targetTool = tool || activeTab;
    setActiveTab(targetTool);
    setView('toolbox');
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('tool', targetTool);
      window.history.pushState(null, '', currentUrl.toString());
    }
  };

  const handleTabChange = (tab: ToolTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('tool', tab);
      window.history.pushState(null, '', currentUrl.toString());
    }
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
    <div className={`min-h-screen flex flex-col bg-[#090d16] text-slate-100 relative overflow-x-hidden ${lang === 'fa' ? 'font-sans' : ''}`}>
      {/* Dynamic Cyber Network Background Canvas */}
      <NetworkBackground />

      {/* Navbar & Privacy Banner */}
      <Header
        lang={lang}
        onToggleLang={toggleLanguage}
        view={view}
        onNavigateLanding={navigateToLanding}
        onNavigateToolbox={navigateToToolbox}
      />

      {/* Dynamic SEO, Open Graph Meta Tags & Social Sharing Manager */}
      <SEOHead view={view} activeTab={activeTab} lang={lang} />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {view === 'landing' ? (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <LandingPage lang={lang} onLaunchToolbox={navigateToToolbox} />
            </motion.div>
          ) : (
            <motion.div
              key="toolbox-page"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Navigation Tabs Bar */}
              <div
                role="tablist"
                aria-label="Linux Tools Navigation"
                className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-lg flex flex-wrap gap-1.5 items-center"
              >
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
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative flex-1 min-w-[140px] sm:min-w-0 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                        active
                          ? 'text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md shadow-emerald-950/60 border border-emerald-400/40"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className={`relative z-10 transition-colors ${active ? 'text-white' : 'text-emerald-400'}`}>{tab.icon}</span>
                      <span className="relative z-10 truncate">{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={`relative z-10 hidden xl:inline text-[9px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                            active
                              ? 'bg-emerald-900/70 text-emerald-200 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/50'
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

              {/* Active Tool View with Fluid Entry & Exit Transitions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  id={`tabpanel-${activeTab}`}
                  role="tabpanel"
                  aria-labelledby={`tab-nav-${activeTab}`}
                  className="pt-2"
                  initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {activeTab === 'setup' && <SetupScriptTool lang={lang} />}
                  {activeTab === 'sysctl' && <SysctlTool lang={lang} />}
                  {activeTab === 'nginx' && <NginxTool lang={lang} />}
                  {activeTab === 'wireguard' && <WireGuardTool lang={lang} />}
                  {activeTab === 'subnet' && <SubnetTool lang={lang} />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b12] py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={navigateToLanding}
              className="font-mono text-slate-300 hover:text-emerald-400 font-semibold dir-ltr transition-colors cursor-pointer"
            >
              LinuxNetwork.ir
            </button>
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
