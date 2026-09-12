import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';

interface DistroBadgesProps {
  lang: Language;
  showLabels?: boolean;
}

interface DistroInfo {
  id: string;
  name: string;
  versions: string;
  brandColor: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  icon: (color: string) => React.ReactNode;
}

export const DISTROS: DistroInfo[] = [
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    versions: '20.04 / 22.04 / 24.04 LTS',
    brandColor: '#E95420',
    badgeBorder: 'hover:border-[#E95420]/60',
    badgeBg: 'hover:bg-[#E95420]/10',
    badgeText: 'text-[#E95420]',
    icon: (color) => (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
        <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" strokeDasharray="16 2 16 2" />
        <circle cx="5" cy="12" r="1.8" fill={color} />
        <circle cx="15.5" cy="5.9" r="1.8" fill={color} />
        <circle cx="15.5" cy="18.1" r="1.8" fill={color} />
      </svg>
    ),
  },
  {
    id: 'debian',
    name: 'Debian',
    versions: '11 (Bullseye) / 12 (Bookworm)',
    brandColor: '#D70A53',
    badgeBorder: 'hover:border-[#D70A53]/60',
    badgeBg: 'hover:bg-[#D70A53]/10',
    badgeText: 'text-[#D70A53]',
    icon: (color) => (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5c-2.8 0-4.5-1.9-4.5-4.2 0-2.6 2.1-4.8 5-4.8 2.2 0 3.8 1.3 3.8 3.2 0 1.5-1.1 2.8-2.6 2.8-1.2 0-1.8-.8-1.8-1.8 0-1.2.9-2.1 2.1-2.1.2 0 .5 0 .7.1-.4-1.2-1.4-1.7-2.3-1.7-1.8 0-3.2 1.5-3.2 3.4 0 1.8 1.4 3.1 3.3 3.1 1.2 0 2.2-.5 2.8-1.2l.9.8c-.8.9-2.1 1.4-3.7 1.4z" />
      </svg>
    ),
  },
  {
    id: 'rhel',
    name: 'RHEL',
    versions: '8.x / 9.x / 10.x',
    brandColor: '#EE0000',
    badgeBorder: 'hover:border-[#EE0000]/60',
    badgeBg: 'hover:bg-[#EE0000]/10',
    badgeText: 'text-[#EE0000]',
    icon: (color) => (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
        <path d="M12 3C8.5 3 6 5.5 5.5 8c-.4 2 .3 3.9 1.7 5.1-3.6.5-6.2 2.6-6.2 5.2C1 21.4 5.9 23 12 23s11-1.6 11-4.7c0-2.6-2.6-4.7-6.2-5.2 1.4-1.2 2.1-3.1 1.7-5.1C18 5.5 15.5 3 12 3zm0 2.2c2.4 0 4.1 1.8 4.3 3.8.2 2.1-1.2 3.8-3.3 4-2.1.2-4.1-1.3-4.3-3.4-.2-2.1 1.4-4.4 3.3-4.4zm0 11.8c4.8 0 8.5 1.1 8.5 2.8 0 1.7-3.7 2.8-8.5 2.8S3.5 21.5 3.5 19.8c0-1.7 3.7-2.8 8.5-2.8z" />
      </svg>
    ),
  },
  {
    id: 'rocky',
    name: 'Rocky',
    versions: '8.x / 9.x',
    brandColor: '#10B981',
    badgeBorder: 'hover:border-[#10B981]/60',
    badgeBg: 'hover:bg-[#10B981]/10',
    badgeText: 'text-[#10B981]',
    icon: (color) => (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
        <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.8L19.5 9v6L12 19.2 4.5 15V9L12 4.8zm-1 4.7l4.5 5.5h-2.5l-2-2.5-1.5 1.5h-2l3.5-4.5z" />
      </svg>
    ),
  },
  {
    id: 'almalinux',
    name: 'AlmaLinux',
    versions: '8.x / 9.x',
    brandColor: '#0284C7',
    badgeBorder: 'hover:border-[#0284C7]/60',
    badgeBg: 'hover:bg-[#0284C7]/10',
    badgeText: 'text-[#38BDF8]',
    icon: (color) => (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2" />
        <path d="M12 7l3.5 5-3.5 5-3.5-5L12 7z" fill={color} />
      </svg>
    ),
  },
  {
    id: 'centos',
    name: 'CentOS',
    versions: 'Stream 8 / 9 / 10',
    brandColor: '#F59E0B',
    badgeBorder: 'hover:border-[#F59E0B]/60',
    badgeBg: 'hover:bg-[#F59E0B]/10',
    badgeText: 'text-[#F59E0B]',
    icon: () => (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
        <path d="M12 2L8.5 7h7L12 2z" fill="#F59E0B" />
        <path d="M22 12l-5-3.5v7l5-3.5z" fill="#10B981" />
        <path d="M12 22l3.5-5h-7l3.5 5z" fill="#3B82F6" />
        <path d="M2 12l5 3.5v-7L2 12z" fill="#EC4899" />
        <rect x="9" y="9" width="6" height="6" fill="#64748B" rx="1" />
      </svg>
    ),
  },
  {
    id: 'fedora',
    name: 'Fedora',
    versions: '38 / 39 / 40 / 41+',
    brandColor: '#3B82F6',
    badgeBorder: 'hover:border-[#3B82F6]/60',
    badgeBg: 'hover:bg-[#3B82F6]/10',
    badgeText: 'text-[#60A5FA]',
    icon: (color) => (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 5.2c1.7 0 3 1.3 3 3 0 1.2-.7 2.2-1.7 2.7v-1.2c.5-.4.8-.9.8-1.5 0-1.1-.9-2-2-2s-2 .9-2 2v2.5h-1.8v-2.5c0-1.7 1.4-3 3.7-3zm-3.5 6.6h1.8v2.5c0 1.1.9 2 2 2s2-.9 2-2v-1.2h1.5v1.2c0 1.7-1.3 3-3.2 3-1.8 0-3.3-1.3-3.3-3v-2.5h-.8V14h.8v-.2z" />
      </svg>
    ),
  },
  {
    id: 'alpine',
    name: 'Alpine',
    versions: '3.18 / 3.19 / 3.20 / 3.21+',
    brandColor: '#0D597F',
    badgeBorder: 'hover:border-[#38BDF8]/60',
    badgeBg: 'hover:bg-[#0D597F]/20',
    badgeText: 'text-[#38BDF8]',
    icon: () => (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#38BDF8">
        <path d="M12 3L1 21h7.5l3.5-6 3.5 6H23L12 3zm0 5.2L16.4 16h-2.3l-2.1-3.6-2.1 3.6H7.6L12 8.2z" />
      </svg>
    ),
  },
];

export const DistroBadges: React.FC<DistroBadgesProps> = ({ lang, showLabels = true }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
      <span className="text-[11px] font-mono text-slate-400 mr-1 hidden sm:inline select-none">
        {lang === 'fa' ? 'توزیع‌های تست‌شده:' : 'Tested Distros:'}
      </span>
      {DISTROS.map((distro) => {
        const isHovered = activeTooltip === distro.id;
        return (
          <div
            key={distro.id}
            className="relative cursor-pointer"
            onMouseEnter={() => setActiveTooltip(distro.id)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <motion.div
              whileHover={{ scale: 1.06, y: -1.5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] font-mono transition-colors duration-200 ${distro.badgeBorder} ${distro.badgeBg}`}
            >
              {distro.icon(distro.brandColor)}
              {showLabels && (
                <span className={`font-semibold transition-colors ${isHovered ? distro.badgeText : 'text-slate-300'}`}>
                  {distro.name}
                </span>
              )}
            </motion.div>

            {/* Floating Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 2, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-mono whitespace-nowrap shadow-xl z-50 pointer-events-none"
                >
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>{distro.name}</span>
                    <span className="text-emerald-400 text-[9px]">✔ Verified</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">{distro.versions}</div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-700" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
