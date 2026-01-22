
import { Video } from './types';

/**
 * هذا الملف يعمل كجسر بين React ونظام Android Native
 * يستخدم Media3 ExoPlayer لتشغيل الفيديوهات بـ Zero Latency
 */

declare global {
  interface Window {
    AndroidPlayer?: {
      playVideo: (url: string, title: string, category: string) => void;
      preloadVideo: (url: string) => void;
      clearCache: () => void;
    }
  }
}

export const NativeBridge = {
  // تشغيل الفيديو عبر المشغل الأصلي (Media3)
  play: (video: Video) => {
    if (window.AndroidPlayer) {
      window.AndroidPlayer.playVideo(video.video_url, video.title, video.category);
      return true;
    }
    return false; // غير متوفر (متصفح ويب عادي)
  },

  // تحميل مسبق للفيديو لضمان تشغيل فوري
  preload: (url: string) => {
    if (window.AndroidPlayer && url) {
      window.AndroidPlayer.preloadVideo(url);
    }
  }
};
