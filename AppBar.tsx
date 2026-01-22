
import React, { useState, useRef, useEffect } from 'react';
import { AppView } from './types';
import { SYSTEM_CONFIG } from './TechSpecs';

interface AppBarProps {
  onViewChange: (view: AppView) => void;
  onRefresh: () => void;
  onCategoryClick: (category: string) => void;
  currentView: AppView;
}

const NAV_ITEMS = [
  { view: AppView.HOME, label: 'الرئيسية', icon: '🏠' },
  { view: AppView.TREND, label: 'الترند', icon: '🔥' },
  { view: AppView.LIKES, label: 'الإعجابات', icon: '❤️' },
  { view: AppView.UNWATCHED, label: 'غير مكتمل', icon: '⏳' },
  { view: AppView.SAVED, label: 'المحفوظات', icon: '📂' },
  { view: AppView.OFFLINE, label: 'الخزنة', icon: '💾' },
  { view: AppView.HIDDEN, label: 'المستبعدة', icon: '🚫' },
  { view: AppView.PRIVACY, label: 'الخصوصية', icon: '🔒' },
];

const OFFICIAL_CATEGORIES = SYSTEM_CONFIG.officialCategories;

const InfiniteRibbon: React.FC<{ 
  items: any[], 
  renderItem: (item: any, idx: number) => React.ReactNode,
  className?: string,
  speed?: string
}> = ({ items, renderItem, className, speed = '60s' }) => {
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleInteraction = () => {
    setIsPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setIsPaused(false), 1200);
  };

  const doubledItems = [...items, ...items, ...items];

  return (
    <div 
      className={`w-full h-11 bg-black/40 backdrop-blur-md border-b border-white/5 overflow-hidden relative nav-mask flex items-center ${className}`}
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div 
        className={`flex items-center gap-3 h-full px-4 ${isPaused ? 'overflow-x-auto scrollbar-hide' : 'animate-marquee-train'}`}
        style={{ 
          animationPlayState: isPaused ? 'paused' : 'running', 
          width: 'max-content',
          animationDuration: speed
        }}
      >
        {doubledItems.map((item, idx) => renderItem(item, idx))}
      </div>
    </div>
  );
};

const AppBar: React.FC<AppBarProps> = ({ onViewChange, onRefresh, onCategoryClick, currentView }) => {
  const channelId = 'UCDc_3d066uDWC3ljZTccKUg';
  const youtubeWebUrl = `https://www.youtube.com/channel/${channelId}?si=spOUUwvDeudYtwEr`;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex flex-col shadow-2xl">
      {/* الجزء العلوي: اللوجو المركزي */}
      <header className="h-16 bg-black/95 backdrop-blur-3xl border-b border-white/5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 w-1/3">
           <button 
             onClick={() => window.open(youtubeWebUrl, '_blank')}
             className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)] active:scale-90 transition-all"
           >
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/></svg>
           </button>
        </div>

        <button 
          onClick={() => { onViewChange(AppView.HOME); onRefresh(); }}
          className="relative group active:scale-95 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-red-600/40 rounded-full blur-2xl animate-pulse"></div>
          <img src="https://i.top4top.io/p_3643ksmii1.jpg" className="w-12 h-12 rounded-full border-2 border-red-500 relative z-10 shadow-[0_0_20px_red] object-cover" alt="Logo" />
        </button>

        <div className="flex items-center justify-end gap-3 w-1/3">
           <button 
             onClick={() => onViewChange(AppView.ADMIN)}
             className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-500 active:scale-90 transition-all"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
           </button>
        </div>
      </header>

      {/* شريط 1: قوائم التنقل والصفحات */}
      <InfiniteRibbon 
        speed="80s"
        items={NAV_ITEMS}
        renderItem={(item, idx) => (
          <button
            key={`nav-${item.view}-${idx}`}
            onClick={() => onViewChange(item.view)}
            className={`neon-white-led shrink-0 px-4 py-1 rounded-full text-[10px] font-black italic flex items-center gap-2 transition-all ${
              currentView === item.view 
              ? 'bg-white/20 border-white text-white shadow-[0_0_15px_white]' 
              : 'text-gray-400 border-white/5'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )}
      />

      {/* شريط 2: تصنيفات الرعب والتقسيمات */}
      <InfiniteRibbon 
        speed="120s"
        className="h-10 border-t border-white/5 bg-black/60"
        items={OFFICIAL_CATEGORIES}
        renderItem={(cat, idx) => (
          <button
            key={`cat-${cat}-${idx}`}
            onClick={() => onCategoryClick(cat)}
            className="neon-white-led shrink-0 px-5 py-1 rounded-full text-[9px] font-black italic text-white/80 active:scale-90"
          >
            {cat}
          </button>
        )}
      />
    </div>
  );
};

export default AppBar;
