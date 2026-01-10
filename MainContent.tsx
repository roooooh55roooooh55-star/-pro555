import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Video, UserInteractions } from './types';
import { downloadVideoWithProgress } from './offlineManager';
import { db, ensureAuth } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import CustomDynamicLayout from './CustomDynamicLayout';
import { bufferVideoChunk } from './smartCache'; // Import buffering function

export const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

// Distinct Neon Border Colors (Solid, Sharp, High Contrast - No Shadows)
const STATIC_NEON_BORDERS = [
  'border-[#ff0000]',      // Pure Red
  'border-[#ff4d00]',      // Orange Red
  'border-[#ff9900]',      // Web Orange
  'border-[#ffcc00]',      // Tangerine Yellow
  'border-[#ffff00]',      // Pure Yellow
  'border-[#ccff00]',      // Electric Lime
  'border-[#66ff00]',      // Bright Green
  'border-[#00ff00]',      // Pure Green
  'border-[#00ff99]',      // Spring Green
  'border-[#00ffff]',      // Cyan / Aqua
  'border-[#0099ff]',      // Dodger Blue
  'border-[#0033ff]',      // Blue
  'border-[#6600ff]',      // Electric Indigo
  'border-[#9900ff]',      // Purple
  'border-[#cc00ff]',      // Phlox
  'border-[#ff00ff]',      // Magenta / Fuchsia
  'border-[#ff00cc]',      // Deep Pink
  'border-[#ff0066]',      // Rose
  'border-[#ffffff]',      // White
];

export const getNeonColor = (id: string) => {
  if (!id) return STATIC_NEON_BORDERS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return STATIC_NEON_BORDERS[Math.abs(hash) % STATIC_NEON_BORDERS.length];
};

export const getDeterministicStats = (seed: string) => {
  let hash = 0;
  if (!seed) return { views: 0, likes: 0 };
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const baseViews = Math.abs(hash % 900000) + 500000; 
  const views = baseViews * (Math.abs(hash % 5) + 2); 
  const likes = Math.abs(Math.floor(views * (0.12 + (Math.abs(hash % 15) / 100)))); 
  return { views, likes };
};

export const formatBigNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const formatVideoSource = (video: Video) => {
  if (!video) return "";
  let r2Url = video.video_url || "";
  
  if (video.redirect_url && video.redirect_url.trim() !== "" && !r2Url) {
    return ""; 
  }
  
  if (!r2Url || !r2Url.startsWith('http')) return "";

  try {
     new URL(r2Url);
  } catch(e) { return ""; }
  
  if ((r2Url.includes('r2.dev') || r2Url.includes('workers.dev')) && !r2Url.includes('#')) {
    return `${r2Url}#t=0.01`;
  }
  return r2Url;
};

// --- SAFE VIDEO COMPONENT FOR AUTOPLAY & BUFFERING ---
export const SafeAutoPlayVideo: React.FC<React.VideoHTMLAttributes<HTMLVideoElement>> = (props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // ⚡ IMMEDIATE BUFFERING: Preload 2MB chunk
    if (typeof props.src === 'string') {
        bufferVideoChunk(props.src);
    }

    const v = videoRef.current;
    if (v && props.src) {
      v.muted = true; // Required for autoplay
      v.preload = "auto";
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
            // Muted autoplay is usually allowed. If it fails, retry once on next tick.
            v.muted = true;
            setTimeout(() => v.play().catch(() => {}), 100);
        });
      }
    }
  }, [props.src]);

  return <video ref={videoRef} {...props} muted={true} autoPlay={true} playsInline />;
};

