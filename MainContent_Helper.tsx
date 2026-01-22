
import React from 'react';
import { Video, UserInteractions } from './types';
import { SafeAutoPlayVideo, getNeonColor, formatVideoSource } from './MainContent';

interface InteractiveMarqueeProps {
  videos: Video[];
  onPlay: (video: Video) => void;
  isShorts?: boolean;
  direction?: 'left-to-right' | 'right-to-left';
  interactions?: UserInteractions;
  transparent?: boolean;
  onLike?: (id: string) => void;
}

export const InteractiveMarquee: React.FC<InteractiveMarqueeProps> = ({ 
  videos, 
  onPlay, 
  isShorts = true, 
  direction = 'right-to-left',
  interactions,
  transparent = false,
  onLike
}) => {
  if (!videos || videos.length === 0) return null;

  // مضاعفة القائمة لضمان استمرار الحركة بدون فجوات
  const displayVideos = [...videos, ...videos, ...videos];

  const animationClass = direction === 'right-to-left' ? 'animate-marquee-train-reverse' : 'animate-marquee-train';

  return (
    <div className={`nav-container w-full overflow-hidden relative py-2 ${transparent ? '' : 'bg-black/20'}`}>
      <div className={`${animationClass} flex gap-3 px-2`}>
        {displayVideos.map((video, idx) => {
          const neonStyle = getNeonColor(video.id);
          const isLiked = interactions?.likedIds?.includes(video.id);
          
          return (
            <div 
              key={`${video.id}-${idx}`}
              onClick={() => onPlay(video)}
              className={`relative flex-shrink-0 group cursor-pointer transition-transform active:scale-95 duration-300 ${isShorts ? 'w-28 h-48' : 'w-48 h-28'} rounded-2xl overflow-hidden border-2 ${neonStyle} bg-neutral-900 shadow-lg`}
              style={{ transform: 'translateZ(0)' }}
            >
              <SafeAutoPlayVideo 
                src={formatVideoSource(video)} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              
              {/* Like Button Overlay */}
              {onLike && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(video.id);
                  }}
                  className={`absolute top-1 right-1 z-10 p-1.5 rounded-lg backdrop-blur-md border transition-all ${
                    isLiked ? 'bg-red-600/60 border-red-500 text-white' : 'bg-black/40 border-white/20 text-gray-300'
                  }`}
                >
                  <svg className="w-3 h-3" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[8px] font-black text-white truncate text-right drop-shadow-md">{video.title}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
