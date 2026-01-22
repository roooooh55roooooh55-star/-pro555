
import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Video, AppView, UserInteractions } from './types';
import { db, ensureAuth } from './firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import AppBar from './AppBar';
import MainContent from './MainContent';
import { downloadVideoWithProgress, removeVideoFromCache } from './offlineManager';
import { initSmartBuffering } from './smartCache';
import { SmartBrain } from './SmartLogic';
import { SYSTEM_CONFIG } from './TechSpecs';

const ShortsPlayerOverlay = lazy(() => import('./ShortsPlayerOverlay'));
const LongPlayerOverlay = lazy(() => import('./LongPlayerOverlay'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AIOracle = lazy(() => import('./AIOracle'));
const TrendPage = lazy(() => import('./TrendPage'));
const SavedPage = lazy(() => import('./SavedPage'));
const PrivacyPage = lazy(() => import('./PrivacyPage'));
const HiddenVideosPage = lazy(() => import('./HiddenVideosPage'));
const CategoryPage = lazy(() => import('./CategoryPage'));
const OfflinePage = lazy(() => import('./OfflinePage'));
const UnwatchedPage = lazy(() => import('./UnwatchedPage'));

export const OFFICIAL_CATEGORIES = SYSTEM_CONFIG.officialCategories;

const DEFAULT_LAYOUT = [
  { id: 'hero', type: 'long_video', width: 100, height: 280, marginTop: 0 },
  { id: 'shorts_grid_1', type: 'shorts_grid', width: 100, height: 350, label: 'أحدث الهجمات' },
  { id: 'slider_1', type: 'slider_right', width: 100, height: 220, label: 'رعب مستمر' },
  { id: 'long_slider_1', type: 'long_slider', width: 100, height: 250, label: 'حكايات القبو' },
  { id: 'slider_2', type: 'slider_left', width: 100, height: 220, label: 'أهوال لا تنتهي' }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [homeLayout, setHomeLayout] = useState<any[]>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);

  const [interactions, setInteractions] = useState<UserInteractions>(() => {
    try {
      const saved = localStorage.getItem('al-hadiqa-interactions-v12');
      return saved ? JSON.parse(saved) : { likedIds: [], dislikedIds: [], savedIds: [], savedCategoryNames: [], watchHistory: [], downloadedIds: [] };
    } catch (e) { return { likedIds: [], dislikedIds: [], savedIds: [], savedCategoryNames: [], watchHistory: [], downloadedIds: [] }; }
  });

  const [rawVideos, setRawVideos] = useState<Video[]>(() => {
    try {
      const cached = localStorage.getItem('rooh1_videos_cache');
      return cached ? JSON.parse(cached) : [];
    } catch (e) { return []; }
  });

  const [displayVideos, setDisplayVideos] = useState<Video[]>([]);
  const [selectedShort, setSelectedShort] = useState<{ video: Video, list: Video[] } | null>(null);
  const [selectedLong, setSelectedLong] = useState<{ video: Video, list: Video[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleManualRefresh = useCallback(() => {
    const newOrder = SmartBrain.generateVideoFeed(rawVideos, interactions);
    setDisplayVideos(newOrder);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("تم سحب أرواح جديدة من القبو 👻");
  }, [rawVideos, interactions]);

  const handleCategorySelection = (cat: string) => {
    setActiveCategory(cat);
    setCurrentView(AppView.CATEGORY);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let unsubscribeVideos: () => void = () => {};
    let unsubscribeLayout: () => void = () => {};
    let isMounted = true;

    const init = async () => {
      await ensureAuth();
      if (!isMounted) return;

      unsubscribeLayout = onSnapshot(doc(db, "Settings", "HomeLayout"), (docSnap) => {
        if (docSnap.exists() && isMounted) {
          setHomeLayout(docSnap.data().sections || DEFAULT_LAYOUT);
        }
      });

      const q = query(collection(db, "videos"), orderBy("created_at", "desc"));
      unsubscribeVideos = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Video[];
        if (isMounted) {
          setRawVideos(list);
          localStorage.setItem('rooh1_videos_cache', JSON.stringify(list));
          const smartList = SmartBrain.generateVideoFeed(list, interactions);
          setDisplayVideos(smartList);
          initSmartBuffering(smartList);
          setLoading(false);
        }
      });
    };

    init();
    return () => { isMounted = false; unsubscribeVideos(); unsubscribeLayout(); };
  }, []);

  const handleLikeToggle = (id: string) => {
    setInteractions(p => {
      const isLiked = p.likedIds.includes(id);
      return { ...p, likedIds: isLiked ? p.likedIds.filter(x => x !== id) : [...p.likedIds, id] };
    });
  };

  const handleDislike = (id: string) => {
    setInteractions(p => ({ ...p, dislikedIds: [...new Set([...p.dislikedIds, id])] }));
    showToast("تم الاستبعاد ⚰️");
  };

  const playShortVideo = (v: Video, list: Video[]) => setSelectedShort({ video: v, list });
  const playLongVideo = (v: Video, list?: Video[]) => setSelectedLong({ video: v, list: list || rawVideos.filter(rv => rv.video_type === 'Long Video') });

  const renderContent = () => {
    const activeVideos = displayVideos.filter(v => !interactions.dislikedIds.includes(v.id));
    const shortsOnly = activeVideos.filter(v => v.video_type === 'Shorts');
    const longsOnly = activeVideos.filter(v => v.video_type === 'Long Video');

    switch(currentView) {
      case AppView.ADMIN:
        return <Suspense fallback={null}><AdminDashboard onClose={() => setCurrentView(AppView.HOME)} categories={OFFICIAL_CATEGORIES} initialVideos={rawVideos} /></Suspense>;
      case AppView.OFFLINE:
        return <Suspense fallback={null}><OfflinePage allVideos={rawVideos} interactions={interactions} onPlayShort={playShortVideo} onPlayLong={playLongVideo} onBack={() => setCurrentView(AppView.HOME)} onUpdateInteractions={setInteractions} /></Suspense>;
      case AppView.TREND:
        return <Suspense fallback={null}><TrendPage allVideos={rawVideos} onPlayShort={playShortVideo} onPlayLong={playLongVideo} excludedIds={interactions.dislikedIds} /></Suspense>;
      case AppView.CATEGORY:
        return <Suspense fallback={null}><CategoryPage category={activeCategory} allVideos={displayVideos} isSaved={interactions.savedCategoryNames.includes(activeCategory)} onToggleSave={() => {}} onPlayShort={playShortVideo} onPlayLong={playLongVideo} onBack={() => setCurrentView(AppView.HOME)} /></Suspense>;
      case AppView.SAVED:
        return <Suspense fallback={null}><SavedPage savedIds={interactions.savedIds} savedCategories={interactions.savedCategoryNames} allVideos={rawVideos} onPlayShort={playShortVideo} onPlayLong={playLongVideo} onCategoryClick={handleCategorySelection} /></Suspense>;
      case AppView.LIKES:
        return <Suspense fallback={null}><SavedPage savedIds={interactions.likedIds} savedCategories={[]} allVideos={rawVideos} title="الإعجابات" onPlayShort={playShortVideo} onPlayLong={playLongVideo} onCategoryClick={() => {}} /></Suspense>;
      case AppView.HIDDEN:
        return <Suspense fallback={null}><HiddenVideosPage interactions={interactions} allVideos={rawVideos} onRestore={(id) => setInteractions(p => ({...p, dislikedIds: p.dislikedIds.filter(x => x !== id)}))} onPlayShort={playShortVideo} onPlayLong={playLongVideo} /></Suspense>;
      case AppView.PRIVACY:
        return <Suspense fallback={null}><PrivacyPage onBack={() => setCurrentView(AppView.HOME)} onOpenAdmin={() => setCurrentView(AppView.ADMIN)} /></Suspense>;
      case AppView.HOME:
      default:
        return (
          <MainContent 
            sections={homeLayout}
            videos={activeVideos} 
            interactions={interactions}
            onPlayShort={(v: Video) => playShortVideo(v, shortsOnly)}
            onPlayLong={playLongVideo}
            onCategoryClick={handleCategorySelection}
            onLike={handleLikeToggle}
            onHardRefresh={handleManualRefresh}
            onOfflineClick={() => setCurrentView(AppView.OFFLINE)}
            loading={loading}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <AppBar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onRefresh={handleManualRefresh}
        onCategoryClick={handleCategorySelection}
      />
      {/* تم تعديل pt-36 لاستيعاب الشريطين الجديدين */}
      <main className="pt-40 pb-24 max-w-md mx-auto">
        {renderContent()}
      </main>
      
      <Suspense fallback={null}>
        <AIOracle allVideos={rawVideos} interactions={interactions} onPlayVideo={(v) => v.video_type === 'Shorts' ? playShortVideo(v, rawVideos) : playLongVideo(v)} />
      </Suspense>

      {selectedShort && (
        <Suspense fallback={null}>
          <ShortsPlayerOverlay 
            initialVideo={selectedShort.video} videoList={selectedShort.list} interactions={interactions}
            onClose={() => setSelectedShort(null)} onLike={handleLikeToggle} onDislike={handleDislike}
            onCategoryClick={handleCategorySelection}
            onSave={() => {}} onProgress={() => {}} onDownload={() => {}} isGlobalDownloading={false}
          />
        </Suspense>
      )}

      {selectedLong && (
        <Suspense fallback={null}>
          <LongPlayerOverlay 
            video={selectedLong.video} allLongVideos={selectedLong.list}
            onClose={() => setSelectedLong(null)} onLike={() => handleLikeToggle(selectedLong.video.id)}
            onDislike={() => handleDislike(selectedLong.video.id)} onSave={() => {}}
            onSwitchVideo={(v) => setSelectedLong({ video: v, list: selectedLong.list })}
            onCategoryClick={handleCategorySelection}
            onDownload={() => {}} isLiked={interactions.likedIds.includes(selectedLong.video.id)}
            isDisliked={interactions.dislikedIds.includes(selectedLong.video.id)} isSaved={false} isDownloaded={false}
            isGlobalDownloading={false} onProgress={() => {}}
          />
        </Suspense>
      )}

      {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-6 py-3 rounded-full font-black shadow-[0_0_20px_red] animate-bounce">{toast}</div>}
    </div>
  );
};

export default App;