// --- TREND BADGE (MATCHING APPBAR BUTTON STYLE EXACTLY) ---
export const NeonTrendBadge = ({ is_trending }: { is_trending: boolean }) => {
  if (!is_trending) return null;
  return (
    <div className="absolute top-2 left-2 z-50">
      <style>{`
        @keyframes rainbow-strong-glow {
          0% { border-color: #ef4444; filter: drop-shadow(0 0 15px #ef4444); }
          20% { border-color: #eab308; filter: drop-shadow(0 0 15px #eab308); }
          40% { border-color: #22d3ee; filter: drop-shadow(0 0 15px #22d3ee); }
          60% { border-color: #3b82f6; filter: drop-shadow(0 0 15px #3b82f6); }
          80% { border-color: #d946ef; filter: drop-shadow(0 0 15px #d946ef); }
          100% { border-color: #ef4444; filter: drop-shadow(0 0 15px #ef4444); }
        }
        .animate-trend-button {
          animation: rainbow-strong-glow 2s linear infinite;
        }
      `}</style>
      
      {/* Replica of the AppBar Button: w-9 h-9 rounded-xl with strong glow */}
      <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/80 backdrop-blur-md border-2 animate-trend-button text-red-500 shadow-[inset_0_0_8px_rgba(239,68,68,0.5)]">
        <svg className="w-5 h-5 drop-shadow-[0_0_5px_currentColor]" fill="currentColor" viewBox="0 0 24 24">
           {/* Original Flame Path from AppBar */}
           <path d="M17.55,11.2C17.32,10.93 15.33,8.19 15.33,8.19C15.33,8.19 15.1,10.03 14.19,10.82C13.21,11.66 12,12.24 12,13.91C12,15.12 12.6,16.22 13.56,16.89C13.88,17.11 14.24,17.29 14.63,17.41C15.4,17.63 16.23,17.61 17,17.33C17.65,17.1 18.23,16.69 18.66,16.15C19.26,15.38 19.5,14.41 19.34,13.44C19.16,12.56 18.63,11.83 18.05,11.33C17.9,11.23 17.73,11.25 17.55,11.2M13,3C13,3 12,5 10,7C8.5,8.5 7,10 7,13C7,15.76 9.24,18 12,18C12,18 11.5,17.5 11,16.5C10.5,15.5 10,14.5 10,13.5C10,12.5 10.5,11.5 11.5,10.5C12.5,9.5 14,8 14,8C14,8 15,10 16,12C16.5,13 17,14 17,15C17,15.5 16.9,16 16.75,16.5C17.5,16 18,15.5 18,15C18,13 17,11.5 15,10C13.5,8.88 13,3 13,3Z"/>
        </svg>
      </div>
    </div>
  );
};

const JoyfulNeonLion: React.FC<{ isDownloading: boolean, hasDownloads: boolean }> = ({ isDownloading, hasDownloads }) => (
  <div className="relative">
    {isDownloading && <div className="absolute inset-0 bg-yellow-400 blur-lg rounded-full opacity-40 animate-pulse"></div>}
    <svg 
      className={`w-7 h-7 transition-all duration-500 ${isDownloading ? 'text-yellow-400 scale-110 drop-shadow-[0_0_10px_#facc15]' : hasDownloads ? 'text-cyan-400 drop-shadow-[0_0_8px_#22d3ee]' : 'text-gray-600'}`} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z" />
      <path d="M8 9.5c0-1.5 1-2.5 4-2.5s4 1 4 2.5" strokeLinecap="round" />
      <circle cx="9.5" cy="11" r="0.8" fill="currentColor" />
      <circle cx="14.5" cy="11" r="0.8" fill="currentColor" />
      <path d="M10 15.5c.5 1 1.5 1.5 2 1.5s1.5-.5 2-1.5" strokeLinecap="round" />
    </svg>
  </div>
);

