
import React from 'react';
import { Video, UserInteractions } from './types';
import { InteractiveMarquee, VideoCardThumbnail, formatVideoSource, getNeonColor, SafeAutoPlayVideo } from './MainContent';

interface CustomDynamicLayoutProps {
  sections: any[];
  videos: Video[];
  interactions: UserInteractions;
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video) => void;
  onCategoryClick: (cat: string) => void;
  onLike: (id: string) => void;
}

const CustomDynamicLayout: React.FC<CustomDynamicLayoutProps> = ({ 
  sections = [], 
  videos, 
  interactions, 
  onPlayShort, 
  onPlayLong, 
  onCategoryClick,
  onLike
}) => {
  
  const getVideosForSection = (count: number, type: string) => {
    const filtered = type === 'Mixed' ? videos : videos.filter(v => v.video_type === type);
    return [...filtered].sort(() => 0.5 - Math.random()).slice(0, count);
  };

  return (
    <div className="w-full flex flex-col p-2 gap-6 animate-in fade-in duration-700">
      {sections.map((section, idx) => (
        <div 
          key={section.id || idx} 
          className="mx-auto relative"
          style={{ 
            width: `${section.width || 100}%`, 
            height: section.height ? `${section.height}px` : 'auto',
            marginTop: `${section.marginTop || 0}px`
          }}
        >
          {section.label && (
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-1.5 h-4 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
              <h3 className="text-xs font-black text-white italic uppercase tracking-wider">{section.label}</h3>
            </div>
          )}

          {section.type === 'long_video' && (
            <div className="w-full h-full rounded-3xl overflow-hidden border-2 border-red-900/50 shadow-2xl">
               {getVideosForSection(1, 'Long Video').map(v => (
                 <div key={v.id} onClick={() => onPlayLong(v)} className="w-full h-full cursor-pointer">
                    <VideoCardThumbnail video={v} interactions={interactions} onLike={onLike} onCategoryClick={onCategoryClick} />
                 </div>
               ))}
            </div>
          )}

          {section.type === 'shorts_grid' && (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-3">
               {getVideosForSection(4, 'Shorts').map(v => {
                 const neonStyle = getNeonColor(v.id);
                 return (
                   <div key={v.id} onClick={() => onPlayShort(v, videos)} className={`rounded-2xl overflow-hidden border-2 ${neonStyle} relative group active:scale-95 transition-all`}>
                      <SafeAutoPlayVideo src={formatVideoSource(v)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-1 left-1 right-1 text-[8px] font-black text-white truncate text-center">{v.title}</div>
                   </div>
                 );
               })}
            </div>
          )}

          {(section.type === 'slider_left' || section.type === 'slider_right') && (
            <InteractiveMarquee 
              videos={getVideosForSection(12, 'Shorts')} 
              onPlay={(v) => onPlayShort(v, videos)} 
              direction={section.type === 'slider_left' ? 'left-to-right' : 'right-to-left'} 
              interactions={interactions}
              transparent={true} 
              onLike={onLike}
            />
          )}

          {section.type === 'long_slider' && (
            <InteractiveMarquee 
              videos={getVideosForSection(10, 'Long Video')} 
              onPlay={onPlayLong} 
              isShorts={false}
              direction="right-to-left" 
              interactions={interactions}
              transparent={true} 
              onLike={onLike}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomDynamicLayout;
