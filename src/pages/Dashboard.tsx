import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Video as VideoIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { VideoRow } from '@/components/VideoRow';
import { VideoCard } from '@/components/VideoCard';
import { MobileDrawer } from '@/components/MobileDrawer';
import { MobileHeader } from '@/components/MobileHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Video } from '@/lib/supabase';
import { videoService } from '@/services/videoService';
import { playlistService } from '@/services/playlistService';
import { toAppError } from '@/lib/errors';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const AnimatedBackground = lazy(() => import('@/components/AnimatedBackground'));
const VideoPlayerModal = lazy(() => import('@/components/VideoPlayerModal'));
const UploadModal = lazy(() =>
  import('@/components/UploadModal').then((m) => ({ default: m.UploadModal }))
);
const CreatePlaylistModal = lazy(() =>
  import('@/components/CreatePlaylistModal').then((m) => ({ default: m.CreatePlaylistModal }))
);

/* ── Skeletons ── */
function RowSkeleton() {
  return (
    <div className="mb-10 px-4 md:px-10 xl:px-16">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 skeleton rounded-full" />
        <div className="h-4 skeleton rounded-full w-36" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-none w-36 sm:w-44 md:w-48 lg:w-52 xl:w-56">
            <div className="aspect-video skeleton rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="relative h-[82vh] min-h-[560px] skeleton overflow-hidden mb-2">
      <div className="absolute bottom-0 left-0 p-8 md:p-16 space-y-4">
        <div className="h-12 skeleton rounded-xl w-96 bg-white/10" />
        <div className="h-12 skeleton rounded-full w-40 bg-white/10" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroVideo, setHeroVideo] = useState<Video | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const { loading: authLoading, user, isAdmin, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ── Queries ── */
  const { data: playlists = [], refetch: refetchPlaylists } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistService.fetchAll(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: playlistItems = [] } = useQuery({
    queryKey: ['playlist-items'],
    queryFn: () => playlistService.fetchAllItems(),
    staleTime: 1000 * 60 * 10,
  });

  const { data: videoResult, isLoading: videosLoading, refetch: refetchVideos } = useQuery({
    queryKey: ['videos', debouncedSearch],
    queryFn: () => videoService.fetchPaginated({ search: debouncedSearch || undefined }),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const videos = videoResult?.data ?? [];

  /* ── Hero ── */
  const heroVideos = useMemo(() => {
    const withThumb = videos.filter(v => v.thumbnail_url).slice(0, 5);
    return withThumb.length > 0 ? withThumb : videos.slice(0, 1);
  }, [videos]);

  useEffect(() => {
    if (heroVideos.length > 0) setHeroIndex(0);
  }, [heroVideos.length]);

  useEffect(() => {
    if (heroVideos.length <= 1) return;
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroVideos.length), 8000);
    return () => clearInterval(t);
  }, [heroIndex, heroVideos.length]);

  const currentHero = heroVideos[heroIndex] ?? null;

  /* ── Videos per playlist ── */
  const videosByPlaylist = useMemo(() => {
    const map = new Map<string, Video[]>();
    playlists.forEach(playlist => {
      const ids = new Set(
        playlistItems
          .filter(pi => pi.playlist_id === playlist.id)
          .map(pi => pi.video_id)
      );
      map.set(playlist.id, videos.filter(v => ids.has(v.id)));
    });
    return map;
  }, [playlists, playlistItems, videos]);

  /* ── Handlers ── */
  const handlePlaylistSelect = useCallback((id: string | null, _title: string) => {
    setSelectedPlaylist(id);
    setIsMobileDrawerOpen(false);
    setTimeout(() => {
      const el = id
        ? document.getElementById(`row-${id}`)
        : null;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 380);
  }, []);

  const handleDeleteVideo = (video: Video) => {
    setVideoToDelete(video);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    setIsDeleting(true);
    try {
      await videoService.remove(videoToDelete);
      toast.success('Vídeo removido');
      refetchVideos();
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setIsDeleting(false);
      setVideoToDelete(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-black relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Suspense fallback={null}>
        <AnimatedBackground />
      </Suspense>

      <Navbar
        playlists={playlists}
        isAdmin={isAdmin}
        onUploadClick={() => setIsUploadOpen(true)}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userEmail={user?.email ?? null}
        userRole={profile?.role ?? null}
        onSignOut={signOut}
      />

      <MobileHeader
        onMenuClick={() => setIsMobileDrawerOpen(true)}
        onUploadClick={() => setIsUploadOpen(true)}
        isAdmin={isAdmin}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        playlists={playlists}
        selectedPlaylist={selectedPlaylist}
        onSelectPlaylist={handlePlaylistSelect}
        onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
      />

      <main className="relative z-10 pb-20">
        {videosLoading ? (
          <>
            <HeroSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : debouncedSearch ? (
          <SearchResults
            query={debouncedSearch}
            videos={videos}
            onDelete={isAdmin ? handleDeleteVideo : undefined}
          />
        ) : (
          <>
            {/* ── Hero ── */}
            {currentHero && (
              <div className="relative h-[82vh] min-h-[560px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentHero.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: currentHero.thumbnail_url
                          ? `url(${currentHero.thumbnail_url})`
                          : undefined,
                        backgroundColor: !currentHero.thumbnail_url ? '#0a0f0a' : undefined,
                      }}
                      initial={{ scale: 1 }}
                      animate={{ scale: 1.06 }}
                      transition={{ duration: 8, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/30" />
                  </motion.div>
                </AnimatePresence>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-3xl z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentHero.id + '-text'}
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight mb-6 drop-shadow-2xl">
                        {currentHero.title}
                      </h1>
                      <div className="flex items-center gap-3 flex-wrap">
                        <motion.button
                          onClick={() => { setHeroVideo(currentHero); setIsPlayerOpen(true); }}
                          className="flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-full font-extrabold text-sm hover:bg-white/90 shadow-2xl transition-colors"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Play className="w-5 h-5 fill-current flex-shrink-0" />
                          Assistir Agora
                        </motion.button>
                        <motion.button
                          onClick={() => navigate(`/video/${currentHero.id}`)}
                          className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-white border border-white/25 hover:bg-white/10 transition-colors"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          Mais Detalhes
                        </motion.button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Indicators */}
                {heroVideos.length > 1 && (
                  <div className="absolute bottom-8 right-8 md:right-16 flex items-center gap-2 z-20">
                    {heroVideos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHeroIndex(i)}
                        className={`h-[3px] rounded-full transition-all duration-500 ${
                          i === heroIndex ? 'w-8 bg-white' : 'w-3 bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Rows ── */}
            <div className="pt-2">
              <VideoRow
                title="Em Alta"
                videos={videos}
                onDelete={isAdmin ? handleDeleteVideo : undefined}
              />

              {playlists.map(playlist => (
                <VideoRow
                  key={playlist.id}
                  id={`row-${playlist.id}`}
                  title={playlist.title}
                  videos={videosByPlaylist.get(playlist.id) ?? []}
                  onDelete={isAdmin ? handleDeleteVideo : undefined}
                />
              ))}

              {videos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-32 text-center px-4"
                >
                  <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
                    <VideoIcon className="w-9 h-9 text-white/15" />
                  </div>
                  <h3 className="text-lg font-bold text-white/60 mb-2">Nenhum vídeo publicado ainda</h3>
                  <p className="text-sm text-white/25">Os vídeos aparecerão aqui após serem enviados.</p>
                </motion.div>
              )}
            </div>
          </>
        )}
      </main>

      <ConfirmDialog
        isOpen={!!videoToDelete}
        title="Excluir vídeo"
        description={`"${videoToDelete?.title ?? ''}" será removido permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir vídeo"
        isLoading={isDeleting}
        onConfirm={confirmDeleteVideo}
        onCancel={() => setVideoToDelete(null)}
      />

      <Suspense fallback={null}>
        {isPlayerOpen && (
          <VideoPlayerModal
            video={heroVideo}
            isOpen={isPlayerOpen}
            onClose={() => { setIsPlayerOpen(false); setHeroVideo(null); }}
          />
        )}
        {isUploadOpen && (
          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onSuccess={refetchVideos}
          />
        )}
        {isCreatePlaylistOpen && (
          <CreatePlaylistModal
            isOpen={isCreatePlaylistOpen}
            onClose={() => setIsCreatePlaylistOpen(false)}
            onSuccess={refetchPlaylists}
          />
        )}
      </Suspense>
    </motion.div>
  );
}

/* ── Search results grid ── */
interface SearchResultsProps {
  query: string;
  videos: Video[];
  onDelete?: (video: Video) => void;
}

function SearchResults({ query, videos, onDelete }: SearchResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 md:px-10 xl:px-16 pt-24 md:pt-20"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-7 bg-primary rounded-full" />
        <h2 className="text-xl md:text-3xl font-black text-white tracking-tight">
          Resultados para{' '}
          <span className="text-primary">"{query}"</span>
        </h2>
        <span className="text-xs text-white/25 font-semibold bg-white/5 px-2.5 py-1 rounded-full ml-1">
          {videos.length}
        </span>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
          {videos.map((video, i) => (
            <VideoCard
              key={video.id}
              video={video}
              index={i}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
            <VideoIcon className="w-7 h-7 text-white/15" />
          </div>
          <h3 className="text-lg font-bold text-white/50 mb-1">Nenhum resultado</h3>
          <p className="text-sm text-white/25">Tente outro termo de pesquisa.</p>
        </div>
      )}
    </motion.div>
  );
}