export const VideoCardThumbnail: React.FC<{ 
  video: Video, 
  isOverlayActive: boolean, 
  interactions: UserInteractions,
  onLike?: (id: string) => void,
  onCategoryClick?: (category: string) => void
}> = ({ video, isOverlayActive, interactions, onLike, onCategoryClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  
  const stats = useMemo(() => video ? getDeterministicStats(video.video_url) : { views: 0, likes: 0 }, [video?.video_url]);
  const formattedSrc = formatVideoSource(video);
  
  const neonStyle = video ? getNeonColor(video.id) : 'border-white/20';
  
  const isLiked = interactions?.likedIds?.includes(video?.id) || false;
  const isSaved = interactions?.savedIds?.includes(video?.id) || false;
  const watchItem = interactions?.watchHistory?.find(h => h.id === video?.id);
  const progress = watchItem ? watchItem.progress : 0;
  const isWatched = progress > 0.05; 
  const isHeartActive = isLiked || isSaved;

  useEffect(() => {
    if (formattedSrc) {
        bufferVideoChunk(formattedSrc);
    }

    const v = videoRef.current;
    if (!v || hasError || !video) return;
    
    // Strict immediate muted autoplay
    v.muted = true;
    v.preload = "auto";
    v.autoplay = true;

    if (isOverlayActive) {
      v.pause();
      return;
    }

    const attemptPlay = () => {
      const playPromise = v.play();
      if (playPromise !== undefined) {
          playPromise.catch(() => {
              v.muted = true;
              v.play().catch(() => {});
          });
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        attemptPlay();
      } else {
        v.pause();
      }
    }, { threshold: 0.05 }); 
    
    observer.observe(v);
    
    // Trigger initial play if visible
    attemptPlay();

    return () => observer.disconnect();
  }, [formattedSrc, isOverlayActive, hasError, video]);

  if (!video) return null;

  if (hasError || !formattedSrc) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-transparent border border-red-900/30 rounded-2xl p-4 text-center group transform-gpu backface-hidden">
            <span className="text-[10px] font-bold text-red-800">Video Error</span>
        </div>
    );
  }

  const containerStyle = `${neonStyle} border-[2px] shadow-none`;

  return (
    <div className={`w-full h-full relative bg-transparent overflow-hidden group rounded-2xl transition-all duration-500 transform-gpu backface-hidden ${containerStyle}`}>
      
      <video 
        ref={videoRef} 
        src={formattedSrc} 
        muted 
        autoPlay
        loop 
        playsInline 
        crossOrigin="anonymous" 
        preload="auto" 
        className="w-full h-full object-cover opacity-100 contrast-110 saturate-125 transition-all duration-700 pointer-events-none landscape:object-contain bg-transparent" 
        onError={() => setHasError(true)}
      />
      
      <NeonTrendBadge is_trending={video.is_trending} />

      <div className="absolute top-2 right-2 flex flex-col items-center gap-1 z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); onLike?.(video.id); }}
          className={`p-2 rounded-xl backdrop-blur-md border-2 transition-all duration-300 active:scale-90 flex items-center justify-center ${isHeartActive ? 'bg-red-600/30 border-red-500 shadow-[0_0_12px_#ef4444]' : 'bg-black/60 border-white/20 hover:border-red-500/50'}`}
        >
          <svg className={`w-5 h-5 ${isHeartActive ? 'text-red-500' : 'text-gray-400'}`} fill={isHeartActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>

        {!isWatched && (
          <div className="px-2 py-0.5 bg-yellow-400/10 border border-yellow-400 rounded-md shadow-[0_0_10px_#facc15] backdrop-blur-sm mt-1 animate-pulse">
             <span className="text-[9px] font-black text-blue-400 drop-shadow-[0_0_2_#3b82f6]">جديد</span>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-20 pointer-events-none">
        <div className="flex justify-start mb-1">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onCategoryClick?.(video.category); 
            }}
            className="pointer-events-auto bg-red-600/10 border border-red-600/50 backdrop-blur-md px-2 py-0.5 rounded-[6px] flex items-center gap-1 shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:bg-red-600 hover:text-white transition-all active:scale-90"
          >
             <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
             <span className="text-[8px] font-black text-red-500 hover:text-white truncate max-w-[80px]">{video.category}</span>
          </button>
        </div>

        <p className="text-white text-[10px] font-black line-clamp-1 italic text-right leading-tight drop-shadow-[0_2px_4_black]">{video.title}</p>
        
        <div className="flex items-center justify-end gap-3 mt-1.5 opacity-90">
          <div className="flex items-center gap-1">
             <span className="text-[8px] font-bold text-gray-300 font-mono tracking-tight">{formatBigNumber(stats.likes)}</span>
             <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <div className="flex items-center gap-1 border-l border-white/20 pl-3">
             <span className="text-[8px] font-bold text-gray-300 font-mono tracking-tight">{formatBigNumber(stats.views)}</span>
             <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </div>
        </div>
      </div>
      
      {progress > 0 && progress < 0.99 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-30">
          <div className="h-full bg-red-600 shadow-[0_0_12px_red]" style={{ width: `${progress * 100}%` }}></div>
        </div>
      )}
    </div>
  );
};

