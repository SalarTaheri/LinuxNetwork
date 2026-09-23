import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  Cpu,
  Globe2,
  Shield,
  Calculator,
  Route,
  Search,
  Command,
  X,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Server,
  Network,
  Lock,
} from 'lucide-react';
import { Language, ToolTab, ToolCategory } from '../types';
import { translations } from '../i18n/translations';

interface ToolItem {
  id: ToolTab;
  category: Exclude<ToolCategory, 'all'>;
  label: string;
  compactLabel: string;
  icon: React.ReactNode;
  badge: string;
  keywords: string[];
}

interface ToolboxNavigationProps {
  activeTab: ToolTab;
  onTabChange: (tab: ToolTab) => void;
  lang: Language;
  onPreloadTool?: (tab: ToolTab) => void;
}

export const ToolboxNavigation: React.FC<ToolboxNavigationProps> = React.memo(({
  activeTab,
  onTabChange,
  lang,
  onPreloadTool,
}) => {
  const t = translations[lang];
  const isFa = lang === 'fa';
  const ArrowIcon = isFa ? ArrowLeft : ArrowRight;

  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // All registered tools with their categories and search keywords
  const tools: ToolItem[] = useMemo(
    () => [
      {
        id: 'setup',
        category: 'server',
        label: t.tabs.setup,
        compactLabel: t.toolboxNav.compactTabs.setup,
        icon: <Terminal className="w-4 h-4" />,
        badge: 'setup.sh',
        keywords: [
          'setup',
          'install',
          'bash',
          'ssh',
          'bbr',
          'docker',
          'fail2ban',
          'ufw',
          'firewalld',
          'zsh',
          'ستاپ',
          'سرور',
          'داکر',
          'فایروال',
        ],
      },
      {
        id: 'sysctl',
        category: 'server',
        label: t.tabs.sysctl,
        compactLabel: t.toolboxNav.compactTabs.sysctl,
        icon: <Cpu className="w-4 h-4" />,
        badge: 'BBR / TCP',
        keywords: [
          'sysctl',
          'bbr',
          'kernel',
          'tcp',
          'tuning',
          'buffer',
          'somaxconn',
          'cake',
          'fq',
          'کرنل',
          'بهینه سازی',
          'پهنای باند',
        ],
      },
      {
        id: 'nginx',
        category: 'security',
        label: t.tabs.nginx,
        compactLabel: t.toolboxNav.compactTabs.nginx,
        icon: <Globe2 className="w-4 h-4" />,
        badge: 'Reverse Proxy',
        keywords: [
          'nginx',
          'proxy',
          'ssl',
          'tls',
          'http2',
          'http3',
          'quic',
          'websocket',
          'hsts',
          'انجین ایکس',
          'ریورس پروکسی',
          'گواهی',
        ],
      },
      {
        id: 'wireguard',
        category: 'security',
        label: t.tabs.wireguard,
        compactLabel: t.toolboxNav.compactTabs.wireguard,
        icon: <Shield className="w-4 h-4" />,
        badge: 'VPN / Crypto',
        keywords: [
          'wireguard',
          'vpn',
          'tunnel',
          'crypto',
          'qr',
          'mtu',
          'curve25519',
          'وایرگارد',
          'تانل',
          'وی پی ان',
          'کیو آر',
        ],
      },
      {
        id: 'subnet',
        category: 'network',
        label: t.tabs.subnet,
        compactLabel: t.toolboxNav.compactTabs.subnet,
        icon: <Calculator className="w-4 h-4" />,
        badge: 'CIDR / IP',
        keywords: [
          'subnet',
          'cidr',
          'ip',
          'netmask',
          'broadcast',
          'calculator',
          'route',
          'ساب نت',
          'محاسبه',
          'آی پی',
          'ماسک',
        ],
      },
      {
        id: 'routing',
        category: 'network',
        label: t.tabs.routing,
        compactLabel: t.toolboxNav.compactTabs.routing,
        icon: <Route className="w-4 h-4" />,
        badge: 'NAT / Route',
        keywords: [
          'routing',
          'nat',
          'iptables',
          'nftables',
          'port forward',
          'dnat',
          'hairpin',
          'docker',
          'pbr',
          'multi-wan',
          'rate limit',
          'مسیریابی',
          'فایروال',
          'پورت فوروارد',
        ],
      },
    ],
    [t]
  );

  // Filter tools by active category
  const filteredTools = useMemo(() => {
    if (selectedCategory === 'all') return tools;
    return tools.filter((tool) => tool.category === selectedCategory);
  }, [tools, selectedCategory]);

  // Search results for Command Palette
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (tool) =>
        tool.label.toLowerCase().includes(q) ||
        tool.compactLabel.toLowerCase().includes(q) ||
        tool.badge.toLowerCase().includes(q) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  }, [tools, searchQuery]);

  // Keep search index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Auto-switch category if the user was on a category that doesn't include the newly chosen tab
  const handleSelectTool = (tabId: ToolTab) => {
    const targetTool = tools.find((t) => t.id === tabId);
    if (targetTool && selectedCategory !== 'all' && targetTool.category !== selectedCategory) {
      setSelectedCategory('all');
    }
    onTabChange(tabId);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    searchTriggerRef.current?.focus();
  };

  // Keyboard shortcut listener: Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Auto-focus search input on modal open & lock body scroll
  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [searchOpen]);

  // Check overflow and scroll boundaries
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const scrollPos = Math.abs(el.scrollLeft);
    setCanScrollLeft(scrollPos > 4);
    setCanScrollRight(scrollPos < maxScroll - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [filteredTools]);

  useEffect(() => {
    const activeEl = document.getElementById(`tab-nav-${activeTab}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(checkScroll, 120);
  }, [activeTab, selectedCategory]);

  const handleScrollBy = (offset: number) => {
    if (!scrollContainerRef.current) return;
    const sign = isFa ? -1 : 1;
    scrollContainerRef.current.scrollBy({ left: offset * sign, behavior: 'smooth' });
  };

  // Memoize categories config to avoid array and object re-creations during search or scroll interactions
  const categories = useMemo<{ id: ToolCategory; label: string; icon: React.ReactNode; count: number }[]>(
    () => [
      {
        id: 'all',
        label: t.toolboxNav.categories.all,
        icon: <Layers className="w-3.5 h-3.5" />,
        count: tools.length,
      },
      {
        id: 'server',
        label: t.toolboxNav.categories.server,
        icon: <Server className="w-3.5 h-3.5" />,
        count: tools.filter((t) => t.category === 'server').length,
      },
      {
        id: 'network',
        label: t.toolboxNav.categories.network,
        icon: <Network className="w-3.5 h-3.5" />,
        count: tools.filter((t) => t.category === 'network').length,
      },
      {
        id: 'security',
        label: t.toolboxNav.categories.security,
        icon: <Lock className="w-3.5 h-3.5" />,
        count: tools.filter((t) => t.category === 'security').length,
      },
    ],
    [t, tools]
  );

  return (
    <div className="space-y-3">
      {/* Top Controls Bar: Categories & Quick Search Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
        {/* Category Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={isCatActive}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  isCatActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className={isCatActive ? 'text-emerald-400' : 'text-slate-500'}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isCatActive
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Trigger (Cmd+K Button) */}
        <button
          ref={searchTriggerRef}
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          aria-label={t.toolboxNav.searchBtn}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all shadow-sm cursor-pointer shrink-0 ml-auto rtl:ml-0 rtl:mr-auto focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          title={t.toolboxNav.searchHint}
        >
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline font-medium">{t.toolboxNav.searchBtn}</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-slate-800/80 border border-slate-700 text-slate-300 rounded">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Main Horizontal Tablist Container with smooth horizontal scroll & chevrons */}
      <div className="relative group/nav">
        {/* Left Scroll Button (on overflow) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScrollBy(-200)}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-lg bg-slate-900/95 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label={isFa ? "پیمایش به چپ" : "Scroll left"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Scroll Button (on overflow) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScrollBy(200)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-lg bg-slate-900/95 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label={isFa ? "پیمایش به راست" : "Scroll right"}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Left Fade Mask */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#090d16] to-transparent z-10 pointer-events-none rounded-l-xl" />
        )}

        {/* Right Fade Mask */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#090d16] to-transparent z-10 pointer-events-none rounded-r-xl" />
        )}

        <div
          ref={scrollContainerRef}
          role="tablist"
          aria-label="Linux Network Toolbox Navigation"
          className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-lg flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {filteredTools.map((tool) => {
            const active = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                id={`tab-nav-${tool.id}`}
                role="tab"
                aria-selected={active}
                aria-controls={`tabpanel-${tool.id}`}
                type="button"
                onClick={() => handleSelectTool(tool.id)}
                onMouseEnter={() => onPreloadTool?.(tool.id)}
                onFocus={() => onPreloadTool?.(tool.id)}
                onTouchStart={() => onPreloadTool?.(tool.id)}
                title={tool.label}
                className={`relative px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  active
                    ? 'text-white shadow-sm shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeToolTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md shadow-emerald-950/60 border border-emerald-400/40"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span
                  className={`relative z-10 transition-colors ${
                    active ? 'text-white' : 'text-emerald-400'
                  }`}
                >
                  {tool.icon}
                </span>
                <span className="relative z-10 whitespace-nowrap font-mono font-medium">
                  {tool.compactLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Command Palette / Quick Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseSearch();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.toolboxNav.searchBtn}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-[#0b101b] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              {/* Modal Search Input Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center gap-3">
                <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedIndex((prev) =>
                        prev < searchResults.length - 1 ? prev + 1 : 0
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : searchResults.length - 1
                      );
                    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
                      e.preventDefault();
                      handleSelectTool(searchResults[selectedIndex].id);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCloseSearch();
                    }
                  }}
                  placeholder={t.toolboxNav.searchPlaceholder}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                  aria-label={t.toolboxNav.searchPlaceholder}
                  aria-controls="search-results-list"
                  aria-activedescendant={
                    searchResults[selectedIndex]
                      ? `search-option-${searchResults[selectedIndex].id}`
                      : undefined
                  }
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={isFa ? 'پاک کردن جستجو' : 'Clear search'}
                    className="text-slate-500 hover:text-slate-300 p-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseSearch}
                  aria-label={isFa ? 'بستن جستجو' : 'Close search'}
                  className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                >
                  ESC
                </button>
              </div>

              {/* Search Results List */}
              <div
                id="search-results-list"
                role="listbox"
                aria-label={t.toolboxNav.searchBtn}
                className="max-h-80 overflow-y-auto p-2 space-y-1"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((tool, idx) => {
                    const isSelected = selectedIndex === idx;
                    const isCurrentActive = activeTab === tool.id;
                    return (
                      <button
                        key={tool.id}
                        id={`search-option-${tool.id}`}
                        role="option"
                        aria-selected={isSelected}
                        type="button"
                        onClick={() => handleSelectTool(tool.id)}
                        onMouseEnter={() => onPreloadTool?.(tool.id)}
                        onFocus={() => onPreloadTool?.(tool.id)}
                        className={`w-full text-left rtl:text-right p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                            : 'bg-slate-900/30 border-transparent hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                              isCurrentActive
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-800/70 border-slate-700 text-slate-400'
                            }`}
                          >
                            {tool.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-100">
                                {tool.label}
                              </span>
                              {isCurrentActive && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                                  {isFa ? 'فعال' : 'Active'}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {tool.badge}
                            </span>
                          </div>
                        </div>
                        <ArrowIcon className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                    <p>{t.toolboxNav.noResults}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer Info */}
              <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <Command className="w-3 h-3 text-emerald-400" />
                  <span>{tools.length} {t.toolboxNav.toolsCount}</span>
                </span>
                <span>{t.toolboxNav.searchHint}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

ToolboxNavigation.displayName = 'ToolboxNavigation';
