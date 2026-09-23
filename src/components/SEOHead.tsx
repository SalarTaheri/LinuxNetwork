import React, { useEffect, useState, useMemo } from 'react';
import { Share2, Check, Copy, ExternalLink, Eye, Code, Globe, ShieldCheck, X } from 'lucide-react';
import { Language, ToolTab, PageView } from '../types';
import { SEO_CONFIG, LANDING_SEO_CONFIG, SITE_CONFIG, ToolSEOData } from '../data/seoConfig';

interface SEOHeadProps {
  view?: PageView;
  activeTab: ToolTab;
  lang: Language;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ view = 'toolbox', activeTab, lang }) => {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'card' | 'meta' | 'jsonld'>('card');

  const isLanding = view === 'landing';
  const currentSEO: ToolSEOData = isLanding ? LANDING_SEO_CONFIG[lang] : SEO_CONFIG[activeTab][lang];
  const shareUrl = isLanding ? SITE_CONFIG.siteUrl : `${SITE_CONFIG.siteUrl}/?tool=${activeTab}`;
  const pageCanonical = isLanding ? SITE_CONFIG.siteUrl : `${SITE_CONFIG.siteUrl}/?tool=${activeTab}`;

  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_CONFIG.siteUrl}/#website`,
        url: SITE_CONFIG.siteUrl,
        name: SITE_CONFIG.siteName,
        alternateName: ['لینوکس نتورک', 'LinuxNetwork'],
        description: currentSEO.metaDescription,
        inLanguage: ['fa-IR', 'en-US'],
        publisher: {
          '@type': 'Organization',
          name: SITE_CONFIG.author,
          url: SITE_CONFIG.siteUrl,
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${pageCanonical}#webapp`,
        name: currentSEO.title,
        headline: currentSEO.headline,
        url: pageCanonical,
        applicationCategory: 'NetworkingApplication',
        operatingSystem: 'Linux (Ubuntu, Debian, CentOS, RHEL, AlmaLinux, Rocky Linux, Alpine Linux)',
        browserRequirements: 'Requires JavaScript. 100% Client-Side Private Processing.',
        description: currentSEO.metaDescription,
        inLanguage: [lang === 'fa' ? 'fa-IR' : 'en-US'],
        isAccessibleForFree: true,
        featureList: currentSEO.featureList,
        screenshot: SITE_CONFIG.ogImage,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        creator: {
          '@type': 'Organization',
          name: SITE_CONFIG.author,
          url: SITE_CONFIG.siteUrl,
        },
      },
      ...(!isLanding
        ? [
            {
              '@type': 'BreadcrumbList',
              '@id': `${pageCanonical}#breadcrumb`,
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: lang === 'fa' ? 'صفحه اصلی' : 'Home',
                  item: SITE_CONFIG.siteUrl,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: currentSEO.headline,
                  item: pageCanonical,
                },
              ],
            },
          ]
        : []),
      ...(currentSEO.faqs && currentSEO.faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageCanonical}#faq`,
              mainEntity: currentSEO.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  }), [currentSEO, isLanding, lang, pageCanonical]);

  // Dynamically update document title, meta tags, and structured JSON-LD data
  useEffect(() => {
    // 1. Update Document Title
    document.title = currentSEO.title;

    // Helper to update or create a <meta> tag
    const setMetaTag = (attribute: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update or create a <link> tag
    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
      let element = document.querySelector(selector) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        if (hreflang) element.setAttribute('hreflang', hreflang);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Search Engine Meta Tags
    setMetaTag('name', 'description', currentSEO.metaDescription);
    setMetaTag('name', 'keywords', currentSEO.keywords.join(', '));
    setMetaTag('name', 'author', SITE_CONFIG.author);
    setMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');

    // 3. Open Graph (Facebook, Telegram, LinkedIn, Discord, WhatsApp)
    setMetaTag('property', 'og:title', currentSEO.ogTitle);
    setMetaTag('property', 'og:description', currentSEO.ogDescription);
    setMetaTag('property', 'og:url', isLanding ? `${SITE_CONFIG.siteUrl}/?lang=${lang}` : `${SITE_CONFIG.siteUrl}/?tool=${activeTab}&lang=${lang}`);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', SITE_CONFIG.siteName);
    setMetaTag('property', 'og:locale', lang === 'fa' ? 'fa_IR' : 'en_US');
    setMetaTag('property', 'og:locale:alternate', lang === 'fa' ? 'en_US' : 'fa_IR');
    setMetaTag('property', 'og:image', SITE_CONFIG.ogImage);
    setMetaTag('property', 'og:image:secure_url', SITE_CONFIG.ogImage);
    setMetaTag('property', 'og:image:width', '1200');
    setMetaTag('property', 'og:image:height', '630');
    setMetaTag('property', 'og:image:type', 'image/png');
    setMetaTag('property', 'og:image:alt', currentSEO.title);

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', currentSEO.ogTitle);
    setMetaTag('name', 'twitter:description', currentSEO.ogDescription);
    setMetaTag('name', 'twitter:image', SITE_CONFIG.ogImage);
    setMetaTag('name', 'twitter:image:alt', currentSEO.title);
    setMetaTag('name', 'twitter:site', SITE_CONFIG.twitterHandle);
    setMetaTag('name', 'twitter:creator', SITE_CONFIG.twitterHandle);

    // 5. Canonical & Hreflang Multi-language Alternate Links
    setLinkTag('canonical', pageCanonical);
    setLinkTag('alternate', isLanding ? `${SITE_CONFIG.siteUrl}/?lang=fa` : `${SITE_CONFIG.siteUrl}/?tool=${activeTab}&lang=fa`, 'fa');
    setLinkTag('alternate', isLanding ? `${SITE_CONFIG.siteUrl}/?lang=en` : `${SITE_CONFIG.siteUrl}/?tool=${activeTab}&lang=en`, 'en');
    setLinkTag('alternate', pageCanonical, 'x-default');

    // 6. Schema.org JSON-LD Structured Data
    let schemaScript = document.getElementById('seo-structured-data') as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'seo-structured-data';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    schemaScript.textContent = JSON.stringify(structuredData, null, 2);

    // 7. Update browser address bar without reload
    try {
      if (isLanding) {
        // Keep root or clean url when in landing view
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('tool')) {
          currentUrl.searchParams.delete('tool');
          const target = currentUrl.search ? `${currentUrl.pathname}?${currentUrl.searchParams.toString()}` : currentUrl.pathname;
          window.history.replaceState(null, '', target === '/app' ? '/' : target);
        }
      } else {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('tool', activeTab);
        window.history.replaceState(null, '', currentUrl.toString());
      }
    } catch {
      // In sandboxed environments if URL manipulation is restricted, fail gracefully
    }
  }, [activeTab, lang, currentSEO, isLanding]);

  const copyShareLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentSEO.title,
          text: currentSEO.ogDescription,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyShareLink();
    }
  };

  const isFa = lang === 'fa';

  if (isLanding) {
    return null;
  }

  return (
    <>
      {/* Top Banner Toolbar Share Trigger & Active SEO indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs">
        <div className="flex items-center gap-2 text-slate-400 min-w-0">
          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-500 hidden sm:inline">URL:</span>
          <span className="font-mono text-emerald-300 truncate dir-ltr select-all">
            linuxnetwork.ir/?tool={activeTab}
          </span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="hidden md:inline text-slate-400 text-[11px] truncate">
            {currentSEO.headline}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-tool-link"
            type="button"
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all font-medium cursor-pointer"
            title={isFa ? 'کپی لینک مستقیم این ابزار' : 'Copy direct link to this tool'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? (isFa ? 'کپی شد!' : 'Copied!') : (isFa ? 'کپی لینک مستقیم' : 'Copy Link')}</span>
          </button>

          <button
            id="btn-open-seo-preview"
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 border border-emerald-700/40 transition-all font-medium cursor-pointer"
            title={isFa ? 'پیش‌نمایش سوشال مدیا و متاتگ‌های Open Graph' : 'SEO & Social Card Preview'}
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFa ? 'اشتراک و متاتگ‌ها' : 'SEO & Share'}</span>
          </button>
        </div>
      </div>

      {/* SEO & Open Graph Social Preview Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-[#0d131f] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isFa ? 'مدیریت سئو و اشتراک‌گذاری در شبکه‌های اجتماعی' : 'SEO & Social Media Sharing Manager'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isFa ? 'پیش‌نمایش کارت Open Graph، متاتگ‌ها و لینک اختصاصی این ابزار' : 'Open Graph live card preview, dynamic meta tags & structured data'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setActivePreviewTab('card')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activePreviewTab === 'card'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isFa ? 'پیش‌نمایش کارت اشتراک (Social Card)' : 'Social Card Preview'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('meta')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activePreviewTab === 'meta'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>{isFa ? 'متاتگ‌های تولید شده' : 'Rendered Meta Tags'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('jsonld')}
                className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activePreviewTab === 'jsonld'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isFa ? 'دیتای ساختاریافته (JSON-LD)' : 'Structured Data'}</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Tab 1: Live Social Card Preview */}
              {activePreviewTab === 'card' && (
                <div className="space-y-4">
                  <div className="text-slate-400 text-[11px] flex items-center justify-between">
                    <span>{isFa ? 'ظاهر لینک هنگام ارسال در تلگرام، توییتر (X)، لینکدین و دیسکورد:' : 'Live rendering preview as seen on Telegram, X (Twitter), LinkedIn & Discord:'}</span>
                    <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      1200 × 630 OG Banner
                    </span>
                  </div>

                  {/* Mock Social Card Container */}
                  <div className="border border-slate-700/80 bg-slate-950 rounded-xl overflow-hidden shadow-xl max-w-lg mx-auto">
                    {/* Banner Image Simulation */}
                    <div className="relative aspect-[1200/630] w-full bg-slate-900 border-b border-slate-800 overflow-hidden group">
                      <img
                        src="/og-image.png"
                        alt={currentSEO.title}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                      <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono">
                        linuxnetwork.ir
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      <div className="text-[11px] font-mono text-emerald-400/90 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        linuxnetwork.ir
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
                        {currentSEO.ogTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                        {currentSEO.ogDescription}
                      </p>
                    </div>
                  </div>

                  {/* Shareable Link Input */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-medium text-slate-300 block">
                      {isFa ? 'لینک مستقیم این ابزار جهت اشتراک‌گذاری:' : 'Direct Shareable Tool Link:'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 select-all outline-none focus:border-emerald-500 dir-ltr"
                      />
                      <button
                        type="button"
                        onClick={copyShareLink}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/50"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? (isFa ? 'کپی شد' : 'Copied') : (isFa ? 'کپی' : 'Copy')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Rendered Meta Tags */}
              {activePreviewTab === 'meta' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">
                    {isFa
                      ? 'این تگ‌ها به صورت خودکار با تغییر تب یا زبان در بخش <head> مرورگر درج و به‌روزرسانی می‌شوند:'
                      : 'These tags are dynamically injected into <head> upon tab or language changes:'}
                  </p>
                  <pre
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed dir-ltr select-all"
                  >
{`<!-- Primary Meta Tags -->
<title>${currentSEO.title}</title>
<meta name="description" content="${currentSEO.metaDescription}" />
<meta name="keywords" content="${currentSEO.keywords.join(', ')}" />
<meta name="author" content="${SITE_CONFIG.author}" />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

<!-- Canonical & Language Alternates -->
<link rel="canonical" href="${pageCanonical}" />
<link rel="alternate" hreflang="fa" href="${isLanding ? `${SITE_CONFIG.siteUrl}/?lang=fa` : `${SITE_CONFIG.siteUrl}/?tool=${activeTab}&lang=fa`}" />
<link rel="alternate" hreflang="en" href="${isLanding ? `${SITE_CONFIG.siteUrl}/?lang=en` : `${SITE_CONFIG.siteUrl}/?tool=${activeTab}&lang=en`}" />
<link rel="alternate" hreflang="x-default" href="${pageCanonical}" />

<!-- Open Graph / Facebook / Telegram / LinkedIn / WhatsApp -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${shareUrl}" />
<meta property="og:site_name" content="${SITE_CONFIG.siteName}" />
<meta property="og:locale" content="${lang === 'fa' ? 'fa_IR' : 'en_US'}" />
<meta property="og:locale:alternate" content="${lang === 'fa' ? 'en_US' : 'fa_IR'}" />
<meta property="og:title" content="${currentSEO.ogTitle}" />
<meta property="og:description" content="${currentSEO.ogDescription}" />
<meta property="og:image" content="${SITE_CONFIG.ogImage}" />
<meta property="og:image:secure_url" content="${SITE_CONFIG.ogImage}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="${SITE_CONFIG.twitterHandle}" />
<meta name="twitter:creator" content="${SITE_CONFIG.twitterHandle}" />
<meta name="twitter:title" content="${currentSEO.ogTitle}" />
<meta name="twitter:description" content="${currentSEO.ogDescription}" />
<meta name="twitter:image" content="${SITE_CONFIG.ogImage}" />`}
                  </pre>
                </div>
              )}

              {/* Tab 3: JSON-LD Structured Data */}
              {activePreviewTab === 'jsonld' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">
                    {isFa
                      ? 'دیتای ساختاریافته چندگانه Schema.org (@graph شامل WebSite، WebApplication، BreadcrumbList و FAQPage) برای ثبت ریچ اسنیپت‌های گوگل:'
                      : 'Schema.org Multi-entity Graph (WebSite, WebApplication, BreadcrumbList, and FAQPage) for Google Rich Snippets:'}
                  </p>
                  <pre
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed dir-ltr select-all"
                  >
{JSON.stringify(structuredData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {isFa ? 'بهینه‌سازی شده برای ربات‌های گوگل، تلگرام، توییتر و کلودفلر' : 'Optimized for Googlebot, Telegram, X, and Cloudflare Pages'}
              </span>

              <div className="flex items-center gap-2">
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isFa ? 'ارسال با...' : 'Share via...'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  {isFa ? 'بستن' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