// --- INTERACTIVE MARQUEE COMPONENT ---
export const InteractiveMarquee: React.FC<{ 
  videos: Video[], 
  onPlay: (v: Video) => void, 
  isShorts?: boolean, 
  direction?: 'left-to-right' | 'right-to-left', 
  interactions: UserInteractions,
  transparent?: boolean,
  onLike?: (id: string) => void
}> = ({ 
  videos, onPlay, isShorts, direction = 'right-to-left', interactions, transparent = false, onLike 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  
  const DEFAULT_SPEED = 0.8;
  const initialSpeed = direction === 'left-to-right' ? -DEFAULT_SPEED : DEFAULT_SPEED;
  const [internalSpeed, setInternalSpeed] = useState(initialSpeed);
  
  const velX = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const requestRef = useRef<number>(null);

  const displayVideos = useMemo(() => {
    if (!videos || videos.length === 0) return [];
    return videos.length < 5 ? [...videos, ...videos, ...videos, ...videos, ...videos] : [...videos, ...videos, ...videos];
  }, [videos]);

  const animate = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      if (!isDragging) {
        const targetSpeed = internalSpeed > 0 ? DEFAULT_SPEED : -DEFAULT_SPEED;
        if (Math.abs(internalSpeed - targetSpeed) > 0.05) {
             setInternalSpeed(prev => prev * 0.95 + targetSpeed * 0.05);
        }

        container.scrollLeft += internalSpeed;
        
        const { scrollLeft, scrollWidth, clientWidth } = container;
        if (scrollWidth > 0) {
           const singleSetWidth = scrollWidth / 3;
           if (internalSpeed > 0) { 
               if (scrollLeft >= (singleSetWidth * 2)) {
                   container.scrollLeft = scrollLeft - singleSetWidth;
               }
           } else { 
               if (scrollLeft <= 10) {
                   container.scrollLeft = scrollLeft + singleSetWidth;
               }
           }
        }
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isDragging, internalSpeed, DEFAULT_SPEED]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  useEffect(() => {
    if (containerRef.current && videos?.length > 0) {
      const tid = setTimeout(() => {
        if (containerRef.current) containerRef.current.scrollLeft = containerRef.current.scrollWidth / 3;
      }, 150);
      return () => clearTimeout(tid);
    }
  }, [videos]);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setInternalSpeed(0); 
    setStartX(clientX - (containerRef.current?.offsetLeft || 0));
    setScrollLeftState(containerRef.current?.scrollLeft || 0);
    lastX.current = clientX;
    lastTime.current = Date.now();
    velX.current = 0;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    const x = clientX - (containerRef.current.offsetLeft || 0);
    containerRef.current.scrollLeft = scrollLeftState - (x - startX);
    
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
        velX.current = clientX - lastX.current;
    }
    lastX.current = clientX;
    lastTime.current = now;
  };

  const handleEnd = () => {
    setIsDragging(false);
    let momentum = -velX.current * 1.5;
    if (momentum > 15) momentum = 15;
    if (momentum < -15) momentum = -15;

    if (Math.abs(momentum) > 1) {
        setInternalSpeed(momentum);
    } else {
        setInternalSpeed(direction === 'left-to-right' ? -DEFAULT_SPEED : DEFAULT_SPEED);
    }
  };

  if (displayVideos.length === 0) return null;
  const containerHeight = isShorts ? 'h-48' : 'h-28';
  const itemDimensions = isShorts ? 'w-24 h-40' : 'w-40 h-22';

  const containerStyle = transparent 
    ? `relative overflow-hidden w-full ${containerHeight} bg-transparent animate-in fade-in duration-700`
    : `relative overflow-hidden w-full ${containerHeight} bg-neutral-900/5 border-y border-white/5 animate-in fade-in duration-700 shadow-inner`;

  return (
    <div className={containerStyle} dir="ltr">
      <div 
        ref={containerRef}
        onMouseDown={(e) => handleStart(e.pageX)}
        onMouseMove={(e) => handleMove(e.pageX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => { if(isDragging) handleEnd(); }}
        onTouchStart={(e) => e.touches?.[0] && handleStart(e.touches[0].pageX)}
        onTouchMove={(e) => e.touches?.[0] && handleMove(e.touches[0].pageX)}
        onTouchEnd={handleEnd}
        className="flex gap-3 px-6 h-full items-center overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
      >
        {displayVideos.map((item, idx) => {
            if (!item || !item.video_url) return null;
            const neonStyle = getNeonColor(item.id);
            const formattedSrc = formatVideoSource(item);
            const isLiked = interactions?.likedIds?.includes(item.id);

            return (
              <div key={`${item.id}-${idx}`} onClick={() => !isDragging && onPlay(item)} className={`${itemDimensions} shrink-0 rounded-xl overflow-hidden border-2 relative active:scale-95 transition-all ${neonStyle} shadow-none`} dir="rtl">
                <SafeAutoPlayVideo 
                   src={formattedSrc} 
                   muted loop playsInline 
                   crossOrigin="anonymous" 
                   preload="auto"
                   className="w-full h-full object-cover opacity-100 contrast-110 saturate-125 pointer-events-none landscape:object-contain" 
                   onError={(e) => e.currentTarget.style.display = 'none'}
                />
                
                <div className="absolute top-1 right-1 z-20">
                   <button 
                     onClick={(e) => { 
                        e.stopPropagation(); 
                        onLike && onLike(item.id); 
                     }}
                     className={`p-1.5 rounded-lg backdrop-blur-md border transition-all active:scale-75 ${isLiked ? 'bg-red-600/60 border-red-500 text-white shadow-[0_0_10px_red]' : 'bg-black/40 border-white/20 text-gray-300 hover:text-white hover:border-white/50'}`}
                   >
                     <svg className="w-3 h-3" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                   </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 backdrop-blur-[1px] pointer-events-none">
                  <p className="text-[8px] font-black text-white truncate italic text-right leading-none">{item.title}</p>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

// --- RESUME NOTIFICATION COMPONENT ---
export const ResumeNotificationFull: React.FC<{
  video: Video,
  pos: { top: string, left: string, anim: string },
  onPlay: () => void,
  onClose: () => void
}> = ({ video, pos, onPlay, onClose }) => {
    if (!video) return null;
    return (
        <div 
          className="fixed z-[1000] transition-all duration-700 pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: pos.anim }}
        >
            <div className="bg-neutral-900/90 border-2 border-red-600 rounded-3xl p-3 flex items-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.5)] backdrop-blur-md pointer-events-auto group">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <video src={formatVideoSource(video)} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <p className="text-[8px] font-black text-red-500 uppercase">مواصلة المشاهدة؟</p>
                    <p className="text-[10px] font-bold text-white line-clamp-1 italic text-right">{video.title}</p>
                    <div className="flex gap-2 mt-1">
                        <button onClick={onPlay} className="text-[8px] font-black bg-red-600 px-2 py-1 rounded-md text-white">تشغيل</button>
                        <button onClick={onClose} className="text-[8px] font-black bg-white/10 px-2 py-1 rounded-md text-white">إغلاق</button>
                    </div>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full animate-ping"></div>
            </div>
        </div>
    );
};

const MainContent: React.FC<any> = ({ 
  videos, categoriesList, interactions, onPlayShort, onPlayLong, onCategoryClick, onHardRefresh, onOfflineClick, loading, isOverlayActive, downloadProgress, syncStatus, onLike
}) => {
  const [pullOffset, setPullOffset] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resumeNotification, setResumeNotification] = useState<{video: Video, pos: {top: string, left: string, anim: string}} | null>(null);
  const [show3DModal, setShow3DModal] = useState(false);

  const [layoutSettings, setLayoutSettings] = useState<{ sections: any[], isLocked: boolean }>({ sections: [], isLocked: true });

  useEffect(() => {
    const fetchLayout = async () => {
        try {
            await ensureAuth();
            const docRef = doc(db, "Settings", "HomeLayout");
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                setLayoutSettings({ 
                    sections: data.sections || [], 
                    isLocked: data.isLocked !== undefined ? data.isLocked : true 
                });
            }
        } catch (e) {
            console.error("Failed to load home layout:", e);
        }
    };
    fetchLayout();
  }, []);

  const safeVideos = useMemo(() => videos || [], [videos]);
  const shortsOnly = useMemo(() => safeVideos.filter((v: any) => v && v.video_type === 'Shorts'), [safeVideos]);
  const longsOnly = useMemo(() => safeVideos.filter((v: any) => v && v.video_type === 'Long Video'), [safeVideos]);

  const { 
    marqueeShorts1, marqueeLongs1, 
    gridShorts1, gridShorts2, 
    stackLongs1, 
    marqueeShorts2, marqueeLongs2, 
    gridShorts3, gridShorts4, 
    stackLongs2, 
    marqueeShorts3, marqueeLongs3 
  } = useMemo(() => {
     const usedIds = new Set<string>();
     
     const getUniqueBatch = (source: Video[], count: number): Video[] => {
        let available = source.filter(v => !usedIds.has(v.id));
        if (available.length < count) {
            const leftovers = available;
            const recyclePool = source.filter(v => !leftovers.includes(v));
            const shuffledRecycle = [...recyclePool].sort(() => 0.5 - Math.random());
            available = [...leftovers, ...shuffledRecycle];
        }
        const selected = available.slice(0, count);
        selected.forEach(v => usedIds.add(v.id));
        return selected;
     };

     return {
        marqueeShorts1: getUniqueBatch(shortsOnly, 12),
        marqueeLongs1: getUniqueBatch(longsOnly, 8),
        gridShorts1: getUniqueBatch(shortsOnly, 2),
        gridShorts2: getUniqueBatch(shortsOnly, 2),
        stackLongs1: getUniqueBatch(longsOnly, 4),
        marqueeShorts2: getUniqueBatch(shortsOnly, 12),
        marqueeLongs2: getUniqueBatch(longsOnly, 8),
        gridShorts3: getUniqueBatch(shortsOnly, 2),
        gridShorts4: getUniqueBatch(shortsOnly, 2),
        stackLongs2: getUniqueBatch(longsOnly, 4),
        marqueeShorts3: getUniqueBatch(shortsOnly, 12),
        marqueeLongs3: getUniqueBatch(longsOnly, 8)
     };
  }, [shortsOnly, longsOnly]);

  const unfinishedVideos = useMemo(() => {
    if (!interactions?.watchHistory) return [];
    return interactions.watchHistory
      .filter((h: any) => h.progress > 0.05 && h.progress < 0.95)
      .map((h: any) => safeVideos.find((vid: any) => vid && (vid.id === h.id)))
      .filter((v: any) => v !== undefined && v !== null && v.video_url).reverse();
  }, [interactions?.watchHistory, safeVideos]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return safeVideos.filter((v: any) => 
      v && v.video_url && (v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.category.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 15);
  }, [searchQuery, safeVideos]);

  const getRandomPosition = () => {
    const top = Math.floor(Math.random() * 60) + 15 + '%'; 
    const left = Math.floor(Math.random() * 40) + 5 + '%'; 
    const animations = ['translate(100px, 0)', 'translate(-100px, 0)', 'translate(0, 100px)', 'translate(0, -100px)', 'scale(0.5)'];
    const anim = animations[Math.floor(Math.random() * animations.length)];
    return { top, left, anim };
  };

  useEffect(() => {
    if (isOverlayActive) return;
    if (sessionStorage.getItem('hadiqa_dismiss_resume') === 'true') return;
    const interval = setInterval(() => {
      if (sessionStorage.getItem('hadiqa_dismiss_resume') === 'true') return;
      if (unfinishedVideos.length > 0) {
        const randomVideo = unfinishedVideos[Math.floor(Math.random() * unfinishedVideos.length)];
        setResumeNotification({
            video: randomVideo,
            pos: getRandomPosition()
        });
      }
    }, 30000); 
    return () => clearInterval(interval);
  }, [unfinishedVideos, isOverlayActive]);

  const isActuallyRefreshing = loading || pullOffset > 30;

  return (
    <div 
      onTouchStart={(e) => window.scrollY === 0 && setStartY(e.touches[0].pageY)}
      onTouchMove={(e) => { if (startY === 0) return; const diff = e.touches[0].pageY - startY; if (diff > 0 && diff < 150) setPullOffset(diff); }}
      onTouchEnd={() => { if (pullOffset > 80) onHardRefresh(); setPullOffset(0); setStartY(0); }}
      className="flex flex-col pb-8 w-full bg-black min-h-screen relative"
      style={{ transform: `translateY(${pullOffset / 2}px)` }} dir="rtl"
    >
      <style>{`
        @keyframes spin3D { 0% { transform: perspective(400px) rotateY(0deg); } 100% { transform: perspective(400px) rotateY(360deg); } }
        .animate-spin-3d { animation: spin3D 3s linear infinite; }
      `}</style>
      
      <header className="flex items-center justify-between py-1 bg-black relative px-4 border-b border-white/5 shadow-lg h-12">
        <div className="flex items-center gap-2" onClick={onHardRefresh}>
          <img src={LOGO_URL} className={`w-8 h-8 rounded-full border-2 transition-all duration-500 ${isActuallyRefreshing ? 'border-yellow-400 shadow-[0_0_20px_#facc15]' : 'border-red-600 shadow-[0_0_10px_red]'}`} />
          {isActuallyRefreshing ? (
             <div className="flex items-center gap-2">
                 <h1 className="text-sm font-black italic text-red-600">الحديقة المرعبة</h1>
                 <div className="px-2 py-0.5 border border-yellow-400 rounded-lg bg-yellow-400/10 shadow-[0_0_10px_#facc15] animate-pulse">
                     <span className="text-[10px] font-black text-blue-400">تحديث</span>
                 </div>
             </div>
          ) : (
             <h1 className="text-sm font-black italic text-red-600 transition-colors duration-500">الحديقة المرعبة</h1>
          )}
        </div>
        <div className="flex items-center gap-3 -translate-x-2">
          {syncStatus && (
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-cyan-400 animate-pulse">مزامنة {syncStatus.current}/{syncStatus.total}</span>
              <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${(syncStatus.current / syncStatus.total) * 100}%` }}></div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
             <button onClick={() => setShow3DModal(true)} className="p-2 bg-white/5 border border-cyan-500/50 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-90 transition-all group relative overflow-hidden w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>
                <span className="block font-black text-[10px] text-cyan-400 animate-spin-3d drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">3D</span>
             </button>
          </div>
          <button onClick={() => setIsSearchOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/20 text-white shadow-lg active:scale-90 transition-all hover:border-red-600 hover:text-red-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </button>
          <button onClick={onOfflineClick} className="p-1 transition-all active:scale-90 relative group">
            <JoyfulNeonLion isDownloading={downloadProgress !== null} hasDownloads={interactions?.downloadedIds?.length > 0} />
          </button>
        </div>
      </header>

      <nav className="nav-container nav-mask relative h-10 bg-black/95 backdrop-blur-2xl z-[100] border-b border-white/10 sticky top-16 overflow-x-auto scrollbar-hide flex items-center">
        <div className="animate-marquee-train flex items-center gap-4 px-10">
          {[...(categoriesList || []), ...(categoriesList || [])].map((cat, idx) => (
            <button key={`${cat}-${idx}`} onClick={() => onCategoryClick(cat)} className="neon-white-led shrink-0 px-4 py-1 rounded-full text-[9px] font-black text-white italic whitespace-nowrap">{cat}</button>
          ))}
        </div>
      </nav>

      {layoutSettings.isLocked ? (
        <>
            {marqueeShorts1.length > 0 && <InteractiveMarquee videos={marqueeShorts1} onPlay={(v) => onPlayShort(v, shortsOnly)} isShorts={true} direction="left-to-right" interactions={interactions} transparent={false} onLike={onLike} />}
            <div className="-mt-1"></div> 
            {marqueeLongs1.length > 0 && <InteractiveMarquee videos={marqueeLongs1} onPlay={(v) => onPlayLong(v, longsOnly)} direction="right-to-left" interactions={interactions} transparent={false} onLike={onLike} />}

            {gridShorts1.length > 0 && (
                <>
                <SectionHeader title="أهوال قصيرة (مختارة)" color="bg-yellow-500" />
                <div className="px-4 grid grid-cols-2 gap-3.5 mb-6">
                    {gridShorts1.map((v: any) => v && (
                    <div key={v.id} onClick={() => onPlayShort(v, shortsOnly)} className="aspect-[9/16] animate-in fade-in duration-500">
                        <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} onLike={onLike} onCategoryClick={onCategoryClick} />
                    </div>
                    ))}
                </div>
                </>
            )}

            {gridShorts2.length > 0 && (
                <div className="px-4 grid grid-cols-2 gap-3.5 mb-6">
                    {gridShorts2.map((v: any) => v && (
                    <div key={v.id} onClick={() => onPlayShort(v, shortsOnly)} className="aspect-[9/16] animate-in fade-in duration-500">
                        <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} onLike={onLike} onCategoryClick={onCategoryClick} />
                    </div>
                    ))}
                </div>
            )}

            {stackLongs1.length > 0 && (
                <>
                <SectionHeader title="حكايات مرعبة (كاملة)" color="bg-red-600" />
                <div className="px-4 space-y-4 mb-6">
                    {stackLongs1.map((v: any) => v && (
                    <div key={v.id} onClick={() => onPlayLong(v, longsOnly)} className="aspect-video w-full animate-in zoom-in-95 duration-500">
                        <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} onLike={onLike} onCategoryClick={onCategoryClick} />
                    </div>
                    ))}
                </div>
                </>
            )}

            {marqueeShorts2.length > 0 && (
                <>
                <SectionHeader title="ومضات من الجحيم" color="bg-orange-500" />
                <InteractiveMarquee videos={marqueeShorts2} onPlay={(v) => onPlayShort(v, shortsOnly)} isShorts={true} direction="left-to-right" interactions={interactions} onLike={onLike} />
                </>
            )}

            {marqueeLongs2.length > 0 && (
                <>
                <SectionHeader title="أرشيف الخزنة" color="bg-emerald-500" />
                <InteractiveMarquee videos={marqueeLongs2} onPlay={(v) => onPlayLong(v, longsOnly)} direction="right-to-left" interactions={interactions} onLike={onLike} />
                </>
            )}

            {gridShorts3.length > 0 && (
                <>
                <SectionHeader title="ظلال متحركة" color="bg-purple-500" />
                <div className="px-4 grid grid-cols-2 gap-3.5 mb-6">
                    {gridShorts3.map((v: any) => v && (
                    <div key={v.id} onClick={() => onPlayShort(v, shortsOnly)} className="aspect-[9/16] animate-in fade-in duration-500">
                        <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} onLike={onLike} onCategoryClick={onCategoryClick} />
                    </div>
                    ))}
                </div>
                </>
            )}

            {gridShorts4.length > 0 && (
                <div className="px-4 grid grid-cols-2 gap-3.5 mb-6">
                    {gridShorts4.map((v: any) => v && (
                    <div key={v.id} onClick={() => onPlayShort(v, shortsOnly)} className="aspect-[9/16] animate-in fade-in duration-500">
                        <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} onLike={onLike} onCategoryClick={onCategoryClick} />
                    </div>
                    ))}
                </div>
            )}

            {stackLongs2.length > 0 && (
                <>
                <SectionHeader title="ملفات سرية" color="bg-blue-600" />
                <div className="px-4 space-y-4 mb-6">
                    {stackLongs2.map((v: any) => v && (
                    <div key={v.id} onClick={() => onPlayLong(v, longsOnly)} className="aspect-video w-full animate-in zoom-in-95 duration-500">
                        <VideoCardThumbnail video={v} interactions={interactions} isOverlayActive={isOverlayActive} onLike={onLike} onCategoryClick={onCategoryClick} />
                    </div>
                    ))}
                </div>
                </>
            )}

            {marqueeShorts3.length > 0 && (
                <>
                <SectionHeader title="النهاية تقترب" color="bg-pink-600" />
                <InteractiveMarquee videos={marqueeShorts3} onPlay={(v) => onPlayShort(v, shortsOnly)} isShorts={true} direction="left-to-right" interactions={interactions} onLike={onLike} />
                </>
            )}

            {marqueeLongs3.length > 0 && (
                <>
                <SectionHeader title="الخروج من القبو" color="bg-white" />
                <InteractiveMarquee videos={marqueeLongs3} onPlay={(v) => onPlayLong(v, longsOnly)} direction="right-to-left" interactions={interactions} onLike={onLike} />
                </>
            )}
        </>
      ) : (
        <CustomDynamicLayout 
            sections={layoutSettings.sections}
            videos={safeVideos}
            interactions={interactions}
            onPlayShort={onPlayShort}
            onPlayLong={onPlayLong}
            onCategoryClick={onCategoryClick}
            onLike={onLike}
            isOverlayActive={isOverlayActive}
        />
      )}

      <div className="w-full h-8 bg-black flex items-center justify-center group relative border-y border-white/5 mt-4">
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest italic z-10">Vault Secure System</span>
      </div>

      {resumeNotification && (
        <ResumeNotificationFull 
          video={resumeNotification.video}
          pos={resumeNotification.pos} 
          onPlay={() => {
            if (resumeNotification.video.video_type === 'Shorts') {
              onPlayShort(resumeNotification.video, shortsOnly);
            } else {
              onPlayLong(resumeNotification.video);
            }
            setResumeNotification(null);
          }}
          onClose={() => setResumeNotification(null)}
        />
      )}

      {show3DModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center pb-80 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShow3DModal(false)}>
          <div className="bg-neutral-900/90 border border-cyan-500/50 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(34,211,238,0.3)] text-center transform scale-100 relative overflow-hidden max-w-xs mx-4" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse"></div>
            <h2 className="text-3xl font-black text-white mb-2 italic drop-shadow-lg">تقنية 3D</h2>
            <p className="text-cyan-400 font-bold text-lg animate-pulse">قريباً جداً...</p>
            <div className="mt-6 flex justify-center">
               <div className="w-16 h-16 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin shadow-[0_0_20px_#22d3ee]"></div>
            </div>
            <button onClick={() => setShow3DModal(false)} className="mt-8 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-sm font-bold text-white transition-colors border border-white/10">إغلاق</button>
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="p-4 flex items-center gap-4 border-b-2 border-white/10 bg-black">
            <button onClick={() => setIsSearchOpen(false)} className="p-3.5 text-red-600 border-2 border-red-600 rounded-2xl shadow-[0_0_20px_red] active:scale-75 transition-all bg-red-600/10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <input 
              autoFocus
              type="text" 
              placeholder="ابحث في أرشيف الحديقة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-white/5 border-2 border-white/10 rounded-2xl py-4.5 px-7 text-white text-base outline-none focus:border-red-600 transition-all font-black text-right shadow-inner"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {searchResults.length > 0 ? searchResults.map((v: any) => v && v.video_url && (
              <div key={v.id} onClick={() => { setIsSearchOpen(false); v.video_type === 'Shorts' ? onPlayShort(v, shortsOnly) : onPlayLong(v, longsOnly); }} className={`flex gap-4.5 p-4 bg-white/5 rounded-3xl border-2 active:scale-95 transition-all shadow-xl group ${getNeonColor(v.id)}`}>
                <div className="w-28 h-18 bg-black rounded-2xl overflow-hidden shrink-0 border-2 border-white/10 shadow-lg">
                  <video src={formatVideoSource(v)} crossOrigin="anonymous" preload="metadata" className="w-full h-full object-cover opacity-100 contrast-110 saturate-125 transition-opacity" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <h3 className="text-sm font-black text-white italic line-clamp-1 text-right">{v.title}</h3>
                  <span className="text-[9px] text-red-500 font-black uppercase mt-1.5 text-right italic tracking-widest bg-red-600/10 self-end px-2 py-0.5 rounded-md border border-red-600/20">{v.category}</span>
                </div>
              </div>
            )) : searchQuery.trim() && (
              <div className="flex flex-col items-center justify-center py-24 opacity-30 gap-5 text-center">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <p className="font-black italic text-lg">لا توجد نتائج لهذا الكابوس..</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ title: string, color: string }> = ({ title, color }) => (
  <div className="px-5 py-2 flex items-center gap-2.5">
    <div className={`w-1.5 h-3.5 ${color} rounded-full shadow-[0_0_12px_currentColor]`}></div>
    <h2 className="text-[11px] font-black text-white italic uppercase tracking-[0.15em] drop-shadow-md">{title}</h2>
  </div>
);

export default MainContent;