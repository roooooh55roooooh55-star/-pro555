
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Video, UserInteractions } from './types';
import { NativeBridge } from './nativeBridge';
import { bufferVideoChunk } from './smartCache';
import CustomDynamicLayout from './CustomDynamicLayout';

export const LOGO_URL = "https://i.top4top.io/p_3643ksmii1.jpg";

const STATIC_NEON_BORDERS = [
  'border-[#ff0000]', 'border-[#ff4d00]', 'border-[#ff9900]', 'border-[#ffcc00]', 
  'border-[#ffff00]', 'border-[#ccff00]', 'border-[#66ff00]', 'border-[#00ff00]', 
  'border-[#00ff99]', 'border-[#00ffff]', 'border-[#0099ff]', 'border-[#0033ff]', 
  'border-[#6600ff]', 'border-[#9900ff]', 'border-[#cc00ff]', 'border-[#ff00ff]', 
  'border-[#ff00cc]', 'border-[#ff0066]', 'border-[#ffffff]'
];

export const getNeonColor = (id: string) => {
  if (!id) return STATIC_NEON_BORDERS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return STATIC_NEON_BORDERS[Math.abs(hash) % STATIC_NEON_BORDERS.length];
};

export const formatVideoSource = (video: Video) => {
  if (!video || !video.video_url) return "";
  const url = video.video_url;
  return url.includes('r2.dev') ? `${url}#t=0.01` : url;
};

export const getDeterministicStats = (seed: string) => {
  let hash = 0;
  if (!seed) return { views: 0, likes: 0, quality: 0 };
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const baseViews = Math.abs(hash % 900000) + 500000; 
  return { views: baseViews, likes: Math.floor(baseViews * 0.1), quality: 90 };
};

export const formatBigNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

export const NeonTrendBadge = ({ is_trending }: { is_trending: boolean | undefined }) => {
  if (!is_trending) return null;
  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-red-600/50 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.557 12c0 3.071-2.488 5.557-5.557 5.557s-5.557-2.486-5.557-5.557c0-1.538.625-2.93 1.63-3.935L12 4l3.929 4.065c1.005 1.005 1.628 2.397 1.628 3.935zM12 2C8.134 2 5 5.134 5 9c0 2.38 1.185 4.481 3 5.733V20l4 2 4-2v-5.267c1.815-1.252 3-3.353 3-5.733 0-3.866-3.134-7-7-7z" /></svg>
      <span className="text-[10px] font-black text-white italic">TREND</span>
    </div>
  );
};

export const SafeAutoPlayVideo: React.FC<React.VideoHTMLAttributes<HTMLVideoElement>> = (props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (typeof props.src === 'string') bufferVideoChunk(props.src);
    const v = videoRef.current;
    if (v && props.src) { 
      v.muted = true; 
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // خطأ صامت لمنع ظهور Error Play Interrupted في الكونسول
        });
      }
    }
  }, [props.src]);

  return <video ref={videoRef} {...props} style={{ ...props.style, transform: 'translateZ(0)' }} muted autoPlay playsInline />;
};

export const VideoCardThumbnail: React.FC<any> = ({ video, interactions, onLike, onCategoryClick }) => {
  const formattedSrc = formatVideoSource(video);
  const neonStyle = video ? getNeonColor(video.id) : 'border-white/20';

  const handlePlayClick = () => {
    if (NativeBridge.play(video)) return true;
    return false;
  };

  if (!video || !formattedSrc) return null;

  return (
    <div onClick={handlePlayClick} className={`w-full h-full relative overflow-hidden group rounded-2xl border-2 ${neonStyle} bg-black`}>
      <SafeAutoPlayVideo src={formattedSrc} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end">
        <p className="text-white text-[10px] font-black truncate">{video.title}</p>
        <span className="text-red-500 text-[8px] font-bold">{video.category}</span>
      </div>
    </div>
  );
};

export { InteractiveMarquee } from './MainContent_Helper';

const MainContent: React.FC<any> = (props) => {
  return (
    <div className="flex flex-col pb-8 w-full bg-black min-h-screen relative">
       <CustomDynamicLayout {...props} />
    </div>
  );
};

export default MainContent;
