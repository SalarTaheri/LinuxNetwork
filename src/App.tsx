import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, ToolTab, PageView } from './types';
import { translations } from './i18n/translations';
import { Header } from './components/Header';
import { SEOHead } from './components/SEOHead';
import { NetworkBackground } from './components/NetworkBackground';
import { ToolboxNavigation } from './components/ToolboxNavigation';

const LandingPage = lazy(() => import('./components/LandingPage').then((m) => ({ default: m.LandingPage })));
const SetupScriptTool = lazy(() => import('./components/SetupScriptTool').then((m) => ({ default: m.SetupScriptTool })));
const SysctlTool = lazy(() => import('./components/SysctlTool').then((m) => ({ default: m.SysctlTool })));
const NginxTool = lazy(() => import('./components/NginxTool').then((m) => ({ default: m.NginxTool })));
const WireGuardTool = lazy(() => import('./components/WireGuardTool').then((m) => ({ default: m.WireGuardTool })));
const SubnetTool = lazy(() => import('./components/SubnetTool').then((m) => ({ default: m.SubnetTool })));
const RoutingTool = lazy(() => import('./components/RoutingTool').then((m) => ({ default: m.RoutingTool })));

const ToolLoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const VALID_TABS: ToolTab[] = ['setup', 'sysctl', 'nginx', 'wireguard', 'subnet', 'routing'];

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
        <Suspense fallback={<ToolLoadingFallback />}>
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
                {/* Scalable Navigation, Categories & Quick Command Bar */}
                <ToolboxNavigation
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  lang={lang}
                />

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
                    {activeTab === 'routing' && <RoutingTool lang={lang} />}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
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
