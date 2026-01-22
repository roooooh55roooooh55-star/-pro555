
import { Video } from './types';
import { NativeBridge } from './nativeBridge';

// زيادة حجم التخزين المؤقت لضمان تشغيل سلس للفيديوهات عالية الجودة (5 ميجابايت)
const BUFFER_SIZE = 5 * 1024 * 1024; 
const CACHE_NAME = 'rooh-video-ultra-buffer-v2';

export const bufferVideoChunk = async (url: string) => {
  if (!url || !url.startsWith('http')) return;

  // إرسال طلب تحميل مسبق للأندرويد إذا كان متاحاً
  NativeBridge.preload(url);

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) return;

    const response = await fetch(url, {
        headers: { 'Range': `bytes=0-${BUFFER_SIZE}` },
        mode: 'cors' 
    });

    if (response.ok || response.status === 206) {
        const blob = await response.blob();
        const newResponse = new Response(blob, {
            status: 200,
            headers: response.headers
        });
        await cache.put(url, newResponse);
    }
  } catch (e) {
    // خطأ صامت لعدم إزعاج المستخدم
  }
};

export const initSmartBuffering = async (videos: Video[]) => {
  if (!navigator.onLine || !videos || videos.length === 0) return;

  // تحميل أول 10 فيديوهات في القائمة لضمان "Zero Latency" أثناء التمرير
  const queue = [...videos].slice(0, 10); 

  queue.forEach(video => {
      if (video.video_url) {
          bufferVideoChunk(video.video_url);
      }
  });
};
