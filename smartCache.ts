import { Video } from './types';

// حجم الجزء الذي سيتم تحميله (2 ميجابايت بالضبط كما طلب)
const BUFFER_SIZE = 2 * 1024 * 1024; 
const CACHE_NAME = 'rooh-video-buffer-v1';

// دالة لتخزين فيديو واحد (تستخدم داخل المكونات)
export const bufferVideoChunk = async (url: string) => {
  if (!url || !url.startsWith('http')) return;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    // إذا كان الفيديو موجوداً بالفعل، لا داعي لإعادة تحميله
    if (cachedResponse) return;

    // طلب أول 2 ميجا بايت فقط
    const response = await fetch(url, {
        headers: {
            'Range': `bytes=0-${BUFFER_SIZE}`
        },
        mode: 'cors' 
    });

    if (response.ok || response.status === 206) {
        const blob = await response.blob();
        // تخزين الاستجابة في الكاش لتستخدمها عناصر <video> تلقائياً
        // نستخدم استجابة جديدة كاملة لتجنب مشاكل Range لاحقاً عند التشغيل الكامل
        const newResponse = new Response(blob, {
            status: 200,
            headers: response.headers
        });
        await cache.put(url, newResponse);
    }
  } catch (e) {
    // تجاهل الأخطاء الصامتة (مثل انقطاع النت)
  }
};

// الدالة الجماعية (لأول مجموعة عند فتح التطبيق)
export const initSmartBuffering = async (videos: Video[]) => {
  if (!navigator.onLine || !videos || videos.length === 0) return;

  // التركيز على أول 8 فيديوهات لضمان سرعة الواجهة
  const queue = [...videos].slice(0, 8); 

  // تنفيذ التحميل بالتوازي
  queue.forEach(video => {
      if (video.video_url) {
          bufferVideoChunk(video.video_url);
      }
  });
};