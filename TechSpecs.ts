
// -----------------------------------------------------------------------------
// TECHNICAL CHEAT SHEET & SYSTEM BLUEPRINT (THE BLACK BOX)
// -----------------------------------------------------------------------------
// هذا الملف يحتوي على التكوينات الحرجة لمشروع "الحديقة المرعبة".
// -----------------------------------------------------------------------------

export const SYSTEM_CONFIG = {
  identity: {
    appName: "Roohpro55الاصلي",
    description: "منصة فيديوهات الرعب المتطورة مع نظام تقسيم ذكي مدعوم بـ Gemini AI",
    logoUrl: "https://i.top4top.io/p_3643ksmii1.jpg"
  },
  
  // 🟢 التكوينات النشطة (المفاتيح الرسمية)
  firebase: {
    apiKey: "AIzaSyCjuQxanRlM3Ef6-vGWtMZowz805DmU0D4",
    projectId: "rooh1-b80e6",
    authDomain: "rooh1-b80e6.firebaseapp.com",
    storageBucket: "rooh1-b80e6.firebasestorage.app",
    messagingSenderId: "798624809478",
    appId: "1:798624809478:web:472d3a3149a7e1c24ff987",
    measurementId: "G-Q59TKDZVDX"
  },

  cloudflare: {
    // مخزن الفيديوهات (R2 Vault)
    workerUrl: "https://bold-king-9a8e.roohr4046.workers.dev",
    publicUrl: "https://pub-82d22c4b0b8b4b1e8a32d6366b7546c8.r2.dev",
    accountId: "82d22c4b0b8b4b1e8a32d6366b7546c8",
    workerName: "bold-king-9a8e"
  },

  officialCategories: [
    'هجمات مرعبة', 
    'رعب حقيقي', 
    'رعب الحيوانات', 
    'أخطر المشاهد',
    'أهوال مرعبة', 
    'رعب كوميدي', 
    'لحظات مرعبة', 
    'صدمه'
  ]
};

export const getFirebaseConfig = () => SYSTEM_CONFIG.firebase;
export const getCloudflareConfig = () => SYSTEM_CONFIG.cloudflare;
